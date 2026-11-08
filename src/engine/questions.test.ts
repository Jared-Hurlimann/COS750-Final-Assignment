import { describe, expect, it } from 'vitest';
import { buildTree, fromLevelOrder, height, parentOf, validateBST } from './bst';
import { balancedOrder, buildFinalCheck, corruptTree, CONTENT_LOS, generateQuestion, type Difficulty } from './questions';
import { makeRng } from './random';

describe('generateQuestion', () => {
  it('always produces a well-formed question for every outcome and difficulty', () => {
    const rng = makeRng(42);
    for (let i = 0; i < 300; i++) {
      for (const lo of CONTENT_LOS) {
        const q = generateQuestion(lo, ((i % 3) + 1) as Difficulty, rng);
        expect(q.lo).toBe(lo);
        expect(q.explanation.length).toBeGreaterThan(0);
        if (q.kind === 'mcq') {
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
        } else {
          expect(q.tree).not.toBeNull();
        }
      }
    }
  });

  it('marks "is this a BST?" answers consistently with validateBST', () => {
    const rng = makeRng(7);
    let checked = 0;
    for (let i = 0; i < 300; i++) {
      const q = generateQuestion('LO2', 3, rng, { allowBank: false });
      if (q.kind === 'mcq' && q.prompt.startsWith('Is this tree')) {
        expect(q.answer === 0).toBe(validateBST(q.tree!).valid);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(50);
  });
});

describe('corruptTree', () => {
  it('deep corruption is valid with its parent but breaks an ancestor', () => {
    const rng = makeRng(3);
    const base = buildTree([50, 30, 70, 20, 40, 60, 80]);
    for (let i = 0; i < 50; i++) {
      const bad = corruptTree(rng, base, true);
      const v = validateBST(bad);
      expect(v.valid).toBe(false);
      if (!v.valid) {
        const p = parentOf(bad, v.offender)!;
        expect(p.key).not.toBe(v.ancestor);
      }
    }
  });

  it('fallback still breaks the rule for a chain', () => {
    expect(validateBST(corruptTree(makeRng(1), fromLevelOrder([5, null, 8]), true)).valid).toBe(false);
  });
});

describe('balancedOrder', () => {
  it('gives minimal height', () => {
    expect(height(buildTree(balancedOrder([1, 2, 3, 4, 5, 6, 7])))).toBe(3);
  });
});

describe('buildFinalCheck', () => {
  it('has 10 questions, two per outcome LO1 to LO5', () => {
    const qs = buildFinalCheck(123);
    expect(qs).toHaveLength(10);
    for (const lo of CONTENT_LOS) expect(qs.filter((q) => q.lo === lo)).toHaveLength(2);
    expect(qs.some((q) => q.kind === 'trace')).toBe(true);
  });
});
