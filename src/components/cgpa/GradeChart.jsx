import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertCircle, Award } from 'lucide-react';

/**
 * Fritsch-Carlson Monotone Cubic Spline Interpolation.
 * Guarantees that the curve between points never overshoots or sags below local extrema.
 */
function smoothMonotonePath(pts) {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)} L ${pts[1][0].toFixed(2)},${pts[1][1].toFixed(2)}`;

  const n = pts.length;
  const dX = [];
  const dY = [];
  const secants = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    dX.push(dx);
    dY.push(dy);
    secants.push(dx === 0 ? 0 : dy / dx);
  }

  // Initial tangents
  const m = new Array(n);
  m[0] = secants[0];
  m[n - 1] = secants[n - 2];

  for (let i = 1; i < n - 1; i++) {
    // If consecutive secants have opposite signs, slope must be 0 to maintain monotonicity
    if (secants[i - 1] * secants[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (secants[i - 1] + secants[i]) / 2;
    }
  }

  // Fritsch-Carlson monotonic clamp
  for (let i = 0; i < n - 1; i++) {
    if (secants[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / secants[i];
      const beta = m[i + 1] / secants[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        m[i] = tau * alpha * secants[i];
        m[i + 1] = tau * beta * secants[i];
      }
    }
  }

  // Convert to SVG cubic bezier commands
  let path = `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = dX[i];
    const c1x = pts[i][0] + dx / 3;
    const c1y = pts[i][1] + m[i] * (dx / 3);
    const c2x = pts[i + 1][0] - dx / 3;
    const c2y = pts[i + 1][1] - m[i + 1] * (dx / 3);
    path += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${pts[i + 1][0].toFixed(2)},${pts[i + 1][1].toFixed(2)}`;
  }

  return path;
}

export default function GradeChart({ history = [] }) {
  const [hover, setHover] = useState(null);
  const [showHonorsThresholds, setShowHonorsThresholds] = useState(true);

  const layout = useMemo(() => {
    const n = history.length;
    const W = Math.max(580, n * 105);
    const H = 260;
    const m = { top: 36, right: 32, bottom: 36, left: 38 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const x = (i) => (n === 1 ? m.left + iw / 2 : m.left + (i / (n - 1)) * iw);
    const y = (v) => m.top + ih - (Math.min(v, 4) / 4) * ih;

    const cumPts = history.map((h, i) => [x(i), y(h.cumulativeCGPA)]);
    const termPts = history.map((h, i) => [x(i), y(h.gpa)]);

    const cumLine = smoothMonotonePath(cumPts);
    const termLine = smoothMonotonePath(termPts);
    const area =
      cumPts.length > 1
        ? `${cumLine} L ${cumPts[cumPts.length - 1][0]},${m.top + ih} L ${cumPts[0][0]},${m.top + ih} Z`
        : '';

    return { W, H, m, ih, x, y, cumPts, termPts, cumLine, termLine, area };
  }, [history]);

  if (!history.length) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-line text-sm text-ink-3">
        Grade a few courses to see your progression graph.
      </div>
    );
  }

  const { W, H, m, ih, x, y, cumPts, termPts, cumLine, termLine, area } = layout;
  const last = history[history.length - 1];

  return (
    <div className="relative flex flex-col gap-3">
      {/* Chart Top Controls & Clean Legend */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-accent">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Cumulative CGPA
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-3">
            <span className="h-0.5 w-3.5 rounded-full bg-ink-3/80" />
            Term GPA
          </span>
        </div>

        <button
          onClick={() => setShowHonorsThresholds(!showHonorsThresholds)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
            showHonorsThresholds
              ? 'border-accent/40 bg-accentSoft text-accent'
              : 'border-line bg-surface2 text-ink-3 hover:text-ink'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          Honors Thresholds {showHonorsThresholds ? 'ON' : 'OFF'}
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
            <linearGradient id="cgAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="85%" stopColor="var(--accent)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Standard Gridlines (1.0, 2.0, 3.0, 4.0) */}
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
                x={m.left - 8}
                y={y(v) + 3.5}
                textAnchor="end"
                className="num fill-[var(--text-3)] text-[10.5px] font-medium"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Honors Threshold Lines & Non-Colliding Staggered Labels */}
          {showHonorsThresholds && (
            <>
              {/* Summa Cum Laude 3.90 */}
              <line
                x1={m.left}
                x2={W - m.right}
                y1={y(3.90)}
                y2={y(3.90)}
                stroke="#c084fc"
                strokeOpacity="0.5"
                strokeDasharray="3 4"
              />
              <text
                x={W - m.right}
                y={y(3.90) - 5}
                textAnchor="end"
                className="fill-purple-400 text-[9px] font-bold tracking-wider"
              >
                SUMMA 3.90
              </text>

              {/* Magna Cum Laude 3.80 — Staggered horizontally to prevent collision */}
              <line
                x1={m.left}
                x2={W - m.right}
                y1={y(3.80)}
                y2={y(3.80)}
                stroke="#38bdf8"
                strokeOpacity="0.5"
                strokeDasharray="3 4"
              />
              <text
                x={W - m.right - 95}
                y={y(3.80) - 5}
                textAnchor="end"
                className="fill-sky-400 text-[9px] font-bold tracking-wider"
              >
                MAGNA 3.80
              </text>

              {/* Cum Laude 3.75 — Staggered horizontally to prevent collision */}
              <line
                x1={m.left}
                x2={W - m.right}
                y1={y(3.75)}
                y2={y(3.75)}
                stroke="#34d399"
                strokeOpacity="0.5"
                strokeDasharray="3 4"
              />
              <text
                x={W - m.right - 190}
                y={y(3.75) - 5}
                textAnchor="end"
                className="fill-emerald-400 text-[9px] font-bold tracking-wider"
              >
                CUM LAUDE 3.75
              </text>
            </>
          )}

          {/* Probation Threshold 2.00 */}
          <line
            x1={m.left}
            x2={W - m.right}
            y1={y(2.0)}
            y2={y(2.0)}
            stroke="var(--bad)"
            strokeOpacity="0.6"
            strokeDasharray="4 4"
          />
          <text
            x={W - m.right}
            y={y(2.0) - 5}
            textAnchor="end"
            className="fill-[var(--bad)] text-[9px] font-bold tracking-wider"
          >
            PROBATION 2.00
          </text>

          {/* Shaded Area Below CGPA Curve */}
          {area && <path d={area} fill="url(#cgAreaGrad)" pointerEvents="none" />}

          {/* Term GPA Line (Grey/Neutral) */}
          <path
            d={termLine}
            fill="none"
            stroke="var(--text-3)"
            strokeWidth="1.8"
            strokeOpacity="0.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cumulative CGPA Line (Accent Solid Line - Clamped Monotone) */}
          <path
            d={cumLine}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Term GPA Points */}
          {termPts.map((p, i) => (
            <circle
              key={`term-${i}`}
              cx={p[0]}
              cy={p[1]}
              r="3.5"
              fill="var(--surface)"
              stroke="var(--text-3)"
              strokeWidth="1.8"
            />
          ))}

          {/* CGPA Points & Interactive Hover Columns */}
          {cumPts.map((p, i) => {
            const h = history[i];
            const isHovered = hover === i;
            return (
              <g key={`cgpa-${i}`}>
                {/* Column Hover Hit Area */}
                <rect
                  x={p[0] - (W / history.length) / 2}
                  y={m.top}
                  width={W / history.length}
                  height={ih}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(i)}
                />

                {/* Point */}
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r={isHovered ? 6 : 4.5}
                  fill="var(--surface)"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  className="transition-all duration-150 pointer-events-none"
                />

                {/* X-Axis Trimester Label */}
                <text
                  x={p[0]}
                  y={H - 12}
                  textAnchor="middle"
                  className={`num text-[11px] font-mono transition-colors ${
                    isHovered ? 'fill-accent font-bold' : 'fill-[var(--text-2)] font-semibold'
                  }`}
                >
                  {h.trimester}
                </text>
              </g>
            );
          })}

          {/* Hover Guide Line */}
          {hover !== null && (
            <line
              x1={cumPts[hover][0]}
              x2={cumPts[hover][0]}
              y1={m.top}
              y2={m.top + ih}
              stroke="var(--accent)"
              strokeWidth="1"
              strokeDasharray="3 3"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-30 min-w-[170px] -translate-x-1/2 rounded-xl border border-line bg-surface p-3 shadow-lg"
            style={{
              left: Math.max(90, Math.min(W - 90, cumPts[hover][0])),
              top: 14,
            }}
          >
            <div className="flex items-center justify-between border-b border-line pb-1.5 text-xs">
              <span className="font-bold text-accent font-mono">
                TERM {history[hover].trimester}
              </span>
              <span className="text-[10px] text-ink-3">
                {history[hover].termCredits} credits
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-3">Term GPA:</span>
                <span className="font-bold text-ink font-mono">
                  {history[hover].gpa.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">Cumulative CGPA:</span>
                <span className="font-bold text-accent font-mono">
                  {history[hover].cumulativeCGPA.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2.5 text-xs text-ink-3 px-1">
        <div className="flex gap-4">
          <span>Highest GPA: <b className="text-ink font-mono">{Math.max(...history.map((h) => h.gpa)).toFixed(2)}</b></span>
          <span>Lowest GPA: <b className="text-ink font-mono">{Math.min(...history.map((h) => h.gpa)).toFixed(2)}</b></span>
          <span>Current CGPA: <b className="text-accent font-mono">{last?.cumulativeCGPA.toFixed(2)}</b></span>
        </div>
        <span className="text-[11px]">Hover over graph points for term breakdown</span>
      </div>
    </div>
  );
}
