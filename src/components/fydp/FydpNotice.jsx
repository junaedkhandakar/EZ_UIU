import React from 'react';
import { GraduationCap, Check } from 'lucide-react';
import Surface from '../ui/Surface';
import Button from '../ui/Button';

/**
 * Asks the student which FYDP stage(s) they are registered for.
 *
 * FYDP has no fixed class times, so it is missing from the routine PDF and
 * therefore from the tuition calculation. The system proposes the likely stage
 * from the transcript; the student confirms.
 */
export default function FydpNotice({
  candidates = [],
  selected = [],
  onToggle,
  onAccept,
  onDismiss,
  context,
  acceptLabel = 'Add to routine',
  title = 'Are you registered for FYDP?',
}) {
  if (!candidates.length) return null;

  return (
    <Surface className="border-accent/30 bg-accentSoft/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ink">{title}</h4>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-2">{context}</p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {candidates.map((stage) => {
                const isOn = selected.includes(stage.code);
                return (
                  <button
                    key={stage.code}
                    type="button"
                    onClick={() => onToggle(stage.code)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      isOn
                        ? 'border-accent bg-surface text-accent'
                        : 'border-line bg-surface2/60 text-ink-3 hover:text-ink'
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border ${
                        isOn ? 'border-accent bg-accent text-white' : 'border-line-strong'
                      }`}
                    >
                      {isOn && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                    {stage.code}
                    <span className="font-medium text-ink-3">
                      {stage.label} · {stage.credit} cr
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 sm:pt-0.5">
          <Button variant="primary" size="sm" onClick={onAccept} disabled={!selected.length}>
            {acceptLabel}
          </Button>
          <Button variant="secondary" size="sm" onClick={onDismiss}>
            Not this term
          </Button>
        </div>
      </div>
    </Surface>
  );
}
