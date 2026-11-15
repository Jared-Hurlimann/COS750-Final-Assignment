import { useEffect, useRef } from 'react';
import { ArrowRight, Flag } from 'lucide-react';

/** Asks before leaving the final check part-way through. Escape or the backdrop means "stay". */
export function LeaveDialog({ message, destination, onStay, onLeave }: {
  message: string;
  destination: string;
  onStay: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stayRef = useRef(onStay);
  stayRef.current = onStay;

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); stayRef.current(); }
      if (e.key === 'Tab' && ref.current) {
        // Keep keyboard focus inside the dialog.
        const items = ref.current.querySelectorAll<HTMLElement>('button');
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    };
    // Capture phase, so Escape is handled before anything underneath the dialog.
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div className="dialog-backdrop" onClick={onStay}>
      <div
        ref={ref}
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        aria-describedby="leave-text"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="leave-title"><Flag size={20} aria-hidden="true" /> Leave the final check?</h2>
        <p id="leave-text">{message}</p>
        <div className="btn-row dialog-actions">
          <button className="primary" onClick={onStay} autoFocus>Keep going with the check</button>
          <button onClick={onLeave}>Leave for “{destination}” <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}
