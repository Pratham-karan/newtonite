/**
 * Shared TypeScript types for the backend.
 * These are the domain types — not DB row shapes (those live in repositories).
 */

// --- Enums ---

export const ROLES = ['ADMIN', 'TEAM_LEAD', 'MEMBER'] as const;
export type Role = (typeof ROLES)[number];

export const WORK_ITEM_TYPES = [
  'CUSTOMER_ISSUE',
  'ENGINEERING',
  'PAYMENT',
  'PRODUCTION_INCIDENT',
  'COMPLIANCE',
  'OPERATIONAL_TASK',
] as const;
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

export const STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_APPROVAL',
  'BLOCKED',
  'RESOLVED',
  'CLOSED',
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ACTION_TYPES = [
  'CREATED',
  'STATUS_CHANGED',
  'PRIORITY_CHANGED',
  'ASSIGNED',
  'REASSIGNED',
  'COMMENT_ADDED',
  'APPROVED',
  'RESOLVED',
  'REOPENED',
  'TEAM_CHANGED',
  'UPDATED',
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

// --- Domain models ---

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  created_at: Date;
}

export interface TeamMembership {
  id: string;
  user_id: string;
  team_id: string;
  created_at: Date;
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  type: WorkItemType;
  status: Status;
  priority: Priority;
  team_id: string;
  assignee_id: string | null;
  created_by: string;
  version: number;
  resolution_note: string | null;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
}

export interface Comment {
  id: string;
  work_item_id: string;
  author_id: string;
  body: string;
  created_at: Date;
}

export interface Activity {
  id: string;
  work_item_id: string;
  actor_id: string;
  action_type: ActionType;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: string | null;
  created_at: Date;
}

// --- Request helpers ---

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// --- JWT payload ---

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

// --- Authenticated request (added by auth middleware) ---

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
    teams: string[]; // team IDs
  };
}
