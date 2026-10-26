import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div className={`relative w-full ${maxWidth} glass-panel bg-white/95 dark:bg-[#1c1c1e]/95 rounded-3xl shadow-2xl border border-black/[0.08] dark:border-white/[0.12] overflow-hidden transform animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
