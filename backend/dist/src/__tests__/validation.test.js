"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const work_items_validation_1 = require("../work-items/work-items.validation");
(0, vitest_1.describe)('Validation Schemas & Optimistic Concurrency Invariants', () => {
    const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    (0, vitest_1.describe)('createWorkItemSchema', () => {
        (0, vitest_1.it)('accepts valid work item creation payload', () => {
            const parsed = work_items_validation_1.createWorkItemSchema.safeParse({
                title: 'Payment gateway timeout',
                description: 'Customer card processing failing on checkout',
                type: 'PAYMENT',
                priority: 'HIGH',
                team_id: validUUID,
            });
            (0, vitest_1.expect)(parsed.success).toBe(true);
        });
        (0, vitest_1.it)('defaults priority to MEDIUM if omitted', () => {
            const parsed = work_items_validation_1.createWorkItemSchema.safeParse({
                title: 'Reported defect',
                description: 'Detail here',
                type: 'CUSTOMER_ISSUE',
                team_id: validUUID,
            });
            (0, vitest_1.expect)(parsed.success).toBe(true);
            if (parsed.success) {
                (0, vitest_1.expect)(parsed.data.priority).toBe('MEDIUM');
            }
        });
        (0, vitest_1.it)('rejects empty title or description', () => {
            const parsed = work_items_validation_1.createWorkItemSchema.safeParse({
                title: '',
                description: '',
                type: 'CUSTOMER_ISSUE',
                team_id: validUUID,
            });
            (0, vitest_1.expect)(parsed.success).toBe(false);
        });
        (0, vitest_1.it)('rejects invalid enum types', () => {
            const parsed = work_items_validation_1.createWorkItemSchema.safeParse({
                title: 'Issue',
                description: 'Detail',
                type: 'RANDOM_UNKNOWN_TYPE',
                team_id: validUUID,
            });
            (0, vitest_1.expect)(parsed.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('updateWorkItemSchema', () => {
        (0, vitest_1.it)('requires a positive integer version', () => {
            const noVersion = work_items_validation_1.updateWorkItemSchema.safeParse({
                title: 'New title',
            });
            (0, vitest_1.expect)(noVersion.success).toBe(false);
            const zeroVersion = work_items_validation_1.updateWorkItemSchema.safeParse({
                title: 'New title',
                version: 0,
            });
            (0, vitest_1.expect)(zeroVersion.success).toBe(false);
            const validVersion = work_items_validation_1.updateWorkItemSchema.safeParse({
                title: 'New title',
                version: 1,
            });
            (0, vitest_1.expect)(validVersion.success).toBe(true);
        });
    });
    (0, vitest_1.describe)('assignWorkItemSchema', () => {
        (0, vitest_1.it)('requires valid assignee UUID and version', () => {
            const result = work_items_validation_1.assignWorkItemSchema.safeParse({
                assignee_id: validUUID,
                version: 2,
            });
            (0, vitest_1.expect)(result.success).toBe(true);
        });
        (0, vitest_1.it)('rejects malformed UUID', () => {
            const result = work_items_validation_1.assignWorkItemSchema.safeParse({
                assignee_id: 'not-a-uuid',
                version: 2,
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('resolveWorkItemSchema', () => {
        (0, vitest_1.it)('requires resolution_note and version', () => {
            const valid = work_items_validation_1.resolveWorkItemSchema.safeParse({
                resolution_note: 'Patched API connection pool settings',
                version: 3,
            });
            (0, vitest_1.expect)(valid.success).toBe(true);
            const emptyNote = work_items_validation_1.resolveWorkItemSchema.safeParse({
                resolution_note: '',
                version: 3,
            });
            (0, vitest_1.expect)(emptyNote.success).toBe(false);
        });
    });
    (0, vitest_1.describe)('reopenWorkItemSchema', () => {
        (0, vitest_1.it)('requires reason and version', () => {
            const valid = work_items_validation_1.reopenWorkItemSchema.safeParse({
                reason: 'Recurred after release rollout',
                version: 4,
            });
            (0, vitest_1.expect)(valid.success).toBe(true);
            const missingReason = work_items_validation_1.reopenWorkItemSchema.safeParse({
                version: 4,
            });
            (0, vitest_1.expect)(missingReason.success).toBe(false);
        });
    });
});
//# sourceMappingURL=validation.test.js.map