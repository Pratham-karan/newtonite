"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../common/errors");
const db_1 = __importDefault(require("../db"));
/**
 * Authentication service — handles login/token generation.
 * Passwords are verified with bcrypt. Tokens are JWTs.
 */
exports.authService = {
    async login(email, password) {
        const user = await (0, db_1.default)('users').where({ email }).first();
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
        });
        // Return user without password hash
        const { password_hash, ...safeUser } = user;
        return { user: safeUser, token };
    },
    async getProfile(userId) {
        const user = await (0, db_1.default)('users')
            .where({ id: userId })
            .select('id', 'email', 'name', 'role', 'created_at')
            .first();
        if (!user) {
            throw new errors_1.UnauthorizedError('User not found');
        }
        // Fetch team memberships with team names
        const teams = await (0, db_1.default)('team_memberships')
            .join('teams', 'teams.id', 'team_memberships.team_id')
            .where('team_memberships.user_id', userId)
            .select('teams.id', 'teams.name');
        return { ...user, teams };
    },
};
//# sourceMappingURL=auth.service.js.map