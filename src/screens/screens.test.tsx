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
import { Results } from './Results';

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
