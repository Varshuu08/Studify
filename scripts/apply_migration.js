import fs from 'fs';
import { Client } from 'pg';

const MIGRATION = './db/migrations/2026_06_14_add_taskxp_history_decayrate.sql';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL environment variable pointing to your Postgres instance.');
  process.exit(1);
}

const sql = fs.readFileSync(MIGRATION, 'utf8');

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected to DB, running migration:', MIGRATION);
    await client.query(sql);
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
