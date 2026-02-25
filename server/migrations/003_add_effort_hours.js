/**
 * Add effort_hours column to features table.
 */
export async function up(knex) {
    const hasCol = await knex.schema.hasColumn('features', 'effort_hours');
    if (!hasCol) {
        await knex.schema.alterTable('features', (t) => {
            t.float('effort_hours').defaultTo(0);
        });
    }
}

export async function down(knex) {
    const hasCol = await knex.schema.hasColumn('features', 'effort_hours');
    if (hasCol) {
        await knex.schema.alterTable('features', (t) => {
            t.dropColumn('effort_hours');
        });
    }
}
