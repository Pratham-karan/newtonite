/**
 * Shared TypeScript types for the backend.
 * These are the domain types — not DB row shapes (those live in repositories).
 */
export declare const ROLES: readonly ["ADMIN", "TEAM_LEAD", "MEMBER"];
export type Role = (typeof ROLES)[number];
export declare const WORK_ITEM_TYPES: readonly ["CUSTOMER_ISSUE", "ENGINEERING", "PAYMENT", "PRODUCTION_INCIDENT", "COMPLIANCE", "OPERATIONAL_TASK"];
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];
export declare const STATUSES: readonly ["OPEN", "IN_PROGRESS", "WAITING_FOR_APPROVAL", "BLOCKED", "RESOLVED", "CLOSED"];
export type Status = (typeof STATUSES)[number];
export declare const PRIORITIES: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export type Priority = (typeof PRIORITIES)[number];
export declare const ACTION_TYPES: readonly ["CREATED", "STATUS_CHANGED", "PRIORITY_CHANGED", "ASSIGNED", "REASSIGNED", "COMMENT_ADDED", "APPROVED", "RESOLVED", "REOPENED", "TEAM_CHANGED", "UPDATED"];
export type ActionType = (typeof ACTION_TYPES)[number];
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
export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
}
import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: Role;
        teams: string[];
    };
}
