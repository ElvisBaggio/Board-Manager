/**
 * Strategic framework migration.
 * Adds: strategic_choices, goals_kpis, goal_objective_links,
 *       product_indicators, indicator_kr_links, execution_items,
 *       efficiency_indicators.
 * Alters: boards (just_cause, vision, mission), lanes (strategic_choice_id, problem_opportunity).
 */
export async function up(knex) {
    // === ALTER boards ===
    if (!(await knex.schema.hasColumn('boards', 'just_cause'))) {
        await knex.schema.alterTable('boards', (t) => {
            t.text('just_cause');
            t.text('vision');
            t.text('mission');
        });
    }

    // === Strategic Choices ===
    if (!(await knex.schema.hasTable('strategic_choices'))) {
        await knex.schema.createTable('strategic_choices', (t) => {
            t.string('id').primary();
            t.string('board_id').notNullable().references('id').inTable('boards').onDelete('CASCADE');
            t.string('title').notNullable();
            t.text('description');
            t.string('color').defaultTo('#ff9500');
            t.integer('sort_order').defaultTo(0);
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // === Goals / KPIs ===
    if (!(await knex.schema.hasTable('goals_kpis'))) {
        await knex.schema.createTable('goals_kpis', (t) => {
            t.string('id').primary();
            t.string('strategic_choice_id').notNullable().references('id').inTable('strategic_choices').onDelete('CASCADE');
            t.string('title').notNullable();
            t.float('target_value').defaultTo(100);
            t.float('current_value').defaultTo(0);
            t.string('unit').defaultTo('%');
            t.string('frequency').defaultTo('quarterly');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // === ALTER lanes (Objectives) ===
    if (!(await knex.schema.hasColumn('lanes', 'strategic_choice_id'))) {
        await knex.schema.alterTable('lanes', (t) => {
            t.string('strategic_choice_id').references('id').inTable('strategic_choices').onDelete('SET NULL');
            t.text('problem_opportunity');
        });
    }

    // === Goal ↔ Objective links (N:N) ===
    if (!(await knex.schema.hasTable('goal_objective_links'))) {
        await knex.schema.createTable('goal_objective_links', (t) => {
            t.string('id').primary();
            t.string('goal_id').notNullable().references('id').inTable('goals_kpis').onDelete('CASCADE');
            t.string('lane_id').notNullable().references('id').inTable('lanes').onDelete('CASCADE');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // === Product Indicators ===
    if (!(await knex.schema.hasTable('product_indicators'))) {
        await knex.schema.createTable('product_indicators', (t) => {
            t.string('id').primary();
            t.string('feature_id').notNullable().references('id').inTable('features').onDelete('CASCADE');
            t.string('title').notNullable();
            t.float('target_value').defaultTo(100);
            t.float('current_value').defaultTo(0);
            t.string('unit').defaultTo('%');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // === Indicator ↔ Key Result links (N:N) ===
    if (!(await knex.schema.hasTable('indicator_kr_links'))) {
        await knex.schema.createTable('indicator_kr_links', (t) => {
            t.string('id').primary();
            t.string('indicator_id').notNullable().references('id').inTable('product_indicators').onDelete('CASCADE');
            t.string('kr_id').notNullable().references('id').inTable('key_results').onDelete('CASCADE');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // === Execution Items ===
    if (!(await knex.schema.hasTable('execution_items'))) {
        await knex.schema.createTable('execution_items', (t) => {
            t.string('id').primary();
            t.string('feature_id').notNullable().references('id').inTable('features').onDelete('CASCADE');
            t.string('title').notNullable();
            t.text('description');
            t.string('item_type').defaultTo('Feature'); // Feature | Epic | Story | Tech Story
            t.string('status').defaultTo('Not Started');
            t.string('assignee_id').references('id').inTable('team_members').onDelete('SET NULL');
            t.float('effort_hours').defaultTo(0);
            t.integer('sort_order').defaultTo(0);
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }

    // === Efficiency Indicators ===
    if (!(await knex.schema.hasTable('efficiency_indicators'))) {
        await knex.schema.createTable('efficiency_indicators', (t) => {
            t.string('id').primary();
            t.string('board_id').notNullable().references('id').inTable('boards').onDelete('CASCADE');
            t.string('title').notNullable();
            t.float('value').defaultTo(0);
            t.string('unit').defaultTo('');
            t.string('period');
            t.timestamp('created_at').defaultTo(knex.fn.now());
        });
    }
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('efficiency_indicators');
    await knex.schema.dropTableIfExists('execution_items');
    await knex.schema.dropTableIfExists('indicator_kr_links');
    await knex.schema.dropTableIfExists('product_indicators');
    await knex.schema.dropTableIfExists('goal_objective_links');

    if (await knex.schema.hasColumn('lanes', 'strategic_choice_id')) {
        await knex.schema.alterTable('lanes', (t) => {
            t.dropColumn('strategic_choice_id');
            t.dropColumn('problem_opportunity');
        });
    }

    await knex.schema.dropTableIfExists('goals_kpis');
    await knex.schema.dropTableIfExists('strategic_choices');

    if (await knex.schema.hasColumn('boards', 'just_cause')) {
        await knex.schema.alterTable('boards', (t) => {
            t.dropColumn('just_cause');
            t.dropColumn('vision');
            t.dropColumn('mission');
        });
    }
}
