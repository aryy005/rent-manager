import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Home, IndianRupee, Zap, Droplets, X } from 'lucide-react';
import { api } from '../utils/api';
import { formatINR, getMonthName, MONTH_NAMES } from '../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function StatsPanel({ isOpen, onClose, propertyId }) {
  const [filter, setFilter] = useState('monthly');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = filter === 'monthly' ? { year, month } : { year };
      const data = await api.getStats(propertyId, params);
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) fetchStats(); }, [isOpen, filter, year, month]);

  if (!isOpen) return null;

  const chartData = (stats?.monthlyBreakdown || []).map(b => ({
    label: `${getMonthName(b.month)} ${b.year}`,
    Rent: Math.round(b.rent),
    Electric: Math.round(b.electric),
    Water: Math.round(b.water),
    Other: Math.round(b.other),
  }));

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart2 size={22} className="text-primary" />
            Revenue Statistics
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Filter Bar */}
          <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
            <button className={`filter-pill ${filter === 'monthly' ? 'active' : ''}`} onClick={() => setFilter('monthly')}>Monthly</button>
            <button className={`filter-pill ${filter === 'yearly'  ? 'active' : ''}`} onClick={() => setFilter('yearly')}>Yearly</button>
            <select className="filter-select" value={year} onChange={e => setYear(Number(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {filter === 'monthly' && (
              <select className="filter-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            )}
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : stats ? (
            <>
              {/* Occupancy Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ padding: '1.1rem' }}>
                  <div className="stat-label">Total Rooms</div>
                  <div className="stat-value" style={{ fontSize: '1.6rem' }}>{stats.totalRooms}</div>
                </div>
                <div className="card" style={{ padding: '1.1rem' }}>
                  <div className="stat-label">Occupied</div>
                  <div className="stat-value text-success" style={{ fontSize: '1.6rem' }}>{stats.occupiedRooms}</div>
                </div>
                <div className="card" style={{ padding: '1.1rem' }}>
                  <div className="stat-label">Vacant</div>
                  <div className="stat-value text-danger" style={{ fontSize: '1.6rem' }}>{stats.vacantRooms}</div>
                </div>
                <div className="card" style={{ padding: '1.1rem' }}>
                  <div className="stat-label">Occupancy Rate</div>
                  <div className="stat-value text-primary" style={{ fontSize: '1.6rem' }}>
                    {stats.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Revenue Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <RevenueCard label="Total Revenue" value={stats.revenue.total} color="var(--primary-light)" icon={<IndianRupee size={18} />} big />
                <RevenueCard label="Rent Collected" value={stats.revenue.rent} color="var(--success)" icon={<Home size={18} />} />
                <RevenueCard label="Electric Bills" value={stats.revenue.electric} color="var(--warning)" icon={<Zap size={18} />} />
                <RevenueCard label="Water Bills" value={stats.revenue.water} color="var(--info)" icon={<Droplets size={18} />} />
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div className="stat-label" style={{ marginBottom: '0.75rem' }}>Last 12 Months Breakdown</div>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                        <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.85rem' }} />
                        <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
                        <Bar dataKey="Rent" fill="#6366f1" radius={[4,4,0,0]} stackId="a" />
                        <Bar dataKey="Electric" fill="#f59e0b" radius={[0,0,0,0]} stackId="a" />
                        <Bar dataKey="Water" fill="#38bdf8" radius={[0,0,0,0]} stackId="a" />
                        <Bar dataKey="Other" fill="#ec4899" radius={[4,4,0,0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RevenueCard({ label, value, color, icon, big }) {
  return (
    <div className="card" style={{ padding: '1.1rem' }}>
      <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <span style={{ color }}>{icon}</span> {label}
      </div>
      <div className="stat-value" style={{ fontSize: big ? '1.8rem' : '1.45rem', color }}>
        {formatINR(value)}
      </div>
    </div>
  );
}
