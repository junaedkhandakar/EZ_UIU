import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';

export default function Surface({
  className = '',
  hover = false,
  spotlight = true,
  children,
  ...rest
}) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!spotlight || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    if (!spotlight) return;
    setMousePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={hover ? { y: -2, transition: { type: 'spring', stiffness: 400, damping: 25 } } : undefined}
      className={`relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-lift ${className}`}
      {...rest}
    >
      {spotlight && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            opacity: mousePos.opacity,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, var(--accent-soft), transparent 80%)`,
          }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function SurfaceHeader({ title, sub, right, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-5 pb-3 pt-4 ${className}`}>
      <div>
        <h3 className="text-[15px] font-bold tracking-tight text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-ink-3">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
