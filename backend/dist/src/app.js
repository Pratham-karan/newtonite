"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("./config");
const request_id_1 = require("./middleware/request-id");
const error_handler_1 = require("./middleware/error-handler");
// Route imports
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const users_routes_1 = __importDefault(require("./users/users.routes"));
const teams_routes_1 = __importDefault(require("./teams/teams.routes"));
const work_items_routes_1 = __importDefault(require("./work-items/work-items.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard/dashboard.routes"));
const app = (0, express_1.default)();
// --- Global Middleware ---
// Security headers
app.use((0, helmet_1.default)());
// CORS — allow frontend origin with credentials (cookies)
app.use((0, cors_1.default)({
    origin: config_1.config.cors.origin,
    credentials: true,
}));
// Parse JSON bodies
app.use(express_1.default.json({ limit: '1mb' }));
// Parse cookies (for JWT httpOnly cookie)
app.use((0, cookie_parser_1.default)());
// Request ID for log correlation
app.use(request_id_1.requestId);
// --- Routes ---
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/teams', teams_routes_1.default);
app.use('/api/work-items', work_items_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// --- Global Error Handler (must be last) ---
app.use(error_handler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map