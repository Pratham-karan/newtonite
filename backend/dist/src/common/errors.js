"use strict";
/**
 * Structured application errors.
 * Every error has a machine-readable code + human-readable message.
 * The error handler middleware translates these into HTTP responses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyConflictError = exports.InvalidTransitionError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
// --- Specific error factories ---
class ValidationError extends AppError {
    constructor(message, details) {
        super(422, 'VALIDATION_ERROR', message, details);
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(401, 'UNAUTHORIZED', message);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(403, 'FORBIDDEN', message);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(resource, id) {
        const msg = id ? `${resource} '${id}' not found` : `${resource} not found`;
        super(404, 'NOT_FOUND', msg);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(409, 'VERSION_CONFLICT', message, details);
    }
}
exports.ConflictError = ConflictError;
class InvalidTransitionError extends AppError {
    constructor(from, to) {
        super(422, 'INVALID_TRANSITION', `Cannot transition from ${from} to ${to}`, {
            from,
            to,
        });
    }
}
exports.InvalidTransitionError = InvalidTransitionError;
class IdempotencyConflictError extends AppError {
    constructor() {
        super(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key was already used with a different request body');
    }
}
exports.IdempotencyConflictError = IdempotencyConflictError;
//# sourceMappingURL=errors.js.map