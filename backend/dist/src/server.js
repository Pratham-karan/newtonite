"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const logger_1 = __importDefault(require("./common/logger"));
const db_1 = __importDefault(require("./db"));
async function start() {
    try {
        // Check if external PostgreSQL is running; if not, fall back to embedded in-memory PostgreSQL
        try {
            await Promise.race([
                db_1.default.raw('SELECT 1'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('PostgreSQL connection timeout')), 2500)),
            ]);
            logger_1.default.info('Connected to PostgreSQL database');
        }
        catch (connErr) {
            logger_1.default.warn('External PostgreSQL not detected. Initializing embedded in-memory PostgreSQL engine (pg-mem)...');
            await db_1.default.initMemoryDb();
            logger_1.default.info('Embedded PostgreSQL initialized with schema migrations and demo seed scenarios');
        }
        app_1.default.listen(config_1.config.port, () => {
            logger_1.default.info(`Newtonite Operations Backend running on port ${config_1.config.port}`, {
                environment: config_1.config.nodeEnv,
                port: config_1.config.port,
                apiUrl: `http://localhost:${config_1.config.port}/api`,
            });
        });
    }
    catch (err) {
        logger_1.default.error('Failed to start server', { error: err.message });
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down...');
    await db_1.default.destroy();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.default.info('SIGINT received, shutting down...');
    await db_1.default.destroy();
    process.exit(0);
});
start();
//# sourceMappingURL=server.js.map