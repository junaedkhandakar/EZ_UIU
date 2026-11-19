import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const TONES = {
  info: { Icon: Info, cls: 'text-accent bg-accentSoft' },
  success: { Icon: CheckCircle2, cls: 'text-ok bg-ok/10' },
  warning: { Icon: AlertTriangle, cls: 'text-warn bg-warn/10' },
  error: { Icon: AlertCircle, cls: 'text-bad bg-bad/10' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast, removeToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 lg:bottom-6 lg:right-6">
        {toasts.map((toast) => {
          const { Icon, cls } = TONES[toast.type] || TONES.info;
          return (
            <div
              key={toast.id}
              className="glass pointer-events-auto flex items-center gap-3 rounded-2xl border border-line p-3 shadow-pop slide-up-in"
            >
              <span className={`shrink-0 rounded-lg p-1.5 ${cls}`}>
                <Icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <p className="flex-1 text-[13px] font-medium leading-snug text-ink">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-1 text-ink-3 transition-colors hover:bg-surface2 hover:text-ink"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
