import { z } from 'zod';
import { WORK_ITEM_TYPES, STATUSES, PRIORITIES } from '../common/types';

export const createWorkItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(WORK_ITEM_TYPES),
  priority: z.enum(PRIORITIES).optional().default('MEDIUM'),
  team_id: z.string().uuid('Invalid team ID'),
  assignee_id: z.string().uuid('Invalid assignee ID').nullable().optional(),
});

export const updateWorkItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(WORK_ITEM_TYPES).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  version: z.number().int().positive('Version is required'),
});

export const assignWorkItemSchema = z.object({
  assignee_id: z.string().uuid('Invalid assignee ID'),
  version: z.number().int().positive('Version is required'),
});

export const approveWorkItemSchema = z.object({
  version: z.number().int().positive('Version is required'),
  note: z.string().optional(),
});

export const resolveWorkItemSchema = z.object({
  version: z.number().int().positive('Version is required'),
  resolution_note: z.string().min(1, 'Resolution note is required'),
});

export const reopenWorkItemSchema = z.object({
  version: z.number().int().positive('Version is required'),
  reason: z.string().min(1, 'Reason for reopening is required'),
});

export const addCommentSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
});

export const listWorkItemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  type: z.enum(WORK_ITEM_TYPES).optional(),
  team_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'priority', 'status']).optional().default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});
