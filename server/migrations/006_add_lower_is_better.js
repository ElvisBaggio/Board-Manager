/**
 * Add lower_is_better boolean to goals_kpis, key_results, and product_indicators.
 * When true, progress is calculated as (target / current) instead of (current / target).
 */
const TABLES = ['goals_kpis', 'key_results', 'product_indicators'];
const COLUMN = 'lower_is_better';

export async function up(knex) {
    for (const table of TABLES) {
        const has = await knex.schema.hasColumn(table, COLUMN);
        if (!has) {
            await knex.schema.alterTable(table, (t) => {
                t.boolean(COLUMN).defaultTo(false);
            });
        }
    }
}

export async function down(knex) {
    for (const table of TABLES) {
        const has = await knex.schema.hasColumn(table, COLUMN);
        if (has) {
            await knex.schema.alterTable(table, (t) => {
                t.dropColumn(COLUMN);
            });
        }
    }
}
