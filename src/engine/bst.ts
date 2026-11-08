/**
 * BST engine: pure functions with no React, so every rule the app teaches
 * is covered by unit tests (see bst.test.ts).
 *
 * Counting convention used throughout the app: ONE comparison per node
 * visited (each visit compares the key with that node's key once,
 * three-way: equal / smaller / larger).
 */

export interface BSTNode {
  key: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

export type Tree = BSTNode | null;
export type Side = 'left' | 'right';

export function node(key: number, left: Tree = null, right: Tree = null): BSTNode {
  return { key, left, right };
}

/** Insert a key, returning a NEW tree. Duplicate keys are ignored. */
export function insert(root: Tree, key: number): BSTNode {
  if (root === null) return node(key);
  if (key < root.key) return { ...root, left: insert(root.left, key) };
  if (key > root.key) return { ...root, right: insert(root.right, key) };
  return root;
}

/** Build a tree by inserting keys in the given order. */
export function buildTree(keys: readonly number[]): Tree {
  return keys.reduce<Tree>((t, k) => insert(t, k), null);
}

/**
 * Build a tree of any shape (including ones that break the BST rule) from a
 * level-order array where `null` marks an empty position.
 * Example: [8, 3, 10, null, 6] is 8 with children 3 and 10, and 3 has right child 6.
 */
export function fromLevelOrder(values: readonly (number | null)[]): Tree {
  if (values.length === 0 || values[0] === null) return null;
  const root = node(values[0]);
  const queue: BSTNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < values.length) {
    const parent = queue.shift()!;
    for (const side of ['left', 'right'] as const) {
      if (i >= values.length) break;
      const v = values[i++];
      if (v !== null && v !== undefined) {
        const child = node(v);
        parent[side] = child;
        queue.push(child);
      }
    }
  }
  return root;
}

export function inorder(root: Tree): number[] {
  return root === null ? [] : [...inorder(root.left), root.key, ...inorder(root.right)];
}

export function keys(root: Tree): number[] {
  return inorder(root);
}

export function size(root: Tree): number {
  return root === null ? 0 : 1 + size(root.left) + size(root.right);
}

/** Height counted in LEVELS (nodes on the longest root-to-leaf path). Empty tree = 0. */
export function height(root: Tree): number {
  return root === null ? 0 : 1 + Math.max(height(root.left), height(root.right));
}

export function find(root: Tree, key: number): BSTNode | null {
  let current = root;
  while (current !== null) {
    if (key === current.key) return current;
    current = key < current.key ? current.left : current.right;
  }
  return null;
}

/** Find a node by key in a tree of ANY shape (does not rely on the BST rule). */
export function findAnywhere(root: Tree, key: number): BSTNode | null {
  if (root === null) return null;
  if (root.key === key) return root;
  return findAnywhere(root.left, key) ?? findAnywhere(root.right, key);
}

export function parentOf(root: Tree, key: number): BSTNode | null {
  if (root === null) return null;
  if (root.left?.key === key || root.right?.key === key) return root;
  return parentOf(root.left, key) ?? parentOf(root.right, key);
}

export function leaves(root: Tree): number[] {
  if (root === null) return [];
  if (root.left === null && root.right === null) return [root.key];
  return [...leaves(root.left), ...leaves(root.right)];
}

export function depthOf(root: Tree, key: number, depth = 0): number {
  if (root === null) return -1;
  if (root.key === key) return depth;
  const l = depthOf(root.left, key, depth + 1);
  return l !== -1 ? l : depthOf(root.right, key, depth + 1);
}

// ---------------------------------------------------------------------------
// Search trace
// ---------------------------------------------------------------------------

export type Move = 'found' | 'left' | 'right';

export interface SearchStep {
  /** Key of the node being compared with. */
  at: number;
  /** Outcome of comparing the search key with `at`. */
  move: Move;
  /** Plain-language explanation of this step. */
  explanation: string;
}

export interface SearchTrace {
  key: number;
  steps: SearchStep[];
  found: boolean;
  /** Keys of the nodes visited, in order. */
  path: number[];
  comparisons: number;
  /** When the key is absent: the empty position where the search ended. */
  emptySlot: { parent: number; side: Side } | null;
}

export function moveFor(key: number, at: number): Move {
  if (key === at) return 'found';
  return key < at ? 'left' : 'right';
}

