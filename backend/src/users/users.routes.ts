import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import db from '../db';

const router = Router();

/**
 * GET /api/users
 * List all users (admin only). Returns id, email, name, role.
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await db('users')
        .select('id', 'email', 'name', 'role', 'created_at')
        .orderBy('name');
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/users/all
 * List all users (minimal info for dropdowns — any authenticated user).
 * Returns only id + name so it can be used in assignee selectors.
 */
router.get(
  '/all',
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await db('users')
        .select('id', 'name', 'email', 'role')
        .orderBy('name');
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
