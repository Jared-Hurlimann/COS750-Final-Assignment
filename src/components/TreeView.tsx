import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { layout, type Side, type Tree } from '../engine/bst';
import { useSettings } from '../settings';

export type NodeState = 'current' | 'visited' | 'found' | 'highlight' | 'bad' | 'dim' | 'selected';

/** The key "bubble" that travels down the tree during an animated search or insert. */
export interface Traveller {
  key: number;
  /** Beside a node (comparing), at an empty slot (landing), or at the root position of an empty tree. */
  at: number | { parent: number; side: Side } | 'root';
  /** Comparison shown between the bubble and the node. */
  sign?: '<' | '>' | '=';
}

interface Props {
  tree: Tree;
  nodeState?: (key: number) => NodeState | undefined;
  /** Empty position to draw (dashed), e.g. where an absent key would be. */
  ghost?: { parent: number; side: Side; label?: string } | null;
  /** Child keys whose edge from the parent is highlighted (the search path). */
  activeEdges?: ReadonlySet<number>;
  /** Small caption under a node, e.g. "root" or "leaf". */
  badges?: Record<number, string>;
  traveller?: Traveller | null;
  onNodeClick?: (key: number) => void;
  title: string;
}

interface Pt { x: number; y: number }

const DX = 50;
const DY = 72;
const R = 20;
const TR = 17;
const PAD = 12;
const TRAVELLER_LIFT = 0.82;

const ICON: Partial<Record<NodeState, string>> = { found: '✓', bad: '✗', current: '?' };

/**
 * Smoothly moves points from where they were drawn to their new targets.
 * New points appear at their target, except new nodes, which grow out of
 * where the traveller bubble was last seen (the key "lands" in the tree).
 */
