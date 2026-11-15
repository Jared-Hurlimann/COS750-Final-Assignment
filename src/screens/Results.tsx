import { useState } from 'react';
import { ArrowRight, ClipboardList, Download, FileText, Printer, RotateCcw, Sprout, TreeDeciduous, TreePine, Compass } from 'lucide-react';
import lessons from '../content/lessons.json';
import { CONTENT_LOS, type LO } from '../engine/questions';
import { SEARCH_CODE } from '../components/Pseudocode';
import { plain } from '../components/Glossary';
import type { ScreenProps } from './types';
import type { CheckAttempt } from '../progress';
import { ScreenActions } from '../components/ScreenActions';

type Route = { id: 'ready' | 'review' | 'guided'; title: string; text: string };

/** Scaffolding thresholds from the instructional design document. */
export function routeFor(pct: number): Route {
  if (pct >= 80) return { id: 'ready', title: 'Lecture-ready', text: 'You are well prepared. Skim any outcome below that is not full, then enjoy the lecture.' };
  if (pct >= 50) return { id: 'review', title: 'Nearly there', text: 'Review the outcomes marked below, then take the check again.' };
  return { id: 'guided', title: 'Take the guided route', text: 'Go back through the worked example and “Your turn”, which have hints, then retake the check. That is exactly what they are for.' };
}
const ROUTE_ICON = { ready: TreeDeciduous, review: TreePine, guided: Sprout } as const;

const SHAPE_NOTE = 'The worst case equals the number of levels. A balanced tree with n keys has about log₂ n levels; inserting keys in sorted order makes a chain of n levels.';

/** The summary sheet as plain text, for the "Download" button. */
export function summaryText(a: CheckAttempt, plan: LO | null): string {
  const pct = Math.round((a.correct / a.total) * 100);
  const lines = [
    'FOREST OF KEYS: BST SEARCH SUMMARY',
    '',
    'TREE WORDS',
    ...lessons.terms.map((t) => `- ${t.name}: ${plain(t.definition)}`),
    '',
    'THE BST RULE',
    plain(lessons.rule.statement),
    plain(lessons.rule.whole),
    '',
    'HOW A SEARCH WORKS',
    ...lessons.search.rules.map((r, i) => `${i + 1}. ${plain(r)}`),
    '',
    'COUNTING COMPARISONS',
    plain(lessons.search.counting),
    '',
    'TREE SHAPE',
    SHAPE_NOTE,
    '',
    'PSEUDOCODE',
    ...SEARCH_CODE,
    '',
    `MY FINAL CHECK (${new Date(a.date).toLocaleDateString()})`,
    `${a.correct}/${a.total} (${pct}%): ${routeFor(pct).title}`,
    ...CONTENT_LOS.map((lo) => `- ${lo} ${lessons.outcomes[lo].short}: ${a.byLO[lo].correct}/${a.byLO[lo].total} (${mark(a.byLO[lo].correct, a.byLO[lo].total).text})`),
    ...(plan ? ['', `Revising first: ${lessons.outcomes[plan].short}`] : []),
    '',
  ];
  return lines.join('\r\n');
}

function download(text: string) {
  try {
    const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'forest-of-keys-summary.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    window.print();
  }
}

function mark(c: number, t: number) {
  if (c === t) return { icon: '✓', cls: 'ok', text: 'secure' };
  if (c === 0) return { icon: '✗', cls: 'bad', text: 'revise' };
  return { icon: '~', cls: 'mid', text: 'partly' };
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`${pct} percent`}>
      <circle className="ring-bg" cx="60" cy="60" r={r} />
      <circle className="ring-fg" cx="60" cy="60" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 60 60)" />
      <text className="ring-text" x="60" y="60">{pct}%</text>
    </svg>
  );
}

