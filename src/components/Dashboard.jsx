import React from 'react';
import { DollarSign, Zap, Droplets, Home } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = ({ totals, rooms }) => {
  const chartData = rooms.map(room => ({
    name: room.number,
    Revenue: room.isOccupied ? room.rent + room.other : 0,
    Bills: room.isOccupied ? room.electric + room.water : 0,
  }));

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-6">Financial Overview</h2>
      
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <span className="stat-title">Total Monthly Revenue</span>
          <div className="stat-value text-gradient">
            <DollarSign size={28} />
            {totals.totalRevenue}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Total Electricity</span>
          <div className="stat-value text-warning">
            <Zap size={28} />
            ${totals.totalElectric}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Total Water</span>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            <Droplets size={28} />
            ${totals.totalWater}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <span className="stat-title">Occupancy</span>
          <div className="stat-value text-main">
            <Home size={28} />
            {totals.occupiedRooms} / {rooms.length}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6" style={{ height: '300px' }}>
        <h3 className="text-lg font-medium mb-4 text-muted">Revenue & Bills by Room</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Bar dataKey="Revenue" fill="#818cf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Bills" fill="#ec4899" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