function useTween(targets: Map<string, Pt>, enabled: boolean, duration = 480): (id: string) => Pt | undefined {
  const sig = [...targets].map(([k, p]) => `${k}:${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('|');
  const shownRef = useRef<Map<string, Pt>>(targets);
  const [, force] = useState(0);
  const targetRef = useRef(targets);
  targetRef.current = targets;

  useEffect(() => {
    const to = targetRef.current;
    if (!enabled) {
      shownRef.current = to;
      return;
    }
    const from = new Map(shownRef.current);
    const orphan = !to.has('t') ? from.get('t') : undefined;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      const next = new Map<string, Pt>();
      for (const [id, p] of to) {
        const f = from.get(id) ?? (id.startsWith('n') && orphan ? orphan : p);
        next.set(id, { x: f.x + (p.x - f.x) * e, y: f.y + (p.y - f.y) * e });
      }
      shownRef.current = next;
      force((n) => n + 1);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, enabled]);

  return (id) => (enabled ? shownRef.current.get(id) ?? targets.get(id) : targets.get(id));
}

/** Plain-SVG tree drawing. Colour is always paired with an icon, a pattern or text. */
export function TreeView({ tree, nodeState, ghost, activeEdges, badges, traveller, onNodeClick, title }: Props) {
  const { animate } = useSettings();
  const pos = layout(tree);
  const byKey = new Map(pos.map((p) => [p.key, p]));

  const slotPt = (parent: number, side: Side): Pt | null => {
    const p = byKey.get(parent);
    return p ? { x: p.x + (side === 'left' ? -0.5 : 0.5), y: p.y + 1 } : null;
  };

  const targets = new Map<string, Pt>();
  for (const p of pos) targets.set(`n${p.key}`, { x: p.x, y: p.y });
  const ghostPt = ghost ? slotPt(ghost.parent, ghost.side) : null;
  if (ghostPt) targets.set('g', ghostPt);
  if (traveller) {
    let tp: Pt | null = null;
    if (traveller.at === 'root') tp = { x: 0, y: 0 };
    else if (typeof traveller.at === 'number') {
      const n = byKey.get(traveller.at);
      if (n) tp = { x: n.x, y: n.y - TRAVELLER_LIFT };
    } else tp = slotPt(traveller.at.parent, traveller.at.side);
    if (tp) targets.set('t', tp);
  }

  const at = useTween(targets, animate);

  if (pos.length === 0 && !traveller) {
    return <div className="tree-empty" role="img" aria-label={`${title}: empty tree`}>Empty tree: no nodes yet.</div>;
  }

  const pts = [...targets.keys()].map((id) => at(id)!).filter(Boolean);
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(0, ...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const badgeSpace = badges || ghost?.label ? 18 : 0;
  const cx = (x: number) => PAD + R + (x - minX) * DX;
  const cy = (y: number) => PAD + R + (y - minY) * DY;
  const width = (maxX - minX) * DX + 2 * (PAD + R);
  const height = (maxY - minY) * DY + 2 * (PAD + R) + badgeSpace;

  const t = traveller && at('t');
  const tNode = traveller && typeof traveller.at === 'number' ? at(`n${traveller.at}`) : undefined;

  return (
    <svg
      className="tree"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: width * 1.5 }}
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id="node-shine" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="var(--node-hi)" />
          <stop offset="100%" stopColor="var(--node)" />
        </radialGradient>
      </defs>
      {pos.map((p) => {
        if (p.parent === null) return null;
        const a = at(`n${p.parent}`)!;
        const b = at(`n${p.key}`)!;
        return (
          <line
            key={`e${p.key}`}
            className={`edge${activeEdges?.has(p.key) ? ' active' : ''}`}
            x1={cx(a.x)} y1={cy(a.y)} x2={cx(b.x)} y2={cy(b.y)}
          />
        );
      })}
      {ghost && ghostPt && (() => {
        const g = at('g')!;
        const par = at(`n${ghost.parent}`)!;
        return (
          <g className="ghost">
            <line className="edge ghost-edge" x1={cx(par.x)} y1={cy(par.y)} x2={cx(g.x)} y2={cy(g.y)} />
            <circle cx={cx(g.x)} cy={cy(g.y)} r={R} />
            <text x={cx(g.x)} y={cy(g.y)} className="node-key">∅</text>
            {ghost.label && <text x={cx(g.x)} y={cy(g.y) + R + 14} className="badge">{ghost.label}</text>}
          </g>
        );
      })()}
      {pos.map((p) => {
        const state = nodeState?.(p.key);
        const clickable = !!onNodeClick;
        const travellerHere = traveller && traveller.at === p.key;
        const icon = state && !travellerHere ? ICON[state] : undefined;
        const q = at(`n${p.key}`)!;
        return (
          <g
            key={`n${p.key}`}
            className={`node${state ? ` ${state}` : ''}${clickable ? ' clickable' : ''}`}
            {...(clickable && {
              role: 'button',
              tabIndex: 0,
              'aria-label': `Node ${p.key}${state ? `, ${state}` : ''}`,
              onClick: () => onNodeClick(p.key),
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNodeClick(p.key); }
              },
            })}
          >
            <circle className="node-shadow" cx={cx(q.x)} cy={cy(q.y) + 3} r={R} />
            <circle className="node-body" cx={cx(q.x)} cy={cy(q.y)} r={R} />
            <text x={cx(q.x)} y={cy(q.y)} className="node-key">{p.key}</text>
            {icon && (
              <g className="node-icon-wrap" aria-hidden="true">
                <circle cx={cx(q.x) + R - 3} cy={cy(q.y) - R + 3} r={8} />
                <text x={cx(q.x) + R - 3} y={cy(q.y) - R + 3} className="node-icon">{icon}</text>
              </g>
            )}
            {badges?.[p.key] && <text x={cx(q.x)} y={cy(q.y) + R + 15} className="badge">{badges[p.key]}</text>}
          </g>
        );
      })}
      {traveller && t && (
        <g className="traveller" aria-hidden="true">
          {traveller.sign && tNode && (
            <g className="sign">
              <rect x={cx(t.x) - 11} y={(cy(t.y) + cy(tNode.y)) / 2 - 10} width={22} height={20} rx={6} />
              <text x={cx(t.x)} y={(cy(t.y) + cy(tNode.y)) / 2}>{traveller.sign}</text>
            </g>
          )}
          <circle cx={cx(t.x)} cy={cy(t.y)} r={TR + 4} className="traveller-halo" />
          <circle cx={cx(t.x)} cy={cy(t.y)} r={TR} className="traveller-body" />
          <text x={cx(t.x)} y={cy(t.y)} className="node-key traveller-key">{traveller.key}</text>
        </g>
      )}
    </svg>
  );
}
