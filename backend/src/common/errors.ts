/**
 * Structured application errors.
 * Every error has a machine-readable code + human-readable message.
 * The error handler middleware translates these into HTTP responses.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// --- Specific error factories ---

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const msg = id ? `${resource} '${id}' not found` : `${resource} not found`;
    super(404, 'NOT_FOUND', msg);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(409, 'VERSION_CONFLICT', message, details);
  }
}

export class InvalidTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(422, 'INVALID_TRANSITION', `Cannot transition from ${from} to ${to}`, {
      from,
      to,
    });
  }
}

export class IdempotencyConflictError extends AppError {
  constructor() {
    super(
      409,
      'IDEMPOTENCY_CONFLICT',
      'Idempotency key was already used with a different request body'
    );
  }
}
