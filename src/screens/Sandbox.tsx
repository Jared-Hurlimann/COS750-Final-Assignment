import { useState, type FormEvent } from 'react';
import { FlaskConical, GraduationCap, Plus, RotateCcw, Search, Shapes, Shuffle, SkipForward } from 'lucide-react';
import lessons from '../content/lessons.json';
import { averageComparisons, buildTree, height, inorder, searchTrace, size, type Tree } from '../engine/bst';
import { balancedOrder } from '../engine/questions';
import { RichText, Term } from '../components/Glossary';
import { TreeView, type NodeState } from '../components/TreeView';
import { useInsertAnimation } from '../components/useInsertAnimation';
import { useSettings } from '../settings';
import type { ScreenProps } from './types';
import { ScreenActions } from '../components/ScreenActions';

const TASK = lessons.sandbox.task;
const fill = (s: string) => s.replace(/\{lookFor\}/g, String(TASK.lookFor)).replace(/\{absent\}/g, String(TASK.absent));

/** Real-world task (Kolb: active experimentation): a class list of student numbers. */
function ClassListTask({ onLoad }: { onLoad: (keys: number[]) => void }) {
  const registered = buildTree(TASK.registration);
  const sortedKeys = [...TASK.registration].sort((a, b) => a - b);
  const sortedTree = buildTree(sortedKeys);
  const n = (t: Tree, k: number) => searchTrace(t, k).comparisons;
  return (
    <div className="card task-card">
      <h2><span className="icon-title"><GraduationCap size={20} aria-hidden="true" /></span> {TASK.title}</h2>
      <p><RichText text={TASK.intro} /></p>
      <ol>{TASK.steps.map((st) => <li key={st}><RichText text={fill(st)} /></li>)}</ol>
      <div className="btn-row">
        <button onClick={() => onLoad(TASK.registration)}>Load the class list ({TASK.registration.join(', ')})</button>
        <button onClick={() => onLoad(sortedKeys)}>Load it sorted</button>
      </div>
      <details className="reflect">
        <summary>Check your answers</summary>
        <p>
          In registration order the tree has {height(registered)} levels. Finding {TASK.lookFor} takes{' '}
          {n(registered, TASK.lookFor)} comparisons, and finding out that {TASK.absent} is absent takes{' '}
          {n(registered, TASK.absent)}. Sorted, the same numbers make a chain of {height(sortedTree)} levels:{' '}
          {TASK.lookFor} now takes {n(sortedTree, TASK.lookFor)} comparisons. Same students, slower search, only
          because of the order they were added.
        </p>
      </details>
    </div>
  );
}

const PRESETS: { label: string; keys: number[] }[] = [
  { label: 'Sorted: 1, 2, 3, 4, 5', keys: [1, 2, 3, 4, 5] },
  { label: 'Mixed: 3, 2, 4, 1, 5', keys: [3, 2, 4, 1, 5] },
  { label: 'Sorted: 1 to 7', keys: [1, 2, 3, 4, 5, 6, 7] },
  { label: 'Balanced: 4, 2, 6, 1, 3, 5, 7', keys: [4, 2, 6, 1, 3, 5, 7] },
];

const SPEEDS = [
  { label: 'Slow', ms: 1500 },
  { label: 'Normal', ms: 950 },
  { label: 'Fast', ms: 450 },
];

function parseKeys(s: string): number[] {
  return s.split(/[\s,;]+/).filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 999);
}

function Stats({ tree }: { tree: Tree }) {
  const n = size(tree);
  return (
    <dl className="stats-grid">
      <div><dt>Nodes</dt><dd>{n}</dd></div>
      <div><dt><Term id="level">Levels</Term> (<Term id="height">height</Term>)</dt><dd>{height(tree)}</dd></div>
      <div><dt><Term id="worst-case">Worst case</Term></dt><dd>{height(tree)}</dd></div>
      <div><dt>Average comparisons</dt><dd>{n ? averageComparisons(tree).toFixed(2) : '–'}</dd></div>
    </dl>
  );
}

