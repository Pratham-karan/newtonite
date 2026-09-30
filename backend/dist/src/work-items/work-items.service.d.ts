import { AuthenticatedRequest, WorkItem, PaginatedResult } from '../common/types';
export declare const workItemsService: {
    /**
     * Create a new work item.
     * Validates team membership, creates the item + CREATED activity in one transaction.
     */
    create(data: {
        title: string;
        description: string;
        type: string;
        priority?: string;
        team_id: string;
        assignee_id?: string | null;
    }, user: AuthenticatedRequest["user"]): Promise<WorkItem>;
    /**
     * List work items with server-side filtering, sorting, and pagination.
     * Only shows items from teams the user belongs to (unless admin).
     */
    list(filters: {
        status?: string;
        priority?: string;
        type?: string;
        team_id?: string;
        assignee_id?: string;
        created_by?: string;
        search?: string;
        sort_by?: string;
        sort_order?: string;
    }, pagination: {
        page: number;
        pageSize: number;
    }, user: AuthenticatedRequest["user"]): Promise<PaginatedResult<WorkItem & {
        assignee_name?: string;
        team_name?: string;
        creator_name?: string;
    }>>;
    /**
     * Get a single work item with its activity log and comments.
     */
    getById(id: string, user: AuthenticatedRequest["user"]): Promise<any>;
    /**
     * Update work item fields (title, description, type, status, priority).
     * Uses optimistic concurrency via the version field.
     * All changes + audit events happen in a single transaction.
     */
    update(id: string, data: {
        title?: string;
        description?: string;
        type?: string;
        status?: string;
        priority?: string;
        version: number;
    }, user: AuthenticatedRequest["user"]): Promise<WorkItem>;
    /**
     * Assign (or reassign) a work item. Requires Team Lead or Admin.
     */
    assign(id: string, data: {
        assignee_id: string;
        version: number;
    }, user: AuthenticatedRequest["user"]): Promise<WorkItem>;
    /**
     * Approve a work item. Requires WAITING_FOR_APPROVAL status.
     * The approver cannot be the item's creator (self-approval prevention).
     */
    approve(id: string, data: {
        version: number;
        note?: string;
    }, user: AuthenticatedRequest["user"]): Promise<WorkItem>;
    /**
     * Resolve a work item. Requires IN_PROGRESS status and a resolution note.
     */
    resolve(id: string, data: {
        version: number;
        resolution_note: string;
    }, user: AuthenticatedRequest["user"]): Promise<WorkItem>;
    /**
     * Reopen a CLOSED work item. Requires Team Lead or Admin.
     */
    reopen(id: string, data: {
        version: number;
        reason: string;
    }, user: AuthenticatedRequest["user"]): Promise<WorkItem>;
    /**
     * Add a comment to a work item.
     */
    addComment(workItemId: string, body: string, user: AuthenticatedRequest["user"]): Promise<any>;
    /**
     * Get activity history for a work item (paginated).
     */
    getActivity(workItemId: string, pagination: {
        page: number;
        pageSize: number;
    }, user: AuthenticatedRequest["user"]): Promise<PaginatedResult<any>>;
};
