import { Inbox } from 'lucide-react';

export default function Empty({ icon: Icon = Inbox, title, sub, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center ${className}`}
    >
      <div className="rounded-2xl bg-surface2 p-3 text-ink-3">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-2">{title}</p>
      {sub && <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-3">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
