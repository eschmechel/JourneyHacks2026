import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const dbPath = '.wrangler/state/v3/d1/proximity-radar-db/db.sqlite';

// Create directory if it doesn't exist
mkdirSync(dirname(dbPath), { recursive: true });

// Initialize database
const db = new Database(dbPath);

// Run migrations
console.log('📦 Initializing database...');

// Migration 001
console.log('  Running 001_create_tables.sql...');
const migration001 = readFileSync('./migrations/001_create_tables.sql', 'utf-8');
db.exec(migration001);

// Migration 002
console.log('  Running 002_add_show_friends_on_map.sql...');
const migration002 = readFileSync('./migrations/002_add_show_friends_on_map.sql', 'utf-8');
db.exec(migration002);

// Migration 003
console.log('  Running 003_add_friend_requests.sql...');
const migration003 = readFileSync('./migrations/003_add_friend_requests.sql', 'utf-8');
db.exec(migration003);

console.log('✅ Database initialized successfully!');
db.close();
