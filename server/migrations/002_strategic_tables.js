/**
 * Strategic tables: key_results, team_members, resource_allocations, risks.
 */
export async function up(knex) {
    if (!(await knex.schema.hasTable('key_results'))) {
        await knex.schema.createTable('key_results', (t) => {
            t.string('id').primary();
            t.string('lane_id').notNullable().references('id').inTable('lanes').onDelete('CASCADE');
            t.string('title').notNullable();
            t.float('target_value').defaultTo(100);
            t.float('current_value').defaultTo(0);
            t.string('unit').defaultTo('%');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    if (!(await knex.schema.hasTable('team_members'))) {
        await knex.schema.createTable('team_members', (t) => {
            t.string('id').primary();
            t.string('board_id').notNullable().references('id').inTable('boards').onDelete('CASCADE');
            t.string('name').notNullable();
            t.string('role_title');
            t.string('avatar_color').defaultTo('#3498db');
            t.float('capacity_hours_per_quarter').defaultTo(480);
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    if (!(await knex.schema.hasTable('resource_allocations'))) {
        await knex.schema.createTable('resource_allocations', (t) => {
            t.string('id').primary();
            t.string('member_id').notNullable().references('id').inTable('team_members').onDelete('CASCADE');
            t.string('feature_id').notNullable().references('id').inTable('features').onDelete('CASCADE');
            t.float('hours_allocated').defaultTo(0);
            t.integer('quarter');
            t.integer('year');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    if (!(await knex.schema.hasTable('risks'))) {
        await knex.schema.createTable('risks', (t) => {
            t.string('id').primary();
            t.string('board_id').notNullable().references('id').inTable('boards').onDelete('CASCADE');
            t.string('title').notNullable();
            t.text('description');
            t.integer('impact').defaultTo(1);
            t.integer('probability').defaultTo(1);
            t.string('status').defaultTo('Open');
            t.text('mitigation');
            t.string('owner');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('resource_allocations');
    await knex.schema.dropTableIfExists('risks');
    await knex.schema.dropTableIfExists('team_members');
    await knex.schema.dropTableIfExists('key_results');
}
