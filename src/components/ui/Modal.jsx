import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="fade-in absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`slide-up-in relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-pop sm:rounded-3xl ${width}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
            {sub && <p className="mt-0.5 text-xs text-ink-3">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-surface2 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(92dvh-64px)] overflow-y-auto overscroll-contain p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
