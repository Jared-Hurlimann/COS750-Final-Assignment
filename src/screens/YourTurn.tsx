import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Term } from '../components/Glossary';
import { buildTree, searchTrace, type Tree } from '../engine/bst';
import { SearchWalker, type WalkMode } from '../components/SearchWalker';
import type { ScreenProps } from './types';
import { ScreenActions } from '../components/ScreenActions';

const T1 = buildTree([50, 30, 70, 20, 40, 60, 80]);
const T2 = buildTree([41, 20, 65, 11, 29, 50, 91, 32, 72, 99]);

/** Support fades: the app does fewer steps each time, ending with no hints at all. */
const PROBLEMS: { tree: Tree; key: number; mode: WalkMode; given: number; support: string }[] = [
  { tree: T1, key: 40, mode: 'guided', given: 2, support: 'I do the first two steps; you make the last decision.' },
  { tree: T1, key: 65, mode: 'guided', given: 1, support: 'I do the first step; you finish. This key is absent.' },
  { tree: T2, key: 32, mode: 'guided', given: 0, support: 'You do every step. Hints appear if you slip.' },
  { tree: T2, key: 75, mode: 'free', given: 0, support: 'On your own: no hints until you finish.' },
];

export function YourTurn({ go }: ScreenProps) {
  const [idx, setIdx] = useState(0);
  const [walked, setWalked] = useState(false);
  const [countAnswer, setCountAnswer] = useState<number | null>(null);

  if (idx >= PROBLEMS.length) {
    return (
      <section className="screen">
        <h1>Your turn</h1>
        <div className="card">
          <p className="feedback ok">✓ You traced four searches, the last one completely on your own, and counted the comparisons each time.</p>
        </div>
        <ScreenActions
          primary={{ label: 'Next: practice', onClick: () => go(6) }}
          secondary={[{ label: 'Do them again', icon: <RotateCcw size={16} aria-hidden="true" />, onClick: () => { setIdx(0); setWalked(false); setCountAnswer(null); } }]}
        />
      </section>
    );
  }

  const p = PROBLEMS[idx];
  const trace = searchTrace(p.tree, p.key);
  const options = [...new Set([trace.comparisons - 1, trace.comparisons, trace.comparisons + 1, trace.comparisons + 2].filter((n) => n > 0))];

  const next = () => { setIdx((i) => i + 1); setWalked(false); setCountAnswer(null); };

  return (
    <section className="screen">
      <h1>Your turn</h1>
      <p className="lead">
        Now you make the decisions. At each node, compare the key and choose <strong>Go left</strong>,{' '}
        <strong>Go right</strong> or <strong>Found it</strong>. Then count the <Term id="comparison">comparisons</Term>.
        The help fades with every problem.
      </p>
      <div className="steps-dots" aria-label={`Problem ${idx + 1} of ${PROBLEMS.length}`}>
        {PROBLEMS.map((_, i) => <span key={i} className={i < idx ? 'dot done' : i === idx ? 'dot current' : 'dot'} />)}
      </div>
      <div className="card">
        <p className="lo-tag">Problem {idx + 1} of {PROBLEMS.length} · Support: {p.support}</p>
        <SearchWalker key={idx} tree={p.tree} searchKey={p.key} mode={p.mode} given={p.given} onDone={() => setWalked(true)} />

        {walked && (
          <div className="followup">
            <p className="prompt">How many comparisons did this search make?</p>
            <div className="btn-row">
              {options.map((n) => {
                const chosen = countAnswer === n;
                const correct = n === trace.comparisons;
                return (
                  <button key={n} className={chosen ? (correct ? 'option ok' : 'option bad') : 'option'} onClick={() => setCountAnswer(n)}>
                    {chosen ? (correct ? '✓ ' : '✗ ') : ''}{n}
                  </button>
                );
              })}
            </div>
            {countAnswer !== null && (
              <p className={`feedback ${countAnswer === trace.comparisons ? 'ok' : 'bad'}`} role="status">
                {countAnswer === trace.comparisons
                  ? `✓ Right: one comparison for each of ${trace.path.join(', ')}.`
                  : `✗ Count the nodes visited: ${trace.path.join(', ')}. ${trace.found ? '' : 'The empty spot does not count.'}`}
              </p>
            )}
          </div>
        )}
      </div>
      <ScreenActions
        primary={{
          label: countAnswer === trace.comparisons ? (idx === PROBLEMS.length - 1 ? 'Finish' : 'Next problem') : walked ? 'Count the comparisons first' : 'Finish the search first',
          onClick: next,
          disabled: countAnswer !== trace.comparisons,
        }}
      />
    </section>
  );
}
