require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const User        = require('./models/User');
const Property    = require('./models/Property');
const Room        = require('./models/Room');
const Tenant      = require('./models/Tenant');
const Bill        = require('./models/Bill');
const Maintenance = require('./models/Maintenance');
const RentHistory = require('./models/RentHistory');
const auth        = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'rentmaster_secret_fallback';

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://rent-manager-eta.vercel.app',
  'http://localhost:3005',
  'http://localhost:3006',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('/{*path}', cors());
app.use(express.json());

// ── HELPERS ──────────────────────────────────────────────────────────────────
const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

function roomShape(room, tenant = null) {
  return {
    id:            room._id.toString(),
    property_id:   room.propertyId?.toString(),
    number:        room.number,
    is_occupied:   room.isOccupied ? 1 : 0,
    base_rent:     room.baseRent,
    created_at:    room.createdAt,
    tenant_id:     tenant?._id.toString()  ?? null,
    tenant_name:   tenant?.name            ?? null,
    tenant_aadhar: tenant?.aadhar          ?? null,
    tenant_mobile: tenant?.mobile          ?? null,
    moved_in_at:   tenant?.movedInAt       ?? null,
  };
}

function billShape(bill, tenantName = null) {
  return {
    id:           bill._id.toString(),
    tenant_id:    bill.tenantId.toString(),
    tenant_name:  tenantName,
    room_id:      bill.roomId.toString(),
    year:         bill.year,
    month:        bill.month,
    rent:         bill.rent,
    electric:     bill.electric,
    water:        bill.water,
    other:        bill.other,
    is_paid:      bill.isPaid ? 1 : 0,
    paid_at:      bill.paidAt,
    created_at:   bill.createdAt,
  };
}

function tenantShape(t, totalPaid = 0) {
  return {
    id:           t._id.toString(),
    room_id:      t.roomId.toString(),
    name:         t.name,
    aadhar:       t.aadhar,
    mobile:       t.mobile,
    moved_in_at:  t.movedInAt,
    moved_out_at: t.movedOutAt,
    is_current:   t.isCurrent ? 1 : 0,
    total_paid:   totalPaid,
  };
}

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email });
});

// ── PROPERTY ROUTES ───────────────────────────────────────────────────────────

