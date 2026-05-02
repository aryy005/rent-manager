require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'rentmaster.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id          TEXT PRIMARY KEY,
    number      TEXT NOT NULL UNIQUE,
    is_occupied INTEGER NOT NULL DEFAULT 0,
    base_rent   REAL NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    mongo_synced INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id           TEXT PRIMARY KEY,
    room_id      TEXT NOT NULL,
    name         TEXT NOT NULL,
    aadhar       TEXT NOT NULL,
    mobile       TEXT NOT NULL,
    moved_in_at  TEXT NOT NULL DEFAULT (datetime('now')),
    moved_out_at TEXT,
    is_current   INTEGER NOT NULL DEFAULT 1,
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    mongo_synced INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS monthly_bills (
    id           TEXT PRIMARY KEY,
    tenant_id    TEXT NOT NULL,
    room_id      TEXT NOT NULL,
    year         INTEGER NOT NULL,
    month        INTEGER NOT NULL,
    rent         REAL NOT NULL DEFAULT 0,
    electric     REAL NOT NULL DEFAULT 0,
    water        REAL NOT NULL DEFAULT 0,
    other        REAL NOT NULL DEFAULT 0,
    is_paid      INTEGER NOT NULL DEFAULT 0,
    paid_at      TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
    mongo_synced INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (room_id)   REFERENCES rooms(id),
    UNIQUE(room_id, year, month)
  );
`);

console.log('✅ Database ready (fresh start)');
module.exports = db;