export function explainStep(key: number, at: number, nextEmpty: boolean): string {
  if (key === at) return `${key} = ${at}, so we have found the key.`;
  const side = key < at ? 'left' : 'right';
  const rel = key < at ? 'smaller than' : 'larger than';
  const base = `${key} is ${rel} ${at}, so we go ${side}.`;
  return nextEmpty
    ? `${base} The ${side} subtree of ${at} is empty, so ${key} is not in the tree.`
    : `${base} The whole ${side === 'left' ? 'right' : 'left'} subtree of ${at} can be ignored.`;
}

/** Trace an iterative BST search for `key`, recording every comparison. */
export function searchTrace(root: Tree, key: number): SearchTrace {
  const steps: SearchStep[] = [];
  let current = root;
  let emptySlot: SearchTrace['emptySlot'] = null;
  while (current !== null) {
    const move = moveFor(key, current.key);
    const next = move === 'found' ? null : current[move];
    steps.push({ at: current.key, move, explanation: explainStep(key, current.key, move !== 'found' && next === null) });
    if (move === 'found') break;
    if (next === null) emptySlot = { parent: current.key, side: move };
    current = next;
  }
  const found = steps.length > 0 && steps[steps.length - 1].move === 'found';
  return {
    key,
    steps,
    found,
    path: steps.map((s) => s.at),
    comparisons: steps.length,
    emptySlot,
  };
}

/** Comparisons needed to search for `key` (present or absent). */
export function comparisons(root: Tree, key: number): number {
  return searchTrace(root, key).comparisons;
}

/** Worst case for a successful search = height in levels. */
export function worstCaseComparisons(root: Tree): number {
  return height(root);
}

/** Average comparisons over all keys in the tree (successful searches). */
export function averageComparisons(root: Tree): number {
  const ks = inorder(root);
  if (ks.length === 0) return 0;
  return ks.reduce((sum, k) => sum + depthOf(root, k) + 1, 0) / ks.length;
}

// ---------------------------------------------------------------------------
// Validation of the BST rule
// ---------------------------------------------------------------------------

export type Validation =
  | { valid: true }
  | {
      valid: false;
      /** The node in the wrong place. */
      offender: number;
      /** The ancestor whose rule it breaks. */
      ancestor: number;
      /** Which subtree of the ancestor the offender sits in. */
      side: Side;
      explanation: string;
    };

/**
 * Check the BST rule over WHOLE subtrees, not only parent/child pairs.
 * Reports the first violation found in pre-order, against the nearest
 * ancestor whose bound it breaks.
 */
export function validateBST(root: Tree): Validation {
  interface Bound { key: number; side: Side }
  function walk(n: Tree, lower: Bound | null, upper: Bound | null): Validation {
    if (n === null) return { valid: true };
    // lower bound comes from an ancestor whose RIGHT subtree we are in
    if (lower !== null && n.key <= lower.key) {
      return violation(n.key, lower.key, 'right');
    }
    if (upper !== null && n.key >= upper.key) {
      return violation(n.key, upper.key, 'left');
    }
    const l = walk(n.left, lower, { key: n.key, side: 'left' });
    if (!l.valid) return l;
    return walk(n.right, { key: n.key, side: 'right' }, upper);
  }
  return walk(root, null, null);
}

function violation(offender: number, ancestor: number, side: Side): Validation {
  const need = side === 'left' ? 'smaller' : 'larger';
  return {
    valid: false,
    offender,
    ancestor,
    side,
    explanation: `${offender} is in the ${side} subtree of ${ancestor}, but every key there must be ${need} than ${ancestor}.`,
  };
}

// ---------------------------------------------------------------------------
// Layout for drawing
// ---------------------------------------------------------------------------

export interface Positioned {
  key: number;
  /** Column (in-order index). */
  x: number;
  /** Row (depth, root = 0). */
  y: number;
  parent: number | null;
  side: Side | null;
}

/** Position each node: x = in-order index, y = depth. Never overlaps. */
export function layout(root: Tree): Positioned[] {
  const out: Positioned[] = [];
  let col = 0;
  function walk(n: Tree, depth: number, parent: number | null, side: Side | null) {
    if (n === null) return;
    walk(n.left, depth + 1, n.key, 'left');
    out.push({ key: n.key, x: col++, y: depth, parent, side });
    walk(n.right, depth + 1, n.key, 'right');
  }
  walk(root, 0, null, null);
  return out;
}
