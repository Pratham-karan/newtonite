import { describe, it, expect } from 'vitest';
import {
  createWorkItemSchema,
  updateWorkItemSchema,
  assignWorkItemSchema,
  approveWorkItemSchema,
  resolveWorkItemSchema,
  reopenWorkItemSchema,
} from '../work-items/work-items.validation';

describe('Validation Schemas & Optimistic Concurrency Invariants', () => {
  const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  describe('createWorkItemSchema', () => {
    it('accepts valid work item creation payload', () => {
      const parsed = createWorkItemSchema.safeParse({
        title: 'Payment gateway timeout',
        description: 'Customer card processing failing on checkout',
        type: 'PAYMENT',
        priority: 'HIGH',
        team_id: validUUID,
      });
      expect(parsed.success).toBe(true);
    });

    it('defaults priority to MEDIUM if omitted', () => {
      const parsed = createWorkItemSchema.safeParse({
        title: 'Reported defect',
        description: 'Detail here',
        type: 'CUSTOMER_ISSUE',
        team_id: validUUID,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.priority).toBe('MEDIUM');
      }
    });

    it('rejects empty title or description', () => {
      const parsed = createWorkItemSchema.safeParse({
        title: '',
        description: '',
        type: 'CUSTOMER_ISSUE',
        team_id: validUUID,
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects invalid enum types', () => {
      const parsed = createWorkItemSchema.safeParse({
        title: 'Issue',
        description: 'Detail',
        type: 'RANDOM_UNKNOWN_TYPE',
        team_id: validUUID,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('updateWorkItemSchema', () => {
    it('requires a positive integer version', () => {
      const noVersion = updateWorkItemSchema.safeParse({
        title: 'New title',
      });
      expect(noVersion.success).toBe(false);

      const zeroVersion = updateWorkItemSchema.safeParse({
        title: 'New title',
        version: 0,
      });
      expect(zeroVersion.success).toBe(false);

      const validVersion = updateWorkItemSchema.safeParse({
        title: 'New title',
        version: 1,
      });
      expect(validVersion.success).toBe(true);
    });
  });

  describe('assignWorkItemSchema', () => {
    it('requires valid assignee UUID and version', () => {
      const result = assignWorkItemSchema.safeParse({
        assignee_id: validUUID,
        version: 2,
      });
      expect(result.success).toBe(true);
    });

    it('rejects malformed UUID', () => {
      const result = assignWorkItemSchema.safeParse({
        assignee_id: 'not-a-uuid',
        version: 2,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resolveWorkItemSchema', () => {
    it('requires resolution_note and version', () => {
      const valid = resolveWorkItemSchema.safeParse({
        resolution_note: 'Patched API connection pool settings',
        version: 3,
      });
      expect(valid.success).toBe(true);

      const emptyNote = resolveWorkItemSchema.safeParse({
        resolution_note: '',
        version: 3,
      });
      expect(emptyNote.success).toBe(false);
    });
  });

  describe('reopenWorkItemSchema', () => {
    it('requires reason and version', () => {
      const valid = reopenWorkItemSchema.safeParse({
        reason: 'Recurred after release rollout',
        version: 4,
      });
      expect(valid.success).toBe(true);

      const missingReason = reopenWorkItemSchema.safeParse({
        version: 4,
      });
      expect(missingReason.success).toBe(false);
    });
  });
});
