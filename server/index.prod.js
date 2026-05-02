require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Room   = require('./models/Room');
const Tenant = require('./models/Tenant');
const Bill   = require('./models/Bill');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS — allow Vercel frontend + local dev ──────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,            // set this on Render to your Vercel URL
  'http://localhost:3005',
  'http://localhost:3006',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// ── Shape helpers (map Mongoose docs → API shape frontend expects) ─────────────

function roomShape(room, tenant = null) {
  return {
    id:            room._id.toString(),
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

function billShape(bill) {
  return {
    id:         bill._id.toString(),
    tenant_id:  bill.tenantId.toString(),
    room_id:    bill.roomId.toString(),
    year:       bill.year,
    month:      bill.month,
    rent:       bill.rent,
    electric:   bill.electric,
    water:      bill.water,
    other:      bill.other,
    is_paid:    bill.isPaid ? 1 : 0,
    paid_at:    bill.paidAt,
    created_at: bill.createdAt,
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

// ── ROOMS ─────────────────────────────────────────────────────────────────────

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms   = await Room.find().sort({ number: 1 });
    const tenants = await Tenant.find({ isCurrent: true });
    const tMap    = Object.fromEntries(tenants.map(t => [t.roomId.toString(), t]));
    rooms.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0) || a.number.localeCompare(b.number));
    res.json(rooms.map(r => roomShape(r, tMap[r._id.toString()] || null)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { number, base_rent = 0 } = req.body;
    if (!number) return res.status(400).json({ error: 'Room number required' });
    if (await Room.findOne({ number: String(number) })) return res.status(409).json({ error: `Room ${number} already exists` });
    const room = await Room.create({ number: String(number), baseRent: base_rent });
    res.status(201).json(roomShape(room));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── TENANTS ───────────────────────────────────────────────────────────────────

app.get('/api/rooms/:id/tenants', async (req, res) => {
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

app.post('/api/rooms/:id/tenants', async (req, res) => {
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

app.patch('/api/rooms/:roomId/tenants/current', async (req, res) => {
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

app.delete('/api/rooms/:roomId/tenants/current', async (req, res) => {
  try {
    const { roomId } = req.params;
    await Tenant.updateMany({ roomId, isCurrent: true }, { isCurrent: false, movedOutAt: new Date() });
    await Room.findByIdAndUpdate(roomId, { isOccupied: false });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── BILLS ─────────────────────────────────────────────────────────────────────

app.get('/api/rooms/:id/bills', async (req, res) => {
  try {
    const { year, month } = req.query;
    const filter = { roomId: req.params.id };
    if (year)  filter.year  = Number(year);
    if (month) filter.month = Number(month);
    const bills = await Bill.find(filter).sort({ year: -1, month: -1 });
    res.json(bills.map(billShape));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/rooms/:id/bills', async (req, res) => {
  try {
    const { year, month, rent, electric, water, other } = req.body;
    const roomId = req.params.id;
    const tenant = await Tenant.findOne({ roomId, isCurrent: true });
    if (!tenant) return res.status(400).json({ error: 'No current tenant' });
    const existing = await Bill.findOne({ roomId, year: Number(year), month: Number(month) });
    if (existing) {
      Object.assign(existing, { rent, electric, water, other });
      await existing.save();
      return res.json(billShape(existing));
    }
    const bill = await Bill.create({ tenantId: tenant._id, roomId, year: Number(year), month: Number(month), rent, electric, water, other });
    res.status(201).json(billShape(bill));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/bills/:id/status', async (req, res) => {
  try {
    const { is_paid } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    bill.isPaid = !!is_paid;
    bill.paidAt = is_paid ? new Date() : null;
    await bill.save();
    res.json(billShape(bill));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PENDING RENTS ─────────────────────────────────────────────────────────────

app.get('/api/pending-rents', async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth() + 1;
    const occupiedRooms = await Room.find({ isOccupied: true });
    const pending = [];
    await Promise.all(occupiedRooms.map(async room => {
      const tenant = await Tenant.findOne({ roomId: room._id, isCurrent: true });
      if (!tenant) return;
      const bill = await Bill.findOne({ roomId: room._id, year, month });
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

// ── STATS ─────────────────────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  try {
    const { year, month } = req.query;
    const totalRooms    = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ isOccupied: true });
    const match = { isPaid: true };
    if (year)  match.year  = Number(year);
    if (month) match.month = Number(month);
    const revAgg = await Bill.aggregate([
      { $match: match },
      { $group: { _id: null, rent: { $sum: '$rent' }, electric: { $sum: '$electric' }, water: { $sum: '$water' }, other: { $sum: '$other' } } },
    ]);
    const rev = revAgg[0] || { rent: 0, electric: 0, water: 0, other: 0 };
    const monthly = await Bill.aggregate([
      { $match: { isPaid: true } },
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

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', db: 'mongodb', ts: new Date() }));

// ── CONNECT & START ───────────────────────────────────────────────────────────

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`✅ RentMaster API (production) → port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
