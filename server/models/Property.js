const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  address: { type: String, default: '', trim: true },
  type:    { type: String, enum: ['apartment', 'house', 'commercial', 'other'], default: 'apartment' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Property', PropertySchema);
