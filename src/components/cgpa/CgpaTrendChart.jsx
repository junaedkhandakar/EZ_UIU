import React, { useState } from 'react';
import { formatTrimester } from '../../utils/cgpaUtils';

export function CgpaTrendChart({ history = [], minCgpa = 2.00 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-64 text-zinc-400 dark:text-zinc-600 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-dashed border-black/[0.08] dark:border-white/[0.08]">
        <p className="text-sm font-medium">No completed trimester history to display yet.</p>
        <p className="text-xs text-zinc-400 mt-1">Add completed courses with grades to view your progress curve.</p>
      </div>
    );
  }

  const height = 240;
  const padLeft = 40;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 36;
  const width = Math.max(500, history.length * 80);

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const minVal = 0.0;
  const maxVal = 4.0;

  const getY = val => padTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  const getX = index => {
    if (history.length === 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (history.length - 1)) * chartWidth;
  };

  // Paths
  let cgpaPoints = [];
  let termPoints = [];

  history.forEach((h, i) => {
    const x = getX(i);
    const yCgpa = getY(h.cumulativeCGPA);
    const yTerm = getY(h.gpa);
    cgpaPoints.push(`${x},${yCgpa}`);
    termPoints.push(`${x},${yTerm}`);
  });

  const cgpaLine = cgpaPoints.join(' ');
  const termLine = termPoints.join(' ');

  const firstX = getX(0);
  const lastX = getX(history.length - 1);
  const bottomY = getY(0);
  const areaPath = `M ${firstX},${bottomY} ${cgpaPoints.map(p => `L ${p}`).join(' ')} L ${lastX},${bottomY} Z`;

  const yProbation = getY(minCgpa);

  return (
    <div className="relative w-full overflow-x-auto pb-2">
      <div style={{ minWidth: `${width}px` }} className="relative select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[240px] overflow-visible">
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0071e3" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0071e3" stopOpacity="0.0" />
            </linearGradient>
            <filter id="point-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0071e3" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Gridlines 0..4 */}
          {[0, 1, 2, 3, 4].map(g => {
            const y = getY(g);
            return (
              <g key={g}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className="stroke-black/[0.05] dark:stroke-white/[0.06]"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 10}
                  y={y + 3.5}
                  className="fill-zinc-400 dark:fill-zinc-500 text-[10px] font-semibold tabular-nums"
                  textAnchor="end"
                >
                  {g}.0
                </text>
              </g>
            );
          })}

          {/* Probation Threshold Line */}
          <line
            x1={padLeft}
            y1={yProbation}
            x2={width - padRight}
            y2={yProbation}
            stroke="#ff3b30"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.65"
          />
          <text
            x={width - padRight}
            y={yProbation - 6}
            fill="#ff3b30"
            fontSize="9.5"
            fontWeight="600"
            textAnchor="end"
          >
            Probation {minCgpa.toFixed(2)}
          </text>

          {/* Area Fill */}
          <path d={areaPath} fill="url(#chart-area-grad)" />

          {/* Term GPA Dashed Line */}
          <polyline
            points={termLine}
            fill="none"
            stroke="#0071e3"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cumulative CGPA Line */}
          <polyline
            points={cgpaLine}
            fill="none"
            stroke="#0071e3"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Labels */}
          {history.map((h, i) => {
            const x = getX(i);
            const yCgpa = getY(h.cumulativeCGPA);
            const yTerm = getY(h.gpa);
            const isHovered = hoveredPoint === i;

            return (
              <g
                key={h.trimester}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Trimester code text */}
                <text
                  x={x}
                  y={height - 10}
                  className="fill-zinc-500 dark:fill-zinc-400 text-[11px] font-semibold"
                  textAnchor="middle"
                >
                  {h.trimester}
                </text>

                {/* Term GPA dot */}
                <circle
                  cx={x}
                  cy={yTerm}
                  r="3"
                  className="fill-white dark:fill-zinc-900 stroke-blue-400 dark:stroke-blue-400"
                  strokeWidth="1.5"
                />

                {/* Cumulative CGPA main point */}
                <circle
                  cx={x}
                  cy={yCgpa}
                  r={isHovered ? '6' : '4.5'}
                  fill="#0071e3"
                  className="stroke-white dark:stroke-[#1c1c1e] transition-all duration-150"
                  strokeWidth="2.5"
                  filter="url(#point-glow)"
                />

                {/* Numerical label callout */}
                <text
                  x={x}
                  y={yCgpa - 10}
                  className="fill-zinc-900 dark:fill-zinc-100 text-[11px] font-bold tabular-nums"
                  textAnchor="middle"
                  stroke="var(--color-surface, #ffffff)"
                  strokeWidth="3.5"
                  paintOrder="stroke fill"
                  strokeLinejoin="round"
                >
                  {h.cumulativeCGPA.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 bg-apple-blue rounded-full inline-block" />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Cumulative CGPA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t border-dashed border-apple-blue opacity-60 inline-block" />
            <span>Trimester Term GPA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t border-dashed border-red-500 opacity-60 inline-block" />
            <span>Probation Cutoff</span>
          </div>
        </div>
      </div>
    </div>
  );
}
