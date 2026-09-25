import { create } from 'zustand';
import type { NpcId } from '../types';
import { NPCS } from '../data/npcs';
import { clampRel } from '../game/systems/relationship';

// v0.17.0: every per-NPC map is DERIVED from the NPC registry — adding a cast
// member (types NpcId + data/npcs.ts entry) no longer requires touching this
// store. Before, init and resetAll each carried hand-synced literal maps and
// a missed key silently fell back to `?? 0` at every read site.

const zeroRel = () => Object.fromEntries(NPCS.map((n) => [n.id, 0])) as Record<NpcId, number>;
const unvisited = () => Object.fromEntries(NPCS.map((n) => [n.id, false])) as Record<NpcId, boolean>;

type Store = {
  relationships: Record<NpcId, number>;
  visitedNpc: Record<NpcId, boolean>;
  talkCounts: Record<NpcId, number>; // hidden-event condition input (systems/conditions 'talks')
  addRel: (target: NpcId, delta: number) => void;
  visit: (npc: NpcId) => void;
  resetAll: () => void;
};

export const useSocial = create<Store>((set) => ({
  relationships: zeroRel(),
  visitedNpc: unvisited(),
  talkCounts: zeroRel(),
  addRel: (target, delta) =>
    set((s) => ({ relationships: { ...s.relationships, [target]: clampRel((s.relationships[target] ?? 0) + delta) } })),
  visit: (npc) =>
    set((s) => ({
      visitedNpc: { ...s.visitedNpc, [npc]: true },
      talkCounts: { ...s.talkCounts, [npc]: (s.talkCounts[npc] ?? 0) + 1 },
    })),
  resetAll: () =>
    set({
      relationships: zeroRel(),
      visitedNpc: unvisited(),
      talkCounts: zeroRel(),
    }),
}));
