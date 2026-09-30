"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
/**
 * GET /api/users
 * List all users (admin only). Returns id, email, name, role.
 */
router.get('/', auth_1.authenticate, (0, authorize_1.authorize)('ADMIN'), async (_req, res, next) => {
    try {
        const users = await (0, db_1.default)('users')
            .select('id', 'email', 'name', 'role', 'created_at')
            .orderBy('name');
        res.json(users);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/users/all
 * List all users (minimal info for dropdowns — any authenticated user).
 * Returns only id + name so it can be used in assignee selectors.
 */
router.get('/all', auth_1.authenticate, async (_req, res, next) => {
    try {
        const users = await (0, db_1.default)('users')
            .select('id', 'name', 'email', 'role')
            .orderBy('name');
        res.json(users);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=users.routes.js.map