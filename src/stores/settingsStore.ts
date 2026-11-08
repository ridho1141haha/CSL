import { create } from 'zustand';
import type { Quality } from '../game/quality';
import type { CamMode } from '../game/camera/mode';

export type Settings = {
  camDistance: number;
  camMin: number;
  camMax: number;
  /** v0.13.0: first-person / third-person camera mode (persisted) */
  camMode: CamMode;
  /** v0.10.0: mouse/touch look speed multiplier (1 = default feel) */
  sensitivity: number;
  /** v0.10.0: flip vertical camera look */
  invertY: boolean;
  master: number;
  music: number;
  sfx: number;
  ui: number;
  ambient: number;
  reducedMotion: boolean;
  screenShake: boolean;
  typewriterCps: number;
  uiScale: number;
  /** v0.10.0: dialogue text size multiplier (1 = default) */
  subtitleScale: number;
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
  camMode: 'third',
  sensitivity: 1,
  invertY: false,
  master: 0.8,
  music: 0.6,
  sfx: 0.9,
  ui: 0.9,
  ambient: 0.5,
  reducedMotion: false,
  screenShake: true,
  typewriterCps: 34,
  uiScale: 1,
  subtitleScale: 1,
  quality: 'auto',
};

const LS_KEY = 'csl.settings.v1';

// v0.16.0: per-key VALUE validation (not just typeof). Dulu `typeof v ===
// typeof DEFAULTS[k]` saja — string apapun lolos, mis. `quality: "RENDAH"`
// (label, bukan nilai enum 'low') → qualityConfig() mengembalikan undefined
// → pbr.tsx crash saat modul dimuat → LAYAR PUTIH permanen yang tidak bisa
// disembuhkan user (localStorage bertahan lintas reload). Payload lama/rusak
// kini jatuh ke nilai pabrik per-kunci.
const QUALITY_VALUES: readonly string[] = ['auto', 'high', 'medium', 'low'];
const CAMMODE_VALUES: readonly string[] = ['third', 'first'];
const NUMERIC_MIN: Partial<Record<keyof Settings, number>> = {
  camDistance: 1, camMin: 0.5, camMax: 2, sensitivity: 0.1, master: 0,
  music: 0, sfx: 0, ui: 0, ambient: 0, typewriterCps: 5, uiScale: 0.5, subtitleScale: 0.5,
};
const NUMERIC_MAX: Partial<Record<keyof Settings, number>> = {
  camDistance: 12, camMin: 2, camMax: 16, sensitivity: 5, master: 1,
  music: 1, sfx: 1, ui: 1, ambient: 1, typewriterCps: 120, uiScale: 2, subtitleScale: 2,
};

function isValidSetting(k: keyof Settings, v: unknown): boolean {
  const def = DEFAULTS[k];
  if (typeof v !== typeof def) return false;
  if (k === 'quality') return QUALITY_VALUES.includes(v as string);
  if (k === 'camMode') return CAMMODE_VALUES.includes(v as string);
  if (typeof def === 'number') {
    const n = v as number;
    if (!Number.isFinite(n)) return false;
    const min = NUMERIC_MIN[k];
    const max = NUMERIC_MAX[k];
    if (min !== undefined && n < min) return false;
    if (max !== undefined && n > max) return false;
    return true;
  }
  return true; // boolean / future primitive with matching typeof
}

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
      if (isValidSetting(k, v)) out[k] = v;
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
