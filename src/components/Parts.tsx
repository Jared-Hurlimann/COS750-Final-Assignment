import { Check } from 'lucide-react';

/**
 * Splits a busy screen into small parts, shown one at a time, with a compact
 * progress strip. Students can jump back to parts they have already seen.
 */
export function Parts({ titles, current, reached, onSelect }: {
  titles: string[];
  current: number;
  /** Highest part index the student has opened so far. */
  reached: number;
  onSelect: (i: number) => void;
}) {
  return (
    <ol className="parts" aria-label="Parts of this screen">
      {titles.map((t, i) => {
        const state = i === current ? 'current' : i < current || i <= reached ? 'done' : 'todo';
        return (
          <li key={t} className={`part ${state}`}>
            <button
              onClick={() => onSelect(i)}
              disabled={i > reached}
              aria-current={i === current ? 'step' : undefined}
            >
              <span className="part-num" aria-hidden="true">{state === 'done' && i !== current ? <Check size={14} /> : i + 1}</span>
              <span className="part-title">{t}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Small "Tree 2 of 3" style dots for items inside a part. */
export function ItemDots({ count, current, label }: { count: number; current: number; label: string }) {
  return (
    <div className="item-dots" aria-label={`${label} ${current + 1} of ${count}`}>
      <span className="item-dots-text">{label} {current + 1} of {count}</span>
      <span className="steps-dots" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => <span key={i} className={i < current ? 'dot done' : i === current ? 'dot current' : 'dot'} />)}
      </span>
    </div>
  );
}
