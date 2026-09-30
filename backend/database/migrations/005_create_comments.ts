import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('work_item_id').notNullable().references('id').inTable('work_items').onDelete('CASCADE');
    table.uuid('author_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.text('body').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['work_item_id', 'created_at'], 'idx_comments_work_item');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('comments');
}
