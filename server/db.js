import knex from 'knex';
import config from '../knexfile.js';

// Initialize Knex instance
const db = knex(config);

// Run migrations and seed
async function initDatabase() {
  try {
    // Run all pending migrations
    await db.migrate.latest();
    console.log('✅ Database migrations completed');

    // Sync tags from existing features (migration from legacy data)
    try {
      const allFeatures = await db('features')
        .join('lanes', 'features.lane_id', 'lanes.id')
        .select('features.tags_json', 'lanes.board_id')
        .whereNotNull('features.tags_json')
        .andWhere('features.tags_json', '!=', '[]');

      for (const feat of allFeatures) {
        try {
          const tags = JSON.parse(feat.tags_json);
          if (!Array.isArray(tags)) continue;
          for (const tag of tags) {
            if (!tag.name || !tag.name.trim()) continue;
            const existing = await db('tags')
              .where('board_id', feat.board_id)
              .whereRaw('LOWER(name) = LOWER(?)', [tag.name.trim()])
              .first();
            if (!existing) {
              const tagId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
              await db('tags').insert({
                id: tagId,
                board_id: feat.board_id,
                name: tag.name.trim(),
                color: tag.color || '#3498db',
              });
            }
          }
        } catch (parseErr) {
          // Skip malformed tags_json
        }
      }
    } catch (e) {
      // Ignore tag sync errors on fresh databases
    }

    // Seed default admin user if no users exist
    const [{ count }] = await db('users').count('* as count');
    if (parseInt(count) === 0) {
      const id = 'admin-' + Date.now().toString(36);
      await db('users').insert({
        id,
        name: 'Admin',
        email: 'admin@admin.com',
        password_hash: 'admin',
        role: 'admin',
      });
      console.log('✅ Default admin user created: admin@admin.com / admin');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

export { initDatabase };
export default db;