export function Results({ go, progress, update }: ScreenProps) {
  const [showSummary, setShowSummary] = useState(false);
  const attempts = progress.attempts;
  const a = attempts[attempts.length - 1];

  if (!a) {
    return (
      <section className="screen">
        <h1>Results</h1>
        <div className="card">
          <p>You have not taken the final check yet.</p>
          <button className="primary" onClick={() => go(8)}>Take the final check <ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </section>
    );
  }

  const pct = Math.round((a.correct / a.total) * 100);
  const route = routeFor(pct);
  const RouteIcon = ROUTE_ICON[route.id];
  const prev = attempts.length > 1 ? attempts[attempts.length - 2] : null;
  const weak = CONTENT_LOS.filter((lo) => a.byLO[lo].correct < a.byLO[lo].total);
  const plan = progress.revisePlan;
  const setPlan = (lo: LO) => update((p) => ({ ...p, revisePlan: lo }));

  return (
    <section className="screen results">
      <h1>Results</h1>

      <div className={`card route ${route.id}`}>
        <div className="score-ring">
          <ScoreRing pct={pct} />
          <div>
            <h2><RouteIcon size={24} aria-hidden="true" /> {route.title}</h2>
            <p className="score-line"><strong>{a.correct}</strong> of {a.total} correct</p>
            <p>{route.text}</p>
            {prev && (
              <p className="muted">
                Last attempt: {prev.correct}/{prev.total}.{' '}
                {a.correct > prev.correct ? `Up by ${a.correct - prev.correct}: real progress.` : a.correct === prev.correct ? 'Same as last time.' : 'A little lower this time; the questions change on every attempt.'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2><span className="icon-title"><ClipboardList size={20} aria-hidden="true" /></span> Outcome by outcome</h2>
        <table className="lo-table">
          <thead><tr><th>Outcome</th><th>Score</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>
            {CONTENT_LOS.map((lo) => {
              const s = a.byLO[lo];
              const m = mark(s.correct, s.total);
              const info = lessons.outcomes[lo];
              return (
                <tr key={lo}>
                  <td><strong>{lo}</strong> {info.short}</td>
                  <td>
                    <span className="bar" aria-hidden="true"><span className={m.cls} style={{ width: `${(s.correct / s.total) * 100}%` }} /></span>
                    {s.correct}/{s.total}
                  </td>
                  <td className={m.cls}>{m.icon} {m.text}</td>
                  <td><button className="link" onClick={() => go(info.screen)}>Revisit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2><span className="icon-title"><Compass size={20} aria-hidden="true" /></span> Your call (LO6)</h2>
        <p>
          {weak.length === 0
            ? 'Every outcome is secure. Is there one you still feel unsure about? Pick it to plan a quick refresh.'
            : `Looking at your results, which outcome will you revise first? ${weak.length > 1 ? 'Start with the one you feel least sure about.' : ''}`}
        </p>
        <div className="chip-row" role="radiogroup" aria-label="Outcome to revise">
          {CONTENT_LOS.map((lo) => (
            <button key={lo} role="radio" aria-checked={plan === lo} className={plan === lo ? 'chip active' : 'chip'} onClick={() => setPlan(lo)}>
              {weak.includes(lo) ? '• ' : ''}{lo} {lessons.outcomes[lo].short}
            </button>
          ))}
        </div>
        {plan && (
          <div className="feedback info">
            Plan: revise <strong>{lessons.outcomes[plan].short}</strong> on the “{lessons.screens[lessons.outcomes[plan].screen].title}” screen, then retake the check.
            <div className="btn-row"><button className="primary" onClick={() => go(lessons.outcomes[plan].screen)}>Go there now <ArrowRight size={18} aria-hidden="true" /></button></div>
          </div>
        )}
      </div>

      <details className="card review-card">
        <summary><h2>Review your answers ({a.answers.filter((x) => x.correct).length} of {a.answers.length} correct)</h2></summary>
        <ol className="review">
          {a.answers.map(({ question, correct }, i) => (
            <li key={i} className={correct ? 'ok' : 'bad'}>
              <details>
                <summary>{correct ? '✓' : '✗'} <span className="lo-tag">{question.lo}</span> {question.prompt}</summary>
                {question.kind === 'mcq' && <p>Answer: <strong>{question.options[question.answer]}</strong></p>}
                <p>{question.explanation}</p>
              </details>
            </li>
          ))}
        </ol>
      </details>

      {showSummary && (
        <div className="card summary-sheet">
          <h2>Forest of Keys: BST search summary</h2>
          <ul>
            <li><strong>Tree words:</strong> {lessons.terms.map((t) => `${t.name}: ${plain(t.definition)}`).join(' ')}</li>
            <li><strong>BST rule:</strong> {plain(lessons.rule.statement)} {plain(lessons.rule.whole)}</li>
            <li><strong>Search:</strong> {lessons.search.rules.map(plain).join(' ')}</li>
            <li><strong>Counting:</strong> {plain(lessons.search.counting)}</li>
            <li><strong>Shape:</strong> {SHAPE_NOTE}</li>
          </ul>
          <pre className="code">{SEARCH_CODE.join('\n')}</pre>
          <p>
            <strong>My check ({new Date(a.date).toLocaleDateString()}):</strong> {a.correct}/{a.total}.{' '}
            {CONTENT_LOS.map((lo) => `${lo} ${a.byLO[lo].correct}/${a.byLO[lo].total}`).join(' · ')}
            {plan ? ` · Revising: ${lessons.outcomes[plan].short}` : ''}
          </p>
        </div>
      )}
      <ScreenActions
        primary={{ label: 'Retake the check', icon: <RotateCcw size={18} aria-hidden="true" />, onClick: () => go(8) }}
        secondary={[
          { label: `${showSummary ? 'Hide' : 'Show'} summary`, icon: <FileText size={18} aria-hidden="true" />, onClick: () => setShowSummary((s) => !s) },
          showSummary && { label: 'Print', icon: <Printer size={18} aria-hidden="true" />, onClick: () => window.print() },
          { label: 'Download summary', icon: <Download size={18} aria-hidden="true" />, onClick: () => download(summaryText(a, plan)) },
        ]}
      />
    </section>
  );
}
