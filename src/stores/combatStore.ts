import { create } from 'zustand';
import type { EncounterEnemy, ZoneId } from '../types';
import { ENCOUNTERS } from '../data/quests';

export type CombatEnemy = EncounterEnemy & { hp: number; maxHp: number };

type Store = {
  encounterId: string | null;
  arena: ZoneId | null;
  enemies: CombatEnemy[];
  index: number;
  phase: 'fighting' | 'won' | 'lost' | null;
  lastPlayerHitAt: number; // seconds epoch for red flash
  totalDamageDealt: number;

  start: (encounterId: string) => void;
  enemy: () => CombatEnemy | null;
  hitEnemy: (dmg: number) => void;
  hitPlayer: (dmg: number) => void;
  finish: (phase: 'won' | 'lost') => void;
  reset: () => void;
};

export const useCombat = create<Store>((set, get) => ({
  encounterId: null,
  arena: null,
  enemies: [],
  index: 0,
  phase: null,
  lastPlayerHitAt: 0,
  totalDamageDealt: 0,

  start: (encounterId) => {
    const def = ENCOUNTERS[encounterId];
    if (!def) return;
    set({
      encounterId,
      arena: def.arena,
      enemies: def.enemies.map((e) => ({ ...e, hp: e.hp, maxHp: e.hp })),
      index: 0,
      phase: 'fighting',
      lastPlayerHitAt: 0,
      totalDamageDealt: 0,
    });
  },

  enemy: () => {
    const s = get();
    return s.enemies[s.index] ?? null;
  },

  hitEnemy: (dmg) => {
    const s = get();
    const enemy = s.enemies[s.index];
    if (!enemy || s.phase !== 'fighting') return;
    const hp = Math.max(0, enemy.hp - dmg);
    const enemies = [...s.enemies];
    enemies[s.index] = { ...enemy, hp };
    if (hp === 0 && s.index < s.enemies.length - 1) {
      set({ enemies, totalDamageDealt: s.totalDamageDealt + dmg, index: s.index + 1 });
    } else {
      set({ enemies, totalDamageDealt: s.totalDamageDealt + dmg });
    }
  },

  hitPlayer: (dmg) => set({ lastPlayerHitAt: Date.now() }),

  finish: (phase) => set({ phase }),

  reset: () =>
    set({ encounterId: null, arena: null, enemies: [], index: 0, phase: null, totalDamageDealt: 0 }),
}));
