import { useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: { border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.1)', text: '#6ee7b7', icon: '#10b981' },
  error:   { border: 'rgba(239,68,68,0.3)',  bg: 'rgba(239,68,68,0.1)',  text: '#fca5a5', icon: '#ef4444' },
  info:    { border: 'rgba(99,102,241,0.3)', bg: 'rgba(99,102,241,0.1)', text: '#c4b5fd', icon: '#8b5cf6' },
  warning: { border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.1)', text: '#fcd34d', icon: '#f59e0b' },
};

function ToastItem({ id, message, type = 'info', onRemove }) {
  const Icon = ICONS[type] || Info;
  const c = COLORS[type] || COLORS.info;

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl border shadow-xl"
      style={{
        background: c.bg,
        borderColor: c.border,
        backdropFilter: 'blur(12px)',
        animation: 'toastIn 0.25s ease-out',
        minWidth: '280px',
        maxWidth: '380px',
      }}
    >
      <Icon style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} className="w-4 h-4" />
      <p className="flex-1 text-sm" style={{ color: c.text }}>{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: c.text }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Global state pattern — simple singleton for easy usage
let _toastId = 0;
let _setToasts = null;

export function useToast() {
  const [toasts, setToasts] = useState([]);
  _setToasts = setToasts;

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, removeToast };
}

export function toast(message, type = 'info', duration = 3500) {
  if (_setToasts) {
    const id = ++_toastId;
    _setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      _setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }
}

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem {...t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
