import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Pill tab bar with a sliding indicator.
 * tabs: [{ value, label, icon?, badge? }]
 */
export default function Tabs({ tabs, value, onChange, className = '' }) {
  const refs = useRef({});
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });

  const measure = (val) => {
    const el = refs.current[val];
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  };

  useLayoutEffect(() => measure(value), [value, tabs.length]);

  useEffect(() => {
    const onResize = () => measure(value);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [value]);

  return (
    <div
      className={`no-scrollbar relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-surface2/60 p-1 ${className}`}
    >
      {ind.ready && (
        <div
          className="absolute bottom-1 top-1 rounded-xl border border-line bg-surface shadow-sm transition-[left,width] duration-200 ease-out"
          style={{ left: ind.left, width: ind.width }}
        />
      )}
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[t.value] = el;
            }}
            onClick={() => onChange(t.value)}
            className={`relative z-10 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-medium transition-colors duration-150 ${
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            {t.icon && <t.icon className="h-3.5 w-3.5" strokeWidth={2.2} />}
            {t.label}
            {t.badge != null && (
              <span
                className={`num rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  active ? 'bg-accentSoft text-accent' : 'bg-surface text-ink-3'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
