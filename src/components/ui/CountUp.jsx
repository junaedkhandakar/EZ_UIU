import { useEffect, useRef, useState } from 'react';

/**
 * Animated number that eases from its previous value to the next.
 * Respects prefers-reduced-motion.
 */
export default function CountUp({ value, decimals = 2, duration = 750, className = '' }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = prevRef.current;
    const to = Number(value) || 0;
    prevRef.current = to;

    if (reduce || from === to) {
      setDisplay(to);
      return undefined;
    }

    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(from + (to - from) * ease(p));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span className={`num ${className}`}>
      {Number(display).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
