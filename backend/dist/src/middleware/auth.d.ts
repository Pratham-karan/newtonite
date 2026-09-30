import { Request, Response, NextFunction } from 'express';
/**
 * Auth middleware — extracts JWT from httpOnly cookie, verifies it,
 * attaches user info (including team IDs) to the request.
 */
export declare function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void>;
