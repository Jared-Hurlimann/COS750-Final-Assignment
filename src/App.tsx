import { useEffect, useRef, useState, type ComponentType } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Dumbbell, Flag, Footprints, Lightbulb, Settings, Sprout, type LucideIcon } from 'lucide-react';
import lessons from './content/lessons.json';
import { useProgress } from './progress';
import { useSettings } from './settings';
import { GlossaryPanel } from './components/Glossary';
import { Logo } from './components/Logo';
import { SettingsPanel } from './components/SettingsPanel';
import type { ScreenProps } from './screens/types';
import { Welcome } from './screens/Welcome';
import { TreeTerms } from './screens/TreeTerms';
import { BstRule } from './screens/BstRule';
import { HowSearch } from './screens/HowSearch';
import { WorkedExample } from './screens/WorkedExample';
import { YourTurn } from './screens/YourTurn';
import { Practice } from './screens/Practice';
import { Sandbox } from './screens/Sandbox';
import { FinalCheck } from './screens/FinalCheck';
import { Results } from './screens/Results';

const SCREENS: ComponentType<ScreenProps>[] = [
  Welcome, TreeTerms, BstRule, HowSearch, WorkedExample, YourTurn, Practice, Sandbox, FinalCheck, Results,
];

/** The journey is shown as five phases instead of numbered screens. */
const PHASES: { id: string; label: string; icon: LucideIcon; screens: number[] }[] = [
  { id: 'start', label: 'Start', icon: Sprout, screens: [0] },
  { id: 'learn', label: 'Learn', icon: Lightbulb, screens: [1, 2, 3] },
  { id: 'try', label: 'Watch & try', icon: Footprints, screens: [4, 5] },
  { id: 'practise', label: 'Practise', icon: Dumbbell, screens: [6, 7] },
  { id: 'check', label: 'Check', icon: Flag, screens: [8, 9] },
];
const phaseOf = (s: number) => PHASES.find((p) => p.screens.includes(s))!;

export default function App() {
  const { progress, update, reset } = useProgress();
  const { openGlossary } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const screen = Math.min(Math.max(progress.screen, 0), SCREENS.length - 1);
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  const go = (n: number) => {
    update((p) => ({ ...p, screen: n, visited: p.visited.includes(n) ? p.visited : [...p.visited, n] }));
  };

  useEffect(() => {
    document.title = `${lessons.screens[screen].title} · Forest of Keys`;
    if (first.current) { first.current = false; return; }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [screen]);

  const Screen = SCREENS[screen];
  const phase = phaseOf(screen);
  const stepInPhase = phase.screens.indexOf(screen) + 1;
  const prev = screen > 0 ? lessons.screens[screen - 1] : null;
  const next = screen < SCREENS.length - 1 ? lessons.screens[screen + 1] : null;
  const pct = Math.round((screen / (SCREENS.length - 1)) * 100);

  return (
    <div className="app-root">
      <a href="#main" className="skip">Skip to content</a>
      <header className="topbar">
        <div className="topbar-inner page-width">
        <button className="brand" onClick={() => go(0)} aria-label="Forest of Keys home">
          <Logo />
          <span className="wordmark">Forest of Keys</span>
        </button>

        <nav className="journey" aria-label="Your learning journey">
          {PHASES.map((p) => {
            const Icon = p.icon;
            const active = p.id === phase.id;
            const done = p.screens.every((s) => progress.visited.includes(s)) && !active;
            return (
              <div key={p.id} className={`phase${active ? ' active' : ''}${done ? ' done' : ''}`}>
                <button
                  className="phase-btn"
                  onClick={() => go(p.screens[0])}
                  aria-current={active ? 'step' : undefined}
                  title={p.label}
                >
                  {done ? <Check size={18} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
                  <span className="phase-label">{p.label}</span>
                </button>
                {active && p.screens.length > 1 && (
                  <span className="phase-dots">
                    {p.screens.map((s) => (
                      <button
                        key={s}
                        className={`pdot${s === screen ? ' current' : ''}${progress.visited.includes(s) ? ' seen' : ''}`}
                        onClick={() => go(s)}
                        aria-label={lessons.screens[s].title}
                        aria-current={s === screen ? 'page' : undefined}
                      />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="top-actions">
          <button className="icon-btn" onClick={() => openGlossary()} aria-label="Open glossary" title="Glossary">
            <BookOpen size={20} />
            <span className="action-label">Glossary</span>
          </button>
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Display settings" title="Display settings">
            <Settings size={20} />
          </button>
        </div>
        </div>
        <div className="top-progress" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      </header>

      <div className="page page-width">
      <main id="main" ref={mainRef} tabIndex={-1}>
        {screen > 0 && (
          <p className="crumb">
            <span className="crumb-phase">{phase.label}</span>
            {phase.screens.length > 1 && <span className="muted"> · part {stepInPhase} of {phase.screens.length}</span>}
          </p>
        )}
        <Screen key={screen} go={go} progress={progress} update={update} />
      </main>

      {screen > 0 && (
        <nav className="pager" aria-label="Sections">
          {prev ? (
            <button className="pager-btn" onClick={() => go(screen - 1)}>
              <ArrowLeft size={20} aria-hidden="true" />
              <span><small>Previous section</small>{prev.title}</span>
            </button>
          ) : <span />}
          {next && (
            <button className="pager-btn next" onClick={() => go(screen + 1)}>
              <span><small>Next section</small>{next.title}</span>
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          )}
        </nav>
      )}
      <p className="fineprint">Nothing is marked, and nothing leaves your device.</p>
      </div>

      <GlossaryPanel />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} onReset={reset} />}
    </div>
  );
}
