import { Request, Response, NextFunction } from 'express';
import { AppError } from '../common/errors';
import logger from '../common/logger';

/**
 * Global error handler — translates AppError into structured JSON responses.
 * Unknown errors become 500s without leaking implementation details.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(`${err.code}: ${err.message}`, {
      requestId: (req as any).requestId,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Unexpected errors — log full stack, return generic message
  logger.error('Unhandled error', {
    requestId: (req as any).requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.',
    },
  });
}
