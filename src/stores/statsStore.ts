import { create } from 'zustand';
import type { Stats } from '../types';

const START: Stats = { academic: 68, violence: 5, diplomacy: 8, reputation: 0 };

type Store = Stats & {
  addStat: (stat: keyof Stats, delta: number) => void;
  resetAll: () => void;
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export const useStats = create<Store>((set) => ({
  ...START,
  addStat: (stat, delta) => set((s) => ({ [stat]: clamp((s[stat] as number) + delta) })),
  resetAll: () => set({ ...START }),
}));
