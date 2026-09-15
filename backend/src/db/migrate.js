import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(sql);

  // Ensure auth verification & reset columns exist on users table in existing database files
  try {
    const columns = db.prepare('PRAGMA table_info(users);').all();
    const existing = new Set(columns.map((c) => c.name));

    if (!existing.has('email_verified')) {
      db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;');
    }
    if (!existing.has('verification_token')) {
      db.exec('ALTER TABLE users ADD COLUMN verification_token TEXT;');
    }
    if (!existing.has('reset_password_token')) {
      db.exec('ALTER TABLE users ADD COLUMN reset_password_token TEXT;');
    }
    if (!existing.has('reset_password_expires')) {
      db.exec('ALTER TABLE users ADD COLUMN reset_password_expires DATETIME;');
    }
  } catch (err) {
    console.error('Migration error checking auth columns:', err);
  }

  // Ensure repositories table has access_token, sync_status, sync_error columns
  try {
    const repoCols = db.prepare('PRAGMA table_info(repositories);').all();
    const existing = new Set(repoCols.map((c) => c.name));

    if (!existing.has('access_token')) {
      db.exec('ALTER TABLE repositories ADD COLUMN access_token TEXT;');
    }
    if (!existing.has('sync_status')) {
      db.exec("ALTER TABLE repositories ADD COLUMN sync_status TEXT DEFAULT 'idle';");
    }
    if (!existing.has('sync_error')) {
      db.exec('ALTER TABLE repositories ADD COLUMN sync_error TEXT;');
    }
  } catch (err) {
    console.error('Migration error checking repositories columns:', err);
  }

  console.log('Database migrations applied successfully.');
}

// If run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
