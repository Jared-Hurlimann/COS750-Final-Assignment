import { useMemo, useState } from 'react';
import { Flame, Sprout, TreeDeciduous, TreePine, Trophy } from 'lucide-react';
import { QuestionCard } from '../components/QuestionCard';
import { practiceQuestion, type Difficulty } from '../engine/questions';
import { makeRng } from '../engine/random';
import type { ScreenProps } from './types';
import { ScreenActions } from '../components/ScreenActions';

const LEVEL_NAME: Record<Difficulty, string> = { 1: 'Seedling', 2: 'Sapling', 3: 'Old oak' };
const LEVEL_ICON = { 1: Sprout, 2: TreePine, 3: TreeDeciduous } as const;

/**
 * Adaptive practice: two correct in a row moves up a level, a wrong answer
 * moves down one. Feedback is immediate and explanatory, with no step hints.
 */
export function Practice({ go, progress, update }: ScreenProps) {
  const rng = useMemo(() => makeRng(Date.now()), []);
  const [level, setLevel] = useState<Difficulty>(1);
  const [run, setRun] = useState(0);
  const [question, setQuestion] = useState(() => practiceQuestion(1, rng));
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [session, setSession] = useState({ answered: 0, correct: 0 });

  const onAnswered = (ok: boolean) => {
    if (answered !== null) return;
    setAnswered(ok);
    const s = ok ? streak + 1 : 0;
    setStreak(s);
    setSession((x) => ({ answered: x.answered + 1, correct: x.correct + (ok ? 1 : 0) }));
    update((p) => ({
      ...p,
      practice: {
        answered: p.practice.answered + 1,
        correct: p.practice.correct + (ok ? 1 : 0),
        bestStreak: Math.max(p.practice.bestStreak, s),
      },
    }));
  };

  const next = () => {
    let l = level;
    if (answered && streak > 0 && streak % 2 === 0 && level < 3) l = (level + 1) as Difficulty;
    if (answered === false && level > 1) l = (level - 1) as Difficulty;
    setLevel(l);
    setQuestion(practiceQuestion(l, rng));
    setAnswered(null);
    setRun((r) => r + 1);
  };

  return (
    <section className="screen">
      <h1>Practice</h1>
      <p className="lead">Mixed questions with no step-by-step hints. Get two right in a row to grow to the next level. Do as many as you like.</p>
      <div className="stats" aria-live="polite">
        <span className="pill">{(() => { const I = LEVEL_ICON[level]; return <I size={16} aria-hidden="true" />; })()} Level {level}: {LEVEL_NAME[level]}</span>
        <span className="pill"><Flame size={16} aria-hidden="true" /> Streak: {streak}</span>
        <span className="pill">This session: {session.correct}/{session.answered}</span>
        <span className="pill"><Trophy size={16} aria-hidden="true" /> Best streak: {progress.practice.bestStreak}</span>
      </div>
      <QuestionCard key={run} question={question} feedback="immediate" onAnswered={onAnswered} />
      <ScreenActions
        primary={{ label: answered === null ? 'Answer to continue' : 'Next question', onClick: next, disabled: answered === null }}
        secondary={[{ label: session.answered >= 5 ? 'Go to the sandbox' : 'Skip to the sandbox', onClick: () => go(7) }]}
      />
    </section>
  );
}
