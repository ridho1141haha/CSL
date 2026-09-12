import type { HiddenEventDef } from '../types';

// ============================================================================
// HIDDEN EVENTS (mentor feedback #5) — data-driven optional content.
//
// Players are rewarded for exploring/talking instead of only chasing the main
// quest marker. Discovery persists as a `he_<id>` story flag (set by the
// runner BEFORE the dialogue opens), so old saves stay compatible and the
// Quests panel can show a discovery log.
//
// Trigger kinds:
//   zone — checked while the player stands inside `zone` (StoryDirector tick)
//   npc  — checked when the player interacts with `npc` (StoryDirector interact)
// Optional gates: `period` (time-of-day), `reqs` (any Condition — flags,
// chapter, route, stats, relationships, quests, zone, talk counts).
// ============================================================================

export const HIDDEN_EVENTS: HiddenEventDef[] = [
  {
    id: 'he_rooftop',
    title: 'Coretan di Atap',
    trigger: { k: 'zone' },
    zone: 'rooftop',
    reqs: { k: 'chapterMin', id: 3 },
    dialogue: 'he_rooftop_1',
  },
  {
    id: 'he_alley_mark',
    title: 'Tanda di Tembok Gang',
    trigger: { k: 'zone' },
    zone: 'back_alley',
    reqs: { k: 'chapterMin', id: 2 },
    dialogue: 'he_alley_1',
  },
  {
    id: 'he_canteen_rumor',
    title: 'Kebiasaan Kantin',
    trigger: { k: 'npc' },
    npc: 'aris',
    period: 'lunch',
    dialogue: 'he_canteen_1',
  },
  {
    id: 'he_field_gloves',
    title: 'Sarung di Lapangan',
    trigger: { k: 'zone' },
    zone: 'field',
    period: 'after',
    reqs: { k: 'chapterMin', id: 2 },
    dialogue: 'he_field_1',
  },
  {
    id: 'he_parking_patrol',
    title: 'Ronda di Parkir',
    trigger: { k: 'zone' },
    zone: 'parking',
    period: 'class2',
    reqs: { k: 'chapterMin', id: 2 },
    dialogue: 'he_parking_1',
  },
  {
    id: 'he_budi_late',
    title: 'Ruang Guru Paling Sepi',
    trigger: { k: 'npc' },
    npc: 'budi',
    period: 'after',
    dialogue: 'he_budi_1',
  },
  {
    id: 'he_classroom_desk',
    title: 'Goresan di Bangku',
    trigger: { k: 'zone' },
    zone: 'classroom',
    reqs: { k: 'flag', id: 'helped_aris' },
    dialogue: 'he_classroom_1',
  },
  {
    id: 'he_hall_notice',
    title: 'Lembar Polos di Papan OSIS',
    trigger: { k: 'zone' },
    zone: 'hall',
    reqs: { k: 'chapterMin', id: 3 },
    dialogue: 'he_hall_1',
  },
  {
    id: 'he_bimo_warning',
    title: 'Bimo Menunggu di Gang',
    trigger: { k: 'npc' },
    npc: 'bimo',
    period: 'after',
    reqs: { k: 'chapterMin', id: 2 },
    dialogue: 'he_bimo_alley_1',
  },
];

// Event ids ARE their persistence flag ids (they already carry the `he_`
// prefix), so discovery survives save/load through the standard flag list.
export const HIDDEN_EVENT_FLAG = (id: string) => id;
export const HIDDEN_EVENT_BY_ID: Record<string, HiddenEventDef> = Object.fromEntries(
  HIDDEN_EVENTS.map((e) => [e.id, e]),
);
