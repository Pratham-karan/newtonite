"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../common/errors");
const logger_1 = __importDefault(require("../common/logger"));
/**
 * Global error handler — translates AppError into structured JSON responses.
 * Unknown errors become 500s without leaking implementation details.
 */
function errorHandler(err, req, res, _next) {
    if (err instanceof errors_1.AppError) {
        logger_1.default.warn(`${err.code}: ${err.message}`, {
            requestId: req.requestId,
            statusCode: err.statusCode,
            path: req.path,
            method: req.method,
        });
        res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                ...(err.details && { details: err.details }),
            },
        });
        return;
    }
    // Unexpected errors — log full stack, return generic message
    logger_1.default.error('Unhandled error', {
        requestId: req.requestId,
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred. Please try again.',
        },
    });
}
//# sourceMappingURL=error-handler.js.map