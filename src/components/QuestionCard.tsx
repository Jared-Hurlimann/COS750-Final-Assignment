import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../settings';
import type { Question } from '../engine/questions';
import lessons from '../content/lessons.json';
import { SearchWalker } from './SearchWalker';
import { TreeView } from './TreeView';

interface Props {
  question: Question;
  /** immediate: show ✓/✗ and explanation. deferred: record only (final check). */
  feedback: 'immediate' | 'deferred';
  onAnswered: (correct: boolean) => void;
}

/** Renders one MCQ or trace question. Remount with a new `key` for each question. */
export function QuestionCard({ question: q, feedback, onAnswered }: Props) {
  const [choice, setChoice] = useState<number | null>(null);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const { animate } = useSettings();
  const outcome = lessons.outcomes[q.lo];
  const immediate = feedback === 'immediate';

  // On small screens the explanation can land below the fold (under the pinned
  // action bar). Bring it into view so students always see *why*.
  useEffect(() => {
    if (choice !== null && immediate) {
      feedbackRef.current?.scrollIntoView({ behavior: animate ? 'smooth' : 'auto', block: 'nearest' });
    }
  }, [choice, immediate, animate]);

  if (q.kind === 'trace') {
    return (
      <div className="card question">
        <p className="lo-tag">{q.lo} · {outcome.short}</p>
        <h3>{q.prompt}</h3>
        <SearchWalker
          tree={q.tree}
          searchKey={q.key}
          mode="free"
          reveal={immediate}
          onDone={onAnswered}
        />
      </div>
    );
  }

  const answered = choice !== null;
  const select = (i: number) => {
    if (answered && immediate) return;
    setChoice(i);
    onAnswered(i === q.answer);
  };

  return (
    <div className="card question">
      <p className="lo-tag">{q.lo} · {outcome.short}</p>
      <h3>{q.prompt}</h3>
      <p className="muted small">Not sure what a word means? Tap <strong>Glossary</strong> at the top.</p>
      <div className={q.tree !== undefined ? 'q-body has-visual' : 'q-body'}>
      {q.tree !== undefined && (
        <div className="q-visual">
        <div className={q.tree2 !== undefined ? 'tree-pair' : ''}>
          <figure>
            {q.treeLabels && <figcaption>{q.treeLabels[0]}</figcaption>}
            <TreeView
              tree={q.tree}
              title={q.treeLabels?.[0] ?? 'Tree for this question'}
              nodeState={(k) => (q.highlight?.includes(k) ? 'highlight' : undefined)}
            />
          </figure>
          {q.tree2 !== undefined && (
            <figure>
              <figcaption>{q.treeLabels?.[1]}</figcaption>
              <TreeView tree={q.tree2} title={q.treeLabels?.[1] ?? 'Second tree'} />
            </figure>
          )}
        </div>
        </div>
      )}
      <div className="q-answer">
      <div className="options" role="group" aria-label="Answer options">
        {q.options.map((opt, i) => {
          let cls = 'option';
          let mark = '';
          if (answered && immediate) {
            if (i === q.answer) { cls += ' ok'; mark = '✓ '; }
            else if (i === choice) { cls += ' bad'; mark = '✗ '; }
          } else if (i === choice) {
            cls += ' selected';
          }
          return (
            <button key={i} className={cls} onClick={() => select(i)} aria-pressed={i === choice} disabled={answered && immediate}>
              {mark}{opt}
            </button>
          );
        })}
      </div>
      {answered && immediate && (
        <p ref={feedbackRef} className={`feedback ${choice === q.answer ? 'ok' : 'bad'}`} role="status">
          {choice === q.answer ? '✓ Correct. ' : '✗ Not quite. '}
          {q.explanation}
        </p>
      )}
      </div>
      </div>
    </div>
  );
}
