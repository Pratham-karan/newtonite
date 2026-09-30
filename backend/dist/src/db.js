"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMemoryDb = initMemoryDb;
const knex_1 = __importDefault(require("knex"));
const knexfile_1 = __importDefault(require("../knexfile"));
const config_1 = require("./config");
const path_1 = __importDefault(require("path"));
const environment = config_1.config.isTest ? 'test' : config_1.config.isProduction ? 'production' : 'development';
let activeDb = (0, knex_1.default)(knexfile_1.default[environment]);
async function initMemoryDb() {
    const { newDb } = await Promise.resolve().then(() => __importStar(require('pg-mem')));
    const memDb = newDb();
    memDb.public.registerFunction({
        name: 'gen_random_uuid',
        implementation: () => '11111111-1111-1111-1111-111111111111',
    });
    const memKnex = memDb.adapters.createKnex();
    // Run migrations
    const migrationsDir = path_1.default.resolve(__dirname, '../database/migrations');
    await memKnex.migrate.latest({
        directory: migrationsDir,
        extension: 'ts',
    });
    // Run seeds
    const seedModule = await Promise.resolve().then(() => __importStar(require('../database/seeds/seed')));
    await seedModule.seed(memKnex);
    activeDb = memKnex;
}
const db = new Proxy(function () { }, {
    apply(_target, _thisArg, argumentsList) {
        return activeDb(...argumentsList);
    },
    get(_target, prop) {
        if (prop === 'initMemoryDb') {
            return initMemoryDb;
        }
        const val = activeDb[prop];
        if (typeof val === 'function') {
            return val.bind(activeDb);
        }
        return val;
    },
});
exports.default = db;
//# sourceMappingURL=db.js.map