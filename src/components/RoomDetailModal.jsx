import React, { useState, useEffect } from 'react';
import { X, User, Phone, CreditCard, IndianRupee, History, Receipt, PlusCircle, LogOut, Edit2, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { formatINR, maskAadhar, getMonthName, MONTH_NAMES } from '../utils/helpers';

const curYear  = new Date().getFullYear();
const curMonth = new Date().getMonth() + 1;

export default function RoomDetailModal({ room, isOpen, onClose, onRefresh }) {
  const [tab, setTab]         = useState('overview');
  const [history, setHistory] = useState([]);
  const [bills, setBills]     = useState([]);
  const [loading, setLoading] = useState(false);

  const [tenantForm, setTenantForm] = useState({ name: '', aadhar: '', mobile: '', base_rent: '' });
  const [editMode, setEditMode]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const [billForm, setBillForm]   = useState({ year: curYear, month: curMonth, rent: '', electric: '', water: '', other: '0' });
  const [addingBill, setAddingBill] = useState(false);
  const [togglingBill, setTogglingBill] = useState(null); // bill id being toggled

  useEffect(() => {
    if (!isOpen || !room) return;
    setTab('overview');
    setEditMode(false);
    loadData();
    setTenantForm({ name: room.tenant_name || '', aadhar: room.tenant_aadhar || '', mobile: room.tenant_mobile || '', base_rent: room.base_rent || '' });
    setBillForm(f => ({ ...f, rent: room.base_rent || '' }));
  }, [isOpen, room?.id]);

  const loadData = async () => {
    if (!room) return;
    setLoading(true);
    try {
      const [h, b] = await Promise.all([api.getRoomTenantHistory(room.id), api.getRoomBills(room.id)]);
      setHistory(h); setBills(b);
    } catch { toast.error('Failed to load room data'); }
    finally { setLoading(false); }
  };

  const handleMoveIn = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await api.addTenant(room.id, { name: tenantForm.name, aadhar: tenantForm.aadhar, mobile: tenantForm.mobile, base_rent: Number(tenantForm.base_rent) || 0 });
      toast.success('Tenant moved in!'); onRefresh(); loadData();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleUpdateTenant = async e => {
    e.preventDefault(); setSaving(true);
    try {
      await api.updateCurrentTenant(room.id, { name: tenantForm.name, aadhar: tenantForm.aadhar, mobile: tenantForm.mobile, base_rent: Number(tenantForm.base_rent) || 0 });
      toast.success('Updated!'); setEditMode(false); onRefresh(); loadData();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleMoveOut = async () => {
    if (!window.confirm('Mark current tenant as moved out?')) return;
    try { await api.moveOutTenant(room.id); toast.success('Moved out.'); onRefresh(); loadData(); }
    catch (err) { toast.error(err.message); }
  };

  const handleAddBill = async e => {
    e.preventDefault(); setAddingBill(true);
    try {
      await api.addOrUpdateBill(room.id, {
        year: Number(billForm.year), month: Number(billForm.month),
        rent: Number(billForm.rent)||0, electric: Number(billForm.electric)||0,
        water: Number(billForm.water)||0, other: Number(billForm.other)||0,
      });
      toast.success('Bill saved!');
      setBillForm(f => ({ ...f, electric: '', water: '', other: '0' }));
      loadData();
    } catch (err) { toast.error(err.message); } finally { setAddingBill(false); }
  };

  const handleTogglePaid = async (bill) => {
    setTogglingBill(bill.id);
    try {
      const updated = await api.markBillStatus(bill.id, !bill.is_paid);
      toast.success(updated.is_paid ? '✅ Marked as Paid' : '⬜ Marked as Unpaid');
      loadData(); onRefresh();
    } catch (err) { toast.error(err.message); }
    finally { setTogglingBill(null); }
  };

  if (!isOpen || !room) return null;
  const isOccupied = !!room.is_occupied;

  // Revenue from paid bills only
  const paidBills = bills.filter(b => b.is_paid);
  const totalRevenue = paidBills.reduce((s,b) => s + b.rent + b.electric + b.water + b.other, 0);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Room {room.number}</h2>
            <span className={`badge ${isOccupied ? 'badge-occupied' : 'badge-vacant'}`} style={{ marginTop: '0.3rem', display: 'inline-block' }}>
              {isOccupied ? 'Occupied' : 'Vacant'}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '1rem 1.5rem 0' }}>
          <div className="tabs">
            <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
            <button className={`tab ${tab === 'bills'    ? 'active' : ''}`} onClick={() => setTab('bills')}>
              Billing {bills.some(b => !b.is_paid) ? '🔴' : ''}
            </button>
            <button className={`tab ${tab === 'history'  ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
          </div>
        </div>

        <div className="modal-body">
          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            isOccupied ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div className="stat-label" style={{ margin: 0 }}>Current Tenant</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(!editMode)}>
                      <Edit2 size={14} /> {editMode ? 'Cancel' : 'Edit'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={handleMoveOut}>
                      <LogOut size={14} /> Move Out
                    </button>
                  </div>
                </div>

                {editMode ? (
                  <form onSubmit={handleUpdateTenant}>
                    <TenantFormFields form={tenantForm} onChange={setTenantForm} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <InfoBlock icon={<User size={16} />}         label="Full Name"   value={room.tenant_name} />
                    <InfoBlock icon={<Phone size={16} />}        label="Mobile"      value={room.tenant_mobile} />
                    <InfoBlock icon={<CreditCard size={16} />}   label="Aadhar No."  value={maskAadhar(room.tenant_aadhar)} fullWidth />
                    <InfoBlock icon={<IndianRupee size={16} />}  label="Base Rent"   value={formatINR(room.base_rent)} />
                  </div>
                )}

                {bills.length > 0 && (
                  <>
                    <hr className="divider" />
                    <div className="stat-label" style={{ marginBottom: '0.75rem' }}>Revenue Summary (Paid Bills Only)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                      {[
                        { label: 'Total Collected', value: totalRevenue, color: 'var(--primary-light)' },
                        { label: 'Rent', value: paidBills.reduce((s,b) => s + b.rent, 0), color: 'var(--success)' },
                        { label: 'Electric', value: paidBills.reduce((s,b) => s + b.electric, 0), color: 'var(--warning)' },
                        { label: 'Water', value: paidBills.reduce((s,b) => s + b.water, 0), color: 'var(--info)' },
                      ].map(item => (
                        <div key={item.label} className="card" style={{ padding: '0.85rem' }}>
                          <div className="stat-label" style={{ marginBottom: '0.3rem' }}>{item.label}</div>
                          <div style={{ fontWeight: 700, color: item.color }}>{formatINR(item.value)}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                <p className="text-muted" style={{ marginBottom: '1.5rem' }}>This room is currently vacant. Move in a new tenant:</p>
                <form onSubmit={handleMoveIn}>
                  <TenantFormFields form={tenantForm} onChange={setTenantForm} required />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      <PlusCircle size={17} /> {saving ? 'Moving in…' : 'Move In Tenant'}
                    </button>
                  </div>
                </form>
              </div>
            )
          )}

          {/* ── BILLING TAB ── */}
          {tab === 'bills' && (
            <div>
              {isOccupied && (
                <>
                  <div className="stat-label" style={{ marginBottom: '0.75rem' }}>Add / Update Bill</div>
                  <form onSubmit={handleAddBill} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Year</label>
                        <input className="form-input" type="number" value={billForm.year} onChange={e => setBillForm(f => ({...f, year: e.target.value}))} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Month</label>
                        <select className="form-input filter-select" value={billForm.month} onChange={e => setBillForm(f => ({...f, month: e.target.value}))}>
                          {MONTH_NAMES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Rent (₹)</label>
                        <input className="form-input" type="number" value={billForm.rent} onChange={e => setBillForm(f => ({...f, rent: e.target.value}))} min="0" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Electric (₹)</label>
                        <input className="form-input" type="number" value={billForm.electric} onChange={e => setBillForm(f => ({...f, electric: e.target.value}))} min="0" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Water (₹)</label>
                        <input className="form-input" type="number" value={billForm.water} onChange={e => setBillForm(f => ({...f, water: e.target.value}))} min="0" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Other (₹)</label>
                        <input className="form-input" type="number" value={billForm.other} onChange={e => setBillForm(f => ({...f, other: e.target.value}))} min="0" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={addingBill}>
                        <Receipt size={15} /> {addingBill ? 'Saving…' : 'Save Bill'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              <div className="stat-label" style={{ marginBottom: '0.75rem' }}>Bill History</div>
              {loading ? <div className="spinner" /> : bills.length === 0 ? (
                <div className="empty"><Receipt size={40} /><p>No bills recorded yet</p></div>
              ) : bills.map(b => (
                <div key={b.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '0.5rem',
                  background: b.is_paid ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${b.is_paid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600 }}>{getMonthName(b.month)} {b.year}</span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        background: b.is_paid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)',
                        color: b.is_paid ? 'var(--success)' : 'var(--danger)',
                        border: `1px solid ${b.is_paid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
                      }}>
                        {b.is_paid ? '✓ Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.81rem', color: 'var(--text-sub)' }}>
                      <span>Rent: {formatINR(b.rent)}</span>
                      <span className="text-warning">⚡ {formatINR(b.electric)}</span>
                      <span className="text-info">💧 {formatINR(b.water)}</span>
                      {b.other > 0 && <span>Other: {formatINR(b.other)}</span>}
                    </div>
                    {b.is_paid && b.paid_at && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Paid on {new Date(b.paid_at).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem', flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, color: b.is_paid ? 'var(--success)' : 'var(--danger)' }}>
                      {formatINR(b.rent + b.electric + b.water + b.other)}
                    </span>
                    {!b.is_paid && (
                      <button
                        onClick={() => handleTogglePaid(b)}
                        disabled={togglingBill === b.id}
                        className="btn btn-sm"
                        title="Tenant has paid — mark as paid"
                        style={{
                          background: 'rgba(16,185,129,0.12)',
                          border: '1px solid rgba(16,185,129,0.35)',
                          color: 'var(--success)',
                          minWidth: '120px',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle size={14} />
                        {togglingBill === b.id ? 'Saving…' : 'Mark as Paid'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <div>
              <div className="stat-label" style={{ marginBottom: '1rem' }}>Tenant History</div>
              {loading ? <div className="spinner" /> : history.length === 0 ? (
                <div className="empty"><History size={40} /><p>No tenants yet</p></div>
              ) : history.map(t => (
                <div key={t.id} className="history-item">
                  <div>
                    <div className="history-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {t.name}
                      {t.is_current
                        ? <span className="badge badge-occupied">Current</span>
                        : <span className="badge badge-vacant">Past</span>}
                    </div>
                    <div className="history-meta">📱 {t.mobile} &nbsp;|&nbsp; 🪪 {maskAadhar(t.aadhar)}</div>
                    <div className="history-meta" style={{ marginTop: '0.3rem' }}>
                      Moved in: {new Date(t.moved_in_at).toLocaleDateString('en-IN')}
                      {t.moved_out_at && ` — Moved out: ${new Date(t.moved_out_at).toLocaleDateString('en-IN')}`}
                    </div>
                  </div>
                  {t.total_paid > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div className="history-amount">{formatINR(t.total_paid)}</div>
                      <div className="history-meta">Total paid</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ icon, label, value, fullWidth }) {
  return (
    <div className="card" style={{ padding: '0.9rem', gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
        <span className="text-primary">{icon}</span> {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: label === 'Aadhar No.' ? '0.05em' : 'normal' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function TenantFormFields({ form, onChange, required }) {
  const set = field => e => onChange(p => ({ ...p, [field]: e.target.value }));
  return (
    <div className="form-grid">
      <div className="form-group full">
        <label className="form-label">Full Name {required && '*'}</label>
        <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" required={required} />
      </div>
      <div className="form-group">
        <label className="form-label">Aadhar Number {required && '*'}</label>
        <input className="form-input" value={form.aadhar} onChange={set('aadhar')} placeholder="XXXX XXXX XXXX" required={required} maxLength={14} />
      </div>
      <div className="form-group">
        <label className="form-label">Mobile Number {required && '*'}</label>
        <input className="form-input" value={form.mobile} onChange={set('mobile')} placeholder="98XXXXXXXX" required={required} maxLength={10} />
      </div>
      <div className="form-group full">
        <label className="form-label">Base Rent (₹)</label>
        <input className="form-input" type="number" value={form.base_rent} onChange={set('base_rent')} placeholder="e.g. 8500" min="0" />
      </div>
    </div>
  );
}
