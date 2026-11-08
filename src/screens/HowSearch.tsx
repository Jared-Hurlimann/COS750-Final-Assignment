import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, RotateCcw } from 'lucide-react';
import lessons from '../content/lessons.json';
import { RichText, Term } from '../components/Glossary';
import { Parts } from '../components/Parts';
import { Pseudocode } from '../components/Pseudocode';
import { ScreenActions } from '../components/ScreenActions';
import type { ScreenProps } from './types';

const PARTS = ['Warm-up game', 'The search rules'];

function newSecret() {
  return 1 + Math.floor(Math.random() * 100);
}

export function HowSearch({ go }: ScreenProps) {
  const [part, setPart] = useState(0);
  const [reached, setReached] = useState(0);
  const [secret, setSecret] = useState(newSecret);
  const [guess, setGuess] = useState('');
  const [history, setHistory] = useState<{ g: number; reply: 'correct' | 'higher' | 'lower' }[]>([]);
  const [range, setRange] = useState<[number, number]>([1, 100]);
  const won = history.some((h) => h.g === secret);

  const openPart = (p: number) => { setPart(p); setReached((r) => Math.max(r, p)); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const g = Number(guess);
    if (!Number.isInteger(g) || g < 1 || g > 100 || won) return;
    const reply = g === secret ? 'correct' : g < secret ? 'higher' : 'lower';
    setHistory((h) => [...h, { g, reply }]);
    if (g < secret) setRange([Math.max(range[0], g + 1), range[1]]);
    if (g > secret) setRange([range[0], Math.min(range[1], g - 1)]);
    if (g === secret) setRange([g, g]);
    setGuess('');
  };

  const restart = () => {
    setSecret(newSecret());
    setHistory([]);
    setRange([1, 100]);
  };

  const mid = Math.floor((range[0] + range[1]) / 2);

  return (
    <section className="screen">
      <h1>How a search works</h1>
      <Parts titles={PARTS} current={part} reached={reached} onSelect={openPart} />

      {part === 0 && (
        <>
          <div className="card">
            <div className="split">
              <div>
                <h2>Higher or lower?</h2>
                <p><RichText text={lessons.search.analogy} /></p>
                <form onSubmit={submit} className="guess-form">
                  <label htmlFor="guess">I am thinking of a number from 1 to 100. Your guess:</label>
                  <div className="btn-row">
                    <input id="guess" type="number" inputMode="numeric" min={1} max={100} value={guess} onChange={(e) => setGuess(e.target.value)} disabled={won} />
                    <button type="submit" className="primary" disabled={won}>Guess</button>
                    <button type="button" onClick={() => setGuess(String(mid))} disabled={won}>Suggest the middle</button>
                  </div>
                </form>
              </div>
              <div>
                <div className="range-bar" aria-hidden="true">
                  <span style={{ left: `${range[0] - 1}%`, width: `${Math.max(1, range[1] - range[0] + 1)}%` }} />
                </div>
                <p className="muted small" aria-live="polite">Still possible: {range[0]} to {range[1]} ({range[1] - range[0] + 1} number{range[1] === range[0] ? '' : 's'})</p>
                {history.length > 0 && (
                  <ol className="log guesses">
                    {history.map((h, i) => (
                      <li key={i} className={h.reply === 'correct' ? 'log-ok' : ''}>
                        {h.g}:{' '}
                        {h.reply === 'correct'
                          ? <><Check size={14} aria-hidden="true" /> Correct!</>
                          : h.reply === 'higher' ? <><ArrowUp size={14} aria-hidden="true" /> Higher</> : <><ArrowDown size={14} aria-hidden="true" /> Lower</>}
                      </li>
                    ))}
                  </ol>
                )}
                {won && (
                  <div className="feedback ok" role="status">
                    ✓ Found it in {history.length} guess{history.length === 1 ? '' : 'es'}. Always guessing the middle never needs
                    more than 7 guesses for 100 numbers, because each answer halves what is left. A BST search works the same way.
                    <div className="btn-row"><button onClick={restart}><RotateCcw size={16} aria-hidden="true" /> Play again</button></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <ScreenActions
            primary={won ? { label: 'Continue: the search rules', onClick: () => openPart(1) } : { label: 'Find the number to continue', onClick: () => {}, disabled: true }}
            secondary={[!won && { label: 'Skip', onClick: () => openPart(1) }]}
          />
        </>
      )}

      {part === 1 && (
        <>
          <div className="card">
            <div className="split">
              <div>
                <h2>The search rules</h2>
                <ol className="rules">
                  {lessons.search.rules.map((r) => <li key={r}><RichText text={r} /></li>)}
                </ol>
                <p className="callout"><strong>Counting:</strong> <RichText text={lessons.search.counting} /></p>
              </div>
              <div>
                <h3>As <Term id="iterative">iterative</Term> <Term id="pseudocode">pseudocode</Term></h3>
                <p className="muted small"><code>current</code> is the node we are looking at; <code>null</code> means an empty spot.</p>
                <Pseudocode />
              </div>
            </div>
          </div>
          <ScreenActions
            primary={{ label: 'Next: watch a worked example', onClick: () => go(4) }}
            secondary={[{ label: 'Back', icon: <ArrowLeft size={16} aria-hidden="true" />, onClick: () => setPart(0) }]}
          />
        </>
      )}
    </section>
  );
}
