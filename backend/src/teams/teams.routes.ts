import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import db from '../db';

const router = Router();

/**
 * GET /api/teams
 * List all teams. Any authenticated user can see team names.
 */
router.get(
  '/',
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const teams = await db('teams').select('*').orderBy('name');
      res.json(teams);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/teams/:id/members
 * List members of a specific team.
 */
router.get(
  '/:id/members',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const members = await db('team_memberships')
        .join('users', 'users.id', 'team_memberships.user_id')
        .where('team_memberships.team_id', id)
        .select('users.id', 'users.name', 'users.email', 'users.role');
      res.json(members);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
