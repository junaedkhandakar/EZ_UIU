import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Sparkles, AlertCircle, Award } from 'lucide-react';

/** Catmull-Rom → cubic bezier smooth path */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M ${pts[0][0]},${pts[0][1]} L ${pts[1][0]},${pts[1][1]}`;
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

export default function GradeChart({ history = [] }) {
  const [hover, setHover] = useState(null);
  const [showHonorsThresholds, setShowHonorsThresholds] = useState(true);

  const layout = useMemo(() => {
    const n = history.length;
    const W = Math.max(580, n * 96);
    const H = 270;
    const m = { top: 32, right: 28, bottom: 34, left: 36 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const x = (i) => (n === 1 ? m.left + iw / 2 : m.left + (i / (n - 1)) * iw);
    const y = (v) => m.top + ih - (Math.min(v, 4) / 4) * ih;

    const cumPts = history.map((h, i) => [x(i), y(h.cumulativeCGPA)]);
    const termPts = history.map((h, i) => [x(i), y(h.gpa)]);

    const cumLine = smoothPath(cumPts);
    const termLine = smoothPath(termPts);
    const area =
      cumPts.length > 1
        ? `${cumLine} L ${cumPts[cumPts.length - 1][0]},${m.top + ih} L ${cumPts[0][0]},${m.top + ih} Z`
        : '';

    return { W, H, m, ih, x, y, cumPts, termPts, cumLine, termLine, area };
  }, [history]);

  if (!history.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-line text-sm text-ink-3">
        Grade a few courses to see your progression graph.
      </div>
    );
  }

  const { W, H, m, ih, x, y, cumPts, termPts, cumLine, termLine, area } = layout;
  const last = history[history.length - 1];
  const maxGpa = Math.max(...history.map((h) => h.gpa));
  const minGpa = Math.min(...history.map((h) => h.gpa));

  return (
    <div className="relative flex flex-col gap-3">
      {/* Chart Top Controls */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-accent">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            CGPA Curve
          </span>
          <span className="flex items-center gap-1.5 text-ink-3">
            <span className="h-0.5 w-3 rounded-full bg-ink-3" />
            Term GPA
          </span>
        </div>
        <button
          onClick={() => setShowHonorsThresholds(!showHonorsThresholds)}
          className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
            showHonorsThresholds
              ? 'border-accent/40 bg-accentSoft text-accent'
              : 'border-line bg-surface2 text-ink-3'
          }`}
        >
          <Award className="h-3 w-3" />
          Honors Lines {showHonorsThresholds ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="relative overflow-x-auto rounded-xl">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[580px]"
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="CGPA progression chart"
        >
          <defs>
            <linearGradient id="neonGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-2)" />
            </linearGradient>
            <linearGradient id="cgAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="80%" stopColor="var(--accent)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Gridlines */}
          {[1.0, 2.0, 3.0, 4.0].map((v) => (
            <g key={v}>
              <line
                x1={m.left}
                x2={W - m.right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--border)"
                strokeDasharray="4 6"
              />
              <text
                x={m.left - 10}
                y={y(v) + 3.5}
                textAnchor="end"
                className="num fill-[var(--text-3)] text-[10.5px] font-medium"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Honors Threshold Lines */}
          {showHonorsThresholds && (
            <>
              {/* Summa 3.90 */}
              <line
                x1={m.left}
                x2={W - m.right}
                y1={y(3.90)}
                y2={y(3.90)}
                stroke="#a855f7"
                strokeOpacity="0.45"
                strokeDasharray="2 4"
              />
              <text
                x={W - m.right}
                y={y(3.90) - 4}
                textAnchor="end"
                className="fill-purple-400 text-[8.5px] font-bold tracking-wider"
              >
                SUMMA 3.90
              </text>

              {/* Magna 3.80 */}
              <line
                x1={m.left}
                x2={W - m.right}
                y1={y(3.80)}
                y2={y(3.80)}
                stroke="#38bdf8"
                strokeOpacity="0.45"
                strokeDasharray="2 4"
              />
              <text
                x={W - m.right}
                y={y(3.80) - 4}
                textAnchor="end"
                className="fill-sky-400 text-[8.5px] font-bold tracking-wider"
              >
                MAGNA 3.80
              </text>

              {/* Cum Laude 3.75 */}
              <line
                x1={m.left}
                x2={W - m.right}
                y1={y(3.75)}
                y2={y(3.75)}
                stroke="#34d399"
                strokeOpacity="0.45"
                strokeDasharray="2 4"
              />
              <text
                x={W - m.right}
                y={y(3.75) - 4}
                textAnchor="end"
                className="fill-emerald-400 text-[8.5px] font-bold tracking-wider"
              >
                CUM LAUDE 3.75
              </text>
            </>
          )}

          {/* Probation Threshold */}
          <line
            x1={m.left}
            x2={W - m.right}
            y1={y(2.0)}
            y2={y(2.0)}
            stroke="var(--bad)"
            strokeOpacity="0.5"
            strokeDasharray="4 4"
          />
          <text
            x={W - m.right}
            y={y(2.0) - 4}
            textAnchor="end"
            className="fill-[var(--bad)] text-[8.5px] font-bold tracking-wider"
            opacity="0.85"
          >
            PROBATION 2.00
          </text>

          {/* X axis labels */}
          {history.map((h, i) => (
            <text
              key={h.trimester}
              x={x(i)}
              y={H - 10}
              textAnchor="middle"
              className={`num text-[10.5px] font-bold transition-colors ${
                hover === i ? 'fill-[var(--text)]' : 'fill-[var(--text-3)]'
              }`}
            >
              {h.trimester}
            </text>
          ))}

          {/* Area under curve */}
          {area && (
            <motion.path
              d={area}
              fill="url(#cgAreaGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Term GPA dashed line */}
          <motion.path
            d={termLine}
            fill="none"
            stroke="var(--text-3)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.55"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* CGPA Neon Gradient Line with animated draw */}
          <motion.path
            d={cumLine}
            fill="none"
            stroke="url(#neonGlow)"
            strokeWidth="3.2"
            strokeLinecap="round"
            filter="url(#lineGlow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Hover Crosshair */}
          {hover != null && (
            <motion.line
              x1={x(hover)}
              x2={x(hover)}
              y1={m.top}
              y2={m.top + ih}
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
            />
          )}

          {/* Data Points */}
          {termPts.map((p, i) => (
            <circle
              key={`t${i}`}
              cx={p[0]}
              cy={p[1]}
              r={hover === i ? 4 : 2.5}
              fill="var(--surface)"
              stroke="var(--text-3)"
              strokeWidth="1.5"
            />
          ))}

          {cumPts.map((p, i) => {
            const isHovered = hover === i;
            return (
              <g key={`c${i}`}>
                {isHovered && (
                  <circle
                    cx={p[0]}
                    cy={p[1]}
                    r={9}
                    fill="var(--accent)"
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r={isHovered ? 6 : 4}
                  fill="var(--surface)"
                  stroke="url(#neonGlow)"
                  strokeWidth="2.8"
                />
              </g>
            );
          })}

          {/* Hover Detection Columns */}
          {history.map((h, i) => (
            <rect
              key={`h${i}`}
              x={x(i) - (W - m.left - m.right) / (2 * Math.max(1, history.length - 1))}
              y={m.top}
              width={(W - m.left - m.right) / Math.max(1, history.length - 1)}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {/* Floating Glass Tooltip */}
        {hover != null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass pointer-events-none absolute top-3 z-20 min-w-[160px] -translate-x-1/2 rounded-xl border border-line-specular p-3 shadow-pop"
            style={{
              left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`,
            }}
          >
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                Term {history[hover].trimester}
              </span>
              <span className="num text-[11px] font-semibold text-ink-3">
                {history[hover].credits} credits
              </span>
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-ink-2">Term GPA:</span>
                <span className="num font-bold text-ink">{history[hover].gpa.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-ink-2">Cumulative CGPA:</span>
                <span className="num font-extrabold text-accent">
                  {history[hover].cumulativeCGPA.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2.5 text-xs text-ink-3">
        <div className="flex items-center gap-3">
          <span>
            Highest GPA: <b className="num text-ink">{maxGpa.toFixed(2)}</b>
          </span>
          <span>
            Lowest GPA: <b className="num text-ink">{minGpa.toFixed(2)}</b>
          </span>
          <span>
            Current CGPA: <b className="num text-accent">{last.cumulativeCGPA.toFixed(2)}</b>
          </span>
        </div>
        <span className="text-[11px]">Hover over graph points for full trimester details</span>
      </div>
    </div>
  );
}
