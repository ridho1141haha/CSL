// ============================================================================
// src/data/story/index.ts — single source of truth graph cerita.
// Node dipisah per chapter/route/ending (lihat file masing-masing); file ini
// yang merakit DIALOGUE + tabel runtime (SPECIAL/MONTAGE/TRIGGER/FLAVOR/
// CHECKPOINT). Import publik tetap 'data/dialogue' (re-export shim).
// ============================================================================
import type { DialogueNode } from '../../types';
import { OPENING_NODES } from './opening';
import { BONDING_NODES } from './bonding';
import { CHAPTER2_NODES } from './chapter2';
import { CHAPTER3_NODES } from './chapter3';
import { NEUTRAL_NODES } from './routes/neutral';
import { BAD_ROUTE_NODES } from './routes/bad';
import { RESISTANCE_NODES } from './routes/resistance';
import { NEUTRAL_ENDING_NODES } from './endings/neutralEnding';
import { BAD1_ENDING_NODES } from './endings/bad1Ending';
import { GOOD_ENDING_NODES } from './endings/goodEnding';
import { BAD2_ENDING_NODES } from './endings/bad2Ending';
import { NPC_NODES } from './npc';
import { DISCOVERY_NODES } from './discoveries';
import { AMBIENT_NODES } from './ambient';

export const DIALOGUE: Record<string, DialogueNode> = Object.fromEntries(
  [
    ...OPENING_NODES,
    ...BONDING_NODES,
    ...CHAPTER2_NODES,
    ...CHAPTER3_NODES,
    ...NPC_NODES,
    ...NEUTRAL_NODES,
    ...BAD_ROUTE_NODES,
    ...RESISTANCE_NODES,
    ...NEUTRAL_ENDING_NODES,
    ...BAD1_ENDING_NODES,
    ...GOOD_ENDING_NODES,
    ...BAD2_ENDING_NODES,
    ...DISCOVERY_NODES,
    ...AMBIENT_NODES,
  ].map((n) => [n.id, n]),
);

// Special node ids consumed by the dialogue runner (not real nodes)
export const SPECIAL_NODES = { combat: '__combat__', study: '__study__' };

// Runtime wiring tables — single source of truth for how the story graph is
// entered from the world. StoryDirector consumes ZONE_FLAVOR; the montage
// roots + trigger nodes + checkpoints are asserted by test/storyFlow.test.ts
// so a broken link fails CI instead of dead-ending a playthrough.
// v0.15.0: + ch1_lib_1 / ch1_pts_1 (montase bonding doc Ch3/Ch4) dan
// ch4_neu_out_1 / ch4_neu_secret_1 (SECRET CHOICE POINT rute netral).
export const MONTAGE_ROOTS = ['ch1_lib_1', 'ch1_pts_1', 'ch4_bad_1', 'ch4_res_1', 'n1_1'] as const;
export const STORY_TRIGGER_NODES = [
  'ch2_intro_1',
  'ch3_osis_1', // GARIS MERAH: pendekatan OSIS (montase)
  'ch3_f2_1', // GARIS MERAH: teror fisik parkiran [FIGHT 2]
  'ch3_intro_1', // rooftop
  'ch4_res_alley', // penyanderaan
  'ch4_bad_grad_1', // bad ending 1 (kelulusan)
  'ch4_good_grad_1', // good ending (kelulusan)
  'ch4_neu_grad_1', // neutral ending (kelulusan)
  'ch4_neu_out_1', // v0.15.0: standard neutral (keluar gerbang)
  'ch4_neu_secret_1', // v0.15.0: secret battle (gang belakang)
] as const;
export const ZONE_FLAVOR: Record<string, string> = {
  field: 'zone_field',
  canteen: 'zone_canteen',
  back_alley: 'zone_alley',
  parking: 'zone_parking',
  street: 'zone_street',
  classroom: 'zone_classroom',
  warehouse: 'zone_warehouse',
  // v0.8.0: new buildings
  library: 'zone_library',
  gedung_b: 'zone_gedung_b',
};
export const CHECKPOINT_NODES = [
  'ch1_lib_6', // v0.15.0: sebelum montase PTS
  'ch1_pts_5', // v0.15.0: sebelum insiden tangga
  'ch2_close',
  'ch2_away_2',
  'ch3_osis_6', // GARIS MERAH: sebelum sergapan parkiran
  'ch3_f2_win_3', // GARIS MERAH: sebelum rooftop
  'ch3_accept_2',
  'ch3_reject_2',
  'ch4_res_3',
  'ch4_good_4', // GARIS MERAH: sebelum kelulusan (good)
  'ch4_bad_after_2', // GARIS MERAH: sebelum kelulusan (bad)
  'ch4_neu_grad_8', // v0.15.0: sebelum SECRET CHOICE POINT (netral)
  'n5_2',
] as const;

export const getDialogue = (id: string): DialogueNode | undefined => DIALOGUE[id];
