import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Building2, BarChart2, PlusCircle, Home, User, IndianRupee,
         RefreshCw, ToggleLeft, ToggleRight, Download, Trash2,
         ArrowLeft, LogOut, Sun, Moon } from 'lucide-react';
import { api } from './utils/api';
import { authStore } from './utils/auth';
import { themeStore } from './utils/theme';
import { toast } from './utils/toast';
import { formatINR } from './utils/helpers';
import StatsPanel        from './components/StatsPanel';
import AddRoomModal      from './components/AddRoomModal';
import RoomDetailModal   from './components/RoomDetailModal';
import StatusToggleModal from './components/StatusToggleModal';
import PendingRentBanner from './components/PendingRentBanner';
import ExportModal       from './components/ExportModal';
import ToastContainer    from './components/ToastContainer';
import ConfirmModal      from './components/ConfirmModal';
import AuthPage          from './pages/AuthPage';
import PropertiesPage    from './pages/PropertiesPage';

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => authStore.getUser());
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [theme, setTheme] = useState(() => themeStore.get());
  const navigate = useNavigate();

  const toggleTheme = () => {
    const next = themeStore.toggle();
    setTheme(next);
  };

  // Keep user in sync on refresh
  useEffect(() => {
    if (authStore.isLoggedIn() && !user) {
      api.getMe().then(u => { setUser(u); authStore.setUser(u); }).catch(() => {
        authStore.clear(); setUser(null);
      });
    }
  }, []);

  const handleAuth = (u) => { setUser(u); navigate('/properties'); };

  const handleLogout = () => {
    authStore.clear();
    setUser(null);
    setSelectedProperty(null);
    navigate('/login');
  };

  const handleSelectProperty = (prop) => {
    setSelectedProperty(prop);
    navigate(`/property/${prop.id}`);
  };

  const handleBackToProperties = () => {
    setSelectedProperty(null);
    navigate('/properties');
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={
          !authStore.isLoggedIn()
            ? <AuthPage onAuth={handleAuth} />
            : <Navigate to="/properties" replace />
        } />
        <Route path="/properties" element={
          authStore.isLoggedIn()
            ? <PropertiesPage user={user} onSelectProperty={handleSelectProperty} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
            : <Navigate to="/login" replace />
        } />
        <Route path="/property/:propertyId" element={
          authStore.isLoggedIn()
            ? <Dashboard
                property={selectedProperty}
                user={user}
                onBack={handleBackToProperties}
                onLogout={handleLogout}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to={authStore.isLoggedIn() ? '/properties' : '/login'} replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

// ── Dashboard (existing room management, now property-scoped) ─────────────────
function Dashboard({ property, user, onBack, onLogout, theme, onToggleTheme }) {
  const navigate = useNavigate();

  // If navigated directly (e.g. refresh), extract propertyId from URL
  const urlPropertyId = window.location.pathname.split('/property/')[1];
  const propertyId = property?.id || urlPropertyId;

  const [rooms, setRooms]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [statsOpen, setStatsOpen]           = useState(false);
  const [addRoomOpen, setAddRoomOpen]       = useState(false);
  const [exportOpen, setExportOpen]         = useState(false);
  const [selectedRoom, setSelectedRoom]     = useState(null);
  const [toggleRoom, setToggleRoom]         = useState(null);
  const [confirmState, setConfirmState]     = useState(null);
  const [pendingData, setPendingData]       = useState({ year: 0, month: 0, pending: [] });

  const fetchRooms = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const data = await api.getRooms(propertyId);
      setRooms(data);
    } catch {
      toast.error('Failed to load rooms.');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const fetchPending = useCallback(async () => {
    if (!propertyId) return;
    try {
      const data = await api.getPendingRents(propertyId);
      setPendingData(data);
    } catch { /* silent */ }
  }, [propertyId]);

  useEffect(() => { fetchRooms(); fetchPending(); }, [fetchRooms, fetchPending]);

  const handleRefresh = useCallback(async () => {
    const data = await api.getRooms(propertyId);
    setRooms(data);
    if (selectedRoom) {
      const updated = data.find(r => r.id === selectedRoom.id);
      if (updated) setSelectedRoom(updated);
    }
    fetchPending();
  }, [propertyId, selectedRoom, fetchPending]);

  const handleToggleRefresh = useCallback(async () => {
    const data = await api.getRooms(propertyId);
    setRooms(data);
    fetchPending();
  }, [propertyId, fetchPending]);

  const handleDeleteRoom = useCallback((room) => {
    setConfirmState({ room, step: 1 });
  }, []);

  const handleConfirmStep = useCallback(async () => {
    const { room, step } = confirmState;
    if (room.is_occupied && step === 1) { setConfirmState({ room, step: 2 }); return; }
    setConfirmState(null);
    try {
      await api.deleteRoom(room.id);
      toast.success(`Room ${room.number} deleted.`);
      fetchRooms(); fetchPending();
    } catch (e) { toast.error(e.message || 'Failed to delete room.'); }
  }, [confirmState, fetchRooms, fetchPending]);

  const occupiedRooms = rooms.filter(r => r.is_occupied);
  const totalBaseRent = occupiedRooms.reduce((s, r) => s + (r.base_rent || 0), 0);
  const pendingCount  = pendingData.pending?.length ?? 0;

  // Pass propertyId to modals that need it
  const addRoomWithProperty = useCallback(async (data) => {
    return api.addRoom(propertyId, data);
  }, [propertyId]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={onBack} className="btn btn-ghost btn-sm" title="Back to Properties"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={15} /> Properties
          </button>
          <div className="topbar-brand">
            <div className="icon-wrap"><Building2 size={20} color="#fff" /></div>
            <span>
              {property?.name
                ? <><span style={{ color: 'var(--primary-light)' }}>{property.name}</span></>
                : <>Rent<span style={{ color: 'var(--primary-light)' }}>Master</span></>}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: '0.5rem' }}>
            <QuickPill label={`${occupiedRooms.length}/${rooms.length} Occupied`} color="var(--success)" />
            <QuickPill label={formatINR(totalBaseRent) + ' /mo'} color="var(--primary-light)" />
            {pendingCount > 0 && <QuickPill label={`🔔 ${pendingCount} Pending`} color="var(--warning)" />}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { fetchRooms(); fetchPending(); }} title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ fontSize: '1rem' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
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
          <button className="btn btn-ghost btn-sm" onClick={onLogout}
            title="Sign Out" style={{ color: 'var(--danger)' }}>
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <PendingRentBanner
              pending={pendingData.pending}
              year={pendingData.year}
              month={pendingData.month}
              onBillCreated={() => fetchPending()}
            />
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              <SummaryCard icon={<Home size={20} />}        label="Total Rooms"  value={rooms.length}             sub={`${rooms.length - occupiedRooms.length} vacant`} color="var(--primary-light)" />
              <SummaryCard icon={<User size={20} />}        label="Tenants"      value={occupiedRooms.length}     sub="currently living"                                color="var(--success)" />
              <SummaryCard icon={<IndianRupee size={20} />} label="Monthly Rent" value={formatINR(totalBaseRent)} sub="base rent collected"                             color="var(--warning)" />
            </div>

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

      <StatsPanel isOpen={statsOpen} onClose={() => setStatsOpen(false)} propertyId={propertyId} />
      <AddRoomModal isOpen={addRoomOpen} onClose={() => setAddRoomOpen(false)} onAdded={fetchRooms} propertyId={propertyId} />
      <RoomDetailModal room={selectedRoom} isOpen={!!selectedRoom} onClose={() => setSelectedRoom(null)} onRefresh={handleRefresh} />

      {confirmState?.step === 1 && (
        <ConfirmModal isOpen
          title={confirmState.room.is_occupied ? 'Delete Occupied Room?' : `Delete Room ${confirmState.room.number}?`}
          message={confirmState.room.is_occupied
            ? `Room ${confirmState.room.number} is currently occupied by ${confirmState.room.tenant_name}.`
            : `Are you sure you want to delete Room ${confirmState.room.number}?`}
          subMessage={confirmState.room.is_occupied ? 'This will permanently remove the tenant and all billing history.' : undefined}
          confirmLabel={confirmState.room.is_occupied ? 'Continue' : 'Delete'}
          onConfirm={handleConfirmStep}
          onCancel={() => setConfirmState(null)}
        />
      )}
      {confirmState?.step === 2 && (
        <ConfirmModal isOpen
          title="Final Confirmation"
          message={`Permanently delete Room ${confirmState.room.number} and all its data?`}
          subMessage="This action cannot be undone."
          confirmLabel="Yes, Delete"
          onConfirm={handleConfirmStep}
          onCancel={() => setConfirmState(null)}
        />
      )}

      <StatusToggleModal room={toggleRoom} isOpen={!!toggleRoom} onClose={() => setToggleRoom(null)} onRefresh={handleToggleRefresh} />
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} propertyId={propertyId} />
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────
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
      {isPending && (
        <span style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', width: 9, height: 9, borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 6px var(--warning)', display: 'inline-block' }} title="Rent pending this month" />
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
        <span style={{ fontSize: '0.82rem', color: 'var(--primary-light)', fontWeight: 500 }}>View Details →</span>
      </div>
      <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={onToggleStatus} title={isOccupied ? 'Mark as Vacant' : 'Mark as Occupied'}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem', borderRadius: '8px', cursor: 'pointer', border: `1px solid ${isOccupied ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, background: isOccupied ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)', color: isOccupied ? 'var(--danger)' : 'var(--success)', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {isOccupied ? <><ToggleRight size={16} /> Mark as Vacant</> : <><ToggleLeft size={16} /> Mark as Occupied</>}
        </button>
        <button onClick={onDelete} title={isOccupied ? 'Delete room (tenant will also be removed)' : 'Delete this room'}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.4rem', height: '2.4rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.07)', color: 'var(--danger)', fontFamily: 'inherit', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
