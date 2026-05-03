import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../utils/toast';

export default function AddRoomModal({ isOpen, onClose, onAdded, propertyId }) {
  const [form, setForm] = useState({ number: '', base_rent: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.number.trim()) return;
    setSaving(true);
    try {
      const room = await api.addRoom(propertyId, { number: form.number.trim(), base_rent: Number(form.base_rent) || 0 });
      toast.success(`Room ${room.number} added!`);
      setForm({ number: '', base_rent: '' });
      onAdded(room);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add New Room</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Room Number *</label>
                <input className="form-input" name="number" value={form.number} onChange={handleChange} placeholder="e.g. 301" required />
              </div>
              <div className="form-group">
                <label className="form-label">Base Rent (₹)</label>
                <input className="form-input" type="number" name="base_rent" value={form.base_rent} onChange={handleChange} placeholder="e.g. 8000" min="0" />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <PlusCircle size={17} /> {saving ? 'Adding…' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
