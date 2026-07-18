import { createPool, runMigrations } from './connection.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is required.');
  console.error('Example: DATABASE_URL=postgresql://rag:rag_dev_password@localhost:5432/rag_pipeline');
  process.exit(1);
}

const pool = createPool(databaseUrl);

try {
  await runMigrations(pool);
  console.log('\n✅ Database ready.');
} catch (err) {
  console.error('❌ Migration failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
