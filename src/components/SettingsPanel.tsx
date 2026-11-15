import { useEffect, useState, type ReactNode } from 'react';
import { Download, Gauge, Monitor, Moon, RotateCcw, Smartphone, Sun, Type, Volume2, VolumeX, X } from 'lucide-react';
import { speechSupported, stopSpeaking } from './Narrate';
import { useSettings, type Motion, type TextSize, type Theme } from '../settings';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Captures the browser's install prompt so we can offer an "Install app" button. */
export function useInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || installed);
  const ios = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return {
    canInstall: !!evt && !standalone,
    showIosHint: ios && !standalone,
    standalone,
    install: async () => {
      if (!evt) return;
      await evt.prompt();
      await evt.userChoice;
      setEvt(null);
    },
  };
}

function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="setting">
      <span className="setting-label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
            {o.icon}{o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsPanel({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const { settings, set } = useSettings();
  const pwa = useInstallPrompt();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet settings" role="dialog" aria-modal="true" aria-label="Display settings" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Make it comfortable</h2>
          <button className="icon-btn" aria-label="Close settings" onClick={onClose} autoFocus><X /></button>
        </div>
        <p className="muted">
          Colours are chosen to be distinguishable with colour blindness, and every right or wrong mark also uses a
          symbol (✓ / ✗), so you never have to rely on colour alone.
        </p>

        <Segmented<Theme>
          label="Theme"
          value={settings.theme}
          onChange={(v) => set('theme', v)}
          options={[
            { value: 'auto', label: 'Auto', icon: <Monitor size={16} aria-hidden="true" /> },
            { value: 'light', label: 'Light', icon: <Sun size={16} aria-hidden="true" /> },
            { value: 'dark', label: 'Dark', icon: <Moon size={16} aria-hidden="true" /> },
          ]}
        />
        <Segmented<TextSize>
          label="Text size"
          value={settings.text}
          onChange={(v) => set('text', v)}
          options={[
            { value: 'normal', label: 'Normal', icon: <Type size={14} aria-hidden="true" /> },
            { value: 'large', label: 'Large', icon: <Type size={17} aria-hidden="true" /> },
            { value: 'larger', label: 'Larger', icon: <Type size={20} aria-hidden="true" /> },
          ]}
        />
        <Segmented<Motion>
          label="Animations"
          value={settings.motion}
          onChange={(v) => set('motion', v)}
          options={[
            { value: 'full', label: 'On', icon: <Gauge size={16} aria-hidden="true" /> },
            { value: 'reduced', label: 'Reduced', icon: <Gauge size={16} aria-hidden="true" /> },
          ]}
        />
        <p className="muted small">Reduced turns off moving animations, which helps if motion makes you feel dizzy or distracted.</p>

        {speechSupported() ? (
          <>
            <Segmented<'off' | 'on'>
              label="Narration"
              value={settings.narration ? 'on' : 'off'}
              onChange={(v) => { if (v === 'off') stopSpeaking(); set('narration', v === 'on'); }}
              options={[
                { value: 'off', label: 'Off', icon: <VolumeX size={16} aria-hidden="true" /> },
                { value: 'on', label: 'On', icon: <Volume2 size={16} aria-hidden="true" /> },
              ]}
            />
            <p className="muted small">
              On adds <strong>Listen</strong> buttons to the lessons, and the worked example reads each step aloud. It uses
              your device's own voice, so nothing is sent anywhere. Everything spoken is also on screen.
            </p>
          </>
        ) : (
          <div className="setting">
            <span className="setting-label">Narration</span>
            <p className="muted small">This browser cannot read text aloud. Every explanation is still on screen.</p>
          </div>
        )}

        <div className="setting">
          <span className="setting-label">Use it like an app</span>
          {pwa.standalone ? (
            <p className="muted"><Smartphone size={16} aria-hidden="true" /> Installed. It works offline, too.</p>
          ) : pwa.canInstall ? (
            <button className="primary" onClick={pwa.install}><Download size={18} aria-hidden="true" /> Install Forest of Keys</button>
          ) : pwa.showIosHint ? (
            <p className="muted">On iPhone or iPad: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p>
          ) : (
            <p className="muted">Open this page in Chrome, Edge or Safari on your phone and choose “Install app” or “Add to Home Screen”. After the first visit it works offline.</p>
          )}
        </div>

        <div className="setting">
          <span className="setting-label">Your progress</span>
          <button onClick={() => { if (confirm('Clear all saved progress on this device?')) { onReset(); onClose(); } }}>
            <RotateCcw size={16} aria-hidden="true" /> Start again from scratch
          </button>
        </div>
      </div>
    </div>
  );
}
