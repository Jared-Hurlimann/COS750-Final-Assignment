import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDownLeft, ArrowDownRight, Check, SkipForward } from 'lucide-react';
import { findAnywhere, moveFor, searchTrace, type Move, type Side, type Tree } from '../engine/bst';
import { LINE, Pseudocode } from './Pseudocode';
import { TreeView, type NodeState, type Traveller } from './TreeView';

/**
 * - watch:  the app performs every step; the student paces it with "Next step".
 * - guided: the app performs the first `given` steps, the student does the rest.
 *           Wrong moves are explained and can be retried (hint after 1st, full
 *           explanation after 2nd mistake on the same step).
 * - free:   the student walks without hints. The walk follows their choices on
 *           the real tree; correctness is decided at the end. With `reveal`,
 *           feedback and the correct path are shown afterwards.
 */
export type WalkMode = 'watch' | 'guided' | 'free';

interface Props {
  tree: Tree;
  searchKey: number;
  mode: WalkMode;
  given?: number;
  reveal?: boolean;
  showCode?: boolean;
  onDone?: (correct: boolean) => void;
}

interface LogEntry { text: string; kind: 'app' | 'ok' | 'bad' | 'info' }

const MOVE_LABEL: Record<Move, string> = { left: 'Go left', right: 'Go right', found: 'Found it' };
const MOVE_ICON: Record<Move, ReactNode> = {
  left: <ArrowDownLeft size={20} aria-hidden="true" />,
  found: <Check size={20} aria-hidden="true" />,
  right: <ArrowDownRight size={20} aria-hidden="true" />,
};
const SIGN: Record<Move, Traveller['sign']> = { left: '<', right: '>', found: '=' };

function MoveButtons({ onChoose }: { onChoose: (m: Move) => void }) {
  return (
    <div className="move-row">
      {(['left', 'found', 'right'] as Move[]).map((m) => (
        <button key={m} className={`move move-${m}`} onClick={() => onChoose(m)}>
          {MOVE_ICON[m]} <span>{MOVE_LABEL[m]}</span>
        </button>
      ))}
    </div>
  );
}

export function SearchWalker(props: Props) {
  return props.mode === 'free' ? <FreeWalk {...props} /> : <GuidedWalk {...props} />;
}

function useOnce(fn: ((v: boolean) => void) | undefined) {
  const done = useRef(false);
  return (v: boolean) => {
    if (done.current) return;
    done.current = true;
    fn?.(v);
  };
}

