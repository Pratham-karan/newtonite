import { Status } from '../common/types';
/**
 * Validates a status transition. Throws InvalidTransitionError if invalid.
 */
export declare function validateTransition(from: Status, to: Status): void;
/**
 * Returns the list of valid next statuses from the given status.
 * Used by the frontend to show only valid transition buttons.
 */
export declare function getValidTransitions(from: Status): Status[];
