import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  InvalidTransitionError,
} from '../common/errors';

describe('Error Hierarchy & HTTP Status Mappings', () => {
  it('NotFoundError maps to 404 with standard message', () => {
    const err = new NotFoundError('Work item', '123');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Work item '123' not found");
  });

  it('ForbiddenError maps to 403', () => {
    const err = new ForbiddenError('Only Team Leads can approve');
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Only Team Leads can approve');
  });

  it('ConflictError maps to 409 and includes concurrency metadata', () => {
    const err = new ConflictError('Concurrent edit detected', { currentVersion: 3 });
    expect(err.statusCode).toBe(409);
    expect(err.details).toEqual({ currentVersion: 3 });
  });

  it('ValidationError maps to 422', () => {
    const err = new ValidationError('Invalid request payload', { field: 'title', message: 'Required' });
    expect(err.statusCode).toBe(422);
    expect(err.details).toEqual({ field: 'title', message: 'Required' });
  });

  it('InvalidTransitionError maps to 422 with workflow description', () => {
    const err = new InvalidTransitionError('OPEN', 'CLOSED');
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Cannot transition from OPEN to CLOSED");
    expect(err.details).toEqual({ from: 'OPEN', to: 'CLOSED' });
  });
});
