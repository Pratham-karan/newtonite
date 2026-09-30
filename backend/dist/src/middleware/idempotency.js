"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotency = idempotency;
const errors_1 = require("../common/errors");
const db_1 = __importDefault(require("../db"));
const logger_1 = __importDefault(require("../common/logger"));
const config_1 = require("../config");
/**
 * Idempotency middleware factory.
 *
 * When a client sends an `Idempotency-Key` header:
 * 1. Check if we've already processed a request with that key for this user.
 * 2. If yes → return the cached response (status + body) without re-executing.
 * 3. If no → let the handler execute, then cache the response.
 *
 * This prevents duplicate operations when clients retry due to timeouts,
 * double-clicks, or network issues.
 */
function idempotency() {
    return async (req, res, next) => {
        const idempotencyKey = req.headers['idempotency-key'];
        // No key → not an idempotent request, proceed normally
        if (!idempotencyKey) {
            next();
            return;
        }
        const user = req.user;
        if (!user) {
            next();
            return;
        }
        try {
            // Check for existing key
            const existing = await (0, db_1.default)('idempotency_keys')
                .where({
                user_id: user.id,
                idempotency_key: idempotencyKey,
            })
                .andWhere('expires_at', '>', new Date())
                .first();
            if (existing) {
                // Check if same route — different route with same key is a conflict
                const currentRoute = `${req.method} ${req.baseUrl}${req.path}`;
                if (existing.route !== currentRoute) {
                    next(new errors_1.IdempotencyConflictError());
                    return;
                }
                logger_1.default.info('Returning cached idempotent response', {
                    requestId: req.requestId,
                    idempotencyKey,
                    userId: user.id,
                });
                // Return the cached response
                res.status(existing.status_code).json(existing.response_body);
                return;
            }
            // Store the key + response after the handler completes
            // Override res.json to intercept the response
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                // Store the result asynchronously (fire-and-forget for speed,
                // but within the same request lifecycle)
                const route = `${req.method} ${req.baseUrl}${req.path}`;
                const expiresAt = new Date(Date.now() + config_1.config.idempotency.ttlHours * 60 * 60 * 1000);
                (0, db_1.default)('idempotency_keys')
                    .insert({
                    user_id: user.id,
                    idempotency_key: idempotencyKey,
                    route,
                    status_code: res.statusCode,
                    response_body: JSON.stringify(body),
                    expires_at: expiresAt,
                })
                    .catch((err) => {
                    // Unique constraint violation means a race condition — another
                    // request with the same key was processed simultaneously.
                    // This is safe: the operation already completed once.
                    if (err.code !== '23505') {
                        logger_1.default.error('Failed to store idempotency key', {
                            error: err.message,
                            idempotencyKey,
                        });
                    }
                });
                return originalJson(body);
            };
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=idempotency.js.map