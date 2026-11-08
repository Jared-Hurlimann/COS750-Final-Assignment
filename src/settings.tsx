/**
 * Display settings (per device): theme, text size and motion.
 * Applied as data-attributes on <html> so plain CSS can react to them.
 * index.html applies the saved theme before first paint to avoid a flash.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'auto' | 'light' | 'dark';
export type TextSize = 'normal' | 'large' | 'larger';
export type Motion = 'full' | 'reduced';

export interface Settings {
  theme: Theme;
  text: TextSize;
  motion: Motion;
}

export const SETTINGS_KEY = 'forest-of-keys:settings';

function systemPrefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function load(): Settings {
  const fallback: Settings = { theme: 'auto', text: 'normal', motion: systemPrefersReducedMotion() ? 'reduced' : 'full' };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<Settings>) } : fallback;
  } catch {
    return fallback;
  }
}

interface Ctx {
  settings: Settings;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** True when animations should play. */
  animate: boolean;
  glossaryOpen: string | false;
  openGlossary: (termId?: string) => void;
  closeGlossary: () => void;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    typeof window === 'undefined' ? { theme: 'auto', text: 'normal', motion: 'full' } : load(),
  );
  const [glossaryOpen, setGlossaryOpen] = useState<string | false>(false);

  useEffect(() => {
    const el = document.documentElement;
    if (settings.theme === 'auto') delete el.dataset.theme;
    else el.dataset.theme = settings.theme;
    el.dataset.text = settings.text;
    el.dataset.motion = settings.motion;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* storage blocked: settings last for this visit */
    }
  }, [settings]);

  const set = useCallback<Ctx['set']>((key, v) => setSettings((s) => ({ ...s, [key]: v })), []);
  const openGlossary = useCallback((id?: string) => setGlossaryOpen(id ?? ''), []);
  const closeGlossary = useCallback(() => setGlossaryOpen(false), []);
  const value = useMemo<Ctx>(
    () => ({ settings, set, animate: settings.motion === 'full', glossaryOpen, openGlossary, closeGlossary }),
    [settings, set, glossaryOpen, openGlossary, closeGlossary],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

const DEFAULT_CTX: Ctx = {
  settings: { theme: 'auto', text: 'normal', motion: 'full' },
  set: () => {},
  animate: false,
  glossaryOpen: false,
  openGlossary: () => {},
  closeGlossary: () => {},
};

/** Works without a provider too (unit tests render screens directly). */
export function useSettings(): Ctx {
  return useContext(SettingsContext) ?? DEFAULT_CTX;
}
