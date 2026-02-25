// Knex.js configuration — supports SQLite3, PostgreSQL, MySQL, MariaDB
// Configure via environment variables:
//   DB_CLIENT: better-sqlite3 | pg | mysql2 | mysql
//   DB_CONNECTION_STRING: (for pg/mysql) e.g. postgres://user:pass@localhost/board_manager
//   DB_FILENAME: (for sqlite) e.g. ./board-manager.sqlite

const client = process.env.DB_CLIENT || 'better-sqlite3';
const isSQLite = client === 'better-sqlite3' || client === 'sqlite3';

const config = {
    client: isSQLite ? 'better-sqlite3' : client,
    connection: isSQLite
        ? { filename: process.env.DB_FILENAME || './board-manager.sqlite' }
        : process.env.DB_CONNECTION_STRING || {
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'board_manager',
        },
    useNullAsDefault: true,
    migrations: {
        directory: './server/migrations',
    },
    pool: isSQLite
        ? undefined
        : { min: 2, max: 10 },
};

export default config;
