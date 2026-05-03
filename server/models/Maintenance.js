const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  roomId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  title:      { type: String, required: true, trim: true },
  description:{ type: String, default: '', trim: true },
  status:     { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  priority:   { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
