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

  // Ensure email_verified column exists on users table in existing database files
  try {
    const columns = db.prepare('PRAGMA table_info(users);').all();
    const hasEmailVerified = Array.isArray(columns) && columns.some((col) => col.name === 'email_verified');
    if (!hasEmailVerified) {
      db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;');
    }
  } catch (err) {
    console.error('Migration error checking email_verified column:', err);
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