app.get('/api/properties', auth, async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    // Attach room counts
    const result = await Promise.all(properties.map(async p => {
      const total    = await Room.countDocuments({ propertyId: p._id });
      const occupied = await Room.countDocuments({ propertyId: p._id, isOccupied: true });
      return { id: p._id, name: p.name, address: p.address, type: p.type, total_rooms: total, occupied_rooms: occupied, created_at: p.createdAt };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/properties', auth, async (req, res) => {
  try {
    const { name, address = '', type = 'apartment' } = req.body;
    if (!name) return res.status(400).json({ error: 'Property name required' });
    const prop = await Property.create({ name, address, type, ownerId: req.user._id });
    res.status(201).json({ id: prop._id, name: prop.name, address: prop.address, type: prop.type, total_rooms: 0, occupied_rooms: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/properties/:id', auth, async (req, res) => {
  try {
    const prop = await Property.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!prop) return res.status(404).json({ error: 'Property not found' });
    const { name, address, type } = req.body;
    if (name)    prop.name    = name;
    if (address !== undefined) prop.address = address;
    if (type)    prop.type    = type;
    await prop.save();
    res.json({ id: prop._id, name: prop.name, address: prop.address, type: prop.type });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/properties/:id', auth, async (req, res) => {
  try {
    const prop = await Property.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!prop) return res.status(404).json({ error: 'Property not found' });
    // Cascade delete rooms, tenants, bills
    const rooms = await Room.find({ propertyId: prop._id });
    const roomIds = rooms.map(r => r._id);
    await Bill.deleteMany({ roomId: { $in: roomIds } });
    await Tenant.deleteMany({ roomId: { $in: roomIds } });
    await Room.deleteMany({ propertyId: prop._id });
    await prop.deleteOne();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── HELPER: verify property belongs to user ───────────────────────────────────
async function getOwnedProperty(propertyId, userId) {
  const prop = await Property.findOne({ _id: propertyId, ownerId: userId });
  return prop;
}

// ── ROOMS ─────────────────────────────────────────────────────────────────────

app.get('/api/properties/:propertyId/rooms', auth, async (req, res) => {
  try {
    if (!await getOwnedProperty(req.params.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const rooms   = await Room.find({ propertyId: req.params.propertyId }).sort({ number: 1 });
    const tenants = await Tenant.find({ isCurrent: true, roomId: { $in: rooms.map(r => r._id) } });
    const tMap    = Object.fromEntries(tenants.map(t => [t.roomId.toString(), t]));
    rooms.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0) || a.number.localeCompare(b.number));
    res.json(rooms.map(r => roomShape(r, tMap[r._id.toString()] || null)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/properties/:propertyId/rooms', auth, async (req, res) => {
  try {
    if (!await getOwnedProperty(req.params.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const { number, base_rent = 0 } = req.body;
    if (!number) return res.status(400).json({ error: 'Room number required' });
    if (await Room.findOne({ propertyId: req.params.propertyId, number: String(number) })) return res.status(409).json({ error: `Room ${number} already exists` });
    const room = await Room.create({ propertyId: req.params.propertyId, number: String(number), baseRent: base_rent });
    res.status(201).json(roomShape(room));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/rooms/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!await getOwnedProperty(room.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    await Bill.deleteMany({ roomId: room._id });
    await Tenant.deleteMany({ roomId: room._id });
    await room.deleteOne();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── TENANTS ───────────────────────────────────────────────────────────────────

app.get('/api/rooms/:id/tenants', auth, async (req, res) => {
  try {
    const tenants = await Tenant.find({ roomId: req.params.id }).sort({ movedInAt: -1 });
    const result  = await Promise.all(tenants.map(async t => {
      const agg = await Bill.aggregate([
        { $match: { tenantId: t._id, isPaid: true } },
        { $group: { _id: null, total: { $sum: { $add: ['$rent','$electric','$water','$other'] } } } },
      ]);
      return tenantShape(t, agg[0]?.total || 0);
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rooms/:id/tenants', auth, async (req, res) => {
  try {
    const { name, aadhar, mobile, base_rent } = req.body;
    if (!name || !aadhar || !mobile) return res.status(400).json({ error: 'Name, Aadhar and Mobile required' });
    const roomId = req.params.id;
    await Tenant.updateMany({ roomId, isCurrent: true }, { isCurrent: false, movedOutAt: new Date() });
    const upd = { isOccupied: true };
    if (base_rent !== undefined) upd.baseRent = base_rent;
    await Room.findByIdAndUpdate(roomId, upd);
    const tenant = await Tenant.create({ roomId, name, aadhar, mobile });
    res.status(201).json(tenantShape(tenant));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/rooms/:roomId/tenants/current', auth, async (req, res) => {
  try {
    const { name, aadhar, mobile, base_rent } = req.body;
    const { roomId } = req.params;
    const upd = {};
    if (name)   upd.name   = name;
    if (aadhar) upd.aadhar = aadhar;
    if (mobile) upd.mobile = mobile;
    if (Object.keys(upd).length) await Tenant.updateOne({ roomId, isCurrent: true }, upd);
    if (base_rent !== undefined) await Room.findByIdAndUpdate(roomId, { baseRent: base_rent });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/rooms/:roomId/tenants/current', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    await Tenant.updateMany({ roomId, isCurrent: true }, { isCurrent: false, movedOutAt: new Date() });
    await Room.findByIdAndUpdate(roomId, { isOccupied: false });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BILLS ─────────────────────────────────────────────────────────────────────

app.get('/api/rooms/:id/bills', auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const filter = { roomId: req.params.id };
    if (year)  filter.year  = Number(year);
    if (month) filter.month = Number(month);
    const bills = await Bill.find(filter).sort({ year: -1, month: -1 });

    // Fetch all tenant names in one query
    const tenantIds = [...new Set(bills.map(b => b.tenantId.toString()))];
    const tenants   = await Tenant.find({ _id: { $in: tenantIds } }).select('_id name movedInAt movedOutAt');
    const tenantMap = Object.fromEntries(tenants.map(t => [t._id.toString(), t]));

    res.json(bills.map(b => billShape(b, tenantMap[b.tenantId.toString()]?.name ?? null)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rooms/:id/bills', auth, async (req, res) => {
  try {
    const { year, month, rent, electric, water, other } = req.body;
    const roomId = req.params.id;
    const tenant = await Tenant.findOne({ roomId, isCurrent: true });
    if (!tenant) return res.status(400).json({ error: 'No current tenant' });

    // KEY FIX: scope to tenantId, not just roomId
    // This allows a new tenant to have their own bill even in the same month
    const existing = await Bill.findOne({ tenantId: tenant._id, year: Number(year), month: Number(month) });
    if (existing) {
      Object.assign(existing, { rent, electric, water, other });
      await existing.save();
      return res.json(billShape(existing, tenant.name));
    }
    const bill = await Bill.create({ tenantId: tenant._id, roomId, year: Number(year), month: Number(month), rent, electric, water, other });
    res.status(201).json(billShape(bill, tenant.name));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/bills/:id/status', auth, async (req, res) => {
  try {
    const { is_paid } = req.body;
    const paidAt = is_paid ? new Date() : null;
    // findByIdAndUpdate avoids triggering full index re-validation (no duplicate key errors)
    const result = await Bill.findByIdAndUpdate(
      req.params.id,
      { $set: { isPaid: !!is_paid, paidAt } },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: 'Bill not found' });
    res.json(billShape(result));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PENDING RENTS (property-scoped) ──────────────────────────────────────────

app.get('/api/properties/:propertyId/pending-rents', auth, async (req, res) => {
  try {
    if (!await getOwnedProperty(req.params.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth() + 1;
    const occupiedRooms = await Room.find({ propertyId: req.params.propertyId, isOccupied: true });
    const pending = [];
    await Promise.all(occupiedRooms.map(async room => {
      const tenant = await Tenant.findOne({ roomId: room._id, isCurrent: true });
      if (!tenant) return;
      // KEY FIX: look up bill by tenantId so we get THIS tenant's bill, not a previous tenant's
      const bill = await Bill.findOne({ tenantId: tenant._id, year, month });
      if (!bill || !bill.isPaid) {
        pending.push({
          room_id: room._id.toString(), room_number: room.number, base_rent: room.baseRent,
          tenant_name: tenant.name, tenant_mobile: tenant.mobile,
          bill_id: bill?._id.toString() ?? null,
          rent: bill?.rent ?? room.baseRent, electric: bill?.electric ?? null,
          water: bill?.water ?? null, other: bill?.other ?? 0,
          is_paid: 0, year, month,
        });
      }
    }));
    pending.sort((a, b) => (parseInt(a.room_number) || 0) - (parseInt(b.room_number) || 0));
    res.json({ year, month, pending });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── STATS (property-scoped) ───────────────────────────────────────────────────

app.get('/api/properties/:propertyId/stats', auth, async (req, res) => {
  try {
    if (!await getOwnedProperty(req.params.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const { year, month } = req.query;
    const roomIds       = (await Room.find({ propertyId: req.params.propertyId })).map(r => r._id);
    const totalRooms    = roomIds.length;
    const occupiedRooms = await Room.countDocuments({ propertyId: req.params.propertyId, isOccupied: true });
    const match = { isPaid: true, roomId: { $in: roomIds } };
    if (year)  match.year  = Number(year);
    if (month) match.month = Number(month);
    const revAgg = await Bill.aggregate([
      { $match: match },
      { $group: { _id: null, rent: { $sum: '$rent' }, electric: { $sum: '$electric' }, water: { $sum: '$water' }, other: { $sum: '$other' } } },
    ]);
    const rev = revAgg[0] || { rent: 0, electric: 0, water: 0, other: 0 };
    const monthly = await Bill.aggregate([
      { $match: { isPaid: true, roomId: { $in: roomIds } } },
      { $group: { _id: { year: '$year', month: '$month' }, rent: { $sum: '$rent' }, electric: { $sum: '$electric' }, water: { $sum: '$water' }, other: { $sum: '$other' }, total: { $sum: { $add: ['$rent','$electric','$water','$other'] } } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
      { $project: { _id: 0, year: '$_id.year', month: '$_id.month', rent: 1, electric: 1, water: 1, other: 1, total: 1 } },
    ]);
    monthly.reverse();
    res.json({
      totalRooms, occupiedRooms, vacantRooms: totalRooms - occupiedRooms,
      revenue: { rent: rev.rent, electric: rev.electric, water: rev.water, other: rev.other, total: rev.rent + rev.electric + rev.water + rev.other },
      monthlyBreakdown: monthly,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', db: 'mongodb', ts: new Date() }));

// ── AUTO-BILL GENERATION ──────────────────────────────────────────────────
app.post('/api/properties/:propertyId/auto-bill', auth, async (req, res) => {
  try {
    if (!await getOwnedProperty(req.params.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const now = new Date();
    const year = Number(req.body.year  || now.getFullYear());
    const month= Number(req.body.month || (now.getMonth() + 1));
    const occupiedRooms = await Room.find({ propertyId: req.params.propertyId, isOccupied: true });
    let created = 0, skipped = 0;
    await Promise.all(occupiedRooms.map(async room => {
      const tenant = await Tenant.findOne({ roomId: room._id, isCurrent: true });
      if (!tenant) { skipped++; return; }
      const existing = await Bill.findOne({ roomId: room._id, year, month });
      if (existing) { skipped++; return; }
      await Bill.create({ tenantId: tenant._id, roomId: room._id, year, month, rent: room.baseRent, electric: 0, water: 0, other: 0 });
      created++;
    }));
    res.json({ success: true, created, skipped, year, month });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── LATE FEE CALCULATION ────────────────────────────────────────────────
app.get('/api/properties/:propertyId/late-fees', auth, async (req, res) => {
  try {
    if (!await getOwnedProperty(req.params.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const dueDay    = Number(req.query.due_day || 5);   // default: rent due on 5th
    const feePerDay = Number(req.query.fee_per_day || 50); // ₹50/day late fee
    const now  = new Date();
    const year = now.getFullYear(), month = now.getMonth() + 1, today = now.getDate();
    const occupiedRooms = await Room.find({ propertyId: req.params.propertyId, isOccupied: true });
    const result = [];
    await Promise.all(occupiedRooms.map(async room => {
      const tenant = await Tenant.findOne({ roomId: room._id, isCurrent: true });
      if (!tenant) return;
      const bill = await Bill.findOne({ roomId: room._id, year, month });
      if (!bill || bill.isPaid) return; // no bill or already paid → no late fee
      const daysLate = today > dueDay ? today - dueDay : 0;
      if (daysLate <= 0) return;
      const lateFee = daysLate * feePerDay;
      result.push({
        room_id: room._id.toString(), room_number: room.number,
        tenant_name: tenant.name, tenant_mobile: tenant.mobile,
        bill_id: bill._id.toString(),
        rent_due: bill.rent, days_late: daysLate,
        fee_per_day: feePerDay, late_fee: lateFee,
        due_date: `${year}-${String(month).padStart(2,'0')}-${String(dueDay).padStart(2,'0')}`,
      });
    }));
    result.sort((a, b) => b.days_late - a.days_late);
    res.json({ due_day: dueDay, fee_per_day: feePerDay, year, month, late_fees: result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── MAINTENANCE LOG ───────────────────────────────────────────────────────
app.get('/api/properties/:propertyId/maintenance', auth, async (req, res) => {
  try {
    if (!await getOwnedProperty(req.params.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const filter = { propertyId: req.params.propertyId };
    if (req.query.roomId) filter.roomId = req.query.roomId;
    if (req.query.status) filter.status = req.query.status;
    const items = await Maintenance.find(filter).populate('roomId', 'number').sort({ createdAt: -1 });
    res.json(items.map(m => ({
      id: m._id, room_id: m.roomId?._id, room_number: m.roomId?.number,
      title: m.title, description: m.description, status: m.status,
      priority: m.priority, resolved_at: m.resolvedAt, created_at: m.createdAt,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/properties/:propertyId/maintenance', auth, async (req, res) => {
  try {
    if (!await getOwnedProperty(req.params.propertyId, req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    const { roomId, title, description = '', priority = 'medium' } = req.body;
    if (!roomId || !title) return res.status(400).json({ error: 'roomId and title required' });
    const item = await Maintenance.create({ propertyId: req.params.propertyId, roomId, title, description, priority });
    res.status(201).json({ id: item._id, room_id: item.roomId, title: item.title, description: item.description, status: item.status, priority: item.priority, created_at: item.createdAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/maintenance/:id', auth, async (req, res) => {
  try {
    const item = await Maintenance.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const { status, title, description, priority } = req.body;
    if (status)      { item.status = status; if (status === 'resolved') item.resolvedAt = new Date(); }
    if (title)       item.title = title;
    if (description !== undefined) item.description = description;
    if (priority)    item.priority = priority;
    await item.save();
    res.json({ id: item._id, status: item.status, resolved_at: item.resolvedAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/maintenance/:id', auth, async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RENT INCREASE HISTORY ───────────────────────────────────────────────
app.get('/api/rooms/:id/rent-history', auth, async (req, res) => {
  try {
    const history = await RentHistory.find({ roomId: req.params.id }).sort({ changedAt: -1 });
    res.json(history.map(h => ({ id: h._id, old_rent: h.oldRent, new_rent: h.newRent, reason: h.reason, changed_at: h.changedAt })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Override updateCurrentTenant to also log rent changes
app.patch('/api/rooms/:roomId/rent', auth, async (req, res) => {
  try {
    const { new_rent, reason = '' } = req.body;
    if (!new_rent) return res.status(400).json({ error: 'new_rent required' });
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    const oldRent = room.baseRent;
    room.baseRent = Number(new_rent);
    await room.save();
    await RentHistory.create({ roomId: room._id, oldRent, newRent: Number(new_rent), reason });
    res.json({ success: true, old_rent: oldRent, new_rent: Number(new_rent) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── START ─────────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');

    // ── ONE-TIME MIGRATION: drop legacy indexes from Bills collection ──────────
    const indexDrops = [
      'roomId_1_year_1_month_1',  // old unique index (now non-unique)
      'localId_1',                // legacy offline-sync field, no longer used
    ];
    for (const idx of indexDrops) {
      try {
        await Bill.collection.dropIndex(idx);
        console.log(`✅ Migration: dropped old bills index (${idx})`);
      } catch (e) {
        if (e.code !== 27) console.warn(`⚠️  Migration note (${idx}):`, e.message);
        // code 27 = IndexNotFound — already dropped, safe to ignore
      }
    }
    // ── END MIGRATION ─────────────────────────────────────────────────────────

    app.listen(PORT, () => {
      console.log(`✅ RentMaster API (production) → port ${PORT}`);
      startKeepAlive();
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ── KEEP-ALIVE SELF-PING (prevents Render free tier sleep) ───────────────────
function startKeepAlive() {
  // Render automatically provides the public URL as RENDER_EXTERNAL_URL
  const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
  if (!selfUrl) {
    console.log('ℹ️  Keep-alive disabled (RENDER_EXTERNAL_URL not set — local dev mode)');
    return;
  }

  const pingUrl = `${selfUrl}/api/health`;
  const intervalMs = 10 * 60 * 1000; // ping every 10 minutes

  const { get } = pingUrl.startsWith('https') ? require('https') : require('http');

  const ping = () => {
    const req = get(pingUrl, (res) => {
      console.log(`💓 Keep-alive ping → ${pingUrl} [${res.statusCode}] at ${new Date().toISOString()}`);
    });
    req.on('error', (err) => {
      console.warn(`⚠️  Keep-alive ping failed: ${err.message}`);
    });
    req.end();
  };

  // First ping after 2 minutes (let server settle), then every 10 min
  setTimeout(() => {
    ping();
    setInterval(ping, intervalMs);
  }, 2 * 60 * 1000);

  console.log(`💓 Keep-alive started — pinging ${pingUrl} every 10 minutes`);
}

