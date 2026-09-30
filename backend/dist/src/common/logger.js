"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
/**
 * Structured logger — JSON in production, colorised text in development.
 * Never log passwords, tokens, or sensitive user data.
 */
const logger = winston_1.default.createLogger({
    level: config_1.config.isProduction ? 'info' : 'debug',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), config_1.config.isProduction
        ? winston_1.default.format.json()
        : winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
            const rid = requestId ? ` [${requestId}]` : '';
            const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level}${rid}: ${message}${extra}`;
        }))),
    transports: [new winston_1.default.transports.Console()],
    // Suppress logs during tests to keep output clean
    silent: config_1.config.isTest,
});
exports.default = logger;
//# sourceMappingURL=logger.js.map