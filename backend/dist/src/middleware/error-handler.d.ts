import { Request, Response, NextFunction } from 'express';
/**
 * Global error handler — translates AppError into structured JSON responses.
 * Unknown errors become 500s without leaking implementation details.
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
