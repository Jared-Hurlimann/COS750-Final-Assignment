import { describe, expect, it } from 'vitest';
import {
  averageComparisons,
  buildTree,
  comparisons,
  fromLevelOrder,
  height,
  inorder,
  insert,
  layout,
  leaves,
  parentOf,
  searchTrace,
  size,
  validateBST,
  worstCaseComparisons,
} from './bst';

const example = buildTree([50, 30, 70, 20, 40, 60, 80]);

describe('insert / buildTree', () => {
  it('keeps keys in sorted in-order sequence', () => {
    expect(inorder(example)).toEqual([20, 30, 40, 50, 60, 70, 80]);
  });

  it('ignores duplicates', () => {
    expect(size(insert(example, 40))).toBe(7);
  });

  it('does not mutate the original tree', () => {
    const before = inorder(example);
    insert(example, 65);
    expect(inorder(example)).toEqual(before);
  });

  it('sorted insertion order gives a lopsided tree', () => {
    expect(height(buildTree([1, 2, 3, 4, 5]))).toBe(5);
    expect(height(buildTree([3, 2, 4, 1, 5]))).toBe(3);
  });
});

describe('searchTrace', () => {
  it('traces a key that is present', () => {
    const t = searchTrace(example, 60);
    expect(t.found).toBe(true);
    expect(t.path).toEqual([50, 70, 60]);
    expect(t.steps.map((s) => s.move)).toEqual(['right', 'left', 'found']);
    expect(t.comparisons).toBe(3);
    expect(t.emptySlot).toBeNull();
  });

  it('traces a key that is absent and reports the empty position', () => {
    const t = searchTrace(example, 45);
    expect(t.found).toBe(false);
    expect(t.path).toEqual([50, 30, 40]);
    expect(t.comparisons).toBe(3);
    expect(t.emptySlot).toEqual({ parent: 40, side: 'right' });
  });

  it('finds the root in one comparison', () => {
    expect(comparisons(example, 50)).toBe(1);
  });

  it('handles an empty tree', () => {
    const t = searchTrace(null, 5);
    expect(t.found).toBe(false);
    expect(t.comparisons).toBe(0);
  });

  it('explains every step', () => {
    for (const s of searchTrace(example, 45).steps) expect(s.explanation.length).toBeGreaterThan(10);
  });
});

describe('validateBST', () => {
  it('accepts a tree built by insertion', () => {
    expect(validateBST(example).valid).toBe(true);
  });

  it('catches a direct child on the wrong side', () => {
    const v = validateBST(fromLevelOrder([50, 70, 30]));
    expect(v.valid).toBe(false);
  });

  it('catches a grandchild that breaks an ancestor rule (whole-subtree property)', () => {
    // 60 is a valid right child of 30 but sits in the LEFT subtree of 50.
    const v = validateBST(fromLevelOrder([50, 30, 70, null, 60]));
    expect(v).toMatchObject({ valid: false, offender: 60, ancestor: 50, side: 'left' });
  });

  it('treats an empty tree as valid', () => {
    expect(validateBST(null).valid).toBe(true);
  });
});

describe('tree measures', () => {
  it('computes leaves and parents', () => {
    expect(leaves(example)).toEqual([20, 40, 60, 80]);
    expect(parentOf(example, 60)?.key).toBe(70);
    expect(parentOf(example, 50)).toBeNull();
  });

  it('worst case equals height', () => {
    expect(worstCaseComparisons(example)).toBe(3);
  });

  it('average comparisons for a perfect tree of 7', () => {
    expect(averageComparisons(example)).toBeCloseTo((1 + 2 * 2 + 4 * 3) / 7);
  });

  it('layout gives unique columns in in-order sequence', () => {
    const pos = layout(example);
    expect(pos.map((p) => p.key)).toEqual(inorder(example));
    expect(pos.find((p) => p.key === 50)).toMatchObject({ x: 3, y: 0, parent: null });
  });
});
