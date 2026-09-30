"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const errors_1 = require("../common/errors");
(0, vitest_1.describe)('Error Hierarchy & HTTP Status Mappings', () => {
    (0, vitest_1.it)('NotFoundError maps to 404 with standard message', () => {
        const err = new errors_1.NotFoundError('Work item', '123');
        (0, vitest_1.expect)(err.statusCode).toBe(404);
        (0, vitest_1.expect)(err.message).toBe("Work item '123' not found");
    });
    (0, vitest_1.it)('ForbiddenError maps to 403', () => {
        const err = new errors_1.ForbiddenError('Only Team Leads can approve');
        (0, vitest_1.expect)(err.statusCode).toBe(403);
        (0, vitest_1.expect)(err.message).toBe('Only Team Leads can approve');
    });
    (0, vitest_1.it)('ConflictError maps to 409 and includes concurrency metadata', () => {
        const err = new errors_1.ConflictError('Concurrent edit detected', { currentVersion: 3 });
        (0, vitest_1.expect)(err.statusCode).toBe(409);
        (0, vitest_1.expect)(err.details).toEqual({ currentVersion: 3 });
    });
    (0, vitest_1.it)('ValidationError maps to 422', () => {
        const err = new errors_1.ValidationError('Invalid request payload', { field: 'title', message: 'Required' });
        (0, vitest_1.expect)(err.statusCode).toBe(422);
        (0, vitest_1.expect)(err.details).toEqual({ field: 'title', message: 'Required' });
    });
    (0, vitest_1.it)('InvalidTransitionError maps to 422 with workflow description', () => {
        const err = new errors_1.InvalidTransitionError('OPEN', 'CLOSED');
        (0, vitest_1.expect)(err.statusCode).toBe(422);
        (0, vitest_1.expect)(err.message).toBe("Cannot transition from OPEN to CLOSED");
        (0, vitest_1.expect)(err.details).toEqual({ from: 'OPEN', to: 'CLOSED' });
    });
});
//# sourceMappingURL=errors.test.js.map