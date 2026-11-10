import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { initialProgress, type Progress } from '../progress';
import { buildFinalCheck, CONTENT_LOS } from '../engine/questions';
import { QuestionCard } from '../components/QuestionCard';
import { Welcome } from './Welcome';
import { TreeTerms } from './TreeTerms';
import { BstRule } from './BstRule';
import { HowSearch } from './HowSearch';
import { WorkedExample } from './WorkedExample';
import { YourTurn } from './YourTurn';
import { Practice } from './Practice';
import { Sandbox } from './Sandbox';
import { FinalCheck } from './FinalCheck';
import { Results, summaryText } from './Results';
import { LeaveDialog } from '../components/LeaveDialog';
import { ListenButton } from '../components/Narrate';
import { buildTree, height, searchTrace } from '../engine/bst';
import lessons from '../content/lessons.json';
import glossary from '../content/glossary.json';

const props = (progress: Progress = initialProgress) => ({ go: () => {}, update: () => {}, progress });

describe('every screen renders', () => {
  const screens = { Welcome, TreeTerms, BstRule, HowSearch, WorkedExample, YourTurn, Practice, Sandbox, FinalCheck, Results };
  for (const [name, Screen] of Object.entries(screens)) {
    it(name, () => {
      expect(renderToString(createElement(Screen, props())).length).toBeGreaterThan(100);
    });
  }

  it('Results with a completed attempt', () => {
    const qs = buildFinalCheck(1);
    const byLO = Object.fromEntries(CONTENT_LOS.map((lo) => [lo, { correct: 1, total: 2 }])) as Progress['attempts'][0]['byLO'];
    const p: Progress = {
      ...initialProgress,
      attempts: [{ date: new Date().toISOString(), correct: 5, total: 10, byLO, answers: qs.map((question, i) => ({ question, correct: i % 2 === 0 })) }],
    };
    const html = renderToString(createElement(Results, props(p)));
    expect(html).toContain('Nearly there');
  });

  it('QuestionCard renders all generated final-check questions', () => {
    for (let seed = 0; seed < 30; seed++) {
      for (const q of buildFinalCheck(seed)) {
        renderToString(createElement(QuestionCard, { question: q, feedback: 'deferred', onAnswered: () => {} }));
      }
    }
  });
});

describe('summary, narration and leaving the check', () => {
  const qs = buildFinalCheck(2);
  const byLO = Object.fromEntries(CONTENT_LOS.map((lo) => [lo, { correct: 2, total: 2 }])) as Progress['attempts'][0]['byLO'];
  const attempt = { date: new Date().toISOString(), correct: 10, total: 10, byLO, answers: qs.map((question) => ({ question, correct: true })) };

  it('downloadable summary has the rule, the pseudocode and the per-outcome results, without markup', () => {
    const text = summaryText(attempt, 'LO3');
    expect(text).toContain('THE BST RULE');
    expect(text).toContain('while current != null');
    expect(text).toContain('LO5 Tree shape: 2/2');
    expect(text).toContain('Lecture-ready');
    expect(text).toContain('Revising first: Tracing a search');
    expect(text).not.toMatch(/\[\[|\*\*/);
  });

  it('Listen buttons are hidden while narration is off (the default)', () => {
    expect(renderToString(createElement(ListenButton, { text: 'Hello' }))).toBe('');
  });

  it('leave dialog names the destination and keeps "stay" as the default choice', () => {
    const html = renderToString(createElement(LeaveDialog, { message: 'You have answered 3 of 10 questions.', destination: 'Sandbox', onStay: () => {}, onLeave: () => {} }));
    expect(html).toContain('Leave the final check?');
    expect(html).toContain('3 of 10');
    expect(html).toContain('Sandbox');
    expect(html.indexOf('Keep going')).toBeLessThan(html.indexOf('Leave for'));
  });

  it('class-list task contrasts a short registration-order tree with a sorted chain', () => {
    const t = lessons.sandbox.task;
    const sorted = [...t.registration].sort((a, b) => a - b);
    expect(t.registration).toContain(t.lookFor);
    expect(t.registration).not.toContain(t.absent);
    expect(height(buildTree(t.registration))).toBeLessThan(height(buildTree(sorted)));
    expect(searchTrace(buildTree(sorted), t.lookFor).comparisons).toBeGreaterThan(searchTrace(buildTree(t.registration), t.lookFor).comparisons);
  });

  it('every [[term]] used in lesson text is in the glossary', () => {
    const ids = new Set(glossary.map((g) => g.id));
    const used = [...JSON.stringify(lessons).matchAll(/\[\[([^\]|]+)/g)].map((m) => m[1]);
    expect(used.filter((id) => !ids.has(id))).toEqual([]);
  });
});
