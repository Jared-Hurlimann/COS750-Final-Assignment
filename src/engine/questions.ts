/**
 * Question generator for Practice (screen 6) and the Final check (screen 8).
 * Every question is tagged with the learning outcome it samples.
 */
import bank from '../content/questionBank.json';
import {
  buildTree,
  comparisons,
  depthOf,
  findAnywhere,
  height,
  inorder,
  leaves,
  parentOf,
  searchTrace,
  size,
  validateBST,
  type Tree,
} from './bst';
import { distinctInts, makeRng, pick, randInt, shuffle, type Rng } from './random';

export type LO = 'LO1' | 'LO2' | 'LO3' | 'LO4' | 'LO5';
export const CONTENT_LOS: LO[] = ['LO1', 'LO2', 'LO3', 'LO4', 'LO5'];
export type Difficulty = 1 | 2 | 3;

export interface McqQuestion {
  id: string;
  kind: 'mcq';
  lo: LO;
  prompt: string;
  tree?: Tree;
  /** Optional second tree for comparison questions. */
  tree2?: Tree;
  treeLabels?: [string, string];
  highlight?: number[];
  options: string[];
  answer: number;
  explanation: string;
}

/** Student walks the key down the tree with Go left / Go right / Found it. */
export interface TraceQuestion {
  id: string;
  kind: 'trace';
  lo: 'LO3';
  prompt: string;
  tree: Tree;
  key: number;
  explanation: string;
}

export type Question = McqQuestion | TraceQuestion;

