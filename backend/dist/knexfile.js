"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const baseConfig = {
    client: 'pg',
    migrations: {
        directory: './database/migrations',
        extension: 'ts',
    },
    seeds: {
        directory: './database/seeds',
        extension: 'ts',
    },
    pool: {
        min: 2,
        max: 10,
    },
};
const config = {
    development: {
        ...baseConfig,
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_NAME || 'newtonite_ops',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
        },
    },
    test: {
        ...baseConfig,
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.TEST_DB_NAME || 'newtonite_ops_test',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
        },
    },
    production: {
        ...baseConfig,
        connection: {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: { rejectUnauthorized: false },
        },
        pool: {
            min: 5,
            max: 30,
        },
    },
};
exports.default = config;
//# sourceMappingURL=knexfile.js.map