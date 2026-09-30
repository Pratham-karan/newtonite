import knex, { Knex } from 'knex';
import knexConfig from '../knexfile';
import { config } from './config';
import path from 'path';
import logger from './common/logger';

const environment = config.isTest ? 'test' : config.isProduction ? 'production' : 'development';

let activeDb: Knex = knex(knexConfig[environment]);

export async function initMemoryDb(): Promise<void> {
  const { newDb } = await import('pg-mem');
  const memDb = newDb();

  memDb.public.registerFunction({
    name: 'gen_random_uuid',
    implementation: () => '11111111-1111-1111-1111-111111111111',
  });

  const memKnex: Knex = memDb.adapters.createKnex();

  // Run migrations
  const migrationsDir = path.resolve(__dirname, '../database/migrations');
  await memKnex.migrate.latest({
    directory: migrationsDir,
    extension: 'ts',
  });

  // Run seeds
  const seedModule = await import('../database/seeds/seed');
  await seedModule.seed(memKnex);

  activeDb = memKnex;
}

// Proxy wrapper so any callers to db(...) or db.xxx delegate to activeDb
type DbProxy = Knex & { initMemoryDb: () => Promise<void> };

const db = new Proxy(function () {} as any, {
  apply(_target, _thisArg, argumentsList) {
    return (activeDb as any)(...argumentsList);
  },
  get(_target, prop) {
    if (prop === 'initMemoryDb') {
      return initMemoryDb;
    }
    const val = (activeDb as any)[prop];
    if (typeof val === 'function') {
      return val.bind(activeDb);
    }
    return val;
  },
}) as DbProxy;

export default db;
