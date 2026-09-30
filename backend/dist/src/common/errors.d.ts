/**
 * Structured application errors.
 * Every error has a machine-readable code + human-readable message.
 * The error handler middleware translates these into HTTP responses.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: Record<string, unknown>;
    constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class InvalidTransitionError extends AppError {
    constructor(from: string, to: string);
}
export declare class IdempotencyConflictError extends AppError {
    constructor();
}
