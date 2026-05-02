require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { startSyncService, getSyncStatus } = require('./syncService');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:3005','http://localhost:3006','http://localhost:3007'] }));
app.use(express.json());

// Helper: mark records as unsynced after any write
const markRoomUnsynced   = (id) => db.prepare("UPDATE rooms SET mongo_synced=0, updated_at=datetime('now') WHERE id=?").run(id);
const markTenantUnsynced = (id) => db.prepare("UPDATE tenants SET mongo_synced=0, updated_at=datetime('now') WHERE id=?").run(id);
const markBillUnsynced   = (id) => db.prepare("UPDATE monthly_bills SET mongo_synced=0, updated_at=datetime('now') WHERE id=?").run(id);

// ── SYNC STATUS ───────────────────────────────────────────────────────────────

app.get('/api/sync-status', (req, res) => res.json(getSyncStatus()));

// ── ROOMS ─────────────────────────────────────────────────────────────────────

app.get('/api/rooms', (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*,
           t.id           AS tenant_id,
           t.name         AS tenant_name,
           t.aadhar       AS tenant_aadhar,
           t.mobile       AS tenant_mobile,
           t.moved_in_at
    FROM rooms r
    LEFT JOIN tenants t ON t.room_id = r.id AND t.is_current = 1
    ORDER BY CAST(r.number AS INTEGER), r.number
  `).all();
  res.json(rooms);
});

app.post('/api/rooms', (req, res) => {
  const { number, base_rent = 0 } = req.body;
  if (!number) return res.status(400).json({ error: 'Room number is required' });
  const exists = db.prepare('SELECT id FROM rooms WHERE number=?').get(String(number));
  if (exists) return res.status(409).json({ error: `Room ${number} already exists` });
  const id = uuidv4();
  db.prepare('INSERT INTO rooms (id, number, is_occupied, base_rent) VALUES (?,?,0,?)').run(id, String(number), base_rent);
  res.status(201).json(db.prepare('SELECT * FROM rooms WHERE id=?').get(id));
});

app.delete('/api/rooms/:id', (req, res) => {
  db.prepare('DELETE FROM rooms WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── TENANTS ───────────────────────────────────────────────────────────────────

app.get('/api/rooms/:id/tenants', (req, res) => {
  const tenants = db.prepare(`
    SELECT t.*,
           COALESCE(SUM(b.rent+b.electric+b.water+b.other),0) AS total_paid
    FROM tenants t
    LEFT JOIN monthly_bills b ON b.tenant_id=t.id AND b.is_paid=1
    WHERE t.room_id=?
    GROUP BY t.id
    ORDER BY t.moved_in_at DESC
  `).all(req.params.id);
  res.json(tenants);
});

app.post('/api/rooms/:id/tenants', (req, res) => {
  const { name, aadhar, mobile, base_rent } = req.body;
  if (!name || !aadhar || !mobile) return res.status(400).json({ error: 'Name, Aadhar and Mobile required' });
  const roomId = req.params.id;

  const txn = db.transaction(() => {
    db.prepare(`UPDATE tenants SET is_current=0, moved_out_at=datetime('now'), mongo_synced=0 WHERE room_id=? AND is_current=1`).run(roomId);
    const update = base_rent !== undefined ? { baseRent: base_rent } : {};
    db.prepare('UPDATE rooms SET is_occupied=1, mongo_synced=0' + (base_rent !== undefined ? ', base_rent=?' : '') + " , updated_at=datetime('now') WHERE id=?")
      .run(...(base_rent !== undefined ? [base_rent, roomId] : [roomId]));
    const tenantId = uuidv4();
    db.prepare(`INSERT INTO tenants (id, room_id, name, aadhar, mobile, moved_in_at, is_current) VALUES (?,?,?,?,?,datetime('now'),1)`)
      .run(tenantId, roomId, name, aadhar, mobile);
    return db.prepare('SELECT * FROM tenants WHERE id=?').get(tenantId);
  });
  res.status(201).json(txn());
});

app.patch('/api/rooms/:roomId/tenants/current', (req, res) => {
  const { name, aadhar, mobile, base_rent } = req.body;
  const { roomId } = req.params;
  const txn = db.transaction(() => {
    const fields = []; const vals = [];
    if (name)   { fields.push('name=?');   vals.push(name); }
    if (aadhar) { fields.push('aadhar=?'); vals.push(aadhar); }
    if (mobile) { fields.push('mobile=?'); vals.push(mobile); }
    if (fields.length) {
      vals.push(roomId);
      db.prepare(`UPDATE tenants SET ${fields.join(',')}, mongo_synced=0, updated_at=datetime('now') WHERE room_id=? AND is_current=1`).run(...vals);
    }
    if (base_rent !== undefined) {
      db.prepare("UPDATE rooms SET base_rent=?, mongo_synced=0, updated_at=datetime('now') WHERE id=?").run(base_rent, roomId);
    }
  });
  txn();
  res.json({ success: true });
});

app.delete('/api/rooms/:roomId/tenants/current', (req, res) => {
  const { roomId } = req.params;
  db.transaction(() => {
    db.prepare(`UPDATE tenants SET is_current=0, moved_out_at=datetime('now'), mongo_synced=0 WHERE room_id=? AND is_current=1`).run(roomId);
    db.prepare("UPDATE rooms SET is_occupied=0, mongo_synced=0, updated_at=datetime('now') WHERE id=?").run(roomId);
  })();
  res.json({ success: true });
});

// ── BILLS ─────────────────────────────────────────────────────────────────────

app.get('/api/rooms/:id/bills', (req, res) => {
  const { year, month } = req.query;
  let q = 'SELECT * FROM monthly_bills WHERE room_id=?';
  const params = [req.params.id];
  if (year)  { q += ' AND year=?';  params.push(year); }
  if (month) { q += ' AND month=?'; params.push(month); }
  res.json(db.prepare(q + ' ORDER BY year DESC, month DESC').all(...params));
});

app.post('/api/rooms/:id/bills', (req, res) => {
  const { year, month, rent, electric, water, other } = req.body;
  const roomId = req.params.id;
  const tenant = db.prepare('SELECT id FROM tenants WHERE room_id=? AND is_current=1').get(roomId);
  if (!tenant) return res.status(400).json({ error: 'No current tenant' });

  const existing = db.prepare('SELECT id FROM monthly_bills WHERE room_id=? AND year=? AND month=?').get(roomId, year, month);
  if (existing) {
    db.prepare("UPDATE monthly_bills SET rent=?,electric=?,water=?,other=?,mongo_synced=0,updated_at=datetime('now') WHERE id=?")
      .run(rent, electric, water, other, existing.id);
    return res.json(db.prepare('SELECT * FROM monthly_bills WHERE id=?').get(existing.id));
  }
  const id = uuidv4();
  db.prepare('INSERT INTO monthly_bills (id,tenant_id,room_id,year,month,rent,electric,water,other,is_paid) VALUES (?,?,?,?,?,?,?,?,?,0)')
    .run(id, tenant.id, roomId, year, month, rent, electric, water, other);
  res.status(201).json(db.prepare('SELECT * FROM monthly_bills WHERE id=?').get(id));
});

app.patch('/api/bills/:id/status', (req, res) => {
  const { is_paid } = req.body;
  const paidAt = is_paid ? new Date().toISOString() : null;
  db.prepare("UPDATE monthly_bills SET is_paid=?,paid_at=?,mongo_synced=0,updated_at=datetime('now') WHERE id=?").run(is_paid ? 1 : 0, paidAt, req.params.id);
  res.json(db.prepare('SELECT * FROM monthly_bills WHERE id=?').get(req.params.id));
});

// ── PENDING RENTS ─────────────────────────────────────────────────────────────

app.get('/api/pending-rents', (req, res) => {
  const now = new Date(); const year = now.getFullYear(); const month = now.getMonth() + 1;
  const pending = db.prepare(`
    SELECT r.id AS room_id, r.number AS room_number, r.base_rent,
           t.name AS tenant_name, t.mobile AS tenant_mobile,
           b.id AS bill_id, b.rent, b.electric, b.water, b.other, b.is_paid, b.paid_at,
           ? AS year, ? AS month
    FROM rooms r
    JOIN tenants t ON t.room_id=r.id AND t.is_current=1
    LEFT JOIN monthly_bills b ON b.room_id=r.id AND b.year=? AND b.month=?
    WHERE r.is_occupied=1 AND (b.id IS NULL OR b.is_paid=0)
    ORDER BY CAST(r.number AS INTEGER), r.number
  `).all(year, month, year, month);
  res.json({ year, month, pending });
});

// ── STATS ─────────────────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  const { year, month } = req.query;
  const totalRooms    = db.prepare('SELECT COUNT(*) as c FROM rooms').get().c;
  const occupiedRooms = db.prepare('SELECT COUNT(*) as c FROM rooms WHERE is_occupied=1').get().c;

  let revQ = 'SELECT SUM(rent) as rent, SUM(electric) as el, SUM(water) as water, SUM(other) as other FROM monthly_bills WHERE is_paid=1';
  const params = [];
  if (year)  { revQ += ' AND year=?';  params.push(year); }
  if (month) { revQ += ' AND month=?'; params.push(month); }
  const rev = db.prepare(revQ).get(...params);

  const monthlyBreakdown = db.prepare(`
    SELECT year, month, SUM(rent) as rent, SUM(electric) as electric,
           SUM(water) as water, SUM(other) as other,
           SUM(rent+electric+water+other) as total
    FROM monthly_bills WHERE is_paid=1
    GROUP BY year, month ORDER BY year DESC, month DESC LIMIT 12
  `).all().reverse();

  res.json({
    totalRooms, occupiedRooms, vacantRooms: totalRooms - occupiedRooms,
    revenue: { rent: rev.rent||0, electric: rev.el||0, water: rev.water||0, other: rev.other||0,
               total: (rev.rent||0)+(rev.el||0)+(rev.water||0)+(rev.other||0) },
    monthlyBreakdown
  });
});

// ── START ─────────────────────────────────────────────────────────────────────

startSyncService(); // non-blocking — connects to Atlas in background
app.listen(PORT, () => console.log(`✅ RentMaster API → http://localhost:${PORT} (offline-first)`));
