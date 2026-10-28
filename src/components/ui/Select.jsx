export default function Select({ className = '', children, ...rest }) {
  return (
    <div className={`relative ${className}`}>
      <select
        className="h-9.5 w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface2/70 py-2 pl-3 pr-8 text-[13px] font-medium text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}

export function SelectSm({ className = '', children, ...rest }) {
  return (
    <div className={`relative ${className}`}>
      <select
        className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface2/70 py-1 pl-2.5 pr-7 text-xs font-semibold text-ink transition-colors hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-3"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}
