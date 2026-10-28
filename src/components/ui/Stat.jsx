export default function Stat({ label, value, sub, className = '', accent = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        accent ? 'border-accent/25 bg-accentSoft/40' : 'border-line bg-surface'
      } shadow-card ${className}`}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
        {label}
      </div>
      <div
        className={`num mt-2 text-[26px] font-bold leading-none tracking-tight ${
          accent ? 'text-accent' : 'text-ink'
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs leading-snug text-ink-3">{sub}</div>}
    </div>
  );
}
