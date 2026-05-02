const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  localId:     { type: String, unique: true, sparse: true },
  roomId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  name:        { type: String, required: true },
  aadhar:      { type: String, required: true },
  mobile:      { type: String, required: true },
  movedInAt:   { type: Date,   default: Date.now },
  movedOutAt:  { type: Date,   default: null },
  isCurrent:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Tenant', TenantSchema);
