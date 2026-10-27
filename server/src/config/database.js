import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store database file in the server root
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../peer_tutor.db');

export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

export default db;
