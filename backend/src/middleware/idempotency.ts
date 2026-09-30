import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../common/types';
import { IdempotencyConflictError } from '../common/errors';
import db from '../db';
import logger from '../common/logger';
import { config } from '../config';

/**
 * Idempotency middleware factory.
 *
 * When a client sends an `Idempotency-Key` header:
 * 1. Check if we've already processed a request with that key for this user.
 * 2. If yes → return the cached response (status + body) without re-executing.
 * 3. If no → let the handler execute, then cache the response.
 *
 * This prevents duplicate operations when clients retry due to timeouts,
 * double-clicks, or network issues.
 */
export function idempotency() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    // No key → not an idempotent request, proceed normally
    if (!idempotencyKey) {
      next();
      return;
    }

    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      next();
      return;
    }

    try {
      // Check for existing key
      const existing = await db('idempotency_keys')
        .where({
          user_id: user.id,
          idempotency_key: idempotencyKey,
        })
        .andWhere('expires_at', '>', new Date())
        .first();

      if (existing) {
        // Check if same route — different route with same key is a conflict
        const currentRoute = `${req.method} ${req.baseUrl}${req.path}`;
        if (existing.route !== currentRoute) {
          next(new IdempotencyConflictError());
          return;
        }

        logger.info('Returning cached idempotent response', {
          requestId: (req as any).requestId,
          idempotencyKey,
          userId: user.id,
        });

        // Return the cached response
        res.status(existing.status_code).json(existing.response_body);
        return;
      }

      // Store the key + response after the handler completes
      // Override res.json to intercept the response
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // Store the result asynchronously (fire-and-forget for speed,
        // but within the same request lifecycle)
        const route = `${req.method} ${req.baseUrl}${req.path}`;
        const expiresAt = new Date(
          Date.now() + config.idempotency.ttlHours * 60 * 60 * 1000
        );

        db('idempotency_keys')
          .insert({
            user_id: user.id,
            idempotency_key: idempotencyKey,
            route,
            status_code: res.statusCode,
            response_body: JSON.stringify(body),
            expires_at: expiresAt,
          })
          .catch((err) => {
            // Unique constraint violation means a race condition — another
            // request with the same key was processed simultaneously.
            // This is safe: the operation already completed once.
            if (err.code !== '23505') {
              logger.error('Failed to store idempotency key', {
                error: err.message,
                idempotencyKey,
              });
            }
          });

        return originalJson(body);
      } as any;

      next();
    } catch (err) {
      next(err);
    }
  };
}