interface BankItem {
  id: string;
  lo: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
const BANK = bank as BankItem[];

const SIZE_FOR: Record<Difficulty, [number, number]> = { 1: [4, 5], 2: [6, 8], 3: [9, 11] };

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${++counter}`;

function randomTree(rng: Rng, d: Difficulty): Tree {
  const [lo, hi] = SIZE_FOR[d];
  // Avoid long chains at low difficulty by retrying a few times.
  for (let attempt = 0; attempt < 20; attempt++) {
    const t = buildTree(distinctInts(rng, randInt(rng, lo, hi), 1, 99));
    if (height(t) <= (d === 1 ? 3 : d === 2 ? 4 : 5)) return t;
  }
  return buildTree(distinctInts(rng, lo, 1, 99));
}

/** Build MCQ options from a correct value and distractors, deduplicated and shuffled. */
function mcq(
  rng: Rng,
  base: Omit<McqQuestion, 'options' | 'answer' | 'kind' | 'id'>,
  correct: string,
  distractors: string[],
  maxOptions = 4,
): McqQuestion {
  const unique = [...new Set(distractors.filter((d) => d !== correct))];
  const options = shuffle(rng, [correct, ...shuffle(rng, unique).slice(0, maxOptions - 1)]);
  return { id: nextId(base.lo), kind: 'mcq', ...base, options, answer: options.indexOf(correct) };
}

/** A key that is NOT in the tree, chosen near existing keys so the search goes deep. */
function absentKey(rng: Rng, t: Tree): number {
  const ks = inorder(t);
  for (let i = 0; i < 50; i++) {
    const k = pick(rng, ks) + pick(rng, [-1, 1, -2, 2]);
    if (k >= 0 && !ks.includes(k)) return k;
  }
  return 100;
}

const arrow = (path: number[]) => path.join(' → ');

// ---------------------------------------------------------------------------
// Per-outcome generators
// ---------------------------------------------------------------------------

function genLO1(rng: Rng, d: Difficulty): McqQuestion {
  const t = randomTree(rng, d)!;
  const ks = inorder(t);
  const variant = randInt(rng, 0, 3);
  if (variant === 0) {
    return mcq(rng, {
      lo: 'LO1', tree: t,
      prompt: 'Which key is at the root of this tree?',
      explanation: `The root is the top node, ${t.key}. It is the only node without a parent.`,
    }, String(t.key), ks.filter((k) => k !== t.key).map(String));
  }
  if (variant === 1) {
    const nonRoot = ks.filter((k) => k !== t.key);
    const child = pick(rng, nonRoot);
    const parent = parentOf(t, child)!.key;
    const own = findAnywhere(t, child)!;
    const distract = [own.left?.key, own.right?.key, ...ks].filter((k): k is number => k !== undefined && k !== parent && k !== child);
    return mcq(rng, {
      lo: 'LO1', tree: t, highlight: [child],
      prompt: `What is the parent of ${child}?`,
      explanation: `${parent} is directly above ${child} and joined to it by an edge, so ${parent} is its parent.`,
    }, String(parent), distract.map(String));
  }
  if (variant === 2) {
    const leafKeys = leaves(t);
    const leaf = pick(rng, leafKeys);
    const internal = ks.filter((k) => !leafKeys.includes(k));
    return mcq(rng, {
      lo: 'LO1', tree: t,
      prompt: 'Which of these nodes is a leaf?',
      explanation: `${leaf} has no children, so it is a leaf. The leaves of this tree are ${leafKeys.join(', ')}.`,
    }, String(leaf), internal.map(String));
  }
  const side = t.left && (rng() < 0.5 || !t.right) ? 'left' : 'right';
  const sub = side === 'left' ? t.left : t.right;
  const n = size(sub);
  return mcq(rng, {
    lo: 'LO1', tree: t,
    prompt: `How many nodes are in the ${side} subtree of the root?`,
    explanation: `The ${side} subtree of ${t.key} is ${sub ? sub.key : 'empty'} and everything below it: ${n} node${n === 1 ? '' : 's'} (${inorder(sub).join(', ') || 'none'}).`,
  }, String(n), [n - 1, n + 1, n + 2, size(t), 1].filter((x) => x >= 0).map(String));
}

/** Replace one key in a tree (shape stays the same). */
function relabel(t: Tree, from: number, to: number): Tree {
  if (t === null) return null;
  return { key: t.key === from ? to : t.key, left: relabel(t.left, from, to), right: relabel(t.right, from, to) };
}

/**
 * Break the BST rule. When `deep`, the broken node is still on the correct
 * side of its own parent but on the wrong side of a higher ancestor.
 */
export function corruptTree(rng: Rng, t: Tree, deep: boolean): Tree {
  const ks = inorder(t);
  const candidates = ks.filter((k) => depthOf(t, k) >= (deep ? 2 : 1));
  for (let attempt = 0; attempt < 200; attempt++) {
    const target = pick(rng, candidates.length ? candidates : ks);
    const newKey = randInt(rng, 1, 99);
    if (ks.includes(newKey)) continue;
    const bad = relabel(t, target, newKey);
    const v = validateBST(bad);
    if (v.valid) continue;
    if (deep) {
      const p = parentOf(bad, newKey);
      if (p === null) continue;
      const okWithParent = p.left?.key === newKey ? newKey < p.key : newKey > p.key;
      if (!okWithParent) continue;
    }
    return bad;
  }
  // Fallback: move the root key past every key on one side; always invalid.
  return t!.right ? relabel(t, t!.key, ks[ks.length - 1] + 1) : relabel(t, t!.key, ks[0] - 1);
}

function genLO2(rng: Rng, d: Difficulty): McqQuestion {
  if (rng() < 0.3) {
    const t = randomTree(rng, d)!;
    const k = absentKey(rng, t);
    const slot = searchTrace(t, k).emptySlot!;
    const label = (p: number, s: string) => `${s} child of ${p}`;
    const correct = label(slot.parent, slot.side);
    const others = inorder(t).flatMap((p) => [label(p, 'left'), label(p, 'right')]);
    return mcq(rng, {
      lo: 'LO2', tree: t,
      prompt: `Where does ${k} belong in this BST?`,
      explanation: `Follow the rule from the root: ${arrow(searchTrace(t, k).path)}. The empty spot is the ${correct}.`,
    }, correct, others);
  }
  const base = randomTree(rng, Math.max(2, d) as Difficulty);
  const broken = rng() < 0.55;
  const t = broken ? corruptTree(rng, base, d >= 2 && rng() < 0.7) : base;
  const v = validateBST(t);
  const options = ['Yes, it obeys the BST rule', 'No, it breaks the BST rule'];
  return {
    id: nextId('LO2'), kind: 'mcq', lo: 'LO2', tree: t,
    prompt: 'Is this tree a binary search tree?',
    options,
    answer: v.valid ? 0 : 1,
    explanation: v.valid
      ? 'Yes. For every node, all keys in its left subtree are smaller and all keys in its right subtree are larger.'
      : `No. ${v.explanation}`,
  };
}

function genLO3(rng: Rng, d: Difficulty, allowTrace = true): Question {
  const t = randomTree(rng, d)!;
  const present = rng() < 0.5;
  const key = present ? pick(rng, inorder(t).filter((k) => k !== t.key)) : absentKey(rng, t);
  const trace = searchTrace(t, key);
  const ending = trace.found ? `found at ${key}` : `then an empty spot, so ${key} is not in the tree`;
  const explanation = `Path: ${arrow(trace.path)}, ${ending}.`;
  if (allowTrace && rng() < 0.5) {
    return { id: nextId('LO3'), kind: 'trace', lo: 'LO3', tree: t, key, prompt: `Search for ${key}. Walk it down the tree.`, explanation };
  }
  // Distractors: paths of other searches, the path with one wrong turn, a truncated path.
  const distract = new Set<string>();
  for (const k of inorder(t)) distract.add(arrow(searchTrace(t, k).path));
  distract.add(arrow(trace.path.slice(0, -1)));
  distract.add(arrow(inorder(t).slice(0, trace.path.length)));
  distract.delete('');
  return mcq(rng, {
    lo: 'LO3', tree: t,
    prompt: `Which nodes are visited, in order, when searching for ${key}?`,
    explanation,
  }, arrow(trace.path), [...distract]);
}

function genLO4(rng: Rng, d: Difficulty): McqQuestion {
  const t = randomTree(rng, d)!;
  if (rng() < 0.3) {
    const h = height(t);
    return mcq(rng, {
      lo: 'LO4', tree: t,
      prompt: 'In the worst case, how many comparisons does a successful search in this tree need?',
      explanation: `The deepest node is on level ${h}. Finding it means comparing with one node on every level: ${h} comparisons.`,
    }, String(h), [h - 1, h + 1, size(t), Math.ceil(size(t) / 2)].filter((x) => x > 0).map(String));
  }
  const present = rng() < 0.5;
  const key = present ? pick(rng, inorder(t)) : absentKey(rng, t);
  const c = comparisons(t, key);
  const tr = searchTrace(t, key);
  return mcq(rng, {
    lo: 'LO4', tree: t,
    prompt: `How many comparisons does a search for ${key} need? (Count one comparison per node visited.)`,
    explanation: `The search compares ${key} with ${arrow(tr.path)}: ${c} comparison${c === 1 ? '' : 's'}${tr.found ? '' : ', then reaches an empty spot'}.`,
  }, String(c), [c - 1, c + 1, c + 2, size(t)].filter((x) => x > 0).map(String));
}

/** Insertion order that produces a balanced tree from sorted keys. */
export function balancedOrder(sorted: number[]): number[] {
  if (sorted.length === 0) return [];
  const mid = Math.floor(sorted.length / 2);
  return [sorted[mid], ...balancedOrder(sorted.slice(0, mid)), ...balancedOrder(sorted.slice(mid + 1))];
}

function genLO5(rng: Rng, d: Difficulty): McqQuestion {
  const n = d === 1 ? 5 : d === 2 ? 6 : 7;
  const sorted = distinctInts(rng, n, 1, 60).sort((a, b) => a - b);
  const variant = randInt(rng, 0, 2);
  if (variant === 0) {
    const chain = buildTree(sorted);
    const bal = buildTree(balancedOrder(sorted));
    const flip = rng() < 0.5;
    const [a, b] = flip ? [bal, chain] : [chain, bal];
    const correct = flip ? 'Tree A' : 'Tree B';
    return {
      id: nextId('LO5'), kind: 'mcq', lo: 'LO5', tree: a, tree2: b, treeLabels: ['Tree A', 'Tree B'],
      prompt: 'Both trees hold the same keys. Which one needs fewer comparisons in the worst case?',
      options: ['Tree A', 'Tree B', 'They need the same'],
      answer: correct === 'Tree A' ? 0 : 1,
      explanation: `The balanced tree has ${height(bal)} levels, so at most ${height(bal)} comparisons. The lopsided one has ${height(chain)} levels, so up to ${height(chain)}.`,
    };
  }
  if (variant === 1) {
    return mcq(rng, {
      lo: 'LO5',
      prompt: `The keys ${sorted.join(', ')} are inserted in this order into an empty BST. How many comparisons are needed to find ${sorted[n - 1]}?`,
      explanation: `Sorted insertion builds a chain: every key goes right of the previous one. Finding the last key visits all ${n} nodes.`,
    }, String(n), [String(height(buildTree(balancedOrder(sorted)))), '1', String(n - 1), String(Math.ceil(n / 2))]);
  }
  const order = shuffle(rng, sorted);
  const h = height(buildTree(order));
  return mcq(rng, {
    lo: 'LO5', tree: buildTree(order),
    prompt: `This tree was built by inserting ${order.join(', ')}. Which insertion order of the same keys gives the TALLEST tree?`,
    explanation: `Sorted order (smallest first, or largest first) makes every key go the same way, giving a chain of ${n} levels. This tree has ${h}.`,
  }, sorted.join(', '), [balancedOrder(sorted).join(', '), order.join(', '), shuffle(rng, sorted).join(', ')]);
}

function bankQuestion(rng: Rng, lo: LO): McqQuestion | null {
  const items = BANK.filter((b) => b.lo === lo);
  if (items.length === 0) return null;
  const item = pick(rng, items);
  const correct = item.options[item.answer];
  const options = item.options.length > 2 ? shuffle(rng, item.options) : item.options;
  return { id: nextId(item.id), kind: 'mcq', lo, prompt: item.prompt, options, answer: options.indexOf(correct), explanation: item.explanation };
}

export function generateQuestion(lo: LO, d: Difficulty, rng: Rng, opts: { allowTrace?: boolean; allowBank?: boolean } = {}): Question {
  const { allowTrace = true, allowBank = true } = opts;
  if (allowBank && rng() < 0.2) {
    const b = bankQuestion(rng, lo);
    if (b) return b;
  }
  switch (lo) {
    case 'LO1': return genLO1(rng, d);
    case 'LO2': return genLO2(rng, d);
    case 'LO3': return genLO3(rng, d, allowTrace);
    case 'LO4': return genLO4(rng, d);
    case 'LO5': return genLO5(rng, d);
  }
}

/** Practice (screen 6) samples LO2–LO5 at the current difficulty. */
export function practiceQuestion(d: Difficulty, rng: Rng): Question {
  return generateQuestion(pick(rng, ['LO2', 'LO3', 'LO4', 'LO5'] as LO[]), d, rng);
}

/** Final check (screen 8): 10 questions, two per content outcome LO1–LO5. */
export function buildFinalCheck(seed: number): Question[] {
  const rng = makeRng(seed);
  const qs: Question[] = [];
  for (const lo of CONTENT_LOS) {
    if (lo === 'LO3') {
      qs.push(genLO3(rng, 2, false));
      qs.push({ ...(genLO3Trace(rng)) });
    } else if (lo === 'LO5') {
      qs.push(genLO5(rng, 2));
      qs.push(bankQuestion(rng, 'LO5') ?? genLO5(rng, 3));
    } else {
      qs.push(generateQuestion(lo, 2, rng, { allowBank: false }));
      qs.push(generateQuestion(lo, 3, rng));
    }
  }
  return qs;
}

function genLO3Trace(rng: Rng): TraceQuestion {
  for (;;) {
    const q = genLO3(rng, 2, true);
    if (q.kind === 'trace') return q;
  }
}

export function isCorrect(q: McqQuestion, choice: number): boolean {
  return q.answer === choice;
}
