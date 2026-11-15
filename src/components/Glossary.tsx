import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import glossary from '../content/glossary.json';
import { useSettings } from '../settings';

export interface GlossaryEntry { id: string; term: string; definition: string; example?: string }
export const GLOSSARY = glossary as GlossaryEntry[];
const BY_ID = new Map(GLOSSARY.map((g) => [g.id, g]));

export function glossaryEntry(id: string): GlossaryEntry | undefined {
  return BY_ID.get(id);
}

/**
 * An inline technical word. Tap / click / Enter shows a plain-language
 * definition in a small popover (a bottom sheet on phones).
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = BY_ID.get(id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const popId = useId();
  const { openGlossary } = useSettings();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!entry) return <>{children}</>;
  return (
    <span className="term-wrap" ref={ref}>
      <button
        type="button"
        className="term"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((o) => !o)}
      >
        {children ?? entry.term.toLowerCase()}
      </button>
      {open && (
        <span className="term-pop" id={popId} role="dialog" aria-label={entry.term}>
          <span className="term-pop-head">
            <strong>{entry.term}</strong>
            <button type="button" className="icon-btn small" aria-label="Close" onClick={() => setOpen(false)}><X size={16} /></button>
          </span>
          <span className="term-pop-body">{entry.definition}</span>
          {entry.example && <span className="term-pop-example">e.g. {entry.example}</span>}
          <button type="button" className="link" onClick={() => { setOpen(false); openGlossary(entry.id); }}>
            <BookOpen size={14} aria-hidden="true" /> Open the glossary
          </button>
        </span>
      )}
    </span>
  );
}

/**
 * Renders lesson text from JSON. Markup:
 *   [[node]]            → glossary term "node"
 *   [[node|nodes]]      → glossary term "node", shown as "nodes"
 *   **bold**            → <strong>
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('[[')) {
          const [id, label] = p.slice(2, -2).split('|');
          return <Term key={i} id={id}>{label ?? glossaryEntry(id)?.term.toLowerCase() ?? id}</Term>;
        }
        if (p.startsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/** Strip RichText markup to plain text (for printing / titles). */
export function plain(text: string): string {
  return text.replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, id: string, label: string) => label || glossaryEntry(id)?.term.toLowerCase() || id).replace(/\*\*/g, '');
}

/** Slide-in panel listing every term, with a filter. */
export function GlossaryPanel() {
  const { glossaryOpen, closeGlossary } = useSettings();
  const [q, setQ] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (glossaryOpen === false) return;
    setQ('');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeGlossary(); };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      const target = glossaryOpen ? document.getElementById(`gl-${glossaryOpen}`) : null;
      if (target) { target.scrollIntoView({ block: 'center' }); target.focus(); }
      else panelRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    });
    return () => document.removeEventListener('keydown', onKey);
  }, [glossaryOpen, closeGlossary]);

  if (glossaryOpen === false) return null;
  const needle = q.trim().toLowerCase();
  const items = [...GLOSSARY]
    .sort((a, b) => a.term.localeCompare(b.term))
    .filter((g) => !needle || g.term.toLowerCase().includes(needle) || g.definition.toLowerCase().includes(needle));

  return (
    <div className="sheet-backdrop" onClick={closeGlossary}>
      <div className="sheet glossary" role="dialog" aria-modal="true" aria-label="Glossary" ref={panelRef} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2><BookOpen size={22} aria-hidden="true" /> Glossary</h2>
          <button className="icon-btn" aria-label="Close glossary" onClick={closeGlossary}><X /></button>
        </div>
        <p className="muted">Every technical word used in this app, in plain language.</p>
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Filter terms</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a word…" />
        </label>
        <dl className="glossary-list">
          {items.map((g) => (
            <div key={g.id} id={`gl-${g.id}`} tabIndex={-1} className={glossaryOpen === g.id ? 'gl-item active' : 'gl-item'}>
              <dt>{g.term}</dt>
              <dd>{g.definition}{g.example && <span className="term-pop-example">e.g. {g.example}</span>}</dd>
            </div>
          ))}
          {items.length === 0 && <p className="muted">No term matches “{q}”.</p>}
        </dl>
      </div>
    </div>
  );
}
