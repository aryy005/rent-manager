import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, PlusCircle, MapPin, Home, Users, IndianRupee,
  LogOut, ChevronRight, Loader, X, Edit2, Trash2, RefreshCw, Sun, Moon
} from 'lucide-react';
import { api } from '../utils/api';
import { authStore } from '../utils/auth';
import { toast } from '../utils/toast';
import { formatINR } from '../utils/helpers';
import ConfirmModal from '../components/ConfirmModal';

const PROPERTY_TYPES = [
  { value: 'apartment', label: '🏢 Apartment' },
  { value: 'house',     label: '🏠 House' },
  { value: 'commercial',label: '🏪 Commercial' },
  { value: 'other',     label: '📦 Other' },
];

export default function PropertiesPage({ user, onSelectProperty, onLogout, theme, onToggleTheme }) {
  const [properties, setProperties]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [addOpen, setAddOpen]         = useState(false);
  const [editProp, setEditProp]       = useState(null);
  const [deleteProp, setDeleteProp]   = useState(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProperties();
      setProperties(data);
    } catch (e) {
      toast.error(e.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleDelete = async () => {
    try {
      await api.deleteProperty(deleteProp.id);
      toast.success(`${deleteProp.name} deleted.`);
      setDeleteProp(null);
      fetchProperties();
    } catch (e) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '3rem' }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '-15%', right: '-10%', width: '55vw', height: '55vw',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0.5rem 1rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)', flexWrap: 'wrap', gap: '0.4rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: '9px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Rent<span style={{ color: 'var(--primary-light)' }}>Master</span>
          </span>
          <span className="prop-user-greeting" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
            👋 {user?.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <button onClick={fetchProperties} className="btn btn-ghost btn-sm" title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={onToggleTheme} className="btn btn-ghost btn-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', whiteSpace: 'nowrap' }}>
            <LogOut size={15} /> <span className="btn-label">Sign Out</span>
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.25rem' }}>
        {/* Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            My Properties
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.92rem' }}>
            Select a property to manage its rooms, tenants and billing.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <p>Loading properties…</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.25rem',
          }}>
            {properties.map(prop => (
              <PropertyCard
                key={prop.id}
                prop={prop}
                onSelect={() => onSelectProperty(prop)}
                onEdit={() => setEditProp(prop)}
                onDelete={() => setDeleteProp(prop)}
              />
            ))}

            {/* Add New */}
            <button
              onClick={() => setAddOpen(true)}
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '2px dashed rgba(99,102,241,0.3)',
                borderRadius: '16px', padding: '2rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '0.75rem',
                cursor: 'pointer', color: 'var(--primary-light)',
                transition: 'all 0.2s', fontFamily: 'inherit',
                minHeight: '180px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
            >
              <PlusCircle size={36} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Add New Property</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Apartment, house, or commercial</span>
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {(addOpen || editProp) && (
        <PropertyFormModal
          prop={editProp}
          onClose={() => { setAddOpen(false); setEditProp(null); }}
          onSaved={() => { setAddOpen(false); setEditProp(null); fetchProperties(); }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteProp}
        title={`Delete "${deleteProp?.name}"?`}
        message="This will permanently delete the property and ALL rooms, tenants, and billing history inside it."
        subMessage="This action cannot be undone."
        confirmLabel="Delete Property"
        onConfirm={handleDelete}
        onCancel={() => setDeleteProp(null)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PropertyCard({ prop, onSelect, onEdit, onDelete }) {
  const typeEmoji = { apartment: '🏢', house: '🏠', commercial: '🏪', other: '📦' };

  return (
    <div
      onClick={onSelect}
      style={{
        background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '1.5rem', cursor: 'pointer',
        transition: 'all 0.2s', position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
    >
      {/* Action buttons */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.4rem' }}
        onClick={e => e.stopPropagation()}>
        <ActionBtn icon={<Edit2 size={13} />} onClick={onEdit} title="Edit" color="var(--primary-light)" />
        <ActionBtn icon={<Trash2 size={13} />} onClick={onDelete} title="Delete" color="var(--danger)" />
      </div>

      {/* Type + Name */}
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{typeEmoji[prop.type] || '📦'}</div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', paddingRight: '4rem' }}>
        {prop.name}
      </div>
      {prop.address && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.3rem' }}>
          <MapPin size={12} /> {prop.address}
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem 0.75rem',
        marginTop: '1.25rem', paddingTop: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <StatPill icon={<Home size={13} />}  value={prop.total_rooms}                         label="Rooms"    color="var(--primary-light)" />
        <StatPill icon={<Users size={13} />} value={prop.occupied_rooms}                      label="Occupied" color="var(--success)" />
        <StatPill icon={<Home size={13} />}  value={prop.total_rooms - prop.occupied_rooms}   label="Vacant"  color="var(--warning)" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '1rem', color: 'var(--primary-light)', fontSize: '0.82rem', fontWeight: 600 }}>
        Manage <ChevronRight size={15} />
      </div>
    </div>
  );
}

function StatPill({ icon, value, label, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.8rem', color, whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {icon} <strong>{value}</strong> <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function ActionBtn({ icon, onClick, title, color }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: '1.8rem', height: '1.8rem', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)', color, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s', fontFamily: 'inherit',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    >
      {icon}
    </button>
  );
}

function PropertyFormModal({ prop, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: prop?.name || '',
    address: prop?.address || '',
    type: prop?.type || 'apartment',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Property name is required');
    setLoading(true);
    try {
      if (prop) {
        await api.updateProperty(prop.id, form);
        toast.success('Property updated!');
      } else {
        await api.addProperty(form);
        toast.success(`${form.name} added!`);
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '18px', padding: '2rem', width: '100%', maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)', animation: 'modalIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {prop ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
            Property Name *
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              placeholder="e.g. Sunshine Apartments"
              style={{ display: 'block', width: '100%', marginTop: '0.35rem', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </label>

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
            Address (optional)
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="e.g. 12 Main Street, Mumbai"
              style={{ display: 'block', width: '100%', marginTop: '0.35rem', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
          </label>

          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
            Property Type
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ display: 'block', width: '100%', marginTop: '0.35rem', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}>
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontFamily: 'inherit',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving…' : prop ? 'Save Changes' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
