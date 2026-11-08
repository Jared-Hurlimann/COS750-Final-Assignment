import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { buildTree } from '../engine/bst';
import { Term } from '../components/Glossary';
import { SearchWalker } from '../components/SearchWalker';
import type { ScreenProps } from './types';
import { ScreenActions } from '../components/ScreenActions';

const tree = buildTree([50, 30, 70, 20, 40, 60, 80, 35, 65]);
const EXAMPLES = [
  { label: 'Present key: 65', key: 65 },
  { label: 'Absent key: 33', key: 33 },
];

export function WorkedExample({ go }: ScreenProps) {
  const [ex, setEx] = useState(0);
  const [run, setRun] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  return (
    <section className="screen">
      <h1>Worked example: watch me</h1>
      <p className="lead">
        Press <strong>Next step</strong> to go at your own pace. The yellow bubble is the key we are searching for. At
        each node it makes one <Term id="comparison">comparison</Term> (&lt;, &gt; or =) and moves down the{' '}
        <Term id="path">path</Term>. The matching line of pseudocode lights up as it goes.
      </p>
      <div className="chip-row" role="tablist" aria-label="Examples">
        {EXAMPLES.map((e, i) => (
          <button key={e.key} role="tab" aria-selected={ex === i} className={ex === i ? 'chip active' : 'chip'} onClick={() => { setEx(i); setRun((r) => r + 1); }}>
            {seen.has(i) && <Check size={16} aria-hidden="true" />}{e.label}
          </button>
        ))}
      </div>
      <div className="card">
        <SearchWalker
          key={`${ex}-${run}`}
          tree={tree}
          searchKey={EXAMPLES[ex].key}
          mode="watch"
          onDone={() => setSeen((s) => new Set(s).add(ex))}
        />
      </div>
      <ScreenActions
        primary={seen.size === EXAMPLES.length
          ? { label: 'Your turn', onClick: () => go(5) }
          : seen.has(0) && ex === 0
            ? { label: 'Now an absent key', onClick: () => { setEx(1); setRun((r) => r + 1); } }
            : { label: 'Watch to the end to continue', onClick: () => {}, disabled: true }}
        secondary={[{ label: 'Replay', icon: <RotateCcw size={16} aria-hidden="true" />, onClick: () => setRun((r) => r + 1) }]}
      />
    </section>
  );
}
