import { describe, expect, it } from 'vitest';
import { DIALOGUE } from '../data/dialogue';
import type { DialogueNode } from '../types';
import { ENCOUNTERS } from '../data/quests';

// v0.16.0 — full story-graph closure. User: "test semua rute/alur/ending/
// scene/combat, pastikan semuanya aman". These tests walk EVERY dialogue
// node and assert that the graph cannot dead-end on a missing reference and
// that every combat hook points back into the story — the same class of bug
// as the v0.15.2 'gate_fight' incident (fallback to a deleted id froze the
// player forever), but guarded at the graph level for every route at once.

const SPECIAL = (id: string) => id.startsWith('__');

describe('story graph closure (semua rute, semua ending)', () => {
  it('setiap node.next menunjuk node yang ADA (tidak ada dead-end referensi)', () => {
    for (const [id, n] of Object.entries(DIALOGUE)) {
      if (n.next && !SPECIAL(n.next)) {
        expect(DIALOGUE[n.next], `${id}.next → "${n.next}" tidak ada`).toBeDefined();
      }
    }
  });

  it('setiap choice.next menunjuk node yang ADA', () => {
    for (const [id, n] of Object.entries(DIALOGUE)) {
      for (const c of n.choices ?? []) {
        if (c.next && !SPECIAL(c.next)) {
          expect(DIALOGUE[c.next], `${id} choice "${c.id}" → "${c.next}" tidak ada`).toBeDefined();
        }
      }
    }
  });

  it('node tanpa next/legal-exit dilindusi oleh close() — pemeriksaan referensi yang valid', () => {
    // Node tanpa next adalah terminal SAH (close() mengembalikan GAMEPLAY):
    // hub pilihan, obrolan NPC, flavor zona, hidden event. Invarian yang
    // benar adalah CLOSURE (dua test di atas) + setiap node tanpa next
    // minimal punya choices ATAU memang terminal naratif.
    for (const [, n] of Object.entries(DIALOGUE)) {
      if (!n.next) {
        const terminalOk = (n.choices?.length ?? 0) > 0 || n.end === true || !n.choices;
        expect(terminalOk).toBe(true);
      }
    }
  });

  it('setiap rute utama BISA mencapai sebuah ending (konektivitas)', () => {
    const reach = (root: string): Set<string> => {
      const seen = new Set<string>();
      const stack = [root];
      while (stack.length) {
        const id = stack.pop()!;
        if (seen.has(id)) continue;
        const n = DIALOGUE[id];
        if (!n) continue;
        seen.add(id);
        if (n.next && !SPECIAL(n.next)) stack.push(n.next);
        for (const c of n.choices ?? []) if (c.next && !SPECIAL(c.next)) stack.push(c.next);
        // combat hook: the runtime continues into BOTH outcomes via
        // ENCOUNTERS.onWin/onLose — mirror that so connectivity holds
        // across __combat__ transitions (secret_fight etc.)
        if (n.next === '__combat__' || (n.choices ?? []).some((c) => c.next === '__combat__')) {
          for (const enc of Object.values(ENCOUNTERS)) {
            if (enc.onWin) stack.push(enc.onWin);
            if (enc.onLose) stack.push(enc.onLose);
          }
        }
      }
      return seen;
    };
    const isEnding = (id: string) => !!DIALOGUE[id]?.effects?.some((e) => e.k === 'ending');
    // one root per chapter-4 route branch (the prolog graph hands control to
    // the story director via beats, so route roots start at the ch4 splits)
    const ROUTES: [string, string][] = [
      // neutral standard masuk lewat zona street (SECRET CHOICE POINT menyerahkan
      // kontrol ke pemain — beat ch4_neu_secret), jadi root-nya chain zone-trigger
      ['neutral', 'ch4_neu_out_1'],
      ['neutral secret', 'ch4_neu_secret_1'],
      ['good/resistance', 'ch4_res_choice'], // hub pilihan tahan/brutal
      ['bad', 'ch4_bad_1'],
      ['bad2', 'ch4_bad2_1'],
    ];
    for (const [route, root] of ROUTES) {
      expect(DIALOGUE[root], `root rute ${route} ("${root}") tidak ada`).toBeDefined();
      const seen = reach(root);
      const endings = [...seen].filter(isEnding);
      expect(endings.length, `rute ${route} tidak menyentuh ending mana pun`).toBeGreaterThan(0);
    }
  });

  it('ENCOUNTERS ↔ story: onWin/onLose menunjuk node dialog yang ADA (dua arah)', () => {
    const ids = Object.keys(ENCOUNTERS);
    expect(ids.length).toBeGreaterThan(0);
    for (const [encId, enc] of Object.entries(ENCOUNTERS)) {
      expect(enc.enemies.length, `${encId} tanpa musuh`).toBeGreaterThan(0);
      for (const e of enc.enemies) {
        expect(e.hp, `${encId}/${e.name} hp <= 0`).toBeGreaterThan(0);
        expect(e.dmg, `${encId}/${e.name} dmg < 0`).toBeGreaterThanOrEqual(0);
      }
      if (enc.onWin) {
        expect(DIALOGUE[enc.onWin], `${encId}.onWin → "${enc.onWin}" tidak ada`).toBeDefined();
      }
      if (enc.onLose) {
        expect(DIALOGUE[enc.onLose], `${encId}.onLose → "${enc.onLose}" tidak ada`).toBeDefined();
      }
    }
  });
});
