"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTransition = validateTransition;
exports.getValidTransitions = getValidTransitions;
const errors_1 = require("../common/errors");
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
const VALID_TRANSITIONS = {
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
function validateTransition(from, to) {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
        throw new errors_1.InvalidTransitionError(from, to);
    }
}
/**
 * Returns the list of valid next statuses from the given status.
 * Used by the frontend to show only valid transition buttons.
 */
function getValidTransitions(from) {
    return VALID_TRANSITIONS[from] || [];
}
//# sourceMappingURL=workflow.js.map