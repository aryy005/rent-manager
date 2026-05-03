import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * ConfirmModal — replaces window.confirm() with a styled, mobile-friendly dialog.
 *
 * Props:
 *  isOpen     bool
 *  title      string
 *  message    string
 *  subMessage string  (optional, shown smaller below message)
 *  confirmLabel string (default "Delete")
 *  danger     bool    (red confirm button, default true)
 *  onConfirm  fn
 *  onCancel   fn
 */
export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message,
  subMessage,
  confirmLabel = 'Delete',
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface, #1a1d2e)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem 1.75rem',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          animation: 'modalIn 0.2s ease',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '3rem', height: '3rem', borderRadius: '50%',
          background: danger ? 'rgba(239,68,68,0.15)' : 'rgba(250,204,21,0.15)',
          border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(250,204,21,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
        }}>
          {danger
            ? <Trash2 size={20} color="var(--danger, #ef4444)" />
            : <AlertTriangle size={20} color="#facc15" />}
        </div>

        {/* Title */}
        <div style={{
          fontSize: '1.1rem', fontWeight: 700,
          color: 'var(--text-primary, #f1f5f9)',
          marginBottom: '0.5rem',
        }}>
          {title}
        </div>

        {/* Message */}
        {message && (
          <div style={{
            fontSize: '0.9rem', color: 'var(--text-muted, #94a3b8)',
            lineHeight: 1.6, marginBottom: subMessage ? '0.5rem' : '1.75rem',
          }}>
            {message}
          </div>
        )}

        {/* Sub message (for second-step warnings) */}
        {subMessage && (
          <div style={{
            fontSize: '0.82rem',
            color: danger ? 'var(--danger, #ef4444)' : '#facc15',
            background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(250,204,21,0.08)',
            border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : 'rgba(250,204,21,0.2)'}`,
            borderRadius: '8px', padding: '0.6rem 0.8rem',
            marginBottom: '1.75rem', lineHeight: 1.5,
          }}>
            {subMessage}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '0.75rem',
              borderRadius: '10px', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '0.95rem', fontWeight: 600,
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '0.75rem',
              borderRadius: '10px', cursor: 'pointer',
              border: `1px solid ${danger ? 'rgba(239,68,68,0.4)' : 'rgba(250,204,21,0.4)'}`,
              background: danger ? 'rgba(239,68,68,0.18)' : 'rgba(250,204,21,0.18)',
              color: danger ? 'var(--danger, #ef4444)' : '#facc15',
              fontSize: '0.95rem', fontWeight: 700,
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
