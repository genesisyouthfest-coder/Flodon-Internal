export default {
  development: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.SUPABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 10 },
    migrations: {
      tableName: 'knex_migrations',
      directory: './supabase_migrations',
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.SUPABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: { min: 2, max: 10 },
    migrations: {
      tableName: 'knex_migrations',
      directory: './supabase_migrations',
    },
  },
}
