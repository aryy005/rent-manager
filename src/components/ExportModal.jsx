import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { X, Download, FileSpreadsheet, FileText, CheckSquare, Square, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from '../utils/toast';
import { formatINR, getMonthName } from '../utils/helpers';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ExportModal({ isOpen, onClose }) {
  const [loading,     setLoading]     = useState(false);
  const [format,      setFormat]      = useState('xlsx');   // 'xlsx' | 'csv'
  const [inclHistory, setInclHistory] = useState(false);    // past tenants
  const [inclBills,   setInclBills]   = useState(true);     // bill history per tenant
  const [inclUnpaid,  setInclUnpaid]  = useState(true);     // include unpaid bills

  if (!isOpen) return null;

  // ── Data fetch + export ──────────────────────────────────────────────────────

  const handleExport = async () => {
    setLoading(true);
    try {
      const rooms = await api.getRooms();

      // Fetch all tenants + bills per room in parallel
      const roomDetails = await Promise.all(
        rooms.map(async room => {
          const [tenants, bills] = await Promise.all([
            api.getRoomTenantHistory(room.id),
            api.getRoomBills(room.id),
          ]);
          return { room, tenants, bills };
        })
      );

      if (format === 'xlsx') {
        exportXLSX(roomDetails, { inclHistory, inclBills, inclUnpaid });
      } else {
        exportCSV(roomDetails, { inclHistory, inclBills, inclUnpaid });
      }
      toast.success('Export downloaded successfully!');
      onClose();
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={20} style={{ color: 'var(--primary-light)' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Export Data</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

          {/* Format selector */}
          <div>
            <div className="stat-label" style={{ marginBottom: '0.6rem' }}>Export Format</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { val: 'xlsx', label: '📊 Excel (.xlsx)', sub: 'Multiple sheets, rich formatting' },
                { val: 'csv',  label: '📄 CSV (.csv)',    sub: 'Simple, opens in any app' },
              ].map(f => (
                <button
                  key={f.val}
                  onClick={() => setFormat(f.val)}
                  style={{
                    flex: 1, padding: '0.7rem 0.85rem', borderRadius: '10px', cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.2s',
                    border: `1.5px solid ${format === f.val ? 'var(--primary-light)' : 'var(--border)'}`,
                    background: format === f.val ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>{f.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* What to include */}
          <div>
            <div className="stat-label" style={{ marginBottom: '0.6rem' }}>What to Include</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Current tenants always included */}
              <OptionRow
                checked={true}
                disabled={true}
                label="Current Tenants"
                sub="Name, Aadhar, mobile, base rent, move-in date (always included)"
              />
              <OptionRow
                checked={inclBills}
                onChange={() => setInclBills(v => !v)}
                label="Bill & Payment History"
                sub="All monthly bills with amounts and paid/unpaid status"
              />
              {inclBills && (
                <div style={{ marginLeft: '1.5rem' }}>
                  <OptionRow
                    checked={inclUnpaid}
                    onChange={() => setInclUnpaid(v => !v)}
                    label="Include Unpaid Bills"
                    sub="Also export bills that haven't been paid yet"
                    small
                  />
                </div>
              )}
              <OptionRow
                checked={inclHistory}
                onChange={() => setInclHistory(v => !v)}
                label="Past Tenant History"
                sub="Previous tenants who have moved out of each room"
              />
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid var(--border)', fontSize: '0.83rem', color: 'var(--text-sub)' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              {format === 'xlsx' ? '📊 Excel will contain:' : '📄 CSV will contain:'}
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
              <li>Sheet 1 — <strong>Room Summary</strong> (all 8 rooms, status, rent)</li>
              <li>Sheet 2 — <strong>Current Tenants</strong> (name, Aadhar, mobile, total paid)</li>
              {inclBills && <li>Sheet 3 — <strong>Bill Records</strong> ({inclUnpaid ? 'paid + unpaid' : 'paid only'})</li>}
              {inclHistory && <li>Sheet {inclBills ? 4 : 3} — <strong>Tenant History</strong> (all past tenants)</li>}
            </ul>
            {format === 'csv' && (
              <div style={{ marginTop: '0.5rem', color: 'var(--warning)', fontSize: '0.78rem' }}>
                ⚠ CSV exports all sheets merged into one file
              </div>
            )}
          </div>

          {/* Export button */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', justifyContent: 'center' }}
            onClick={handleExport}
            disabled={loading}
          >
            {loading
              ? <><Loader2 size={17} className="spin" /> Preparing export…</>
              : <><Download size={17} /> Export {format === 'xlsx' ? 'Excel' : 'CSV'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Option toggle row ──────────────────────────────────────────────────────────

function OptionRow({ checked, onChange, disabled, label, sub, small }) {
  const Icon = checked ? CheckSquare : Square;
  return (
    <div
      onClick={!disabled ? onChange : undefined}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
        padding: small ? '0.4rem 0.6rem' : '0.55rem 0.7rem',
        borderRadius: '8px', cursor: disabled ? 'default' : 'pointer',
        background: checked ? 'rgba(99,102,241,0.07)' : 'transparent',
        border: `1px solid ${checked ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
        transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
      }}
    >
      <Icon size={small ? 15 : 17} style={{ color: checked ? 'var(--primary-light)' : 'var(--text-muted)', marginTop: 1, flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 600, fontSize: small ? '0.82rem' : '0.88rem' }}>{label}</div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{sub}</div>
      </div>
    </div>
  );
}

// ── XLSX Export ────────────────────────────────────────────────────────────────

function exportXLSX(roomDetails, { inclHistory, inclBills, inclUnpaid }) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Room Summary ──────────────────────────────────────────────────
  const summaryRows = roomDetails.map(({ room }) => ({
    'Room No.':    room.number,
    'Status':      room.is_occupied ? 'Occupied' : 'Vacant',
    'Tenant Name': room.tenant_name || '—',
    'Aadhar No.':  room.tenant_aadhar || '—',
    'Mobile':      room.tenant_mobile || '—',
    'Base Rent':   room.base_rent,
    'Move-in Date': room.moved_in_at ? new Date(room.moved_in_at).toLocaleDateString('en-IN') : '—',
  }));
  const ws1 = XLSX.utils.json_to_sheet(summaryRows);
  setColWidths(ws1, [10, 12, 22, 16, 14, 12, 16]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Room Summary');

  // ── Sheet 2: Current Tenants ───────────────────────────────────────────────
  const currentRows = [];
  for (const { room, tenants, bills } of roomDetails) {
    if (!room.is_occupied) continue;
    const current = tenants.find(t => t.is_current);
    if (!current) continue;
    const paidBills   = bills.filter(b => b.is_paid);
    const totalPaid   = paidBills.reduce((s, b) => s + b.rent + b.electric + b.water + b.other, 0);
    const totalRent   = paidBills.reduce((s, b) => s + b.rent, 0);
    const totalElec   = paidBills.reduce((s, b) => s + b.electric, 0);
    const totalWater  = paidBills.reduce((s, b) => s + b.water, 0);
    const totalOther  = paidBills.reduce((s, b) => s + b.other, 0);
    currentRows.push({
      'Room No.':       room.number,
      'Full Name':      current.name,
      'Aadhar No.':     current.aadhar,
      'Mobile':         current.mobile,
      'Base Rent (₹)':  room.base_rent,
      'Move-in Date':   new Date(current.moved_in_at).toLocaleDateString('en-IN'),
      'Months Paid':    paidBills.length,
      'Total Rent (₹)': totalRent,
      'Electric (₹)':   totalElec,
      'Water (₹)':      totalWater,
      'Other (₹)':      totalOther,
      'Grand Total (₹)':totalPaid,
    });
  }
  const ws2 = XLSX.utils.json_to_sheet(currentRows);
  setColWidths(ws2, [10, 22, 16, 14, 14, 14, 13, 15, 13, 12, 12, 15]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Current Tenants');

  // ── Sheet 3: Bill Records ──────────────────────────────────────────────────
  if (inclBills) {
    const billRows = [];
    for (const { room, tenants, bills } of roomDetails) {
      for (const b of bills) {
        if (!inclUnpaid && !b.is_paid) continue;
        const tenant = tenants.find(t => t.id === b.tenant_id);
        billRows.push({
          'Room No.':    room.number,
          'Tenant Name': tenant?.name || '—',
          'Month':       MONTHS[b.month - 1],
          'Year':        b.year,
          'Rent (₹)':    b.rent,
          'Electric (₹)':b.electric,
          'Water (₹)':   b.water,
          'Other (₹)':   b.other,
          'Total (₹)':   b.rent + b.electric + b.water + b.other,
          'Status':      b.is_paid ? 'Paid' : 'Unpaid',
          'Paid On':     b.paid_at ? new Date(b.paid_at).toLocaleDateString('en-IN') : '—',
        });
      }
    }
    // Sort by room then year/month desc
    billRows.sort((a, b) => Number(a['Room No.']) - Number(b['Room No.']) || b['Year'] - a['Year'] || MONTHS.indexOf(b['Month']) - MONTHS.indexOf(a['Month']));
    const ws3 = XLSX.utils.json_to_sheet(billRows);
    setColWidths(ws3, [10, 22, 8, 7, 12, 13, 12, 12, 12, 10, 14]);
    XLSX.utils.book_append_sheet(wb, ws3, 'Bill Records');
  }

  // ── Sheet 4: Tenant History ────────────────────────────────────────────────
  if (inclHistory) {
    const histRows = [];
    for (const { room, tenants, bills } of roomDetails) {
      for (const t of tenants) {
        const tBills    = bills.filter(b => b.tenant_id === t.id && b.is_paid);
        const totalPaid = tBills.reduce((s, b) => s + b.rent + b.electric + b.water + b.other, 0);
        histRows.push({
          'Room No.':       room.number,
          'Name':           t.name,
          'Aadhar No.':     t.aadhar,
          'Mobile':         t.mobile,
          'Move-in Date':   new Date(t.moved_in_at).toLocaleDateString('en-IN'),
          'Move-out Date':  t.moved_out_at ? new Date(t.moved_out_at).toLocaleDateString('en-IN') : 'Currently Living',
          'Status':         t.is_current ? 'Current' : 'Past',
          'Total Paid (₹)': totalPaid,
        });
      }
    }
    const ws4 = XLSX.utils.json_to_sheet(histRows);
    setColWidths(ws4, [10, 22, 16, 14, 14, 18, 10, 14]);
    XLSX.utils.book_append_sheet(wb, ws4, 'Tenant History');
  }

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `RentMaster_Export_${date}.xlsx`);
}

// ── CSV Export ─────────────────────────────────────────────────────────────────

function exportCSV(roomDetails, opts) {
  // For CSV, just export current tenants + optionally bills/history merged
  const rows = [];

  rows.push(['=== CURRENT TENANTS ===']);
  rows.push(['Room','Name','Aadhar','Mobile','Base Rent','Move-in Date','Total Paid (₹)','Months Paid']);
  for (const { room, tenants, bills } of roomDetails) {
    if (!room.is_occupied) continue;
    const t = tenants.find(t => t.is_current);
    if (!t) continue;
    const paidBills = bills.filter(b => b.is_paid);
    const totalPaid = paidBills.reduce((s,b) => s + b.rent + b.electric + b.water + b.other, 0);
    rows.push([room.number, t.name, t.aadhar, t.mobile, room.base_rent,
      new Date(t.moved_in_at).toLocaleDateString('en-IN'), totalPaid, paidBills.length]);
  }

  if (opts.inclBills) {
    rows.push([]); rows.push(['=== BILL RECORDS ===']);
    rows.push(['Room','Tenant','Month','Year','Rent','Electric','Water','Other','Total','Status','Paid On']);
    for (const { room, tenants, bills } of roomDetails) {
      for (const b of bills) {
        if (!opts.inclUnpaid && !b.is_paid) continue;
        const t = tenants.find(t => t.id === b.tenant_id);
        rows.push([room.number, t?.name||'—', MONTHS[b.month-1], b.year, b.rent, b.electric, b.water, b.other,
          b.rent+b.electric+b.water+b.other, b.is_paid?'Paid':'Unpaid',
          b.paid_at ? new Date(b.paid_at).toLocaleDateString('en-IN') : '—']);
      }
    }
  }

  if (opts.inclHistory) {
    rows.push([]); rows.push(['=== TENANT HISTORY ===']);
    rows.push(['Room','Name','Aadhar','Mobile','Move-in','Move-out','Status','Total Paid']);
    for (const { room, tenants, bills } of roomDetails) {
      for (const t of tenants) {
        const tBills = bills.filter(b => b.tenant_id === t.id && b.is_paid);
        const total  = tBills.reduce((s,b) => s + b.rent + b.electric + b.water + b.other, 0);
        rows.push([room.number, t.name, t.aadhar, t.mobile,
          new Date(t.moved_in_at).toLocaleDateString('en-IN'),
          t.moved_out_at ? new Date(t.moved_out_at).toLocaleDateString('en-IN') : 'Currently Living',
          t.is_current ? 'Current' : 'Past', total]);
      }
    }
  }

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `RentMaster_Export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helper: set column widths ─────────────────────────────────────────────────
function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}
