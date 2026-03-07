/**
 * Migration: Rename 'boards' table to 'plans' and 'board_id' columns to 'plan_id'.
 * This is a destructive migration — requires a fresh database.
 */
export async function up(knex) {
    // Rename boards → plans
    if (await knex.schema.hasTable('boards')) {
        await knex.schema.renameTable('boards', 'plans');
    }

    // Rename board_id → plan_id in all child tables
    const tables = ['lanes', 'tags', 'team_members', 'strategic_choices', 'efficiency_indicators', 'risks'];
    for (const table of tables) {
        if (await knex.schema.hasTable(table) && await knex.schema.hasColumn(table, 'board_id')) {
            await knex.schema.alterTable(table, (t) => {
                t.renameColumn('board_id', 'plan_id');
            });
        }
    }
}

export async function down(knex) {
    // Reverse: plan_id → board_id
    const tables = ['lanes', 'tags', 'team_members', 'strategic_choices', 'efficiency_indicators', 'risks'];
    for (const table of tables) {
        if (await knex.schema.hasTable(table) && await knex.schema.hasColumn(table, 'plan_id')) {
            await knex.schema.alterTable(table, (t) => {
                t.renameColumn('plan_id', 'board_id');
            });
        }
    }

    if (await knex.schema.hasTable('plans')) {
        await knex.schema.renameTable('plans', 'boards');
    }
}
