/**
 * Migration script to enable pg_trgm extension
 * Run this once: node db/enable-pg-trgm.mjs
 */
import { config } from "dotenv";
import { neon } from '@neondatabase/serverless';

config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log('Enabling pg_trgm extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    
    console.log('Creating GIN index on plans.title...');
    await sql`CREATE INDEX IF NOT EXISTS plans_title_trgm_idx ON plans USING GIN (title gin_trgm_ops)`;
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
