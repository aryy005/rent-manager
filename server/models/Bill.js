const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  tenantId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  roomId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Room',   required: true },
  year:      { type: Number, required: true },
  month:     { type: Number, required: true },
  rent:      { type: Number, default: 0 },
  electric:  { type: Number, default: 0 },
  water:     { type: Number, default: 0 },
  other:     { type: Number, default: 0 },
  isPaid:    { type: Boolean, default: false },
  paidAt:    { type: Date,    default: null },
}, { timestamps: true });

// One bill per TENANT per month — allows new tenant to have their own bill in same month
BillSchema.index({ tenantId: 1, year: 1, month: 1 }, { unique: true });
// Room+month index for fast lookups (non-unique)
BillSchema.index({ roomId: 1, year: 1, month: 1 });

module.exports = mongoose.model('Bill', BillSchema);
