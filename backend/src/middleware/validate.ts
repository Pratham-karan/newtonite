import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../common/errors';

/**
 * Zod validation middleware factory.
 * Validates req.body against a Zod schema.
 * Returns structured 422 errors with field-level details.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.');
          fieldErrors[path] = issue.message;
        }
        next(new ValidationError('Validation failed', { fields: fieldErrors }));
      } else {
        next(err);
      }
    }
  };
}

/**
 * Validates req.query against a Zod schema (for GET endpoints with filters).
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.');
          fieldErrors[path] = issue.message;
        }
        next(new ValidationError('Invalid query parameters', { fields: fieldErrors }));
      } else {
        next(err);
      }
    }
  };
}
