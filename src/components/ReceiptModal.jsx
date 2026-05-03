import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatINR, getMonthName } from '../utils/helpers';

/**
 * ReceiptModal — print-to-PDF rent receipt.
 * Props: bill, room, tenant, onClose
 */
export default function ReceiptModal({ bill, room, tenant, onClose }) {
  if (!bill || !room) return null;

  const total  = (bill.rent || 0) + (bill.electric || 0) + (bill.water || 0) + (bill.other || 0);
  const today  = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const paidOn = bill.paid_at ? new Date(bill.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : today;

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(#receipt-print-root) { display: none !important; }
          #receipt-print-root .no-print { display: none !important; }
          #receipt-print-root .receipt-card {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            max-width: 100% !important;
          }
          @page { margin: 1cm; size: A5; }
        }
      `}</style>

      <div id="receipt-print-root"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.25rem',
        }}
      >
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px' }}>
          {/* Action bar */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <button onClick={handlePrint} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.2rem', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
            }}>
              <Printer size={16} /> Print / Save PDF
            </button>
            <button onClick={onClose} style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={18} />
            </button>
          </div>

          {/* Receipt card */}
          <div className="receipt-card" style={{
            background: '#fff', color: '#1a1a2e', borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
            fontFamily: "'Outfit', sans-serif",
          }}>
            {/* Header stripe */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              padding: '1.5rem', color: '#fff',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', opacity: 0.8, marginBottom: '0.25rem' }}>
                RENT RECEIPT
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>RentMaster</div>
              <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '0.2rem' }}>Official Rent Payment Receipt</div>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Receipt meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#64748b' }}>
                <span>Receipt Date: <strong style={{ color: '#1a1a2e' }}>{paidOn}</strong></span>
                <span>For: <strong style={{ color: '#1a1a2e' }}>{getMonthName(bill.month)} {bill.year}</strong></span>
              </div>

              {/* Tenant info */}
              <div style={{
                background: '#f8faff', borderRadius: '10px', padding: '1rem',
                border: '1px solid #e2e8f0', marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>TENANT DETAILS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div><span style={{ color: '#64748b' }}>Name: </span><strong>{tenant?.name || room.tenant_name || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Mobile: </span><strong>{tenant?.mobile || room.tenant_mobile || '—'}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Room No: </span><strong>{room.number}</strong></div>
                  <div><span style={{ color: '#64748b' }}>Aadhar: </span><strong>{tenant?.aadhar ? `XXXX XXXX ${tenant.aadhar.slice(-4)}` : '—'}</strong></div>
                </div>
              </div>

              {/* Bill breakdown */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>CHARGES BREAKDOWN</div>
                {[
                  { label: 'Base Rent',         value: bill.rent,     always: true },
                  { label: 'Electricity Charge', value: bill.electric, always: false },
                  { label: 'Water Charge',       value: bill.water,    always: false },
                  { label: 'Other Charges',      value: bill.other,    always: false },
                ].filter(r => r.always || r.value > 0).map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '0.5rem 0', borderBottom: '1px dashed #e2e8f0',
                    fontSize: '0.9rem',
                  }}>
                    <span>{row.label}</span>
                    <strong>{formatINR(row.value)}</strong>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.06))',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '10px', padding: '1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total Paid</span>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#6366f1' }}>{formatINR(total)}</span>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                ✅ Payment received in full · Generated by RentMaster
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
