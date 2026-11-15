import { useEffect, useRef, useState } from 'react';
import { insert, searchTrace, type Side, type Tree } from '../engine/bst';
import { useSettings } from '../settings';
import type { Traveller } from './TreeView';

/**
 * Animated insertion for the LEARNING screens only (rule screen, sandbox).
 * Each key travels down from the root, comparing at every node, then lands
 * in the empty spot where the walk ends. Challenges never use this: there
 * the student has to make each decision themselves.
 *
 * With reduced motion (or `instant`), keys are inserted immediately.
 */
interface Job {
  key: number;
  path: number[];
  slot: { parent: number; side: Side } | 'root' | null; // null = duplicate
  step: number;
}

export interface InsertAnimation {
  enqueue: (keys: number[], opts?: { instant?: boolean }) => void;
  skip: () => void;
  /** Drop the current and queued keys without inserting them. */
  cancel: () => void;
  /** Cancel everything and replace the tree (e.g. Clear, or loading a preset). */
  reset: (t: Tree) => void;
  busy: boolean;
  traveller: Traveller | null;
  ghost: { parent: number; side: Side; label?: string } | null;
  activeEdges: Set<number>;
  visited: Set<number>;
  /** Plain-language description of the current step (also read out by screen readers). */
  caption: string;
}

export function useInsertAnimation(
  tree: Tree,
  setTree: (fn: (t: Tree) => Tree) => void,
  stepMs = 950,
  onInserted?: (key: number, added: boolean) => void,
): InsertAnimation {
  const { animate } = useSettings();
  const [job, setJobState] = useState<Job | null>(null);
  const jobRef = useRef<Job | null>(null);
  const queue = useRef<number[]>([]);
  // The tree as it will be once pending commits render (keeps planning in sync).
  const treeRef = useRef(tree);
  treeRef.current = tree;
  const insertedCb = useRef(onInserted);
  insertedCb.current = onInserted;

  const setJob = (j: Job | null) => { jobRef.current = j; setJobState(j); };

  const plan = (key: number, t: Tree): Job => {
    const tr = searchTrace(t, key);
    return { key, path: tr.path, slot: t === null ? 'root' : tr.found ? null : tr.emptySlot, step: 0 };
  };

  const commit = (keys: number[]) => {
    let out = treeRef.current;
    for (const k of keys) {
      const before = out;
      out = insert(out, k);
      insertedCb.current?.(k, before !== out);
    }
    treeRef.current = out;
    setTree(() => out);
  };

  const startNext = () => {
    const k = queue.current.shift();
    setJob(k === undefined ? null : plan(k, treeRef.current));
  };

  const enqueue = (keys: number[], opts: { instant?: boolean } = {}) => {
    if (!animate || opts.instant) {
      commit(keys);
      return;
    }
    queue.current.push(...keys);
    if (!jobRef.current) startNext();
  };

  const skip = () => {
    const keys = [...(jobRef.current ? [jobRef.current.key] : []), ...queue.current];
    queue.current = [];
    setJob(null);
    commit(keys);
  };

  const cancel = () => { queue.current = []; setJob(null); };
  const reset = (t: Tree) => { cancel(); treeRef.current = t; setTree(() => t); };

  // Advance the current job on a timer: compare at each node, land, then commit.
  useEffect(() => {
    if (!job) return;
    const last = job.path.length + 1;
    const id = window.setTimeout(() => {
      if (job.step < last) {
        setJob({ ...job, step: job.step + 1 });
        return;
      }
      commit([job.key]);
      startNext();
    }, job.step === last ? stepMs * 0.6 : stepMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, stepMs]);

  // ---- Derived view state ----
  let traveller: Traveller | null = null;
  let ghost: InsertAnimation['ghost'] = null;
  let caption = '';
  const visited = new Set<number>();
  const activeEdges = new Set<number>();

  if (job) {
    const { key, path, slot, step } = job;
    path.slice(0, Math.min(step, path.length)).forEach((k) => visited.add(k));
    path.slice(1, Math.min(step + 1, path.length)).forEach((k) => activeEdges.add(k));
    if (step === 0) {
      traveller = { key, at: path.length ? path[0] : 'root' };
      caption = path.length ? `Inserting ${key}: start at the root, ${path[0]}.` : `The tree is empty, so ${key} becomes the root.`;
    } else if (step <= path.length) {
      const at = path[step - 1];
      const sign = key === at ? '=' : key < at ? '<' : '>';
      traveller = { key, at, sign };
      caption = key === at
        ? `${key} = ${at}: it is already in the tree. A BST holds each key only once, so nothing changes.`
        : `${key} ${sign} ${at}, so go ${key < at ? 'left' : 'right'}.`;
    } else if (slot === 'root') {
      traveller = { key, at: 'root' };
      caption = `${key} is now the root.`;
    } else if (slot) {
      traveller = { key, at: slot };
      ghost = { ...slot };
      caption = `Empty spot found: ${key} becomes the ${slot.side} child of ${slot.parent}. It took ${path.length} comparison${path.length === 1 ? '' : 's'}, exactly like a search.`;
    } else {
      traveller = { key, at: path[path.length - 1], sign: '=' };
      caption = `${key} is already in the tree, so it is skipped.`;
    }
  }

  return { enqueue, skip, cancel, reset, busy: job !== null, traveller, ghost, activeEdges, visited, caption };
}
