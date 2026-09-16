import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbAbsolutePath = path.isAbsolute(config.databasePath)
  ? config.databasePath
  : path.resolve(__dirname, '../../', config.databasePath);

const dbDir = path.dirname(dbAbsolutePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbAbsolutePath);

// Enable foreign keys and write-ahead logging for high concurrency and relational integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Run a query returning all rows
 * @param {string} sql
 * @param {Array<any>} params
 * @returns {Array<any>}
 */
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Run a query returning a single row or null
 * @param {string} sql
 * @param {Array<any>} params
 * @returns {any|null}
 */
export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.get(...params);
  return result || null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement
 * @param {string} sql
 * @param {Array<any>} params
 * @returns {{ lastInsertRowid: number|bigint, changes: number }}
 */
export function execute(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute multiple statements in a transaction
 * @param {Function} callback
 * @returns {any}
 */
export function transaction(callback) {
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = callback();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
