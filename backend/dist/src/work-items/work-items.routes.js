"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const idempotency_1 = require("../middleware/idempotency");
const validate_1 = require("../middleware/validate");
const work_items_service_1 = require("./work-items.service");
const work_items_validation_1 = require("./work-items.validation");
const router = (0, express_1.Router)();
/**
 * POST /api/work-items
 * Create a new work item. Supports Idempotency-Key header.
 */
router.post('/', auth_1.authenticate, (0, idempotency_1.idempotency)(), (0, validate_1.validate)(work_items_validation_1.createWorkItemSchema), async (req, res, next) => {
    try {
        const user = req.user;
        const item = await work_items_service_1.workItemsService.create(req.body, user);
        res.status(201).json(item);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/work-items
 * List work items with filtering, sorting, and pagination.
 */
router.get('/', auth_1.authenticate, (0, validate_1.validateQuery)(work_items_validation_1.listWorkItemsQuerySchema), async (req, res, next) => {
    try {
        const user = req.user;
        const { page, pageSize, sort_by, sort_order, ...filters } = req.query;
        const result = await work_items_service_1.workItemsService.list({ ...filters, sort_by, sort_order }, { page, pageSize }, user);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/work-items/:id
 * Get work item detail with activity and comments.
 */
router.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const item = await work_items_service_1.workItemsService.getById(req.params.id, user);
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
/**
 * PATCH /api/work-items/:id
 * Update work item fields. Requires version for optimistic concurrency.
 */
router.patch('/:id', auth_1.authenticate, (0, validate_1.validate)(work_items_validation_1.updateWorkItemSchema), async (req, res, next) => {
    try {
        const user = req.user;
        const item = await work_items_service_1.workItemsService.update(req.params.id, req.body, user);
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/work-items/:id/assign
 * Assign/reassign a work item. Team Lead or Admin only.
 */
router.post('/:id/assign', auth_1.authenticate, (0, idempotency_1.idempotency)(), (0, validate_1.validate)(work_items_validation_1.assignWorkItemSchema), async (req, res, next) => {
    try {
        const user = req.user;
        const item = await work_items_service_1.workItemsService.assign(req.params.id, req.body, user);
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/work-items/:id/approve
 * Approve a work item. Must be WAITING_FOR_APPROVAL. Cannot self-approve.
 */
router.post('/:id/approve', auth_1.authenticate, (0, idempotency_1.idempotency)(), (0, validate_1.validate)(work_items_validation_1.approveWorkItemSchema), async (req, res, next) => {
    try {
        const user = req.user;
        const item = await work_items_service_1.workItemsService.approve(req.params.id, req.body, user);
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/work-items/:id/resolve
 * Resolve a work item with a resolution note.
 */
router.post('/:id/resolve', auth_1.authenticate, (0, idempotency_1.idempotency)(), (0, validate_1.validate)(work_items_validation_1.resolveWorkItemSchema), async (req, res, next) => {
    try {
        const user = req.user;
        const item = await work_items_service_1.workItemsService.resolve(req.params.id, req.body, user);
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/work-items/:id/reopen
 * Reopen a CLOSED work item with a reason.
 */
router.post('/:id/reopen', auth_1.authenticate, (0, idempotency_1.idempotency)(), (0, validate_1.validate)(work_items_validation_1.reopenWorkItemSchema), async (req, res, next) => {
    try {
        const user = req.user;
        const item = await work_items_service_1.workItemsService.reopen(req.params.id, req.body, user);
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
/**
 * POST /api/work-items/:id/comments
 * Add a comment to a work item.
 */
router.post('/:id/comments', auth_1.authenticate, (0, validate_1.validate)(work_items_validation_1.addCommentSchema), async (req, res, next) => {
    try {
        const user = req.user;
        const comment = await work_items_service_1.workItemsService.addComment(req.params.id, req.body.body, user);
        res.status(201).json(comment);
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/work-items/:id/activity
 * Get paginated activity history for a work item.
 */
router.get('/:id/activity', auth_1.authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 25;
        const result = await work_items_service_1.workItemsService.getActivity(req.params.id, { page, pageSize }, user);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=work-items.routes.js.map