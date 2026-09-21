import { describe, it, expect } from 'vitest';
import {
  DIALOGUE,
  getDialogue,
  MONTAGE_ROOTS,
  STORY_TRIGGER_NODES,
  ZONE_FLAVOR,
  CHECKPOINT_NODES,
  SPECIAL_NODES,
} from '../data/dialogue';
import { OPENING_NODES } from '../data/story/opening';
import { CHAPTER2_NODES } from '../data/story/chapter2';
import { CHAPTER3_NODES } from '../data/story/chapter3';
import { NEUTRAL_NODES } from '../data/story/routes/neutral';
import { BAD_ROUTE_NODES } from '../data/story/routes/bad';
import { RESISTANCE_NODES } from '../data/story/routes/resistance';
import { NEUTRAL_ENDING_NODES } from '../data/story/endings/neutralEnding';
import { BAD1_ENDING_NODES } from '../data/story/endings/bad1Ending';
import { GOOD_ENDING_NODES } from '../data/story/endings/goodEnding';
import { BAD2_ENDING_NODES } from '../data/story/endings/bad2Ending';
import { NPC_NODES } from '../data/story/npc';
import { DISCOVERY_NODES } from '../data/story/discoveries';
import { AMBIENT_NODES } from '../data/story/ambient';
import type { DialogueNode } from '../types';

// v0.14.0 — modularisasi cerita (Task 4/5): graph terpecah per chapter /
// route / ending, tapi harus tetap SATU graph yang utuh dan bebas duplikat,
// dan rute/ending harus terisolasi satu sama lain.

const ALL_MODULES: [string, DialogueNode[]][] = [
  ['opening', OPENING_NODES],
  ['chapter2', CHAPTER2_NODES],
  ['chapter3', CHAPTER3_NODES],
  ['neutral', NEUTRAL_NODES],
  ['bad', BAD_ROUTE_NODES],
  ['resistance', RESISTANCE_NODES],
  ['endingNeutral', NEUTRAL_ENDING_NODES],
  ['endingBad1', BAD1_ENDING_NODES],
  ['endingGood', GOOD_ENDING_NODES],
  ['endingBad2', BAD2_ENDING_NODES],
  ['npc', NPC_NODES],
  ['discoveries', DISCOVERY_NODES],
  ['ambient', AMBIENT_NODES],
];

function reach(root: string): Set<string> {
  const seen = new Set<string>();
  const stack = [root];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    const n = getDialogue(id);
    if (!n) continue; // __combat__/__study__ etc.
    seen.add(id);
    if (n.next && !n.next.startsWith('__')) stack.push(n.next);
    for (const c of n.choices ?? []) if (c.next) stack.push(c.next);
  }
  return seen;
}

describe('story module separation (v0.14.0)', () => {
  it('module composition == single DIALOGUE map, no duplicate ids', () => {
    const seen = new Set<string>();
    const total = ALL_MODULES.reduce((acc, [, nodes]) => acc + nodes.length, 0);
    for (const [, nodes] of ALL_MODULES) {
      for (const n of nodes) {
        expect(seen.has(n.id), `duplikat node: ${n.id}`).toBe(false);
        seen.add(n.id);
      }
    }
    expect(seen.size).toBe(total);
    expect(total).toBe(Object.keys(DIALOGUE).length);
  });

  it('each module only owns its id family', () => {
    const families: [string, (id: string) => boolean][] = [
      ['opening', (id) => /^(o[1-5]_)/.test(id)],
      ['chapter2', (id) => id.startsWith('ch2_')],
      ['chapter3', (id) => id.startsWith('ch3_')],
      ['neutral', (id) => /^(n[1-4]_)/.test(id)],
      ['bad', (id) => id.startsWith('ch4_bad_')],
      ['resistance', (id) => id.startsWith('ch4_res_')],
      ['endingNeutral', (id) => id.startsWith('ch4_neu_grad_')],
      ['endingBad1', (id) => id.startsWith('ch4_bad_grad_')],
      ['endingGood', (id) => id.startsWith('ch4_good_')],
      ['endingBad2', (id) => id.startsWith('ch4_bad2_')],
      ['discoveries', (id) => id.startsWith('he_')],
      ['ambient', (id) => id.startsWith('zone_')],
    ];
    for (const [name, nodes] of ALL_MODULES) {
      const fam = families.find(([f]) => f === name);
      if (!fam) continue; // npc = sisa (roots + subtree)
      for (const n of nodes) {
        expect(fam[1](n.id), `${name} memuat id aneh: ${n.id}`).toBe(true);
      }
    }
  });

  it('runtime tables all point at real nodes', () => {
    for (const n of [...STORY_TRIGGER_NODES, ...MONTAGE_ROOTS, ...CHECKPOINT_NODES]) {
      expect(DIALOGUE[n], `runtime table → node hilang: ${n}`).toBeDefined();
    }
    for (const [, nodeId] of Object.entries(ZONE_FLAVOR)) {
      expect(DIALOGUE[nodeId], `ZONE_FLAVOR → node hilang: ${nodeId}`).toBeDefined();
    }
    expect(SPECIAL_NODES.combat).toBe('__combat__');
  });

  it('ENDINGS ARE ISOLATED (Task 12): tidak ada ending menjalankan graph ending lain', () => {
    const neutral = reach('ch4_neu_grad_1');
    const bad1 = reach('ch4_bad_grad_1');
    const good = reach('ch4_good_grad_1');
    const bad2 = reach('ch4_bad2_1');
    const pairs: [string, Set<string>, string, Set<string>][] = [
      ['neutral', neutral, 'bad1', bad1],
      ['neutral', neutral, 'good', good],
      ['neutral', neutral, 'bad2', bad2],
      ['bad1', bad1, 'good', good],
      ['bad1', bad1, 'bad2', bad2],
      ['good', good, 'bad2', bad2],
    ];
    for (const [an, a, bn, b] of pairs) {
      for (const id of a) {
        expect(b.has(id), `${an} menyentuh node milik ${bn}: ${id}`).toBe(false);
      }
    }
    // tiap ending berakhir dengan effect {k:'ending'}
    expect(neutral.has('ch4_neu_grad_6')).toBe(true);
    expect(bad1.has('ch4_bad_grad_3')).toBe(true);
    expect(good.has('ch4_good_grad_5')).toBe(true);
    expect(bad2.has('ch4_bad2_5')).toBe(true);
  });

  it('routes are separated (Task 4): montase netral ≠ rooftop ≠ bad ≠ resistance', () => {
    const neutralMontage = reach('n1_1');
    const rooftop = reach('ch3_intro_1');
    const badMontage = reach('ch4_bad_1');
    const resMontage = reach('ch4_res_1');
    for (const id of neutralMontage) expect(rooftop.has(id), `netral↔rooftop silang: ${id}`).toBe(false);
    for (const id of badMontage) expect(resMontage.has(id), `bad↔resistance silang: ${id}`).toBe(false);
    for (const id of neutralMontage) expect(badMontage.has(id), `netral↔bad silang: ${id}`).toBe(false);
  });

  it('NPC trees stay out of route graphs (free-roam ≠ story scene)', () => {
    const npcIds = new Set(NPC_NODES.map((n) => n.id));
    const res = reach('ch4_res_1');
    for (const id of res) expect(npcIds.has(id), `route memakai node NPC: ${id}`).toBe(false);
  });
});
