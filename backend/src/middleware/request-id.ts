import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../common/logger';

/**
 * Assigns a unique request ID to every incoming request.
 * Used for correlating log entries across a single request lifecycle.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  (req as any).requestId = id;
  res.setHeader('X-Request-Id', id);

  // Log every incoming request
  logger.info(`${req.method} ${req.path}`, {
    requestId: id,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  next();
}
