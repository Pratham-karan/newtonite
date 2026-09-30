import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../common/errors';
import { AuthenticatedRequest, Role } from '../common/types';

/**
 * Role-based authorization middleware factory.
 * Checks that the authenticated user has one of the allowed roles.
 *
 * Usage:
 *   router.post('/admin-action', authenticate, authorize('ADMIN'), handler);
 *   router.patch('/team-action', authenticate, authorize('ADMIN', 'TEAM_LEAD'), handler);
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      next(new ForbiddenError('User context not found'));
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      next(
        new ForbiddenError(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        )
      );
      return;
    }

    next();
  };
}

/**
 * Checks that the authenticated user is a member of the specified team.
 * Admins bypass this check.
 */
export function requireTeamMembership(teamIdExtractor: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      next(new ForbiddenError('User context not found'));
      return;
    }

    // Admins can access all teams
    if (user.role === 'ADMIN') {
      next();
      return;
    }

    const teamId = teamIdExtractor(req);
    if (!teamId) {
      // Team ID will be checked at the service layer when loading the resource
      next();
      return;
    }

    if (!user.teams.includes(teamId)) {
      next(new ForbiddenError('You are not a member of this team'));
      return;
    }

    next();
  };
}
