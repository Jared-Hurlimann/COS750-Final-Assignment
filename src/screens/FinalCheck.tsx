import { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { QuestionCard } from '../components/QuestionCard';
import { buildFinalCheck, CONTENT_LOS, type LO } from '../engine/questions';
import type { CheckAttempt, OutcomeScore } from '../progress';
import type { ScreenProps } from './types';
import { ScreenActions } from '../components/ScreenActions';

export function FinalCheck({ go, update, setLeaveGuard }: ScreenProps) {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState(() => buildFinalCheck(Date.now()));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(boolean | undefined)[]>([]);

  // Once the check has begun, leaving through the menu or pager asks first.
  const answeredCount = answers.filter((x) => x !== undefined).length;
  useEffect(() => {
    if (!started) return;
    setLeaveGuard?.(
      `You have answered ${answeredCount} of ${questions.length} questions. If you leave now, these answers are not kept, ` +
      'and next time you start the check you will get a fresh set of questions.',
    );
  }, [started, answeredCount, questions.length, setLeaveGuard]);
  useEffect(() => () => setLeaveGuard?.(null), [setLeaveGuard]);

  if (!started) {
    return (
      <section className="screen">
        <h1>Final check</h1>
        <div className="card">
          <p className="lead">
            Ten questions, two for each content outcome (LO1 to LO5). You will not see right or wrong until the end, so
            you can focus. It is not marked: the results only help you decide what to revise before the lecture.
          </p>
        </div>
        <ScreenActions primary={{ label: 'Begin the check', icon: <Flag size={18} aria-hidden="true" />, onClick: () => { setQuestions(buildFinalCheck(Date.now())); setStarted(true); } }} />
      </section>
    );
  }

  const q = questions[idx];
  const last = idx === questions.length - 1;

  const finish = () => {
    const byLO = Object.fromEntries(CONTENT_LOS.map((lo) => [lo, { correct: 0, total: 0 }])) as Record<LO, OutcomeScore>;
    questions.forEach((qq, i) => {
      byLO[qq.lo].total++;
      if (answers[i]) byLO[qq.lo].correct++;
    });
    const attempt: CheckAttempt = {
      date: new Date().toISOString(),
      correct: answers.filter(Boolean).length,
      total: questions.length,
      byLO,
      answers: questions.map((question, i) => ({ question, correct: !!answers[i] })),
    };
    update((p) => ({ ...p, attempts: [...p.attempts, attempt].slice(-5), revisePlan: null }));
    setLeaveGuard?.(null);
    go(9);
  };

  return (
    <section className="screen">
      <h1>Final check</h1>
      <div className="progress-track" role="progressbar" aria-valuemin={1} aria-valuemax={questions.length} aria-valuenow={idx + 1} aria-label="Question progress">
        <div style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="muted">Question {idx + 1} of {questions.length}</p>
      <QuestionCard
        key={q.id}
        question={q}
        feedback="deferred"
        onAnswered={(ok) => setAnswers((a) => { const c = [...a]; c[idx] = ok; return c; })}
      />
      <ScreenActions
        primary={{
          label: answers[idx] === undefined ? 'Answer to continue' : last ? 'See my results' : 'Next question',
          onClick: last ? finish : () => setIdx(idx + 1),
          disabled: answers[idx] === undefined,
        }}
      />
    </section>
  );
}
