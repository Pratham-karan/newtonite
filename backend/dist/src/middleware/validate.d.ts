import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Zod validation middleware factory.
 * Validates req.body against a Zod schema.
 * Returns structured 422 errors with field-level details.
 */
export declare function validate(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Validates req.query against a Zod schema (for GET endpoints with filters).
 */
export declare function validateQuery(schema: ZodSchema): (req: Request, _res: Response, next: NextFunction) => void;
