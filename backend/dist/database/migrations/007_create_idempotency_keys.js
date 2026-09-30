"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('idempotency_keys', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('idempotency_key', 255).notNullable();
        table.string('route', 500).notNullable();
        table.integer('status_code').notNullable();
        table.jsonb('response_body').notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('expires_at').notNullable();
        // Each user + key combination must be unique
        table.unique(['user_id', 'idempotency_key']);
        // Index for cleanup of expired keys
        table.index(['expires_at'], 'idx_idempotency_keys_expires');
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('idempotency_keys');
}
//# sourceMappingURL=007_create_idempotency_keys.js.map