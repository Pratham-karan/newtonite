"use strict";
/**
 * Shared TypeScript types for the backend.
 * These are the domain types — not DB row shapes (those live in repositories).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTION_TYPES = exports.PRIORITIES = exports.STATUSES = exports.WORK_ITEM_TYPES = exports.ROLES = void 0;
// --- Enums ---
exports.ROLES = ['ADMIN', 'TEAM_LEAD', 'MEMBER'];
exports.WORK_ITEM_TYPES = [
    'CUSTOMER_ISSUE',
    'ENGINEERING',
    'PAYMENT',
    'PRODUCTION_INCIDENT',
    'COMPLIANCE',
    'OPERATIONAL_TASK',
];
exports.STATUSES = [
    'OPEN',
    'IN_PROGRESS',
    'WAITING_FOR_APPROVAL',
    'BLOCKED',
    'RESOLVED',
    'CLOSED',
];
exports.PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
exports.ACTION_TYPES = [
    'CREATED',
    'STATUS_CHANGED',
    'PRIORITY_CHANGED',
    'ASSIGNED',
    'REASSIGNED',
    'COMMENT_ADDED',
    'APPROVED',
    'RESOLVED',
    'REOPENED',
    'TEAM_CHANGED',
    'UPDATED',
];
//# sourceMappingURL=types.js.map