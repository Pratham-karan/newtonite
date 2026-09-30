"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const workflow_1 = require("../work-items/workflow");
const errors_1 = require("../common/errors");
(0, vitest_1.describe)('Workflow State Machine Invariants', () => {
    (0, vitest_1.describe)('Valid Transitions', () => {
        (0, vitest_1.it)('allows OPEN -> IN_PROGRESS', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('OPEN', 'IN_PROGRESS')).not.toThrow();
        });
        (0, vitest_1.it)('allows IN_PROGRESS -> WAITING_FOR_APPROVAL', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('IN_PROGRESS', 'WAITING_FOR_APPROVAL')).not.toThrow();
        });
        (0, vitest_1.it)('allows IN_PROGRESS -> BLOCKED', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('IN_PROGRESS', 'BLOCKED')).not.toThrow();
        });
        (0, vitest_1.it)('allows IN_PROGRESS -> RESOLVED', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('IN_PROGRESS', 'RESOLVED')).not.toThrow();
        });
        (0, vitest_1.it)('allows WAITING_FOR_APPROVAL -> IN_PROGRESS (rejection)', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('WAITING_FOR_APPROVAL', 'IN_PROGRESS')).not.toThrow();
        });
        (0, vitest_1.it)('allows WAITING_FOR_APPROVAL -> RESOLVED (approval)', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('WAITING_FOR_APPROVAL', 'RESOLVED')).not.toThrow();
        });
        (0, vitest_1.it)('allows BLOCKED -> IN_PROGRESS (unblocked)', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('BLOCKED', 'IN_PROGRESS')).not.toThrow();
        });
        (0, vitest_1.it)('allows RESOLVED -> CLOSED', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('RESOLVED', 'CLOSED')).not.toThrow();
        });
        (0, vitest_1.it)('allows CLOSED -> OPEN (reopen)', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('CLOSED', 'OPEN')).not.toThrow();
        });
    });
    (0, vitest_1.describe)('Invalid Transitions (Enforced Constraints)', () => {
        (0, vitest_1.it)('disallows skipping steps: OPEN -> RESOLVED directly', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('OPEN', 'RESOLVED')).toThrow(errors_1.InvalidTransitionError);
        });
        (0, vitest_1.it)('disallows OPEN -> CLOSED directly', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('OPEN', 'CLOSED')).toThrow(errors_1.InvalidTransitionError);
        });
        (0, vitest_1.it)('disallows BLOCKED -> RESOLVED directly without resuming IN_PROGRESS', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('BLOCKED', 'RESOLVED')).toThrow(errors_1.InvalidTransitionError);
        });
        (0, vitest_1.it)('disallows BLOCKED -> CLOSED directly', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('BLOCKED', 'CLOSED')).toThrow(errors_1.InvalidTransitionError);
        });
        (0, vitest_1.it)('disallows RESOLVED -> IN_PROGRESS directly (must be reopened from CLOSED or moved to CLOSED)', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('RESOLVED', 'IN_PROGRESS')).toThrow(errors_1.InvalidTransitionError);
        });
        (0, vitest_1.it)('disallows CLOSED -> RESOLVED directly', () => {
            (0, vitest_1.expect)(() => (0, workflow_1.validateTransition)('CLOSED', 'RESOLVED')).toThrow(errors_1.InvalidTransitionError);
        });
    });
    (0, vitest_1.describe)('getValidTransitions lookup', () => {
        (0, vitest_1.it)('returns valid targets for each status', () => {
            (0, vitest_1.expect)((0, workflow_1.getValidTransitions)('OPEN')).toEqual(['IN_PROGRESS']);
            (0, vitest_1.expect)((0, workflow_1.getValidTransitions)('IN_PROGRESS')).toEqual(['WAITING_FOR_APPROVAL', 'BLOCKED', 'RESOLVED']);
            (0, vitest_1.expect)((0, workflow_1.getValidTransitions)('WAITING_FOR_APPROVAL')).toEqual(['IN_PROGRESS', 'RESOLVED']);
            (0, vitest_1.expect)((0, workflow_1.getValidTransitions)('BLOCKED')).toEqual(['IN_PROGRESS']);
            (0, vitest_1.expect)((0, workflow_1.getValidTransitions)('RESOLVED')).toEqual(['CLOSED']);
            (0, vitest_1.expect)((0, workflow_1.getValidTransitions)('CLOSED')).toEqual(['OPEN']);
        });
    });
});
//# sourceMappingURL=workflow.test.js.map