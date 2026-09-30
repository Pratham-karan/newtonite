"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = requestId;
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../common/logger"));
/**
 * Assigns a unique request ID to every incoming request.
 * Used for correlating log entries across a single request lifecycle.
 */
function requestId(req, res, next) {
    const id = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    // Log every incoming request
    logger_1.default.info(`${req.method} ${req.path}`, {
        requestId: id,
        method: req.method,
        path: req.path,
        ip: req.ip,
    });
    next();
}
//# sourceMappingURL=request-id.js.map