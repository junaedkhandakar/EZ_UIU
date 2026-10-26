import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast, removeToast }}>
      {children}
      {/* Toast Container - Apple floating capsule */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => {
          let Icon = Info;
          let colorClass = 'text-blue-500 bg-blue-500/10 border-blue-500/20';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            colorClass = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel shadow-apple-lg border border-black/[0.08] dark:border-white/[0.12] transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl border ${colorClass} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
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
