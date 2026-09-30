import { Request, Response, NextFunction } from 'express';
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
export declare function idempotency(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
