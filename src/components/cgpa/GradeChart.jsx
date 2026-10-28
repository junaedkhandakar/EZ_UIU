import { useMemo, useState } from 'react';

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

export default function GradeChart({ history }) {
  const [hover, setHover] = useState(null);

  const layout = useMemo(() => {
    const n = history.length;
    const W = Math.max(560, n * 92);
    const H = 260;
    const m = { top: 24, right: 20, bottom: 30, left: 34 };
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
      <div className="flex h-[260px] items-center justify-center text-sm text-ink-3">
        Grade a few courses to see your progression.
      </div>
    );
  }

  const { W, H, m, ih, x, y, cumPts, termPts, cumLine, termLine, area } = layout;
  const last = history[history.length - 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="CGPA progression chart"
      >
        <defs>
          <linearGradient id="cgStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
          <linearGradient id="cgFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* gridlines */}
        {[0, 1, 2, 3, 4].map((v) => (
          <g key={v}>
            <line
              x1={m.left}
              x2={W - m.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeDasharray={v === 0 ? '' : '3 5'}
            />
            <text
              x={m.left - 10}
              y={y(v) + 3.5}
              textAnchor="end"
              className="num fill-[var(--text-3)] text-[10px]"
            >
              {v}
            </text>
          </g>
        ))}

        {/* probation threshold */}
        <line
          x1={m.left}
          x2={W - m.right}
          y1={y(2.0)}
          y2={y(2.0)}
          stroke="var(--bad)"
          strokeOpacity="0.4"
          strokeDasharray="5 4"
        />
        <text
          x={W - m.right}
          y={y(2.0) - 5}
          textAnchor="end"
          className="fill-[var(--bad)] text-[9px] font-semibold"
          opacity="0.7"
        >
          PROBATION 2.00
        </text>

        {/* x labels */}
        {history.map((h, i) => (
          <text
            key={h.trimester}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className={`text-[9.5px] font-semibold ${
              hover === i ? 'fill-[var(--text)]' : 'fill-[var(--text-3)]'
            }`}
          >
            {h.trimester}
          </text>
        ))}

        {/* area + lines */}
        {area && <path d={area} fill="url(#cgFill)" />}
        <path d={termLine} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.65" />
        <path d={cumLine} fill="none" stroke="url(#cgStroke)" strokeWidth="2.5" strokeLinecap="round" />

        {/* hover crosshair */}
        {hover != null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={m.top}
            y2={m.top + ih}
            stroke="var(--border-strong)"
          />
        )}

        {/* dots */}
        {termPts.map((p, i) => (
          <circle
            key={`t${i}`}
            cx={p[0]}
            cy={p[1]}
            r={hover === i ? 3.5 : 2.5}
            fill="var(--surface)"
            stroke="var(--text-3)"
            strokeWidth="1.5"
          />
        ))}
        {cumPts.map((p, i) => (
          <circle
            key={`c${i}`}
            cx={p[0]}
            cy={p[1]}
            r={hover === i ? 5 : 3.5}
            fill="var(--surface)"
            stroke="url(#cgStroke)"
            strokeWidth="2.5"
          />
        ))}

        {/* hover targets */}
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

        {/* end label */}
        <text
          x={cumPts[cumPts.length - 1][0]}
          y={cumPts[cumPts.length - 1][1] - 10}
          textAnchor="middle"
          className="num fill-[var(--accent)] text-[11px] font-bold"
        >
          {last.cumulativeCGPA.toFixed(2)}
        </text>
      </svg>

      {/* tooltip */}
      {hover != null && (
        <div
          className="glass pointer-events-none absolute top-2 z-10 min-w-[150px] -translate-x-1/2 rounded-xl border border-line p-3 shadow-pop"
          style={{
            left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%`,
          }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">
            {history[hover].trimester}
          </div>
          <div className="mt-1.5 space-y-1 text-[11.5px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-ink-2">Term GPA</span>
              <span className="num font-bold text-ink">{history[hover].gpa.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-ink-2">CGPA</span>
              <span className="num font-bold text-accent">
                {history[hover].cumulativeCGPA.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-ink-2">Credits</span>
              <span className="num font-semibold text-ink-2">{history[hover].credits}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
