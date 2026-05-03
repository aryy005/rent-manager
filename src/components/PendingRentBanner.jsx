import React, { useState } from 'react';
import { BellRing, X, ChevronDown, ChevronUp, IndianRupee, CheckCircle, Zap } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { formatINR, getMonthName, MONTH_NAMES } from '../utils/helpers';
import WhatsAppButton from './WhatsAppButton';

export default function PendingRentBanner({ pending, year, month, onBillCreated, propertyId }) {
  const [expanded, setExpanded]   = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [forms, setForms]         = useState({});
  const [saving, setSaving]       = useState({});
  const [autoGen, setAutoGen]     = useState(false);

  if (dismissed || !pending || pending.length === 0) return null;

  const setField = (roomId, field, value) =>
    setForms(p => ({ ...p, [roomId]: { ...p[roomId], [field]: value } }));

  const getForm = (room) => forms[room.room_id] || {
    rent:     room.rent     ?? room.base_rent ?? '',
    electric: room.electric ?? '',
    water:    room.water    ?? '',
    other:    room.other    ?? '0',
  };

  const handleCreateAndPay = async (room) => {
    const form = getForm(room);
    if (!form.rent) { toast.error('Enter rent amount'); return; }
    setSaving(p => ({ ...p, [room.room_id]: true }));
    try {
      // Create / update bill
      const bill = await api.addOrUpdateBill(room.room_id, {
        year, month,
        rent:     Number(form.rent)     || 0,
        electric: Number(form.electric) || 0,
        water:    Number(form.water)    || 0,
        other:    Number(form.other)    || 0,
      });
      // Mark as paid
      await api.markBillStatus(bill.id, true);
      toast.success(`Rent collected for Room ${room.room_number} – ${room.tenant_name}`);
      onBillCreated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(p => ({ ...p, [room.room_id]: false }));
    }
  };

  const handleAutoBill = async () => {
    setAutoGen(true);
    try {
      const result = await api.autoBill(propertyId, year, month);
      toast.success(`Auto-generated ${result.created} bill(s) for ${getMonthName(month)} ${year}. ${result.skipped} skipped.`);
      onBillCreated();
    } catch (e) { toast.error(e.message); }
    finally { setAutoGen(false); }
  };

  const handleSaveUnpaid = async (room) => {
    const form = getForm(room);
    if (!form.rent) { toast.error('Enter rent amount'); return; }
    setSaving(p => ({ ...p, [room.room_id]: true }));
    try {
      await api.addOrUpdateBill(room.room_id, {
        year, month,
        rent:     Number(form.rent)     || 0,
        electric: Number(form.electric) || 0,
        water:    Number(form.water)    || 0,
        other:    Number(form.other)    || 0,
      });
      toast.success(`Bill created (unpaid) for Room ${room.room_number}`);
      onBillCreated();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(p => ({ ...p, [room.room_id]: false }));
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(236,72,153,0.08))',
      border: '1px solid rgba(99,102,241,0.35)',
      borderRadius: '14px',
      marginBottom: '2rem',
      overflow: 'hidden',
    }}>
      {/* Banner Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem', cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            background: 'rgba(99,102,241,0.25)', borderRadius: '50%',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BellRing size={18} style={{ color: 'var(--primary-light)' }} />
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              🔔 Rent Pending for <span style={{ color: 'var(--primary-light)' }}>{getMonthName(month)} {year}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {pending.length} room{pending.length > 1 ? 's' : ''} haven't collected rent this month
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {propertyId && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={e => { e.stopPropagation(); handleAutoBill(); }}
              disabled={autoGen}
              title="Auto-create bills for all occupied rooms this month"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <Zap size={13} />{autoGen ? 'Generating…' : 'Auto-Generate Bills'}
            </button>
          )}
          <button
            className="btn-icon"
            onClick={e => { e.stopPropagation(); setDismissed(true); }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded rows */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(99,102,241,0.2)', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pending.map(room => {
            const form = getForm(room);
            const isSaving = !!saving[room.room_id];
            const total = (Number(form.rent)||0) + (Number(form.electric)||0) + (Number(form.water)||0) + (Number(form.other)||0);
            const hasBill = !!room.bill_id; // bill exists but unpaid

            return (
              <div key={room.room_id} style={{
                background: 'rgba(0,0,0,0.25)', borderRadius: '10px',
                border: '1px solid var(--border)', padding: '1rem 1.25rem',
              }}>
                {/* Room header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>Room {room.room_number}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginLeft: '0.6rem' }}>
                      {room.tenant_name} · {room.tenant_mobile}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <WhatsAppButton room={room} year={year} month={month} total={(Number(getForm(room).rent)||0)+(Number(getForm(room).electric)||0)+(Number(getForm(room).water)||0)} />
                    {hasBill && (
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                        borderRadius: '999px', background: 'rgba(245,158,11,0.15)',
                        border: '1px solid rgba(245,158,11,0.3)', color: 'var(--warning)',
                      }}>
                        Bill created · Unpaid
                      </span>
                    )}
                  </div>
                </div>

                {/* Bill fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '0.85rem' }}>
                  {[
                    { label: 'Rent (₹) *', field: 'rent', placeholder: room.base_rent },
                    { label: 'Electric (₹)', field: 'electric', placeholder: '0' },
                    { label: 'Water (₹)', field: 'water', placeholder: '0' },
                    { label: 'Other (₹)', field: 'other', placeholder: '0' },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field} className="form-group">
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>{label}</label>
                      <input
                        className="form-input"
                        type="number" min="0"
                        style={{ padding: '0.5rem 0.7rem', fontSize: '0.88rem' }}
                        value={form[field] ?? ''}
                        placeholder={placeholder}
                        onChange={e => setField(room.room_id, field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Total: <strong style={{ color: 'var(--text-main)' }}>{formatINR(total)}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleSaveUnpaid(room)}
                      disabled={isSaving}
                    >
                      Save as Unpaid
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleCreateAndPay(room)}
                      disabled={isSaving}
                    >
                      <CheckCircle size={15} />
                      {isSaving ? 'Saving…' : 'Mark as Paid'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
