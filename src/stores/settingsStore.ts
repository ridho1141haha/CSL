import { create } from 'zustand';
import type { Quality } from '../game/quality';

export type Settings = {
  camDistance: number;
  camMin: number;
  camMax: number;
  master: number;
  music: number;
  sfx: number;
  ui: number;
  ambient: number;
  reducedMotion: boolean;
  screenShake: boolean;
  typewriterCps: number;
  uiScale: number;
  /** v0.9.0: graphics quality (auto resolves from device tier) */
  quality: Quality;
};

type Store = Settings & {
  set: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  resetAll: () => void;
};

const DEFAULTS: Settings = {
  camDistance: 4.6,
  camMin: 2.6,
  camMax: 8,
  master: 0.8,
  music: 0.6,
  sfx: 0.9,
  ui: 0.9,
  ambient: 0.5,
  reducedMotion: false,
  screenShake: true,
  typewriterCps: 34,
  uiScale: 1,
  quality: 'auto',
};

const LS_KEY = 'csl.settings.v1';

// v0.9.0: settings (previously ephemeral) now persist to localStorage so the
// chosen graphics tier survives reloads. Validates + merges over DEFAULTS —
// a corrupt or stale payload falls back to factory values.
function loadPersisted(): Partial<Settings> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
      const v = parsed[k];
      if (typeof v === typeof DEFAULTS[k]) out[k] = v;
    }
    return out as Partial<Settings>;
  } catch {
    return {};
  }
}

function persist(state: Store): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const plain: Record<string, unknown> = {};
    for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) plain[k] = state[k];
    localStorage.setItem(LS_KEY, JSON.stringify(plain));
  } catch {
    /* storage full / disabled — settings just stay ephemeral */
  }
}

export const useSettings = create<Store>((set, get) => ({
  ...DEFAULTS,
  ...loadPersisted(),
  set: (k, v) => {
    set({ [k]: v } as Partial<Store>);
    persist(get());
  },
  resetAll: () => {
    set({ ...DEFAULTS });
    persist(get());
  },
}));
