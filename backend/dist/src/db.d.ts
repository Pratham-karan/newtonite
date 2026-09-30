import { Knex } from 'knex';
export declare function initMemoryDb(): Promise<void>;
type DbProxy = Knex & {
    initMemoryDb: () => Promise<void>;
};
declare const db: DbProxy;
export default db;
