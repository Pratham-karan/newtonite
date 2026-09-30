import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../common/errors';
import { AuthenticatedRequest, JwtPayload } from '../common/types';
import db from '../db';

/**
 * Auth middleware — extracts JWT from httpOnly cookie, verifies it,
 * attaches user info (including team IDs) to the request.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Fetch user's team memberships (needed for authorization checks)
    const teamMemberships = await db('team_memberships')
      .where('user_id', decoded.userId)
      .select('team_id');

    (req as AuthenticatedRequest).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      teams: teamMemberships.map((tm) => tm.team_id),
    };

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(err);
    }
  }
}
