import { Request, Response, NextFunction } from 'express';
import { Role } from '../common/types';
/**
 * Role-based authorization middleware factory.
 * Checks that the authenticated user has one of the allowed roles.
 *
 * Usage:
 *   router.post('/admin-action', authenticate, authorize('ADMIN'), handler);
 *   router.patch('/team-action', authenticate, authorize('ADMIN', 'TEAM_LEAD'), handler);
 */
export declare function authorize(...allowedRoles: Role[]): (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Checks that the authenticated user is a member of the specified team.
 * Admins bypass this check.
 */
export declare function requireTeamMembership(teamIdExtractor: (req: Request) => string | undefined): (req: Request, _res: Response, next: NextFunction) => void;
