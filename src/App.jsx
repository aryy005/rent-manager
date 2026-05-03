import React, { useState, useEffect, useCallback } from 'react';
import { Building2, BarChart2, PlusCircle, Home, User, IndianRupee, RefreshCw, ToggleLeft, ToggleRight, Download, Trash2 } from 'lucide-react';
import { api } from './utils/api';
import { toast } from './utils/toast';
import { formatINR } from './utils/helpers';
import StatsPanel       from './components/StatsPanel';
import AddRoomModal     from './components/AddRoomModal';
import RoomDetailModal  from './components/RoomDetailModal';
import StatusToggleModal from './components/StatusToggleModal';
import PendingRentBanner from './components/PendingRentBanner';
import ExportModal      from './components/ExportModal';
import ToastContainer   from './components/ToastContainer';


export default function App() {
  const [rooms, setRooms]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statsOpen, setStatsOpen]     = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [exportOpen, setExportOpen]   = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [toggleRoom, setToggleRoom] = useState(null);

  // Pending rent state
  const [pendingData, setPendingData] = useState({ year: 0, month: 0, pending: [] });

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRooms();
      setRooms(data);
    } catch {
      toast.error('Failed to load rooms. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const data = await api.getPendingRents();
      setPendingData(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchPending();
  }, [fetchRooms, fetchPending]);

  const handleRefresh = useCallback(async () => {
    const data = await api.getRooms();
    setRooms(data);
    if (selectedRoom) {
      const updated = data.find(r => r.id === selectedRoom.id);
      if (updated) setSelectedRoom(updated);
    }
    fetchPending();
  }, [selectedRoom, fetchPending]);

  const handleToggleRefresh = useCallback(async () => {
    const data = await api.getRooms();
    setRooms(data);
    fetchPending();
  }, [fetchPending]);

  const handleDeleteRoom = useCallback(async (room) => {
    if (room.is_occupied) {
      // Step 1 — warn about tenant data loss
      const step1 = window.confirm(
        `⚠️ Room ${room.number} is currently occupied by ${room.tenant_name}.\n\n` +
        `Deleting this room will permanently remove the tenant and ALL billing history.\n\n` +
        `Are you sure you want to continue?`
      );
      if (!step1) return;
      // Step 2 — final confirmation
      const step2 = window.confirm(
        `🚨 FINAL CONFIRMATION\n\nYou are about to permanently delete Room ${room.number} and all its data. This CANNOT be undone.\n\nClick OK to delete.`
      );
      if (!step2) return;
    } else {
      // Single confirm for vacant rooms
      const ok = window.confirm(
        `Delete Room ${room.number}?\n\nThis will permanently remove the room and all its history. This cannot be undone.`
      );
      if (!ok) return;
    }
    try {
      await api.deleteRoom(room.id);
      toast.success(`Room ${room.number} deleted.`);
      fetchRooms();
      fetchPending();
    } catch (e) {
      toast.error(e.message || 'Failed to delete room.');
    }
  }, [fetchRooms, fetchPending]);

  const occupiedRooms  = rooms.filter(r => r.is_occupied);
  const totalBaseRent  = occupiedRooms.reduce((s, r) => s + (r.base_rent || 0), 0);
  const pendingCount   = pendingData.pending?.length ?? 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="icon-wrap"><Building2 size={20} color="#fff" /></div>
          <span>RentMaster <span style={{ color: 'var(--primary-light)' }}>AI</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: '0.5rem' }}>
            <QuickPill label={`${occupiedRooms.length}/${rooms.length} Occupied`} color="var(--success)" />
            <QuickPill label={formatINR(totalBaseRent) + ' /mo'} color="var(--primary-light)" />
            {pendingCount > 0 && (
              <QuickPill label={`🔔 ${pendingCount} Pending`} color="var(--warning)" />
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { fetchRooms(); fetchPending(); }} title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button className="btn btn-ghost" onClick={() => setStatsOpen(true)}>
            <BarChart2 size={17} /> Statistics
          </button>
          <button className="btn btn-ghost" onClick={() => setExportOpen(true)}>
            <Download size={17} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setAddRoomOpen(true)}>
            <PlusCircle size={17} /> Add Room
          </button>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* Pending Rent Reminder Banner */}
            <PendingRentBanner
              pending={pendingData.pending}
              year={pendingData.year}
              month={pendingData.month}
              onBillCreated={() => { fetchPending(); }}
            />

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              <SummaryCard icon={<Home size={20} />}         label="Total Rooms"   value={rooms.length}              sub={`${rooms.length - occupiedRooms.length} vacant`}    color="var(--primary-light)" />
              <SummaryCard icon={<User size={20} />}         label="Tenants"       value={occupiedRooms.length}      sub="currently living"                                   color="var(--success)" />
              <SummaryCard icon={<IndianRupee size={20} />}  label="Monthly Rent"  value={formatINR(totalBaseRent)}  sub="base rent collected"                                color="var(--warning)" />
            </div>

            {/* Rooms Grid */}
            <div className="section-header">
              <span className="section-title">All Rooms</span>
              <span className="text-muted" style={{ fontSize: '0.88rem' }}>Click a room to manage · Use toggle to change status</span>
            </div>

            <div className="rooms-grid">
              {rooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  isPending={pendingData.pending?.some(p => p.room_id === room.id)}
                  onClick={() => setSelectedRoom(room)}
                  onToggleStatus={e => { e.stopPropagation(); setToggleRoom(room); }}
                  onDelete={e => { e.stopPropagation(); handleDeleteRoom(room); }}
                />
              ))}
              <button className="add-room-card" onClick={() => setAddRoomOpen(true)}>
                <PlusCircle size={36} />
                <span style={{ fontWeight: 600 }}>Add New Room</span>
                <span style={{ fontSize: '0.82rem' }}>Click to add another room</span>
              </button>
            </div>
          </>
        )}
      </main>

      <StatsPanel isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
      <AddRoomModal isOpen={addRoomOpen} onClose={() => setAddRoomOpen(false)} onAdded={fetchRooms} />
      <RoomDetailModal
        room={selectedRoom}
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onRefresh={handleRefresh}
      />
      <StatusToggleModal
        room={toggleRoom}
        isOpen={!!toggleRoom}
        onClose={() => setToggleRoom(null)}
        onRefresh={handleToggleRefresh}
      />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <ToastContainer />
    </div>
  );
}

