import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import {
  AuthenticatedRequest,
  Status,
  Priority,
  ActionType,
  WorkItem,
  PaginatedResult,
} from '../common/types';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../common/errors';
import { validateTransition, getValidTransitions } from './workflow';
import logger from '../common/logger';
import { Knex } from 'knex';

// --- Helpers ---

/**
 * Performs an optimistic lock update. Returns the updated row or throws 409.
 *
 * This is the core concurrency mechanism:
 *   UPDATE ... WHERE id = :id AND version = :expectedVersion
 *   SET version = version + 1, ...
 *
 * If 0 rows are updated, another user modified the item first.
 */
async function optimisticUpdate(
  trx: Knex.Transaction,
  id: string,
  expectedVersion: number,
  updates: Partial<WorkItem>
): Promise<WorkItem> {
  const rows = await trx('work_items')
    .where({ id, version: expectedVersion })
    .update({
      ...updates,
      version: trx.raw('version + 1'),
      updated_at: trx.fn.now(),
    })
    .returning('*');

  if (rows.length === 0) {
    // Fetch current version to include in error details
    const current = await trx('work_items').where({ id }).select('version').first();
    throw new ConflictError(
      'This work item was modified by another user. Please refresh and try again.',
      { currentVersion: current?.version }
    );
  }

  return rows[0];
}

/**
 * Records an activity event within the same transaction as the state change.
 * This guarantees audit consistency — you can never have a state change without a log entry.
 */
async function recordActivity(
  trx: Knex.Transaction,
  workItemId: string,
  actorId: string,
  actionType: ActionType,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  metadata?: string
): Promise<void> {
  await trx('activities').insert({
    id: uuidv4(),
    work_item_id: workItemId,
    actor_id: actorId,
    action_type: actionType,
    old_value: oldValue ? JSON.stringify(oldValue) : null,
    new_value: newValue ? JSON.stringify(newValue) : null,
    metadata: metadata || null,
  });
}

/**
 * Checks that a user has access to a work item (is a member of its team, or is admin).
 */
function assertTeamAccess(
  userTeams: string[],
  userRole: string,
  workItemTeamId: string
): void {
  if (userRole === 'ADMIN') return;
  if (!userTeams.includes(workItemTeamId)) {
    throw new ForbiddenError('You do not have access to this work item');
  }
}

// --- Service ---

