import { describe, it, expect } from 'vitest';
import { validateTransition, getValidTransitions } from '../work-items/workflow';
import { InvalidTransitionError } from '../common/errors';
import { Status } from '../common/types';

describe('Workflow State Machine Invariants', () => {
  describe('Valid Transitions', () => {
    it('allows OPEN -> IN_PROGRESS', () => {
      expect(() => validateTransition('OPEN', 'IN_PROGRESS')).not.toThrow();
    });

    it('allows IN_PROGRESS -> WAITING_FOR_APPROVAL', () => {
      expect(() => validateTransition('IN_PROGRESS', 'WAITING_FOR_APPROVAL')).not.toThrow();
    });

    it('allows IN_PROGRESS -> BLOCKED', () => {
      expect(() => validateTransition('IN_PROGRESS', 'BLOCKED')).not.toThrow();
    });

    it('allows IN_PROGRESS -> RESOLVED', () => {
      expect(() => validateTransition('IN_PROGRESS', 'RESOLVED')).not.toThrow();
    });

    it('allows WAITING_FOR_APPROVAL -> IN_PROGRESS (rejection)', () => {
      expect(() => validateTransition('WAITING_FOR_APPROVAL', 'IN_PROGRESS')).not.toThrow();
    });

    it('allows WAITING_FOR_APPROVAL -> RESOLVED (approval)', () => {
      expect(() => validateTransition('WAITING_FOR_APPROVAL', 'RESOLVED')).not.toThrow();
    });

    it('allows BLOCKED -> IN_PROGRESS (unblocked)', () => {
      expect(() => validateTransition('BLOCKED', 'IN_PROGRESS')).not.toThrow();
    });

    it('allows RESOLVED -> CLOSED', () => {
      expect(() => validateTransition('RESOLVED', 'CLOSED')).not.toThrow();
    });

    it('allows CLOSED -> OPEN (reopen)', () => {
      expect(() => validateTransition('CLOSED', 'OPEN')).not.toThrow();
    });
  });

  describe('Invalid Transitions (Enforced Constraints)', () => {
    it('disallows skipping steps: OPEN -> RESOLVED directly', () => {
      expect(() => validateTransition('OPEN', 'RESOLVED')).toThrow(InvalidTransitionError);
    });

    it('disallows OPEN -> CLOSED directly', () => {
      expect(() => validateTransition('OPEN', 'CLOSED')).toThrow(InvalidTransitionError);
    });

    it('disallows BLOCKED -> RESOLVED directly without resuming IN_PROGRESS', () => {
      expect(() => validateTransition('BLOCKED', 'RESOLVED')).toThrow(InvalidTransitionError);
    });

    it('disallows BLOCKED -> CLOSED directly', () => {
      expect(() => validateTransition('BLOCKED', 'CLOSED')).toThrow(InvalidTransitionError);
    });

    it('disallows RESOLVED -> IN_PROGRESS directly (must be reopened from CLOSED or moved to CLOSED)', () => {
      expect(() => validateTransition('RESOLVED', 'IN_PROGRESS')).toThrow(InvalidTransitionError);
    });

    it('disallows CLOSED -> RESOLVED directly', () => {
      expect(() => validateTransition('CLOSED', 'RESOLVED')).toThrow(InvalidTransitionError);
    });
  });

  describe('getValidTransitions lookup', () => {
    it('returns valid targets for each status', () => {
      expect(getValidTransitions('OPEN')).toEqual(['IN_PROGRESS']);
      expect(getValidTransitions('IN_PROGRESS')).toEqual(['WAITING_FOR_APPROVAL', 'BLOCKED', 'RESOLVED']);
      expect(getValidTransitions('WAITING_FOR_APPROVAL')).toEqual(['IN_PROGRESS', 'RESOLVED']);
      expect(getValidTransitions('BLOCKED')).toEqual(['IN_PROGRESS']);
      expect(getValidTransitions('RESOLVED')).toEqual(['CLOSED']);
      expect(getValidTransitions('CLOSED')).toEqual(['OPEN']);
    });
  });
});
