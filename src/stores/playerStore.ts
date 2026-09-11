import { create } from 'zustand';

type Store = {
  hp: number;
  maxHp: number;
  focus: number;
  x: number;
  z: number;
  facing: number;
  defeated: boolean;

  spawn: (x: number, z: number) => void;
  setPos: (x: number, z: number) => void;
  setFacing: (f: number) => void;
  damage: (n: number) => void;
  heal: (n: number) => void;
  addFocus: (n: number) => void;
  setFocus: (n: number) => void;
  setDefeated: (v: boolean) => void;
  resetAll: () => void;
};

const START = { hp: 100, maxHp: 100, focus: 100, x: 7, z: 29, facing: Math.PI, defeated: false };

export const usePlayer = create<Store>((set) => ({
  ...START,
  spawn: (x, z) => set({ x, z, hp: START.hp, focus: START.focus, defeated: false }),
  setPos: (x, z) => set({ x, z }),
  setFacing: (facing) => set({ facing }),
  damage: (n) => set((s) => ({ hp: Math.max(0, s.hp - Math.max(0, Math.round(n))) })),
  heal: (n) => set((s) => ({ hp: Math.min(s.maxHp, s.hp + Math.max(0, Math.round(n))) })),
  addFocus: (n) => set((s) => ({ focus: Math.max(0, Math.min(100, s.focus + Math.round(n))) })),
  setFocus: (n) => set({ focus: Math.max(0, Math.min(100, Math.round(n))) }),
  setDefeated: (defeated) => set({ defeated }),
  resetAll: () => set({ ...START }),
}));
