/**
 * Progress lives in localStorage only: no login, no student data leaves the
 * browser. Every access is wrapped so the app still works when storage is
 * blocked (private windows, strict browser settings).
 */
import { useCallback, useEffect, useState } from 'react';
import type { LO, Question } from './engine/questions';

export interface OutcomeScore { correct: number; total: number }

export interface CheckAttempt {
  date: string;
  correct: number;
  total: number;
  byLO: Record<LO, OutcomeScore>;
  /** Question ids and whether each was answered correctly (for the review list). */
  answers: { question: Question; correct: boolean }[];
}

export interface Progress {
  screen: number;
  visited: number[];
  practice: { answered: number; correct: number; bestStreak: number };
  attempts: CheckAttempt[];
  /** LO the student chose to revise after the check (LO6). */
  revisePlan: LO | null;
}

const KEY = 'forest-of-keys:v1';

export const initialProgress: Progress = {
  screen: 0,
  visited: [0],
  practice: { answered: 0, correct: 0, bestStreak: 0 },
  attempts: [],
  revisePlan: null,
};

/** `?screen=4` opens a screen directly (handy for presentations and testing). */
function screenFromUrl(): number | null {
  try {
    const v = new URLSearchParams(window.location.search).get('screen');
    const n = v === null ? NaN : Number(v);
    return Number.isInteger(n) && n >= 0 && n <= 9 ? n : null;
  } catch {
    return null;
  }
}

function load(): Progress {
  let p = initialProgress;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) p = { ...initialProgress, ...(JSON.parse(raw) as Partial<Progress>) };
  } catch {
    /* use defaults */
  }
  const s = screenFromUrl();
  return s === null ? p : { ...p, screen: s, visited: p.visited.includes(s) ? p.visited : [...p.visited, s] };
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress));
    } catch {
      /* storage unavailable: progress lasts for this visit only */
    }
  }, [progress]);

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress(fn), []);
  const reset = useCallback(() => setProgress(initialProgress), []);

  return { progress, update, reset };
}
