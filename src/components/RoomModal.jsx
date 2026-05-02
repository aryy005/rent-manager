import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const RoomModal = ({ room, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(room);

  useEffect(() => {
    if (room) {
      setFormData(room);
    }
  }, [room]);

  if (!isOpen || !room) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        <div className="modal-header">
          <h3 className="text-xl font-semibold">Edit Room {room.number}</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group flex items-center gap-2 mb-6">
              <input 
                type="checkbox" 
                id="isOccupied" 
                name="isOccupied"
                checked={formData.isOccupied}
                onChange={handleChange}
                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="isOccupied" className="font-medium text-main">Room is Occupied</label>
            </div>

            {formData.isOccupied && (
              <>
                <div className="form-group">
                  <label className="form-label">Tenant Name</label>
                  <input 
                    type="text" 
                    name="tenant" 
                    value={formData.tenant} 
                    onChange={handleChange} 
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label">Base Rent ($)</label>
                    <input 
                      type="number" 
                      name="rent" 
                      value={formData.rent} 
                      onChange={handleChange} 
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Electric Bill ($)</label>
                    <input 
                      type="number" 
                      name="electric" 
                      value={formData.electric} 
                      onChange={handleChange} 
                      className="form-input"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Water Bill ($)</label>
                    <input 
                      type="number" 
                      name="water" 
                      value={formData.water} 
                      onChange={handleChange} 
                      className="form-input"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Other Fees ($)</label>
                    <input 
                      type="number" 
                      name="other" 
                      value={formData.other} 
                      onChange={handleChange} 
                      className="form-input"
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}
            
            {!formData.isOccupied && (
              <div className="p-4 bg-black bg-opacity-20 rounded-lg text-muted text-sm border border-glass-border">
                Marking a room as vacant will hide tenant details. To input billing data, please mark the room as occupied first.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
