"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
exports.requireTeamMembership = requireTeamMembership;
const errors_1 = require("../common/errors");
/**
 * Role-based authorization middleware factory.
 * Checks that the authenticated user has one of the allowed roles.
 *
 * Usage:
 *   router.post('/admin-action', authenticate, authorize('ADMIN'), handler);
 *   router.patch('/team-action', authenticate, authorize('ADMIN', 'TEAM_LEAD'), handler);
 */
function authorize(...allowedRoles) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user) {
            next(new errors_1.ForbiddenError('User context not found'));
            return;
        }
        if (!allowedRoles.includes(user.role)) {
            next(new errors_1.ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`));
            return;
        }
        next();
    };
}
/**
 * Checks that the authenticated user is a member of the specified team.
 * Admins bypass this check.
 */
function requireTeamMembership(teamIdExtractor) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user) {
            next(new errors_1.ForbiddenError('User context not found'));
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
            next(new errors_1.ForbiddenError('You are not a member of this team'));
            return;
        }
        next();
    };
}
//# sourceMappingURL=authorize.js.map