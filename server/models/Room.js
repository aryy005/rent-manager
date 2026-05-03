const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  localId:    { type: String, unique: true, sparse: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  number:     { type: String, required: true },
  isOccupied: { type: Boolean, default: false },
  baseRent:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
