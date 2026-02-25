/**
 * Initial schema migration — recreates existing tables using Knex.
 * Uses hasTable checks for safe execution on databases with existing data.
 */
export async function up(knex) {
    // Users
    if (!(await knex.schema.hasTable('users'))) {
        await knex.schema.createTable('users', (t) => {
            t.string('id').primary();
            t.string('name').notNullable();
            t.string('email').unique().notNullable();
            t.string('password_hash').notNullable();
            t.string('role').defaultTo('user');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // Boards
    if (!(await knex.schema.hasTable('boards'))) {
        await knex.schema.createTable('boards', (t) => {
            t.string('id').primary();
            t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
            t.string('title').notNullable();
            t.string('visibility').defaultTo('private');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // Lanes
    if (!(await knex.schema.hasTable('lanes'))) {
        await knex.schema.createTable('lanes', (t) => {
            t.string('id').primary();
            t.string('board_id').notNullable().references('id').inTable('boards').onDelete('CASCADE');
            t.string('title').notNullable();
            t.integer('sort_order').defaultTo(0);
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // Features
    if (!(await knex.schema.hasTable('features'))) {
        await knex.schema.createTable('features', (t) => {
            t.string('id').primary();
            t.string('lane_id').notNullable().references('id').inTable('lanes').onDelete('CASCADE');
            t.string('title').notNullable();
            t.text('description');
            t.string('status').defaultTo('Not Started');
            t.text('tags_json').defaultTo('[]');
            t.string('start_date').notNullable();
            t.string('end_date').notNullable();
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // Tags
    if (!(await knex.schema.hasTable('tags'))) {
        await knex.schema.createTable('tags', (t) => {
            t.string('id').primary();
            t.string('board_id').notNullable().references('id').inTable('boards').onDelete('CASCADE');
            t.string('name').notNullable();
            t.string('color').defaultTo('#3498db');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('tags');
    await knex.schema.dropTableIfExists('features');
    await knex.schema.dropTableIfExists('lanes');
    await knex.schema.dropTableIfExists('boards');
    await knex.schema.dropTableIfExists('users');
}
