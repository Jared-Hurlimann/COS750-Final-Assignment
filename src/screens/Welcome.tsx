import { ArrowRight, Clock, Eye, Footprints, Globe, Heart, Lightbulb, Play, ShieldCheck, Sparkles, Target } from 'lucide-react';
import lessons from '../content/lessons.json';
import { RichText } from '../components/Glossary';
import { ListenButton } from '../components/Narrate';
import type { ScreenProps } from './types';

const LOS = Object.entries(lessons.outcomes);

/** Decorative hero: the key 40 travels from the root down to its node. */
function HeroArt() {
  const nodes = [
    { k: 50, x: 200, y: 60, lit: true }, { k: 30, x: 130, y: 130, lit: true }, { k: 70, x: 270, y: 130 },
    { k: 20, x: 95, y: 200 }, { k: 40, x: 165, y: 200, lit: true }, { k: 60, x: 235, y: 200 }, { k: 80, x: 305, y: 200 },
  ];
  const edges: [number, number, boolean?][] = [[0, 1, true], [0, 2], [1, 3], [1, 4, true], [2, 5], [2, 6]];
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="40 0 320 240" className="hero-tree">
        <g className="leaf-float" style={{ animationDelay: '-2s' }}>
          <path d="M330 30c12-10 26-8 30 2-10 10-22 12-30-2z" fill="#f2c66e" opacity="0.7" />
        </g>
        <g className="leaf-float">
          <path d="M60 60c10-14 26-14 32-4-10 12-24 14-32 4z" fill="#9fd8c3" opacity="0.6" />
        </g>
        {edges.map(([a, b, lit], i) => (
          <line key={i} className={lit ? 'h-edge lit' : 'h-edge'} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
        ))}
        {nodes.map((n) => (
          <g key={n.k}>
            <circle className={n.lit ? 'h-node lit' : 'h-node'} cx={n.x} cy={n.y} r={20} />
            <text className="h-key" x={n.x} y={n.y}>{n.k}</text>
          </g>
        ))}
        <g className="bubble">
          <circle className="h-bubble" cx={200} cy={20} r={16} />
          <text className="h-bubble-key" x={200} y={20}>40</text>
        </g>
      </svg>
    </div>
  );
}

const JOURNEY = [
  { icon: Lightbulb, title: 'Learn', text: 'Trees, the BST rule and how a search works, one small idea at a time.' },
  { icon: Eye, title: 'Watch', text: 'See a search step by step, with every comparison explained.' },
  { icon: Footprints, title: 'Try', text: 'Walk keys down the tree yourself, with help that fades as you improve.' },
  { icon: Target, title: 'Check', text: 'Ten quick questions show which outcomes are ready and which need a revisit.' },
];

export function Welcome({ go, progress }: ScreenProps) {
  const furthest = Math.max(...progress.visited);
  return (
    <section className="screen welcome">
      <div className="hero">
        <div>
          <p className="eyebrow"><Sparkles size={14} aria-hidden="true" /> COS212 lecture preparation</p>
          <h1>Forest of Keys</h1>
          <p className="hook">{lessons.welcome.hook}</p>
          <p><RichText text={lessons.welcome.intro} /></p>
          <ListenButton text={[lessons.welcome.hook, lessons.welcome.intro, lessons.welcome.reassurance]} label="Listen to the welcome" />
          <div className="reassure-row">
            <span><Heart size={15} aria-hidden="true" /> Nothing is marked</span>
            <span><ShieldCheck size={15} aria-hidden="true" /> Stays on your device</span>
            <span><Clock size={15} aria-hidden="true" /> 30–40 minutes</span>
          </div>
          <div className="btn-row">
            <button className="primary" onClick={() => go(furthest > 1 ? furthest : 1)}>
              <Play size={18} aria-hidden="true" /> {furthest > 1 ? `Continue: ${lessons.screens[furthest].title}` : 'Start learning'}
            </button>
            {furthest > 1 && <button onClick={() => go(1)}>Start from the beginning</button>}
            <button onClick={() => go(8)}>Already know BSTs? Take the check <ArrowRight size={16} aria-hidden="true" /></button>
          </div>
        </div>
        <HeroArt />
      </div>

      <div className="feature-grid">
        {JOURNEY.map(({ icon: Icon, title, text }) => (
          <div key={title} className="feature">
            <span className="icon-title"><Icon size={20} aria-hidden="true" /></span>
            <div><h3>{title}</h3><p>{text}</p></div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2><span className="icon-title"><Globe size={20} aria-hidden="true" /></span> {lessons.welcome.usesTitle}</h2>
        <ul className="outcomes">
          {lessons.welcome.uses.map((u) => <li key={u}><span><RichText text={u} /></span></li>)}
        </ul>
        <ListenButton text={[lessons.welcome.usesTitle, ...lessons.welcome.uses]} />
      </div>

      <div className="card">
        <h2><span className="icon-title"><Target size={20} aria-hidden="true" /></span> By the end you will be able to…</h2>
        <ul className="outcomes">
          {LOS.map(([id, lo]) => (
            <li key={id}><span className="lo-badge">{id}</span><span><RichText text={lo.text} /></span></li>
          ))}
        </ul>
        <p className="muted small" style={{ marginTop: 14 }}>
          Words with a dotted underline are technical terms: tap one to see what it means. You can also open the
          Glossary at the top at any time.
        </p>
      </div>
    </section>
  );
}
