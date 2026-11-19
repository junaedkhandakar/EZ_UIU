import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { type, control } from './tokens';

/**
 * The one modal in the app.
 *
 * Renders through a portal so it always sits above the sticky sidebar and
 * the mobile tab bar, and traps scroll on the page behind it.
 */
export default function Modal({ open, onClose, title, sub, width = 'max-w-lg', children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div className="fade-in absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`slide-up-in relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl ${width}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className={type.sectionTitle}>{title}</h2>
            {sub && <p className={`${type.small} mt-0.5`}>{sub}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`${control.iconButton} -mr-1 shrink-0`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
