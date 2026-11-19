/**
 * Grade → semantic tone mapping.
 *
 * The transcript table used raw Tailwind palette colours (emerald-500,
 * sky-500, amber-500, rose-500) which ignored the app's own semantic
 * tokens and broke in dark mode. Grades now map onto the same
 * ok / accent / warn / bad / orange scale the rest of the UI uses.
 */

const TONES = {
  A: 'border-ok/30 bg-ok/10 text-ok',
  B: 'border-accent/30 bg-accentSoft text-accent',
  C: 'border-warn/30 bg-warn/10 text-warn',
  D: 'border-warn/40 bg-warn/10 text-warn',
  F: 'border-bad/30 bg-bad/10 text-bad',
  none: 'border-line bg-surface2 text-ink-3',
};

export function gradeTone(grade) {
  const g = String(grade || '').toUpperCase();
  if (!g || g === 'RUNNING') return TONES.none;
  if (g.startsWith('A')) return TONES.A;
  if (g.startsWith('B')) return TONES.B;
  if (g.startsWith('C')) return TONES.C;
  if (g.startsWith('D')) return TONES.D;
  if (g === 'F') return TONES.F;
  return TONES.none;
}