function QuickPill({ label, color }) {
  return (
    <span style={{ fontSize: '0.8rem', fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: '999px', padding: '0.25rem 0.7rem' }}>
      {label}
    </span>
  );
}

function SummaryCard({ icon, label, value, sub, color }) {
  return (
    <div className="card stat-card">
      <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <div className="stat-value gradient-text">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function RoomCard({ room, isPending, onClick, onToggleStatus, onDelete }) {
  const isOccupied = !!room.is_occupied;
  return (
    <div className="card room-card" onClick={onClick} style={{ position: 'relative' }}>
      {/* Pending rent dot */}
      {isPending && (
        <span style={{
          position: 'absolute', top: '0.85rem', right: '0.85rem',
          width: 9, height: 9, borderRadius: '50%',
          background: 'var(--warning)', boxShadow: '0 0 6px var(--warning)',
          display: 'inline-block',
        }} title="Rent pending this month" />
      )}

      <div className="room-top">
        <div>
          <div className="room-number">Room {room.number}</div>
          {isOccupied && <div className="room-sub">{room.tenant_name}</div>}
        </div>
        <span className={`badge ${isOccupied ? 'badge-occupied' : 'badge-vacant'}`} style={{ marginRight: isPending ? '1rem' : 0 }}>
          {isOccupied ? 'Occupied' : 'Vacant'}
        </span>
      </div>

      <div className="room-info">
        <div className="info-row">
          <span className="info-label"><IndianRupee size={14} /> Base Rent</span>
          <span className="info-value">{formatINR(room.base_rent)}</span>
        </div>
        {isOccupied && (
          <div className="info-row">
            <span className="info-label"><User size={14} /> Mobile</span>
            <span className="info-value">{room.tenant_mobile || '—'}</span>
          </div>
        )}
      </div>

      <div className="room-footer">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isOccupied ? `Since ${new Date(room.moved_in_at).toLocaleDateString('en-IN')}` : 'Available for rent'}
        </span>
        <span style={{ fontSize: '0.82rem', color: 'var(--primary-light)', fontWeight: 500 }}>
          View Details →
        </span>
      </div>

      {/* Action buttons row */}
      <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onToggleStatus}
          title={isOccupied ? 'Mark as Vacant' : 'Mark as Occupied'}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.55rem', borderRadius: '8px', cursor: 'pointer',
            border: `1px solid ${isOccupied ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            background: isOccupied ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)',
            color: isOccupied ? 'var(--danger)' : 'var(--success)',
            fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {isOccupied
            ? <><ToggleRight size={16} /> Mark as Vacant</>
            : <><ToggleLeft  size={16} /> Mark as Occupied</>}
        </button>

        <button
          onClick={onDelete}
          title={isOccupied ? 'Delete room (tenant will also be removed)' : 'Delete this room'}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '2.4rem', height: '2.4rem', borderRadius: '8px', cursor: 'pointer',
            border: '1px solid rgba(239,68,68,0.35)',
            background: 'rgba(239,68,68,0.07)',
            color: 'var(--danger)',
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function SyncBadge({ status }) {
  const { online, pendingSyncCount } = status;
  const label   = online ? 'Synced to Cloud' : 'Offline Mode';
  const subtext = online
    ? (pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'All synced')
    : 'Working locally';
  const color   = online ? 'var(--success)' : 'var(--warning)';
  const Icon    = online ? Cloud : WifiOff;

  return (
    <div title={online ? `MongoDB Atlas connected · ${pendingSyncCount} unsynced records` : 'No internet — data saved locally, will sync when online'}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.3rem 0.7rem', borderRadius: '999px',
        background: `${color}14`, border: `1px solid ${color}35`,
        fontSize: '0.78rem', fontWeight: 600, color,
        cursor: 'default', userSelect: 'none',
      }}>
      <Icon size={13} />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span>{label}</span>
        {pendingSyncCount > 0 && online && (
          <span style={{ fontSize: '0.68rem', fontWeight: 400, opacity: 0.8 }}>{subtext}</span>
        )}
      </span>
    </div>
  );
}
