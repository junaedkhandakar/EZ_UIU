/**
 * The design system's shared vocabulary.
 *
 * Every view composes from these constants so a card in Tuition matches a
 * card in Commute. Nothing in here is a component — these are class strings
 * that get appended to an element, so they compose with `flex`, `gap-*`,
 * `mt-*` and any other Tailwind utility.
 *
 * The scale is deliberately small. A handful of text sizes, one radius
 * family, one border weight, one shadow. Anything a view needs beyond that
 * is a bug.
 */

/* ------------------------------------------------------------------ *
 * Type scale
 * ------------------------------------------------------------------ */
export const type = {
  /** View-level heading. Exactly one per page. */
  pageTitle: 'text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[26px]',
  /** Heading of a panel or section inside a view. */
  sectionTitle: 'text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink',
  /** Heading of a single card, list row or dialog. */
  cardTitle: 'text-[13.5px] font-semibold leading-snug text-ink',
  /** Default reading size. */
  body: 'text-[13px] leading-relaxed text-ink-2',
  /** Default reading size when the text itself is the point. */
  bodyStrong: 'text-[13px] font-medium leading-relaxed text-ink',
  /** Secondary reading size — captions, helper text. */
  small: 'text-[12px] leading-relaxed text-ink-3',
  /** Smallest supporting text — footnotes, timestamps. */
  micro: 'text-[11px] leading-relaxed text-ink-3',
  /** Uppercase field label above an input. */
  label: 'text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3',
  /** Uppercase eyebrow above a metric or a list. */
  eyebrow: 'text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3',
  /** Large numeric readout. */
  metric: 'num text-[26px] font-bold leading-none tracking-[-0.02em] text-ink',
  /** Hero numeric readout. */
  metricLg: 'num text-[32px] font-bold leading-none tracking-[-0.02em] text-ink',
  /** Compact numeric readout — inside dense rows and tables. */
  metricSm: 'num text-[19px] font-bold leading-none tracking-[-0.01em] text-ink',
  /** A course code, room or identifier. */
  code: 'font-mono text-[12.5px] font-semibold tracking-tight text-ink',
  /** A course code that acts as a link or an accent. */
  codeAccent: 'font-mono text-[12.5px] font-bold tracking-tight text-accent',
  /** Inline link — external sources, policy references. */
  link: 'inline-flex items-center gap-1 text-[11.5px] font-semibold text-accent transition-colors hover:text-accent/75 hover:underline',
};

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */
export const surface = {
  /** Raised panel: the default card. */
  card: 'rounded-xl border border-line bg-surface shadow-card',
  /** Recessed panel used for read-only summaries. */
  inset: 'rounded-xl border border-line bg-surface2/40',
  /** A single row inside a list. */
  row: 'rounded-lg border border-line bg-surface2/40',
  /** Hairline divider inside a panel. */
  divider: 'border-t border-line pt-4',
  /** Hairline divider with no extra top padding. */
  rule: 'border-t border-line',
};

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */
export const icon = {
  /** 16px — inline with 13px text. */
  sm: 'h-4 w-4',
  /** 14px — inline with 11–12px text. */
  xs: 'h-3.5 w-3.5',
  /** 20px — panel headers, empty states. */
  md: 'h-5 w-5',
};

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */
export const control = {
  /** Focus ring shared by inputs, selects and textareas. */
  focus: 'focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25',
  /** A square, icon-only control. */
  iconButton:
    'inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface2 hover:text-ink',
};
