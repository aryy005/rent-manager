import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToasts } from '../utils/toast';

export default function ToastContainer() {
  const toasts = useToasts();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
