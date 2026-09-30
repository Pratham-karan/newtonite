import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../common/types';
import db from '../db';

const router = Router();

/**
 * GET /api/dashboard/summary
 * Aggregated counts: work items by status, by priority, total.
 * Scoped to user's teams (unless admin).
 */
router.get(
  '/summary',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const query = db('work_items');

      if (user.role !== 'ADMIN') {
        query.whereIn('team_id', user.teams);
      }

      // Status counts
      const statusCounts = await query.clone()
        .select('status')
        .count('id as count')
        .groupBy('status');

      // Priority counts (only for non-closed items)
      const priorityCounts = await query.clone()
        .whereNotIn('status', ['CLOSED', 'RESOLVED'])
        .select('priority')
        .count('id as count')
        .groupBy('priority');

      // Total active (not closed)
      const { count: totalActive } = (await query.clone()
        .whereNotIn('status', ['CLOSED'])
        .count('id as count')
        .first()) as any;

      res.json({
        statusCounts: statusCounts.reduce((acc: any, row: any) => {
          acc[row.status] = parseInt(row.count, 10);
          return acc;
        }, {}),
        priorityCounts: priorityCounts.reduce((acc: any, row: any) => {
          acc[row.priority] = parseInt(row.count, 10);
          return acc;
        }, {}),
        totalActive: parseInt(totalActive, 10),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/dashboard/my-work
 * Work items assigned to the current user, ordered by priority.
 */
router.get(
  '/my-work',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const items = await db('work_items')
        .join('teams', 'work_items.team_id', 'teams.id')
        .where('work_items.assignee_id', user.id)
        .whereNotIn('work_items.status', ['CLOSED'])
        .select(
          'work_items.id',
          'work_items.title',
          'work_items.status',
          'work_items.priority',
          'work_items.type',
          'work_items.updated_at',
          'teams.name as team_name'
        )
        .orderByRaw(
          "CASE work_items.priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 WHEN 'LOW' THEN 3 END ASC"
        )
        .orderBy('work_items.updated_at', 'desc')
        .limit(20);

      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/dashboard/critical
 * All CRITICAL priority items that aren't closed.
 */
router.get(
  '/critical',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const query = db('work_items')
        .join('teams', 'work_items.team_id', 'teams.id')
        .leftJoin('users as assignee', 'work_items.assignee_id', 'assignee.id')
        .where('work_items.priority', 'CRITICAL')
        .whereNotIn('work_items.status', ['CLOSED']);

      if (user.role !== 'ADMIN') {
        query.whereIn('work_items.team_id', user.teams);
      }

      const items = await query
        .select(
          'work_items.id',
          'work_items.title',
          'work_items.status',
          'work_items.type',
          'work_items.updated_at',
          'work_items.created_at',
          'teams.name as team_name',
          'assignee.name as assignee_name'
        )
        .orderBy('work_items.created_at', 'desc')
        .limit(20);

      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/dashboard/approvals
 * Items WAITING_FOR_APPROVAL in user's teams.
 */
router.get(
  '/approvals',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const query = db('work_items')
        .join('teams', 'work_items.team_id', 'teams.id')
        .leftJoin('users as assignee', 'work_items.assignee_id', 'assignee.id')
        .leftJoin('users as creator', 'work_items.created_by', 'creator.id')
        .where('work_items.status', 'WAITING_FOR_APPROVAL');

      if (user.role !== 'ADMIN') {
        query.whereIn('work_items.team_id', user.teams);
      }

      const items = await query
        .select(
          'work_items.id',
          'work_items.title',
          'work_items.type',
          'work_items.priority',
          'work_items.updated_at',
          'teams.name as team_name',
          'assignee.name as assignee_name',
          'creator.name as creator_name'
        )
        .orderBy('work_items.updated_at', 'desc')
        .limit(20);

      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/dashboard/recent
 * Recently updated items across user's teams.
 */
router.get(
  '/recent',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const query = db('work_items')
        .join('teams', 'work_items.team_id', 'teams.id')
        .leftJoin('users as assignee', 'work_items.assignee_id', 'assignee.id');

      if (user.role !== 'ADMIN') {
        query.whereIn('work_items.team_id', user.teams);
      }

      const items = await query
        .select(
          'work_items.id',
          'work_items.title',
          'work_items.status',
          'work_items.priority',
          'work_items.type',
          'work_items.updated_at',
          'teams.name as team_name',
          'assignee.name as assignee_name'
        )
        .orderBy('work_items.updated_at', 'desc')
        .limit(10);

      res.json(items);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