function GuidedWalk({ tree, searchKey, mode, given = 0, showCode = true, onDone }: Props) {
  const trace = useMemo(() => searchTrace(tree, searchKey), [tree, searchKey]);
  const [done, setDone] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [wrongOnStep, setWrongOnStep] = useState(0);
  const [feedback, setFeedback] = useState<LogEntry | null>(null);
  const finish = useOnce(onDone);

  const total = trace.steps.length;
  const finished = done >= total;
  const appTurn = mode === 'watch' || done < given;
  const step = trace.steps[done];

  useEffect(() => { if (finished) finish(true); });

  const advance = (kind: LogEntry['kind']) => {
    // Derive the step from the list length, so rapid clicks never log a stale step.
    setLog((l) => (l.length >= total ? l : [...l, { text: trace.steps[l.length].explanation, kind }]));
    setDone((d) => Math.min(d + 1, total));
    setWrongOnStep(0);
    setFeedback(null);
  };

  const choose = (m: Move) => {
    if (m === step.move) return advance('ok');
    const n = wrongOnStep + 1;
    setWrongOnStep(n);
    setFeedback({
      kind: 'bad',
      text: n === 1
        ? `✗ Not quite. Compare ${searchKey} with ${step.at}: is it smaller, larger, or equal?`
        : `✗ ${step.explanation.split('.')[0]}. Choose “${MOVE_LABEL[step.move]}”.`,
    });
  };

  const visited = new Set(trace.path.slice(0, done));
  const current = finished ? null : step?.at;
  const state = (k: number): NodeState | undefined => {
    if (finished && trace.found && k === searchKey) return 'found';
    if (k === current) return 'current';
    if (visited.has(k)) return 'visited';
    return undefined;
  };
  const edges = new Set(trace.path.slice(1, finished ? total : done + 1));
  const traveller: Traveller | null = finished
    ? (trace.found ? { key: searchKey, at: searchKey, sign: '=' } : trace.emptySlot ? { key: searchKey, at: trace.emptySlot } : null)
    : step ? { key: searchKey, at: step.at, sign: appTurn ? SIGN[step.move] : undefined } : null;
  const codeLine = finished
    ? (trace.found ? LINE.found : LINE.absent)
    : done === 0 ? LINE.start : LINE[trace.steps[done - 1].move];

  return (
    <div className="walker">
      <div className="walker-main">
        <div className="walker-status" aria-live="polite">
          <span className="pill">Searching for <strong>{searchKey}</strong></span>
          <span className="pill">Comparisons: <strong>{done}</strong></span>
        </div>
        <TreeView
          tree={tree}
          title={`Search for ${searchKey}`}
          nodeState={state}
          activeEdges={edges}
          traveller={traveller}
          ghost={finished && trace.emptySlot ? { ...trace.emptySlot, label: `${searchKey} would go here` } : null}
        />
      </div>
      <div className="walker-side">
        <p className="step-caption" aria-live="polite">
          {log.length === 0
            ? <>Start at the <strong>root</strong>, {trace.steps[0]?.at}. {appTurn ? 'Press Next step to make the first comparison.' : `Compare ${searchKey} with ${trace.steps[0]?.at}.`}</>
            : <><span className="step-num">Step {log.length}</span> {log[log.length - 1].text}</>}
        </p>
        {!finished && (
          <div className="controls">
            {appTurn ? (
              <button className="primary" onClick={() => advance('app')} autoFocus={done > 0}>
                <SkipForward size={18} aria-hidden="true" /> Next step
              </button>
            ) : (
              <>
                <p className="prompt">Your move: at <strong>{step.at}</strong>, what do you do with {searchKey}?</p>
                <MoveButtons onChoose={choose} />
              </>
            )}
          </div>
        )}
        {feedback && <p className={`feedback ${feedback.kind}`} role="status">{feedback.text}</p>}
        {finished && (
          <p className="feedback ok" role="status">
            ✓ {trace.found
              ? `Found ${searchKey} after ${total} comparison${total === 1 ? '' : 's'}.`
              : `${searchKey} is not in the tree. We made ${total} comparison${total === 1 ? '' : 's'} and reached an empty spot.`}
          </p>
        )}
        {showCode && <Pseudocode active={codeLine} />}
        {log.length > 0 && (
          <div className="steps-so-far">
            <h4>Steps so far</h4>
            <ol className="log">
              {log.map((e, i) => <li key={i} className={`log-${e.kind}`}>{e.kind === 'ok' ? '✓ ' : ''}{e.text}</li>)}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}


function FreeWalk({ tree, searchKey, reveal = true, onDone }: Props) {
  const trace = useMemo(() => searchTrace(tree, searchKey), [tree, searchKey]);
  const [path, setPath] = useState<number[]>(tree ? [tree.key] : []);
  const [moves, setMoves] = useState<Move[]>([]);
  const [end, setEnd] = useState<null | { found: boolean; ghost?: { parent: number; side: Side } }>(null);
  const finish = useOnce(onDone);

  const at = path[path.length - 1];
  const correct = end !== null
    && moves.length === trace.steps.length
    && moves.every((m, i) => m === trace.steps[i].move);

  useEffect(() => { if (end) finish(correct); });

  const choose = (m: Move) => {
    const nextMoves = [...moves, m];
    setMoves(nextMoves);
    if (m === 'found') return setEnd({ found: true });
    const child = findAnywhere(tree, at)![m];
    if (child === null) setEnd({ found: false, ghost: { parent: at, side: m } });
    else setPath([...path, child.key]);
  };

  const showAnswer = end && reveal;
  const correctSet = new Set(trace.path);
  const state = (k: number): NodeState | undefined => {
    if (showAnswer) {
      if (!correct && path.includes(k) && !correctSet.has(k)) return 'bad';
      if (trace.found && k === searchKey) return 'found';
      return correctSet.has(k) ? 'visited' : 'dim';
    }
    if (!end && k === at) return 'current';
    return path.includes(k) ? 'visited' : undefined;
  };
  const edgeKeys = showAnswer ? trace.path.slice(1) : path.slice(1);

  return (
    <div className="walker free">
      <div className="walker-status">
        <span className="pill">Searching for <strong>{searchKey}</strong></span>
        <span className="pill">Your path: <strong>{path.join(' → ')}</strong></span>
      </div>
      <TreeView
        tree={tree}
        title={`Walk ${searchKey} down the tree`}
        nodeState={state}
        activeEdges={new Set(edgeKeys)}
        ghost={showAnswer ? (trace.emptySlot ? { ...trace.emptySlot, label: 'empty' } : null) : end?.ghost ?? null}
      />
      {!end && (
        <div className="controls">
          <p className="prompt">You are at <strong>{at}</strong>. What do you do with {searchKey}?</p>
          <MoveButtons onChoose={choose} />
        </div>
      )}
      {end && !reveal && <p className="feedback info" role="status">Answer recorded.</p>}
      {showAnswer && (
        <p className={`feedback ${correct ? 'ok' : 'bad'}`} role="status">
          {correct ? '✓ Correct. ' : '✗ Not quite. '}
          The correct path is {trace.path.join(' → ')}
          {trace.found ? `, found at ${searchKey}` : `, then an empty spot: ${searchKey} is not in the tree`}.
          {!correct && wrongHint(trace.steps.map((s) => s.at), moves, searchKey)}
        </p>
      )}
    </div>
  );
}

function wrongHint(correctPath: number[], moves: Move[], key: number): string {
  for (let i = 0; i < moves.length; i++) {
    const at = correctPath[i];
    if (at === undefined) break;
    const right = moveFor(key, at);
    if (moves[i] !== right) {
      return ` At ${at} you chose “${MOVE_LABEL[moves[i]]}”, but ${key} ${right === 'found' ? 'equals' : right === 'left' ? 'is smaller than' : 'is larger than'} ${at}.`;
    }
  }
  return '';
}
