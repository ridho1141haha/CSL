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
import { STORY_TRIGGERS } from './triggers';

export { STORY_TRIGGERS };

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
// entered from the world. v0.17.1: DERIVED from the STORY_TRIGGERS registry
// (data/story/triggers.ts) — were two hand-maintained lists that drifted from
// the StoryDirector branches they mirrored. storyFlow/staging/cinema tests
// consume them so a broken link fails CI instead of dead-ending a playthrough.
export const MONTAGE_ROOTS: string[] = STORY_TRIGGERS.filter(
  (t) => t.duringCinematic && t.open,
).map((t) => t.open!);
export const STORY_TRIGGER_NODES: string[] = STORY_TRIGGERS.flatMap((t) =>
  t.open ? [t.open] : [],
);
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
