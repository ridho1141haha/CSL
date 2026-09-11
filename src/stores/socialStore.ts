import { create } from 'zustand';
import type { NpcId } from '../types';
import { clampRel } from '../game/systems/relationship';

type Store = {
  relationships: Record<NpcId, number>;
  visitedNpc: Record<NpcId, boolean>;
  addRel: (target: NpcId, delta: number) => void;
  visit: (npc: NpcId) => void;
  resetAll: () => void;
};

export const useSocial = create<Store>((set) => ({
  relationships: { aris: 0, siti: 0, bimo: 0, budi: 0 },
  visitedNpc: { aris: false, siti: false, bimo: false, budi: false },
  addRel: (target, delta) =>
    set((s) => ({ relationships: { ...s.relationships, [target]: clampRel((s.relationships[target] ?? 0) + delta) } })),
  visit: (npc) => set((s) => ({ visitedNpc: { ...s.visitedNpc, [npc]: true } })),
  resetAll: () =>
    set({ relationships: { aris: 0, siti: 0, bimo: 0, budi: 0 }, visitedNpc: { aris: false, siti: false, bimo: false, budi: false } }),
}));
