import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('work_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 500).notNullable();
    table.text('description').notNullable();
    table
      .enum('type', [
        'CUSTOMER_ISSUE',
        'ENGINEERING',
        'PAYMENT',
        'PRODUCTION_INCIDENT',
        'COMPLIANCE',
        'OPERATIONAL_TASK',
      ])
      .notNullable();
    table
      .enum('status', [
        'OPEN',
        'IN_PROGRESS',
        'WAITING_FOR_APPROVAL',
        'BLOCKED',
        'RESOLVED',
        'CLOSED',
      ])
      .notNullable()
      .defaultTo('OPEN');
    table.enum('priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).notNullable().defaultTo('MEDIUM');
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('RESTRICT');
    table.uuid('assignee_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.integer('version').notNullable().defaultTo(1);
    table.text('resolution_note').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('resolved_at').nullable();

    // Indexes for common queries
    table.index(['team_id', 'status'], 'idx_work_items_team_status');
    table.index(['assignee_id', 'status'], 'idx_work_items_assignee_status');
    table.index(['priority', 'status'], 'idx_work_items_priority_status');
    table.index(['status', 'updated_at'], 'idx_work_items_status_updated');
    table.index(['created_at'], 'idx_work_items_created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('work_items');
}
