import React, { useState } from 'react';
import { X, UserPlus, UserMinus, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../utils/toast';

export default function StatusToggleModal({ room, isOpen, onClose, onRefresh }) {
  const isOccupied = !!room?.is_occupied;

  // Form state for move-in
  const [form, setForm] = useState({ name: '', aadhar: '', mobile: '', base_rent: '' });
  const [saving, setSaving] = useState(false);

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleMoveIn = async e => {
    e.preventDefault();
    if (!form.name || !form.aadhar || !form.mobile) {
      toast.error('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      await api.addTenant(room.id, {
        name: form.name.trim(),
        aadhar: form.aadhar.trim(),
        mobile: form.mobile.trim(),
        base_rent: Number(form.base_rent) || room.base_rent || 0,
      });
      toast.success(`Room ${room.number} is now occupied by ${form.name}.`);
      setForm({ name: '', aadhar: '', mobile: '', base_rent: '' });
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveOut = async () => {
    setSaving(true);
    try {
      await api.moveOutTenant(room.id);
      toast.success(`Room ${room.number} marked as vacant.`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !room) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: '440px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── VACANT → OCCUPIED ── */}
        {!isOccupied && (
          <>
            <div className="modal-head">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <UserPlus size={20} style={{ color: 'var(--success)' }} />
                Mark Room {room.number} as Occupied
              </h2>
              <button className="btn-icon" onClick={onClose}><X size={18} /></button>
            </div>

            <form onSubmit={handleMoveIn}>
              <div className="modal-body">
                <p className="text-muted" style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  Enter the new tenant's details to mark this room as occupied.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" value={form.name} onChange={set('name')}
                      placeholder="e.g. Rahul Sharma" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aadhar Number *</label>
                    <input className="form-input" value={form.aadhar} onChange={set('aadhar')}
                      placeholder="XXXX XXXX XXXX" maxLength={14} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input className="form-input" value={form.mobile} onChange={set('mobile')}
                      placeholder="98XXXXXXXX" maxLength={10} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Rent (₹)</label>
                    <input className="form-input" type="number" value={form.base_rent}
                      onChange={set('base_rent')} placeholder={`Default: ₹${room.base_rent || 0}`} min="0" />
                  </div>
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <UserPlus size={16} /> {saving ? 'Saving…' : 'Confirm & Mark Occupied'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── OCCUPIED → VACANT ── */}
        {isOccupied && (
          <>
            <div className="modal-head">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                Mark Room {room.number} as Vacant?
              </h2>
              <button className="btn-icon" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="modal-body">
              {/* Warning box */}
              <div style={{
                display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem'
              }}>
                <AlertTriangle size={22} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Are you sure?</p>
                  <p className="text-muted" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
                    This will move out <strong style={{ color: 'var(--text-main)' }}>{room.tenant_name}</strong> and
                    mark Room {room.number} as <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Vacant</span>.
                    Their billing history will be preserved.
                  </p>
                </div>
              </div>

              {/* Tenant summary */}
              <div style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                padding: '0.85rem 1rem', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Tenant</span>
                  <span style={{ fontWeight: 600 }}>{room.tenant_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Mobile</span>
                  <span>{room.tenant_mobile}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Room</span>
                  <span>{room.number}</span>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="btn btn-danger" onClick={handleMoveOut} disabled={saving}>
                <UserMinus size={16} /> {saving ? 'Processing…' : 'Yes, Mark Vacant'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