export const workItemsService = {
  /**
   * Create a new work item.
   * Validates team membership, creates the item + CREATED activity in one transaction.
   */
  async create(
    data: {
      title: string;
      description: string;
      type: string;
      priority?: string;
      team_id: string;
      assignee_id?: string | null;
    },
    user: AuthenticatedRequest['user']
  ): Promise<WorkItem> {
    // Verify team membership
    assertTeamAccess(user.teams, user.role, data.team_id);

    // If assignee specified, verify they belong to the team
    if (data.assignee_id) {
      const membership = await db('team_memberships')
        .where({ user_id: data.assignee_id, team_id: data.team_id })
        .first();
      if (!membership) {
        throw new ValidationError('Assignee is not a member of the selected team');
      }
    }

    const id = uuidv4();

    const workItem = await db.transaction(async (trx) => {
      const [created] = await trx('work_items')
        .insert({
          id,
          title: data.title,
          description: data.description,
          type: data.type,
          priority: data.priority || 'MEDIUM',
          status: 'OPEN',
          team_id: data.team_id,
          assignee_id: data.assignee_id || null,
          created_by: user.id,
          version: 1,
        })
        .returning('*');

      await recordActivity(trx, id, user.id, 'CREATED', null, {
        title: data.title,
        type: data.type,
        priority: data.priority || 'MEDIUM',
        team_id: data.team_id,
      });

      return created;
    });

    logger.info('Work item created', { workItemId: id, userId: user.id });
    return workItem;
  },

  /**
   * List work items with server-side filtering, sorting, and pagination.
   * Only shows items from teams the user belongs to (unless admin).
   */
  async list(
    filters: {
      status?: string;
      priority?: string;
      type?: string;
      team_id?: string;
      assignee_id?: string;
      created_by?: string;
      search?: string;
      sort_by?: string;
      sort_order?: string;
    },
    pagination: { page: number; pageSize: number },
    user: AuthenticatedRequest['user']
  ): Promise<PaginatedResult<WorkItem & { assignee_name?: string; team_name?: string; creator_name?: string }>> {
    const query = db('work_items')
      .leftJoin('users as assignee', 'work_items.assignee_id', 'assignee.id')
      .leftJoin('users as creator', 'work_items.created_by', 'creator.id')
      .join('teams', 'work_items.team_id', 'teams.id');

    // Non-admin users can only see their teams' items
    if (user.role !== 'ADMIN') {
      query.whereIn('work_items.team_id', user.teams);
    }

    // Apply filters
    if (filters.status) query.where('work_items.status', filters.status);
    if (filters.priority) query.where('work_items.priority', filters.priority);
    if (filters.type) query.where('work_items.type', filters.type);
    if (filters.team_id) query.where('work_items.team_id', filters.team_id);
    if (filters.assignee_id) query.where('work_items.assignee_id', filters.assignee_id);
    if (filters.created_by) query.where('work_items.created_by', filters.created_by);
    if (filters.search) {
      query.where(function () {
        this.whereILike('work_items.title', `%${filters.search}%`)
          .orWhereILike('work_items.description', `%${filters.search}%`);
      });
    }

    // Count total (before pagination)
    const countQuery = query.clone().clearSelect().clearOrder().count('work_items.id as total').first();
    const { total } = (await countQuery) as any;

    // Apply sorting and pagination
    const sortBy = filters.sort_by || 'updated_at';
    const sortOrder = filters.sort_order || 'desc';
    const offset = (pagination.page - 1) * pagination.pageSize;

    // Priority sorting: CRITICAL > HIGH > MEDIUM > LOW
    if (sortBy === 'priority') {
      query.orderByRaw(
        `CASE work_items.priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 END ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`
      );
    } else {
      query.orderBy(`work_items.${sortBy}`, sortOrder);
    }

    const items = await query
      .select(
        'work_items.*',
        'assignee.name as assignee_name',
        'creator.name as creator_name',
        'teams.name as team_name'
      )
      .offset(offset)
      .limit(pagination.pageSize);

    return {
      data: items,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: parseInt(total, 10),
        totalPages: Math.ceil(parseInt(total, 10) / pagination.pageSize),
      },
    };
  },

  /**
   * Get a single work item with its activity log and comments.
   */
  async getById(
    id: string,
    user: AuthenticatedRequest['user']
  ): Promise<any> {
    const item = await db('work_items')
      .leftJoin('users as assignee', 'work_items.assignee_id', 'assignee.id')
      .leftJoin('users as creator', 'work_items.created_by', 'creator.id')
      .join('teams', 'work_items.team_id', 'teams.id')
      .where('work_items.id', id)
      .select(
        'work_items.*',
        'assignee.name as assignee_name',
        'creator.name as creator_name',
        'teams.name as team_name'
      )
      .first();

    if (!item) {
      throw new NotFoundError('Work item', id);
    }

    assertTeamAccess(user.teams, user.role, item.team_id);

    // Get valid transitions for frontend
    const validTransitions = getValidTransitions(item.status as Status);

    // Get recent activities
    const activities = await db('activities')
      .join('users', 'activities.actor_id', 'users.id')
      .where('activities.work_item_id', id)
      .select('activities.*', 'users.name as actor_name')
      .orderBy('activities.created_at', 'desc')
      .limit(50);

    // Get comments
    const comments = await db('comments')
      .join('users', 'comments.author_id', 'users.id')
      .where('comments.work_item_id', id)
      .select('comments.*', 'users.name as author_name')
      .orderBy('comments.created_at', 'asc');

    return {
      ...item,
      validTransitions,
      activities,
      comments,
    };
  },

  /**
   * Update work item fields (title, description, type, status, priority).
   * Uses optimistic concurrency via the version field.
   * All changes + audit events happen in a single transaction.
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      type?: string;
      status?: string;
      priority?: string;
      version: number;
    },
    user: AuthenticatedRequest['user']
  ): Promise<WorkItem> {
    const item = await db('work_items').where({ id }).first();
    if (!item) throw new NotFoundError('Work item', id);

    assertTeamAccess(user.teams, user.role, item.team_id);

    // Authorization: Members can only update items assigned to them
    if (user.role === 'MEMBER') {
      if (item.assignee_id !== user.id && item.created_by !== user.id) {
        throw new ForbiddenError('You can only update items assigned to you or created by you');
      }
    }

    // Priority changes require Team Lead or Admin
    if (data.priority && data.priority !== item.priority && user.role === 'MEMBER') {
      throw new ForbiddenError('Only Team Leads and Admins can change priority');
    }

    // Status change → validate workflow transition
    if (data.status && data.status !== item.status) {
      validateTransition(item.status as Status, data.status as Status);
    }

    const updates: Record<string, any> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.type !== undefined) updates.type = data.type;
    if (data.status !== undefined) updates.status = data.status;
    if (data.priority !== undefined) updates.priority = data.priority;

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No fields to update');
    }

    return db.transaction(async (trx) => {
      const updated = await optimisticUpdate(trx, id, data.version, updates);

      // Record activity for each changed field
      if (data.status && data.status !== item.status) {
        await recordActivity(trx, id, user.id, 'STATUS_CHANGED',
          { status: item.status },
          { status: data.status }
        );
      }
      if (data.priority && data.priority !== item.priority) {
        await recordActivity(trx, id, user.id, 'PRIORITY_CHANGED',
          { priority: item.priority },
          { priority: data.priority }
        );
      }
      if (data.title || data.description || data.type) {
        await recordActivity(trx, id, user.id, 'UPDATED',
          {
            ...(data.title && { title: item.title }),
            ...(data.description && { description: item.description }),
            ...(data.type && { type: item.type }),
          },
          {
            ...(data.title && { title: data.title }),
            ...(data.description && { description: data.description }),
            ...(data.type && { type: data.type }),
          }
        );
      }

      return updated;
    });
  },

  /**
   * Assign (or reassign) a work item. Requires Team Lead or Admin.
   */
  async assign(
    id: string,
    data: { assignee_id: string; version: number },
    user: AuthenticatedRequest['user']
  ): Promise<WorkItem> {
    const item = await db('work_items').where({ id }).first();
    if (!item) throw new NotFoundError('Work item', id);

    assertTeamAccess(user.teams, user.role, item.team_id);

    // Only Team Lead or Admin can assign
    if (user.role === 'MEMBER') {
      throw new ForbiddenError('Only Team Leads and Admins can assign work items');
    }

    // Verify assignee belongs to the item's team
    const membership = await db('team_memberships')
      .where({ user_id: data.assignee_id, team_id: item.team_id })
      .first();
    if (!membership) {
      throw new ValidationError('Assignee is not a member of this team');
    }

    const oldAssigneeId = item.assignee_id;
    const actionType: ActionType = oldAssigneeId ? 'REASSIGNED' : 'ASSIGNED';

    return db.transaction(async (trx) => {
      const updated = await optimisticUpdate(trx, id, data.version, {
        assignee_id: data.assignee_id,
      } as any);

      await recordActivity(trx, id, user.id, actionType,
        { assignee_id: oldAssigneeId },
        { assignee_id: data.assignee_id }
      );

      return updated;
    });
  },

  /**
   * Approve a work item. Requires WAITING_FOR_APPROVAL status.
   * The approver cannot be the item's creator (self-approval prevention).
   */
  async approve(
    id: string,
    data: { version: number; note?: string },
    user: AuthenticatedRequest['user']
  ): Promise<WorkItem> {
    const item = await db('work_items').where({ id }).first();
    if (!item) throw new NotFoundError('Work item', id);

    assertTeamAccess(user.teams, user.role, item.team_id);

    // Only Team Lead or Admin can approve
    if (user.role === 'MEMBER') {
      throw new ForbiddenError('Only Team Leads and Admins can approve work items');
    }

    // Cannot approve own item
    if (item.created_by === user.id) {
      throw new ForbiddenError('You cannot approve a work item you created');
    }

    // Must be in WAITING_FOR_APPROVAL
    validateTransition(item.status as Status, 'RESOLVED');

    return db.transaction(async (trx) => {
      const updated = await optimisticUpdate(trx, id, data.version, {
        status: 'RESOLVED',
        resolved_at: new Date(),
        resolution_note: data.note || 'Approved',
      } as any);

      await recordActivity(trx, id, user.id, 'APPROVED',
        { status: item.status },
        { status: 'RESOLVED' },
        data.note
      );

      return updated;
    });
  },

  /**
   * Resolve a work item. Requires IN_PROGRESS status and a resolution note.
   */
  async resolve(
    id: string,
    data: { version: number; resolution_note: string },
    user: AuthenticatedRequest['user']
  ): Promise<WorkItem> {
    const item = await db('work_items').where({ id }).first();
    if (!item) throw new NotFoundError('Work item', id);

    assertTeamAccess(user.teams, user.role, item.team_id);

    // Members can only resolve items assigned to them
    if (user.role === 'MEMBER' && item.assignee_id !== user.id) {
      throw new ForbiddenError('You can only resolve items assigned to you');
    }

    validateTransition(item.status as Status, 'RESOLVED');

    return db.transaction(async (trx) => {
      const updated = await optimisticUpdate(trx, id, data.version, {
        status: 'RESOLVED',
        resolved_at: new Date(),
        resolution_note: data.resolution_note,
      } as any);

      await recordActivity(trx, id, user.id, 'RESOLVED',
        { status: item.status },
        { status: 'RESOLVED' },
        data.resolution_note
      );

      return updated;
    });
  },

  /**
   * Reopen a CLOSED work item. Requires Team Lead or Admin.
   */
  async reopen(
    id: string,
    data: { version: number; reason: string },
    user: AuthenticatedRequest['user']
  ): Promise<WorkItem> {
    const item = await db('work_items').where({ id }).first();
    if (!item) throw new NotFoundError('Work item', id);

    assertTeamAccess(user.teams, user.role, item.team_id);

    if (user.role === 'MEMBER') {
      throw new ForbiddenError('Only Team Leads and Admins can reopen work items');
    }

    validateTransition(item.status as Status, 'OPEN');

    return db.transaction(async (trx) => {
      const updated = await optimisticUpdate(trx, id, data.version, {
        status: 'OPEN',
        resolved_at: null,
        resolution_note: null,
      } as any);

      await recordActivity(trx, id, user.id, 'REOPENED',
        { status: item.status },
        { status: 'OPEN' },
        data.reason
      );

      return updated;
    });
  },

  /**
   * Add a comment to a work item.
   */
  async addComment(
    workItemId: string,
    body: string,
    user: AuthenticatedRequest['user']
  ): Promise<any> {
    const item = await db('work_items').where({ id: workItemId }).first();
    if (!item) throw new NotFoundError('Work item', workItemId);

    assertTeamAccess(user.teams, user.role, item.team_id);

    const commentId = uuidv4();

    return db.transaction(async (trx) => {
      const [comment] = await trx('comments')
        .insert({
          id: commentId,
          work_item_id: workItemId,
          author_id: user.id,
          body,
        })
        .returning('*');

      await recordActivity(trx, workItemId, user.id, 'COMMENT_ADDED',
        null,
        { comment_id: commentId, body: body.substring(0, 200) }
      );

      // Update work item's updated_at timestamp
      await trx('work_items').where({ id: workItemId }).update({
        updated_at: trx.fn.now(),
      });

      return comment;
    });
  },

  /**
   * Get activity history for a work item (paginated).
   */
  async getActivity(
    workItemId: string,
    pagination: { page: number; pageSize: number },
    user: AuthenticatedRequest['user']
  ): Promise<PaginatedResult<any>> {
    const item = await db('work_items').where({ id: workItemId }).first();
    if (!item) throw new NotFoundError('Work item', workItemId);

    assertTeamAccess(user.teams, user.role, item.team_id);

    const { total } = (await db('activities')
      .where({ work_item_id: workItemId })
      .count('id as total')
      .first()) as any;

    const offset = (pagination.page - 1) * pagination.pageSize;
    const activities = await db('activities')
      .join('users', 'activities.actor_id', 'users.id')
      .where('activities.work_item_id', workItemId)
      .select('activities.*', 'users.name as actor_name')
      .orderBy('activities.created_at', 'desc')
      .offset(offset)
      .limit(pagination.pageSize);

    return {
      data: activities,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: parseInt(total, 10),
        totalPages: Math.ceil(parseInt(total, 10) / pagination.pageSize),
      },
    };
  },
};