export function Sandbox({ go }: ScreenProps) {
  const { animate } = useSettings();
  const [tree, setTree] = useState<Tree>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [input, setInput] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [tool, setTool] = useState<'search' | 'shape'>('search');
  const [notice, setNotice] = useState('');
  const [speed, setSpeed] = useState(1);
  const anim = useInsertAnimation(tree, setTree, SPEEDS[speed].ms, (k, added) => {
    if (added) setOrder((o) => [...o, k]);
    else setNotice(`${k} was skipped: it is already in the tree, and a BST holds each key only once.`);
  });

  const reset = () => {
    anim.reset(null);
    setOrder([]);
    setSearchKey('');
    setNotice('');
  };

  const load = (ks: number[], instant = false) => {
    reset();
    anim.enqueue(ks, { instant });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ks = parseKeys(input);
    if (ks.length === 0) return setNotice('Type one or more whole numbers (0 to 999), separated by commas or spaces.');
    setNotice('');
    anim.enqueue(ks);
    setInput('');
  };

  const sk = searchKey.trim() === '' ? null : Number(searchKey);
  const trace = !anim.busy && sk !== null && Number.isInteger(sk) && tree ? searchTrace(tree, sk) : null;
  const state = (k: number): NodeState | undefined => {
    if (anim.busy) return anim.visited.has(k) ? 'visited' : undefined;
    if (!trace) return undefined;
    if (trace.found && k === trace.key) return 'found';
    return trace.path.includes(k) ? 'visited' : 'dim';
  };

  const sorted = inorder(tree);
  const chain = buildTree(sorted);
  const balanced = buildTree(balancedOrder(sorted));

  return (
    <section className="screen">
      <h1>Sandbox</h1>
      <p className="lead">
        Build your own trees and see how their <strong>shape</strong> changes the number of comparisons. Watch each key
        travel down and compare its way to an <Term id="empty-spot">empty spot</Term>. Curious? Try{' '}
        <Term id="insert">inserting</Term> 1, 2, 3, 4, 5 in that order. What happens?
      </p>

      <ClassListTask onLoad={(ks) => { setTool('search'); load(ks); }} />

      <div className="two-col sandbox">
        <div className="card">
          <h2><span className="icon-title"><FlaskConical size={20} aria-hidden="true" /></span> Grow a tree</h2>
          <form onSubmit={submit} className="btn-row">
            <label htmlFor="keys" className="sr-only">Keys to insert</label>
            <input id="keys" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Keys, e.g. 50 30 70" inputMode="numeric" />
            <button type="submit" className="primary"><Plus size={18} aria-hidden="true" /> Insert</button>
            <button type="button" onClick={reset}><RotateCcw size={16} aria-hidden="true" /> Clear</button>
          </form>
          <div className="chip-row">
            <span className="chip-label">Try:</span>
            {PRESETS.map((p) => <button key={p.label} className="chip" onClick={() => load(p.keys)}>{p.label}</button>)}
            <button className="chip" onClick={() => load(Array.from({ length: 7 }, () => 1 + Math.floor(Math.random() * 99)).filter((k, i, a) => a.indexOf(k) === i))}>
              <Shuffle size={15} aria-hidden="true" /> Random
            </button>
          </div>
          {notice && <p className="muted small" role="status">{notice}</p>}
          <TreeView
            tree={tree}
            title="Your tree"
            nodeState={state}
            traveller={anim.traveller}
            ghost={anim.ghost ?? (trace?.emptySlot ? { ...trace.emptySlot, label: 'empty' } : null)}
            activeEdges={anim.busy ? anim.activeEdges : trace ? new Set(trace.path.slice(1)) : undefined}
          />
          <div className="anim-caption" aria-live="polite">
            {anim.busy
              ? <><span className="dotpulse" aria-hidden="true" />{anim.caption}</>
              : <span className="muted">Insertion order: {order.length ? order.join(', ') : '(none yet)'}</span>}
          </div>
          {anim.busy && (
            <div className="anim-controls">
              {animate && (
                <div className="segmented small-seg" role="radiogroup" aria-label="Animation speed">
                  {SPEEDS.map((s, i) => (
                    <button key={s.label} role="radio" aria-checked={speed === i} className={speed === i ? 'active' : ''} onClick={() => setSpeed(i)}>{s.label}</button>
                  ))}
                </div>
              )}
              <button className="ghost-btn" onClick={anim.skip}><SkipForward size={16} aria-hidden="true" /> Skip</button>
            </div>
          )}
          <Stats tree={tree} />
        </div>

        <div className="card">
          <div className="chip-row" role="tablist" aria-label="Tools">
            <button role="tab" aria-selected={tool === 'search'} className={tool === 'search' ? 'chip active' : 'chip'} onClick={() => setTool('search')}>
              <Search size={15} aria-hidden="true" /> Search your tree
            </button>
            <button role="tab" aria-selected={tool === 'shape'} className={tool === 'shape' ? 'chip active' : 'chip'} onClick={() => setTool('shape')}>
              <Shapes size={15} aria-hidden="true" /> Compare shapes
            </button>
          </div>

          {tool === 'search' && (
            <div role="tabpanel">
              <label htmlFor="skey">Type a key to see its search path on your tree:</label>
              <div className="btn-row">
                <input id="skey" type="number" inputMode="numeric" value={searchKey} onChange={(e) => setSearchKey(e.target.value)} disabled={!tree || anim.busy} placeholder={tree ? 'e.g. 5' : 'Grow a tree first'} />
              </div>
              {trace && (
                <p className={`feedback ${trace.found ? 'ok' : 'info'}`} role="status">
                  {trace.found ? '✓ Found' : '∅ Not in the tree'}: {trace.path.join(' → ')} · {trace.comparisons} comparison{trace.comparisons === 1 ? '' : 's'}
                </p>
              )}
            </div>
          )}

          {tool === 'shape' && (
            <div role="tabpanel">
              <p>Your keys as a <Term id="lopsided">lopsided</Term> chain (inserted in sorted order) and as a <Term id="balanced">balanced</Term> tree.</p>
              {sorted.length >= 3 && !anim.busy ? (
                <div className="tree-pair">
                  <figure>
                    <figcaption>Sorted order: {height(chain)} levels</figcaption>
                    <TreeView tree={chain} title="Lopsided tree from sorted insertion" />
                  </figure>
                  <figure>
                    <figcaption>Balanced: {height(balanced)} levels</figcaption>
                    <TreeView tree={balanced} title="Balanced tree with the same keys" />
                  </figure>
                </div>
              ) : <p className="muted">{anim.busy ? 'Wait for the tree to finish growing.' : 'Grow a tree with at least 3 keys first.'}</p>}
              <details className="reflect">
                <summary>Why does sorted order make a chain?</summary>
                <p>
                  Each new key is larger than every key already in the tree, so its walk always goes right, all the way to the
                  bottom. The tree becomes a single path, and a search may have to visit every node, just like a{' '}
                  <Term id="linear-search">linear search</Term> through a list. A balanced tree with the same keys keeps every
                  path short.
                </p>
              </details>
            </div>
          )}
        </div>
      </div>
      <ScreenActions primary={{ label: 'I’m ready for the final check', onClick: () => go(8) }} />
    </section>
  );
}
