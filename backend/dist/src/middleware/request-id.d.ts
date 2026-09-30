import { Request, Response, NextFunction } from 'express';
/**
 * Assigns a unique request ID to every incoming request.
 * Used for correlating log entries across a single request lifecycle.
 */
export declare function requestId(req: Request, res: Response, next: NextFunction): void;
