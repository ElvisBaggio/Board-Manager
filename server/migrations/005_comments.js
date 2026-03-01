export async function up(knex) {
    if (!(await knex.schema.hasTable('comments'))) {
        await knex.schema.createTable('comments', (t) => {
            t.string('id').primary();
            t.string('feature_id').notNullable().references('id').inTable('features').onDelete('CASCADE');
            t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            t.text('content').notNullable();
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('comments');
}
