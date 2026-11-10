import { useState } from 'react';
import { ArrowDownLeft, ArrowDownRight, ArrowLeft, Check, X } from 'lucide-react';
import lessons from '../content/lessons.json';
import { buildTree, fromLevelOrder, validateBST, type Tree } from '../engine/bst';
import { RichText, Term } from '../components/Glossary';
import { ItemDots, Parts } from '../components/Parts';
import { ScreenActions } from '../components/ScreenActions';
import { TreeView } from '../components/TreeView';
import { useInsertAnimation } from '../components/useInsertAnimation';
import { ListenButton } from '../components/Narrate';
import type { ScreenProps } from './types';

const PREDICT_KEYS = [35, 72, 55, 18];

const CANDIDATES: { tree: Tree; trap?: string }[] = [
  { tree: buildTree([50, 30, 70, 20, 40, 60, 80]) },
  { tree: fromLevelOrder([50, 70, 30, 60, 80, 20, 40]) },
  { tree: fromLevelOrder([50, 30, 70, 20, 60, null, 80]), trap: ' 60 looks fine next to its parent 30, which is exactly why this one is a trap.' },
];

const PARTS = ['Predict where keys go', 'Spot the rule-breaker'];

export function BstRule({ go }: ScreenProps) {
  const [part, setPart] = useState(0);
  const [reached, setReached] = useState(0);
  const [tree, setTree] = useState<Tree>(buildTree([50, 30, 70]));
  const [pi, setPi] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ti, setTi] = useState(0);
  const [verdicts, setVerdicts] = useState<Record<number, boolean>>({});
  const anim = useInsertAnimation(tree, setTree, 1000);

  const openPart = (p: number) => { setPart(p); setReached((r) => Math.max(r, p)); };

  const key = PREDICT_KEYS[pi];
  const predict = (side: 'left' | 'right') => {
    const correct = key < 50 ? 'left' : 'right';
    if (side === correct) {
      setMsg({ ok: true, text: `✓ Yes: ${key} is ${key < 50 ? 'smaller' : 'larger'} than 50, so it belongs in the ${correct} subtree. Watch it find its exact spot.` });
      anim.enqueue([key]);
      setPi((i) => i + 1);
    } else {
      setMsg({ ok: false, text: `✗ Compare ${key} with 50. Smaller keys go left; larger keys go right.` });
    }
  };

  const c = CANDIDATES[ti];
  const v = validateBST(c.tree);
  const answered = ti in verdicts;
  const right = answered && verdicts[ti] === v.valid;

  return (
    <section className="screen">
      <h1>The BST rule</h1>
      <Parts titles={PARTS} current={part} reached={reached} onSelect={openPart} />

      {part === 0 && (
        <>
          <div className="card rule">
            <p className="muted small" style={{ marginBottom: 6 }}>A <Term id="bst">binary search tree</Term> keeps its keys in order with one rule:</p>
            <p className="rule-text"><RichText text={lessons.rule.statement} /></p>
            <p style={{ marginBottom: 0 }}><RichText text={lessons.rule.whole} /></p>
            <ListenButton text={[lessons.rule.statement, lessons.rule.whole]} label="Listen to the rule" />
          </div>
          <div className="card">
            <div className="split">
              <div>
                <h2>Which side of 50?</h2>
                {pi < PREDICT_KEYS.length ? (
                  <>
                    <ItemDots count={PREDICT_KEYS.length} current={pi} label="Key" />
                    <p className="prompt">Where does <strong>{key}</strong> belong: the left or the right subtree of 50?</p>
                    <div className="move-row two">
                      <button className="move" onClick={() => predict('left')} disabled={anim.busy}><ArrowDownLeft size={20} aria-hidden="true" /> Left subtree</button>
                      <button className="move" onClick={() => predict('right')} disabled={anim.busy}><ArrowDownRight size={20} aria-hidden="true" /> Right subtree</button>
                    </div>
                  </>
                ) : (
                  <p className="feedback ok">✓ All four placed. Everything left of 50 is smaller; everything right of 50 is larger.</p>
                )}
                {msg && pi < PREDICT_KEYS.length && <p className={`feedback ${msg.ok ? 'ok' : 'bad'}`} role="status">{msg.text}</p>}
              </div>
              <div>
                <TreeView
                  tree={tree}
                  title="Tree growing as you predict"
                  traveller={anim.traveller}
                  ghost={anim.ghost}
                  activeEdges={anim.activeEdges}
                  nodeState={(k) => (anim.visited.has(k) ? 'visited' : undefined)}
                />
                <div className="step-caption" aria-live="polite">
                  {anim.busy ? anim.caption : <span className="muted">Each new key walks down from the root, comparing as it goes, until it reaches an <Term id="empty-spot">empty spot</Term>.</span>}
                </div>
                {anim.busy && <button className="ghost-btn" onClick={anim.skip}>Skip animation</button>}
              </div>
            </div>
          </div>
          <ScreenActions
            primary={pi < PREDICT_KEYS.length
              ? { label: `Place all ${PREDICT_KEYS.length} keys to continue`, onClick: () => {}, disabled: true }
              : { label: 'Continue: spot the rule-breaker', onClick: () => openPart(1) }}
            secondary={[pi < PREDICT_KEYS.length && { label: 'Skip', onClick: () => openPart(1) }]}
          />
        </>
      )}

      {part === 1 && (
        <>
          <div className="card">
            <div className="split">
              <div>
                <h2>Valid or not?</h2>
                <ItemDots count={CANDIDATES.length} current={ti} label="Tree" />
                <p>Does this tree obey the rule <em>everywhere</em>, not just between each parent and child?</p>
                <div className="btn-row">
                  <button disabled={answered} onClick={() => setVerdicts({ ...verdicts, [ti]: true })}><Check size={18} aria-hidden="true" /> Valid BST</button>
                  <button disabled={answered} onClick={() => setVerdicts({ ...verdicts, [ti]: false })}><X size={18} aria-hidden="true" /> Breaks the rule</button>
                </div>
                {answered && (
                  <p className={`feedback ${right ? 'ok' : 'bad'}`} role="status">
                    {right ? '✓ Correct. ' : '✗ Not quite. '}
                    {v.valid ? 'Every key is on the correct side of every ancestor.' : v.explanation}
                    {!v.valid && c.trap}
                  </p>
                )}
              </div>
              <TreeView
                key={ti}
                tree={c.tree}
                title={`Tree ${ti + 1}`}
                nodeState={(k) => (answered && !v.valid && (k === v.offender ? 'bad' : k === v.ancestor ? 'highlight' : undefined)) || undefined}
              />
            </div>
          </div>
          <ScreenActions
            primary={!answered
              ? { label: 'Choose an answer', onClick: () => {}, disabled: true }
              : ti < CANDIDATES.length - 1
                ? { label: 'Next tree', onClick: () => setTi(ti + 1) }
                : { label: 'Next: how a search works', onClick: () => go(3) }}
            secondary={[{ label: 'Back', icon: <ArrowLeft size={16} aria-hidden="true" />, onClick: () => (ti > 0 ? setTi(ti - 1) : setPart(0)) }]}
          />
        </>
      )}
    </section>
  );
}
