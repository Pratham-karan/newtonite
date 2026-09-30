import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activities', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('work_item_id').notNullable().references('id').inTable('work_items').onDelete('CASCADE');
    table.uuid('actor_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table
      .enum('action_type', [
        'CREATED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'ASSIGNED',
        'REASSIGNED',
        'COMMENT_ADDED',
        'APPROVED',
        'RESOLVED',
        'REOPENED',
        'TEAM_CHANGED',
        'UPDATED',
      ])
      .notNullable();
    table.jsonb('old_value').nullable();
    table.jsonb('new_value').nullable();
    table.text('metadata').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Immutable audit log — indexed for timeline queries
    table.index(['work_item_id', 'created_at'], 'idx_activities_work_item');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activities');
}
