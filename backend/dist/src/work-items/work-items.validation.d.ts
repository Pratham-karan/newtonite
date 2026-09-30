import { z } from 'zod';
export declare const createWorkItemSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["CUSTOMER_ISSUE", "ENGINEERING", "PAYMENT", "PRODUCTION_INCIDENT", "COMPLIANCE", "OPERATIONAL_TASK"]>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>>;
    team_id: z.ZodString;
    assignee_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    team_id: string;
    type: "CUSTOMER_ISSUE" | "ENGINEERING" | "PAYMENT" | "PRODUCTION_INCIDENT" | "COMPLIANCE" | "OPERATIONAL_TASK";
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    assignee_id?: string | null | undefined;
}, {
    team_id: string;
    type: "CUSTOMER_ISSUE" | "ENGINEERING" | "PAYMENT" | "PRODUCTION_INCIDENT" | "COMPLIANCE" | "OPERATIONAL_TASK";
    title: string;
    description: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
    assignee_id?: string | null | undefined;
}>;
export declare const updateWorkItemSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["CUSTOMER_ISSUE", "ENGINEERING", "PAYMENT", "PRODUCTION_INCIDENT", "COMPLIANCE", "OPERATIONAL_TASK"]>>;
    status: z.ZodOptional<z.ZodEnum<["OPEN", "IN_PROGRESS", "WAITING_FOR_APPROVAL", "BLOCKED", "RESOLVED", "CLOSED"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    version: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    version: number;
    type?: "CUSTOMER_ISSUE" | "ENGINEERING" | "PAYMENT" | "PRODUCTION_INCIDENT" | "COMPLIANCE" | "OPERATIONAL_TASK" | undefined;
    status?: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_APPROVAL" | "BLOCKED" | "RESOLVED" | "CLOSED" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}, {
    version: number;
    type?: "CUSTOMER_ISSUE" | "ENGINEERING" | "PAYMENT" | "PRODUCTION_INCIDENT" | "COMPLIANCE" | "OPERATIONAL_TASK" | undefined;
    status?: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_APPROVAL" | "BLOCKED" | "RESOLVED" | "CLOSED" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}>;
export declare const assignWorkItemSchema: z.ZodObject<{
    assignee_id: z.ZodString;
    version: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    version: number;
    assignee_id: string;
}, {
    version: number;
    assignee_id: string;
}>;
export declare const approveWorkItemSchema: z.ZodObject<{
    version: z.ZodNumber;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    version: number;
    note?: string | undefined;
}, {
    version: number;
    note?: string | undefined;
}>;
export declare const resolveWorkItemSchema: z.ZodObject<{
    version: z.ZodNumber;
    resolution_note: z.ZodString;
}, "strip", z.ZodTypeAny, {
    resolution_note: string;
    version: number;
}, {
    resolution_note: string;
    version: number;
}>;
export declare const reopenWorkItemSchema: z.ZodObject<{
    version: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    version: number;
    reason: string;
}, {
    version: number;
    reason: string;
}>;
export declare const addCommentSchema: z.ZodObject<{
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
}, {
    body: string;
}>;
export declare const listWorkItemsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["OPEN", "IN_PROGRESS", "WAITING_FOR_APPROVAL", "BLOCKED", "RESOLVED", "CLOSED"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    type: z.ZodOptional<z.ZodEnum<["CUSTOMER_ISSUE", "ENGINEERING", "PAYMENT", "PRODUCTION_INCIDENT", "COMPLIANCE", "OPERATIONAL_TASK"]>>;
    team_id: z.ZodOptional<z.ZodString>;
    assignee_id: z.ZodOptional<z.ZodString>;
    created_by: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sort_by: z.ZodDefault<z.ZodOptional<z.ZodEnum<["created_at", "updated_at", "priority", "status"]>>>;
    sort_order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sort_by: "created_at" | "status" | "priority" | "updated_at";
    sort_order: "asc" | "desc";
    search?: string | undefined;
    team_id?: string | undefined;
    type?: "CUSTOMER_ISSUE" | "ENGINEERING" | "PAYMENT" | "PRODUCTION_INCIDENT" | "COMPLIANCE" | "OPERATIONAL_TASK" | undefined;
    status?: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_APPROVAL" | "BLOCKED" | "RESOLVED" | "CLOSED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
    assignee_id?: string | undefined;
    created_by?: string | undefined;
}, {
    search?: string | undefined;
    team_id?: string | undefined;
    type?: "CUSTOMER_ISSUE" | "ENGINEERING" | "PAYMENT" | "PRODUCTION_INCIDENT" | "COMPLIANCE" | "OPERATIONAL_TASK" | undefined;
    status?: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_APPROVAL" | "BLOCKED" | "RESOLVED" | "CLOSED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
    assignee_id?: string | undefined;
    created_by?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    sort_by?: "created_at" | "status" | "priority" | "updated_at" | undefined;
    sort_order?: "asc" | "desc" | undefined;
}>;
