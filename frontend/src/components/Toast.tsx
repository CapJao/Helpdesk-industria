import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div className="toast-wrapper">
      {toasts.map((t) => {
        let icon = <Info size={18} color="var(--primary)" />;
        let borderColor = 'var(--border-light)';

        if (t.type === 'success') {
          icon = <CheckCircle size={18} color="var(--success-text)" />;
          borderColor = 'var(--success-border)';
        } else if (t.type === 'error') {
          icon = <AlertCircle size={18} color="var(--danger-text)" />;
          borderColor = 'var(--danger-border)';
        } else if (t.type === 'warning') {
          icon = <AlertTriangle size={18} color="var(--warning-text)" />;
          borderColor = 'var(--warning-border)';
        }

        return (
          <div key={t.id} className="toast-box" style={{ borderColor }}>
            <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div className="toast-title">{t.title}</div>
              <div className="toast-desc">{t.message}</div>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
