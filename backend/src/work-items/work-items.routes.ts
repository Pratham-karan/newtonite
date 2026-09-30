import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { idempotency } from '../middleware/idempotency';
import { validate, validateQuery } from '../middleware/validate';
import { AuthenticatedRequest } from '../common/types';
import { workItemsService } from './work-items.service';
import {
  createWorkItemSchema,
  updateWorkItemSchema,
  assignWorkItemSchema,
  approveWorkItemSchema,
  resolveWorkItemSchema,
  reopenWorkItemSchema,
  addCommentSchema,
  listWorkItemsQuerySchema,
} from './work-items.validation';

const router = Router();

/**
 * POST /api/work-items
 * Create a new work item. Supports Idempotency-Key header.
 */
router.post(
  '/',
  authenticate,
  idempotency(),
  validate(createWorkItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await workItemsService.create(req.body, user);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/work-items
 * List work items with filtering, sorting, and pagination.
 */
router.get(
  '/',
  authenticate,
  validateQuery(listWorkItemsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const { page, pageSize, sort_by, sort_order, ...filters } = req.query as any;
      const result = await workItemsService.list(
        { ...filters, sort_by, sort_order },
        { page, pageSize },
        user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/work-items/:id
 * Get work item detail with activity and comments.
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await workItemsService.getById(req.params.id, user);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/work-items/:id
 * Update work item fields. Requires version for optimistic concurrency.
 */
router.patch(
  '/:id',
  authenticate,
  validate(updateWorkItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await workItemsService.update(req.params.id, req.body, user);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/work-items/:id/assign
 * Assign/reassign a work item. Team Lead or Admin only.
 */
router.post(
  '/:id/assign',
  authenticate,
  idempotency(),
  validate(assignWorkItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await workItemsService.assign(req.params.id, req.body, user);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/work-items/:id/approve
 * Approve a work item. Must be WAITING_FOR_APPROVAL. Cannot self-approve.
 */
router.post(
  '/:id/approve',
  authenticate,
  idempotency(),
  validate(approveWorkItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await workItemsService.approve(req.params.id, req.body, user);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/work-items/:id/resolve
 * Resolve a work item with a resolution note.
 */
router.post(
  '/:id/resolve',
  authenticate,
  idempotency(),
  validate(resolveWorkItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await workItemsService.resolve(req.params.id, req.body, user);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/work-items/:id/reopen
 * Reopen a CLOSED work item with a reason.
 */
router.post(
  '/:id/reopen',
  authenticate,
  idempotency(),
  validate(reopenWorkItemSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const item = await workItemsService.reopen(req.params.id, req.body, user);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/work-items/:id/comments
 * Add a comment to a work item.
 */
router.post(
  '/:id/comments',
  authenticate,
  validate(addCommentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const comment = await workItemsService.addComment(req.params.id, req.body.body, user);
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/work-items/:id/activity
 * Get paginated activity history for a work item.
 */
router.get(
  '/:id/activity',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 25;
      const result = await workItemsService.getActivity(
        req.params.id,
        { page, pageSize },
        user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
