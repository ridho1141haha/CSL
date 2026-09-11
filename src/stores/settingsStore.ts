import { create } from 'zustand';

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
};

export const useSettings = create<Store>((set) => ({
  ...DEFAULTS,
  set: (k, v) => set({ [k]: v } as Partial<Store>),
  resetAll: () => set({ ...DEFAULTS }),
}));
