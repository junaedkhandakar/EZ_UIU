import React, { useMemo, useState } from 'react';
import { TrendingUp, AlertCircle, Award, LineChart } from 'lucide-react';
import Empty from '../ui/Empty';
import { type } from '../ui/tokens';

/**
 * Fritsch-Carlson Monotone Cubic Spline Interpolation.
 * Guarantees that the curve between points never overshoots or sags below local extrema.
 */
function smoothMonotonePath(pts) {
  if (pts.length < 2) return '';
  if (pts.length === 2)
    return `M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)} L ${pts[1][0].toFixed(2)},${pts[1][1].toFixed(2)}`;

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
    const W = Math.max(560, n * 100);
    const H = 240;
    const m = { top: 30, right: 30, bottom: 32, left: 36 };
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
      <Empty
        icon={LineChart}
        title="No graded terms yet"
        sub="Grade a few courses and your cumulative progression will be charted here."
        compact
      />
    );
  }

  const { W, H, m, ih, cumPts, termPts, cumLine, termLine, area } = layout;
  const last = history[history.length - 1];
  const best = Math.max(...history.map((h) => h.gpa));
  const worst = Math.min(...history.map((h) => h.gpa));

  return (
    <div className="flex flex-col gap-3">
      {/* Legend + threshold toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[11.5px]">
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <span className="h-[3px] w-4 rounded-full bg-accent" />
            Cumulative CGPA
          </span>
          <span className="flex items-center gap-1.5 font-medium text-ink-3">
            <span className="h-[3px] w-4 rounded-full bg-ink-3/70" />
            Term GPA
          </span>
        </div>

        <button
          onClick={() => setShowHonorsThresholds(!showHonorsThresholds)}
          aria-pressed={showHonorsThresholds}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
            showHonorsThresholds
              ? 'border-accent/40 bg-accentSoft text-accent'
              : 'border-line bg-surface2 text-ink-3 hover:text-ink'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          Thresholds {showHonorsThresholds ? 'on' : 'off'}
        </button>
      </div>

      <div className="relative overflow-x-auto rounded-xl border border-line bg-surface2/30 p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[560px]"
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="CGPA progression chart"
        >
          <defs>
            <linearGradient id="cgAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
              <stop offset="85%" stopColor="var(--accent)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines (1.0, 2.0, 3.0, 4.0) */}
          {[1.0, 2.0, 3.0, 4.0].map((v) => (
            <g key={v}>
              <line
                x1={m.left}
                x2={W - m.right}
                y1={layout.y(v)}
                y2={layout.y(v)}
                stroke="var(--border)"
                strokeDasharray="3 6"
              />
              <text
                x={m.left - 8}
                y={layout.y(v) + 3.5}
                textAnchor="end"
                className="num fill-[var(--text-3)] text-[10px] font-medium"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Published UIU thresholds: probation 2.00, merit scholarship 3.50 */}
          {showHonorsThresholds && (
            <line
              x1={m.left}
              x2={W - m.right}
              y1={layout.y(3.5)}
              y2={layout.y(3.5)}
              stroke="var(--accent)"
              strokeOpacity="0.4"
              strokeDasharray="3 4"
            />
          )}
          {showHonorsThresholds && (
            <text
              x={W - m.right - 4}
              y={layout.y(3.5) - 6}
              textAnchor="end"
              className="fill-[var(--accent)] text-[9px] font-bold tracking-wider"
            >
              MERIT 3.50
            </text>
          )}

          {/* Probation Threshold 2.00 */}
          <line
            x1={m.left}
            x2={W - m.right}
            y1={layout.y(2.0)}
            y2={layout.y(2.0)}
            stroke="var(--bad)"
            strokeOpacity="0.55"
            strokeDasharray="4 4"
          />
          <text
            x={W - m.right - 4}
            y={layout.y(2.0) - 6}
            textAnchor="end"
            className="fill-[var(--bad)] text-[9px] font-bold tracking-wider"
          >
            PROBATION 2.00
          </text>

          {/* Shaded Area Below CGPA Curve */}
          {area && <path d={area} fill="url(#cgAreaGrad)" pointerEvents="none" />}

          {/* Term GPA Line */}
          <path
            d={termLine}
            fill="none"
            stroke="var(--text-3)"
            strokeWidth="1.6"
            strokeOpacity="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cumulative CGPA Line */}
          <path
            d={cumLine}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Term GPA Points */}
          {termPts.map((p, i) => (
            <circle
              key={`term-${i}`}
              cx={p[0]}
              cy={p[1]}
              r="3"
              fill="var(--surface)"
              stroke="var(--text-3)"
              strokeWidth="1.6"
            />
          ))}

          {/* CGPA Points & Interactive Hover Columns */}
          {cumPts.map((p, i) => {
            const h = history[i];
            const isHovered = hover === i;
            return (
              <g key={`cgpa-${i}`}>
                <rect
                  x={p[0] - W / history.length / 2}
                  y={m.top}
                  width={W / history.length}
                  height={ih}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(i)}
                />
                <circle
                  cx={p[0]}
                  cy={p[1]}
                  r={isHovered ? 5.5 : 4}
                  fill="var(--surface)"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  className="pointer-events-none transition-all duration-150"
                />
                <text
                  x={p[0]}
                  y={H - 10}
                  textAnchor="middle"
                  className={`num text-[10.5px] transition-colors ${
                    isHovered ? 'fill-accent font-bold' : 'fill-[var(--text-3)] font-semibold'
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

        {/* Hover Tooltip */}
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-30 min-w-[168px] -translate-x-1/2 rounded-lg border border-line bg-surface p-2.5 shadow-pop"
            style={{
              left: Math.max(90, Math.min(W - 90, cumPts[hover][0])),
              top: 16,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line pb-1.5 text-[11.5px]">
              <span className="num font-mono font-bold text-accent">
                TERM {history[hover].trimester}
              </span>
              <span className="num text-[10.5px] text-ink-3">{history[hover].credits} cr</span>
            </div>
            <div className="mt-2 space-y-1 text-[11.5px]">
              <div className="flex justify-between gap-4">
                <span className="text-ink-3">Term GPA</span>
                <span className="num font-bold text-ink">{history[hover].gpa.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-ink-3">Cumulative</span>
                <span className="num font-bold text-accent">
                  {history[hover].cumulativeCGPA.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2.5 text-[11.5px]">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-ink-3">
          <span>
            Highest <b className="num font-bold text-ink">{best.toFixed(2)}</b>
          </span>
          <span>
            Lowest <b className="num font-bold text-ink">{worst.toFixed(2)}</b>
          </span>
          <span>
            Current <b className="num font-bold text-accent">{last?.cumulativeCGPA.toFixed(2)}</b>
          </span>
        </div>
        <span className="text-ink-3/80">Hover a point for the term breakdown</span>
      </div>
    </div>
  );
}
