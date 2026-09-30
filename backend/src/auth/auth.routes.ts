import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../common/types';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Authenticates user, sets JWT in httpOnly cookie.
 */
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);

      // Set JWT in httpOnly cookie — JS cannot read it (XSS protection)
      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        path: '/',
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/logout
 * Clears the auth cookie.
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Returns current user's profile + team memberships.
 * Requires authentication.
 */
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const profile = await authService.getProfile(user.id);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
