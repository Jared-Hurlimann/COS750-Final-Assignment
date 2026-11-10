import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import lessons from '../content/lessons.json';
import { buildTree, findAnywhere, inorder, leaves, parentOf } from '../engine/bst';
import { RichText, Term } from '../components/Glossary';
import { ItemDots, Parts } from '../components/Parts';
import { ScreenActions } from '../components/ScreenActions';
import { TreeView, type NodeState } from '../components/TreeView';
import { ListenButton } from '../components/Narrate';
import type { ScreenProps } from './types';

const tree = buildTree([50, 30, 70, 20, 40, 60, 80]);

/** Which nodes each term lights up, plus captions. */
const TERM_VIEW: Record<string, { highlight: number[]; selected?: number[]; badges: Record<number, string> }> = {
  root: { highlight: [50], badges: { 50: 'root' } },
  parent: { highlight: [30], selected: [20, 40], badges: { 30: 'parent', 20: 'child', 40: 'child' } },
  child: { highlight: [20, 40], selected: [30], badges: { 20: 'left child', 40: 'right child', 30: 'parent' } },
  leaf: { highlight: leaves(tree), badges: Object.fromEntries(leaves(tree).map((k) => [k, 'leaf'])) },
  subtree: { highlight: [30, 20, 40], badges: { 30: 'left subtree of 50' } },
};

const TASKS = [
  { prompt: 'Tap the root.', check: (k: number) => k === 50, why: '50 is the root: the top node, with no parent.' },
  { prompt: 'Tap any leaf.', check: (k: number) => leaves(tree).includes(k), why: `Leaves have no children: ${leaves(tree).join(', ')}.` },
  { prompt: 'Tap the parent of 60.', check: (k: number) => k === 70, why: '70 is directly above 60, so it is 60’s parent.' },
];

const PARTS = ['Explore the words', 'Quick check'];

function describe(k: number): string {
  const n = findAnywhere(tree, k)!;
  const parts: string[] = [];
  const p = parentOf(tree, k);
  parts.push(p ? `child of ${p.key}` : 'the root (no parent)');
  const kids = [n.left?.key, n.right?.key].filter((x) => x !== undefined);
  parts.push(kids.length ? `parent of ${kids.join(' and ')}` : 'a leaf (no children)');
  const sub = inorder(n);
  if (sub.length > 1) parts.push(`top of a subtree holding ${sub.join(', ')}`);
  return `${k} is ${parts.join('; ')}.`;
}

export function TreeTerms({ go }: ScreenProps) {
  const [part, setPart] = useState(0);
  const [reached, setReached] = useState(0);
  const [term, setTerm] = useState<string>('root');
  const [seenTerms, setSeenTerms] = useState<Set<string>>(new Set(['root']));
  const [taskIdx, setTaskIdx] = useState(0);
  const [taskMsg, setTaskMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [inspect, setInspect] = useState<number | null>(null);
  const [found, setFound] = useState<number[]>([]);

  const openPart = (p: number) => { setPart(p); setReached((r) => Math.max(r, p)); };
  const view = TERM_VIEW[term];
  const def = lessons.terms.find((t) => t.id === term)!;
  const state = (k: number): NodeState | undefined =>
    view.highlight.includes(k) ? 'highlight' : view.selected?.includes(k) ? 'selected' : undefined;

  const task = TASKS[taskIdx];
  const tasksDone = taskIdx >= TASKS.length;
  const tap = (k: number) => {
    if (tasksDone) return;
    if (task.check(k)) {
      setTaskMsg({ ok: true, text: `✓ Yes. ${task.why}` });
      setFound((f) => [...f, k]);
      setTaskIdx((i) => i + 1);
    } else {
      setTaskMsg({ ok: false, text: `✗ ${describe(k)} Try again.` });
    }
  };

  return (
    <section className="screen">
      <h1>What is a tree?</h1>
      <Parts titles={PARTS} current={part} reached={reached} onSelect={openPart} />

      {part === 0 && (
        <>
          <p className="lead">
            A <Term id="tree">tree</Term> stores items in <Term id="node">nodes</Term> (the circles) joined by{' '}
            <Term id="edge">edges</Term> (the lines). In a <Term id="binary-tree">binary tree</Term> each node has at most
            two <Term id="child">children</Term>. The number inside each node is its <Term id="key">key</Term>.
          </p>
          <ListenButton text="A tree stores items in nodes, the circles, joined by edges, the lines. In a binary tree each node has at most two children. The number inside each node is its key." label="Listen to the intro" />
          <div className="card">
            <div className="split">
              <div>
                <h2>Tap a word to see it on the tree</h2>
                <div className="chip-row" role="tablist" aria-label="Tree terms">
                  {lessons.terms.map((t) => (
                    <button key={t.id} role="tab" aria-selected={term === t.id} className={term === t.id ? 'chip active' : 'chip'}
                      onClick={() => { setTerm(t.id); setSeenTerms((s) => new Set(s).add(t.id)); }}>
                      {t.name}
                    </button>
                  ))}
                </div>
                <p className="definition"><strong>{def.name}:</strong> <RichText text={def.definition} /></p>
                <ListenButton key={def.id} text={`${def.name}. ${def.definition}`} label={`Listen: ${def.name.toLowerCase()}`} />
                <p className="muted small" aria-live="polite">{inspect !== null ? describe(inspect) : 'Tip: you can also tap any node to see its role.'}</p>
              </div>
              <TreeView tree={tree} title={`Tree showing: ${def.name}`} nodeState={state} badges={view.badges} onNodeClick={setInspect} />
            </div>
          </div>
          <ScreenActions primary={{
            label: seenTerms.size < lessons.terms.length ? `Continue (${seenTerms.size} of ${lessons.terms.length} words seen)` : 'Continue: quick check',
            onClick: () => openPart(1),
          }} />
        </>
      )}

      {part === 1 && (
        <>
          <div className="card">
            <div className="split">
              <div>
                <h2>Quick check</h2>
                {!tasksDone ? (
                  <>
                    <ItemDots count={TASKS.length} current={taskIdx} label="Question" />
                    <p className="prompt big-prompt">{task.prompt}</p>
                    <ListenButton key={taskIdx} text={task.prompt} label="Read the question" />
                  </>
                ) : <p className="feedback ok">✓ All three done. You know your tree words.</p>}
                {taskMsg && !tasksDone && <p className={`feedback ${taskMsg.ok ? 'ok' : 'bad'}`} role="status">{taskMsg.text}</p>}
              </div>
              <TreeView tree={tree} title="Tap a node to answer" onNodeClick={tap} nodeState={(k) => (found.includes(k) ? 'found' : undefined)} />
            </div>
          </div>
          <ScreenActions
            primary={{ label: 'Next: the BST rule', onClick: () => go(2) }}
            secondary={[{ label: 'Back', icon: <ArrowLeft size={16} aria-hidden="true" />, onClick: () => setPart(0) }]}
          />
        </>
      )}
    </section>
  );
}
