"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../common/errors");
const db_1 = __importDefault(require("../db"));
/**
 * Auth middleware — extracts JWT from httpOnly cookie, verifies it,
 * attaches user info (including team IDs) to the request.
 */
async function authenticate(req, _res, next) {
    try {
        const token = req.cookies?.token;
        if (!token) {
            throw new errors_1.UnauthorizedError('No authentication token provided');
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
        // Fetch user's team memberships (needed for authorization checks)
        const teamMemberships = await (0, db_1.default)('team_memberships')
            .where('user_id', decoded.userId)
            .select('team_id');
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            teams: teamMemberships.map((tm) => tm.team_id),
        };
        next();
    }
    catch (err) {
        if (err instanceof errors_1.UnauthorizedError) {
            next(err);
        }
        else if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errors_1.UnauthorizedError('Invalid or expired token'));
        }
        else {
            next(err);
        }
    }
}
//# sourceMappingURL=auth.js.map