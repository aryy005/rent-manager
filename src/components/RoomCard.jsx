import React from 'react';
import { User, Zap, Droplets, DollarSign, MoreVertical } from 'lucide-react';

const RoomCard = ({ room, onEdit }) => {
  return (
    <div className="glass-panel room-card">
      <div className="room-header">
        <div className="room-number">
          Room {room.number}
        </div>
        <div className={`status-badge ${room.isOccupied ? 'status-occupied' : 'status-vacant'}`}>
          {room.isOccupied ? 'Occupied' : 'Vacant'}
        </div>
      </div>

      <div className="room-details">
        <div className="detail-row">
          <span className="detail-label"><User size={16} /> Tenant</span>
          <span className="font-medium">{room.isOccupied ? room.tenant : '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label"><DollarSign size={16} /> Base Rent</span>
          <span className="font-medium">${room.rent}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label text-warning"><Zap size={16} /> Electric</span>
          <span className="font-medium">${room.electric}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label" style={{ color: '#38bdf8' }}><Droplets size={16} /> Water</span>
          <span className="font-medium">${room.water}</span>
        </div>
        {room.other > 0 && (
          <div className="detail-row">
            <span className="detail-label text-muted"><MoreVertical size={16} /> Other Fees</span>
            <span className="font-medium">${room.other}</span>
          </div>
        )}
      </div>

      <button onClick={() => onEdit(room)} className="btn btn-outline" style={{ width: '100%' }}>
        Edit Details
      </button>
    </div>
  );
};

export default RoomCard;
