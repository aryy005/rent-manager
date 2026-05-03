import React from 'react';
import { MessageCircle } from 'lucide-react';
import { formatINR, getMonthName } from '../utils/helpers';

/**
 * WhatsApp reminder button.
 * Opens wa.me with a pre-filled message about pending rent.
 */
export default function WhatsAppButton({ room, year, month, total }) {
  const handleClick = (e) => {
    e.stopPropagation();
    const mobile = room.tenant_mobile?.replace(/\D/g, '');
    if (!mobile) return;
    const msg = encodeURIComponent(
      `Hello ${room.tenant_name}, this is a gentle reminder that your rent for *${getMonthName(month)} ${year}* is pending.\n\n` +
      `🏠 Room No: *${room.room_number || room.number}*\n` +
      `💰 Amount Due: *${formatINR(total || room.base_rent)}*\n\n` +
      `Please make the payment at your earliest convenience. Thank you! 🙏`
    );
    const num = mobile.length === 10 ? `91${mobile}` : mobile;
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      title="Send WhatsApp reminder"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
        border: '1px solid rgba(37,211,102,0.35)',
        background: 'rgba(37,211,102,0.1)',
        color: '#25d366',
        fontSize: '0.8rem', fontWeight: 600,
        fontFamily: 'inherit', transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.1)'}
    >
      <MessageCircle size={14} />
      Remind
    </button>
  );
}
