"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('team_memberships', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        // A user can only be a member of a team once
        table.unique(['user_id', 'team_id']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('team_memberships');
}
//# sourceMappingURL=003_create_team_memberships.js.map