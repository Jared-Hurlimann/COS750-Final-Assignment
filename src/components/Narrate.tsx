/**
 * Optional narration (VARK: auditory). Uses the browser's built-in speech
 * synthesis, preferring a voice installed on the device so nothing is sent
 * over the network. Off by default; switched on in Display settings.
 * Only one thing is read at a time, and reading stops when the screen changes.
 */
import { useEffect, useId, useSyncExternalStore } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { useSettings } from '../settings';
import { plain } from './Glossary';

let speakingId: string | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

export function speechSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  } catch {
    return false;
  }
}

/** An English voice that runs on the device, if there is one. */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.localService);
  const english = voices.filter((v) => /^en/i.test(v.lang));
  return english.find((v) => /^en[-_](ZA|GB)/i.test(v.lang)) ?? english[0] ?? voices[0];
}

/** Read `text` aloud (RichText markup is stripped). `id` identifies who asked. */
export function speak(id: string, text: string) {
  if (!speechSupported()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(plain(text).replace(/[✓✗∅→]/g, ' '));
    const voice = pickVoice();
    if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-ZA'; }
    u.rate = 0.95;
    const clear = () => {
      if (currentUtterance !== u) return; // an older utterance ending after cancel()
      currentUtterance = null;
      speakingId = null;
      notify();
    };
    u.onend = clear;
    u.onerror = clear;
    currentUtterance = u;
    speakingId = id;
    notify();
    synth.speak(u);
  } catch {
    speakingId = null;
    notify();
  }
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  try {
    currentUtterance = null;
    window.speechSynthesis.cancel();
  } catch {
    /* nothing to stop */
  }
  if (speakingId !== null) { speakingId = null; notify(); }
}

function useSpeakingId() {
  return useSyncExternalStore(
    (f) => { listeners.add(f); return () => { listeners.delete(f); }; },
    () => speakingId,
    () => null,
  );
}

/** True when narration is switched on and the browser can speak. */
export function useNarration(): boolean {
  const { settings } = useSettings();
  return settings.narration && speechSupported();
}

/** A small "Listen" button that reads `text` aloud. Renders nothing while narration is off. */
export function ListenButton({ text, label = 'Listen' }: { text: string | string[]; label?: string }) {
  const on = useNarration();
  const id = useId();
  const active = useSpeakingId() === id;
  useEffect(() => () => { if (speakingId === id) stopSpeaking(); }, [id]);
  if (!on) return null;
  const full = Array.isArray(text) ? text.join(' ') : text;
  return (
    <button
      type="button"
      className="listen-btn"
      onClick={() => (active ? stopSpeaking() : speak(id, full))}
      aria-pressed={active}
    >
      {active ? <Square size={14} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
      {active ? 'Stop' : label}
    </button>
  );
}

/** Reads `text` aloud whenever it changes (used for the worked-example steps). */
export function useAutoNarrate(text: string | null) {
  const on = useNarration();
  const id = useId();
  useEffect(() => {
    if (on && text) speak(id, text);
  }, [on, text, id]);
  useEffect(() => () => { if (speakingId === id) stopSpeaking(); }, [id]);
}
