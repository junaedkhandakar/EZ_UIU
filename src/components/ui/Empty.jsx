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
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface2/25 text-center ${
        compact ? 'px-6 py-8' : 'px-6 py-12'
      } ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-ink-3">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <p className={`mt-3 ${type.cardTitle}`}>{title}</p>
      {sub && <p className={`${type.small} mt-1 max-w-sm`}>{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
