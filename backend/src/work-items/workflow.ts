import { Status } from '../common/types';
import { InvalidTransitionError } from '../common/errors';

/**
 * Work item state machine.
 *
 * Defines which status transitions are valid.
 * This is the single source of truth for workflow rules —
 * the frontend reads the same transitions from an API endpoint.
 *
 *   OPEN → IN_PROGRESS
 *   IN_PROGRESS → WAITING_FOR_APPROVAL | BLOCKED | RESOLVED
 *   WAITING_FOR_APPROVAL → IN_PROGRESS (rejected) | RESOLVED (approved)
 *   BLOCKED → IN_PROGRESS
 *   RESOLVED → CLOSED
 *   CLOSED → OPEN (reopen)
 */
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['WAITING_FOR_APPROVAL', 'BLOCKED', 'RESOLVED'],
  WAITING_FOR_APPROVAL: ['IN_PROGRESS', 'RESOLVED'],
  BLOCKED: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED'],
  CLOSED: ['OPEN'],
};

/**
 * Validates a status transition. Throws InvalidTransitionError if invalid.
 */
export function validateTransition(from: Status, to: Status): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/**
 * Returns the list of valid next statuses from the given status.
 * Used by the frontend to show only valid transition buttons.
 */
export function getValidTransitions(from: Status): Status[] {
  return VALID_TRANSITIONS[from] || [];
}
