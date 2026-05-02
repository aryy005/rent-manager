/**
 * MongoDB Atlas Sync Service
 * Runs in background — pushes unsynced SQLite records to Atlas.
 * The main app always works offline; this is purely additive cloud backup.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const db       = require('./db');
const Room     = require('./models/Room');
const Tenant   = require('./models/Tenant');
const Bill     = require('./models/Bill');

let mongoConnected = false;
let syncInterval   = null;

async function connectMongo() {
  if (!process.env.MONGO_URI) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      tls: true,
      tlsAllowInvalidCertificates: true,  // allows self-signed / proxy certs
    });
    mongoConnected = true;
    console.log('☁️  MongoDB Atlas connected — cloud sync active');
    await runSync();
  } catch (err) {
    mongoConnected = false;
    console.log(`⚠️  MongoDB Atlas unreachable — running offline (${err.message.split('\n')[0]})`);
  }
}

async function runSync() {
  if (!mongoConnected) return;
  try {
    // ── Sync Rooms ────────────────────────────────────────────────────────────
    const unsyncedRooms = db.prepare('SELECT * FROM rooms WHERE mongo_synced = 0').all();
    for (const r of unsyncedRooms) {
      await Room.findOneAndUpdate(
        { localId: r.id },
        { localId: r.id, number: r.number, isOccupied: !!r.is_occupied, baseRent: r.base_rent },
        { upsert: true, returnDocument: 'after' }
      );
      db.prepare('UPDATE rooms SET mongo_synced = 1 WHERE id = ?').run(r.id);
    }

    // ── Sync Tenants ──────────────────────────────────────────────────────────
    const unsyncedTenants = db.prepare('SELECT * FROM tenants WHERE mongo_synced = 0').all();
    for (const t of unsyncedTenants) {
      const mongoRoom = await Room.findOne({ localId: t.room_id });
      if (!mongoRoom) continue;
      await Tenant.findOneAndUpdate(
        { localId: t.id },
        { localId: t.id, roomId: mongoRoom._id, name: t.name, aadhar: t.aadhar, mobile: t.mobile,
          movedInAt: t.moved_in_at, movedOutAt: t.moved_out_at, isCurrent: !!t.is_current },
        { upsert: true, returnDocument: 'after' }
      );
      db.prepare('UPDATE tenants SET mongo_synced = 1 WHERE id = ?').run(t.id);
    }

    // ── Sync Bills ────────────────────────────────────────────────────────────
    const unsyncedBills = db.prepare('SELECT * FROM monthly_bills WHERE mongo_synced = 0').all();
    for (const b of unsyncedBills) {
      const mongoRoom   = await Room.findOne({ localId: b.room_id });
      const mongoTenant = await Tenant.findOne({ localId: b.tenant_id });
      if (!mongoRoom || !mongoTenant) continue;
      await Bill.findOneAndUpdate(
        { localId: b.id },
        { localId: b.id, tenantId: mongoTenant._id, roomId: mongoRoom._id,
          year: b.year, month: b.month, rent: b.rent, electric: b.electric,
          water: b.water, other: b.other, isPaid: !!b.is_paid, paidAt: b.paid_at },
        { upsert: true, returnDocument: 'after' }
      );
      db.prepare('UPDATE monthly_bills SET mongo_synced = 1 WHERE id = ?').run(b.id);
    }

    const total = unsyncedRooms.length + unsyncedTenants.length + unsyncedBills.length;
    if (total > 0) console.log(`☁️  Synced ${total} record(s) to MongoDB Atlas`);
  } catch (err) {
    mongoConnected = false;
    console.log('⚠️  Sync lost connection to Atlas — will retry');
    // Try to reconnect
    setTimeout(connectMongo, 30000);
  }
}

function startSyncService() {
  connectMongo();
  // Retry connection every 2 minutes if offline
  syncInterval = setInterval(() => {
    if (!mongoConnected) {
      connectMongo();
    } else {
      runSync();
    }
  }, 2 * 60 * 1000);
}

function getSyncStatus() {
  const unsynced = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM rooms WHERE mongo_synced=0) +
      (SELECT COUNT(*) FROM tenants WHERE mongo_synced=0) +
      (SELECT COUNT(*) FROM monthly_bills WHERE mongo_synced=0) AS n
  `).get().n;
  return { online: mongoConnected, pendingSyncCount: unsynced };
}

module.exports = { startSyncService, getSyncStatus, runSync };
