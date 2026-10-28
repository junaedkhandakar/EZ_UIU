export default function Surface({ className = '', hover = false, children, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-card ${
        hover ? 'transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SurfaceHeader({ title, sub, right, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-5 pt-4 pb-3 ${className}`}>
      <div>
        <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-ink-3">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
