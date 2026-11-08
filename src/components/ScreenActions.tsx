import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowRight, CornerDownLeft } from 'lucide-react';

export interface Action {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

interface Props {
  /** The one thing the student most likely wants to do next. */
  primary?: Action;
  /** Less important choices (skip, replay…), shown smaller. */
  secondary?: (Action | false | null | undefined)[];
}

const INTERACTIVE = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY']);

/**
 * The screen's main action(s), always in the same place:
 * - big screens: bottom-right under the content; Enter triggers the primary action.
 * - phones: a bar pinned to the bottom of the screen, in thumb reach (CSS).
 * Must be the LAST child of the screen <section> so the pinned bar stays on
 * screen while the student scrolls through that screen.
 */
export function ScreenActions({ primary, secondary = [] }: Props) {
  const primaryRef = useRef(primary);
  primaryRef.current = primary;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = primaryRef.current;
      if (e.key !== 'Enter' || e.defaultPrevented || !p || p.disabled) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (INTERACTIVE.has(el.tagName) || el.getAttribute('role') === 'button' || el.isContentEditable)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      p.onClick();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const extras = secondary.filter((a): a is Action => !!a);
  if (!primary && extras.length === 0) return null;

  return (
    <div className="screen-actions" role="group" aria-label="Actions">
      <div className="screen-actions-inner">
        {extras.map((a, i) => (
          <button key={i} className="secondary-action" onClick={a.onClick} disabled={a.disabled}>
            {a.icon}{a.label}
          </button>
        ))}
        {primary && (
          <button className="primary primary-action" onClick={primary.onClick} disabled={primary.disabled}>
            {primary.label}
            {primary.icon ?? <ArrowRight size={18} aria-hidden="true" />}
            {!primary.disabled && <kbd className="kbd-hint" aria-hidden="true"><CornerDownLeft size={12} /> Enter</kbd>}
          </button>
        )}
      </div>
    </div>
  );
}
