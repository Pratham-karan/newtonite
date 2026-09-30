"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('email', 255).notNullable().unique();
        table.string('password_hash', 255).notNullable();
        table.string('name', 255).notNullable();
        table.enum('role', ['ADMIN', 'TEAM_LEAD', 'MEMBER']).notNullable().defaultTo('MEMBER');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('users');
}
//# sourceMappingURL=001_create_users.js.map