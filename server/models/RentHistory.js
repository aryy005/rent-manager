const mongoose = require('mongoose');

const RentHistorySchema = new mongoose.Schema({
  roomId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  oldRent:  { type: Number, required: true },
  newRent:  { type: Number, required: true },
  reason:   { type: String, default: '', trim: true },
  changedAt:{ type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('RentHistory', RentHistorySchema);
