"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
/**
 * GET /api/teams
 * List all teams. Any authenticated user can see team names.
 */
router.get('/', auth_1.authenticate, async (_req, res, next) => {
    try {
        const teams = await (0, db_1.default)('teams').select('*').orderBy('name');
        res.json(teams);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/teams/:id/members
 * List members of a specific team.
 */
router.get('/:id/members', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const members = await (0, db_1.default)('team_memberships')
            .join('users', 'users.id', 'team_memberships.user_id')
            .where('team_memberships.team_id', id)
            .select('users.id', 'users.name', 'users.email', 'users.role');
        res.json(members);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=teams.routes.js.map