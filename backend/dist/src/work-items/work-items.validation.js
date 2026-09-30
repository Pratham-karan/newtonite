"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkItemsQuerySchema = exports.addCommentSchema = exports.reopenWorkItemSchema = exports.resolveWorkItemSchema = exports.approveWorkItemSchema = exports.assignWorkItemSchema = exports.updateWorkItemSchema = exports.createWorkItemSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../common/types");
exports.createWorkItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(500),
    description: zod_1.z.string().min(1, 'Description is required'),
    type: zod_1.z.enum(types_1.WORK_ITEM_TYPES),
    priority: zod_1.z.enum(types_1.PRIORITIES).optional().default('MEDIUM'),
    team_id: zod_1.z.string().uuid('Invalid team ID'),
    assignee_id: zod_1.z.string().uuid('Invalid assignee ID').nullable().optional(),
});
exports.updateWorkItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(500).optional(),
    description: zod_1.z.string().min(1).optional(),
    type: zod_1.z.enum(types_1.WORK_ITEM_TYPES).optional(),
    status: zod_1.z.enum(types_1.STATUSES).optional(),
    priority: zod_1.z.enum(types_1.PRIORITIES).optional(),
    version: zod_1.z.number().int().positive('Version is required'),
});
exports.assignWorkItemSchema = zod_1.z.object({
    assignee_id: zod_1.z.string().uuid('Invalid assignee ID'),
    version: zod_1.z.number().int().positive('Version is required'),
});
exports.approveWorkItemSchema = zod_1.z.object({
    version: zod_1.z.number().int().positive('Version is required'),
    note: zod_1.z.string().optional(),
});
exports.resolveWorkItemSchema = zod_1.z.object({
    version: zod_1.z.number().int().positive('Version is required'),
    resolution_note: zod_1.z.string().min(1, 'Resolution note is required'),
});
exports.reopenWorkItemSchema = zod_1.z.object({
    version: zod_1.z.number().int().positive('Version is required'),
    reason: zod_1.z.string().min(1, 'Reason for reopening is required'),
});
exports.addCommentSchema = zod_1.z.object({
    body: zod_1.z.string().min(1, 'Comment body is required'),
});
exports.listWorkItemsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).optional().default(25),
    status: zod_1.z.enum(types_1.STATUSES).optional(),
    priority: zod_1.z.enum(types_1.PRIORITIES).optional(),
    type: zod_1.z.enum(types_1.WORK_ITEM_TYPES).optional(),
    team_id: zod_1.z.string().uuid().optional(),
    assignee_id: zod_1.z.string().uuid().optional(),
    created_by: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().optional(),
    sort_by: zod_1.z.enum(['created_at', 'updated_at', 'priority', 'status']).optional().default('updated_at'),
    sort_order: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
//# sourceMappingURL=work-items.validation.js.map