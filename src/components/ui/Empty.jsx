import React from 'react';
import { Inbox } from 'lucide-react';
import { type } from './tokens';

/**
 * The one empty state in the app.
 *
 * @param {Function} icon     leading icon component
 * @param {string} title      short headline
 * @param {string} sub        one or two lines of guidance
 * @param {ReactNode} action  optional call to action
 * @param {boolean} compact   tighter vertical rhythm
 */
export default function Empty({
  icon: Icon = Inbox,
  title,
  sub,
  action,
  compact = false,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center ${
        compact ? 'py-8' : ''
      } ${className}`}
    >
      <div className="rounded-xl bg-surface2 p-2.5 text-ink-3">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className={`mt-3 ${type.cardTitle} text-ink-2`}>{title}</p>
      {sub && <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-3">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
