import { useGame } from '../stores/gameStore';
import { usePlayer } from '../stores/playerStore';
import { useStats } from '../stores/statsStore';
import { useStory } from '../stores/storyStore';
import { useSocial } from '../stores/socialStore';
import { useQuests } from '../stores/questStore';
import { useInventory } from '../stores/inventoryStore';
// v0.17.0: useCombat / resetCombatRuntime / enemyPos imports REMOVED — they
// were only used by loadGame, which moved to game/loadFlow.ts. save.ts is now
// a pure (snapshot ↔ localStorage) module: importing combat.ts here closed the
// module cycle save → combat → dialogueStore → effects → (dynamic) save.
import { STARTING_INVENTORY } from '../data/items';
import { NPCS } from '../data/npcs';
import { CHAPTERS } from '../data/chapters';
import { ROUTES } from '../types';
import type { ChapterId, Clock, NpcId, QuestState, Route, SceneId, StoryBeat, ZoneId } from '../types';

export const SAVE_VERSION = 2;
const KEY_PREFIX = 'csl-save-v2';
export const SAVE_SLOTS = ['auto', '1', '2', '3'] as const;
export type SlotId = (typeof SAVE_SLOTS)[number];

export type SaveV2 = {
  version: number;
  savedAt: number;
  clock: Clock;
  visitedZones: ZoneId[];
  player: { hp: number; focus: number; x: number; z: number };
  stats: { academic: number; violence: number; diplomacy: number; reputation: number };
  story: { chapter: ChapterId; beat: StoryBeat; route: Route; flags: string[]; choices: Record<string, string> };
  relationships: Record<NpcId, number>;
  visitedNpc: Record<NpcId, boolean>;
  talkCounts?: Record<NpcId, number>; // optional since v0.6 — old saves default to zero
  quests: Record<string, QuestState>;
  inventory: string[];
  scene?: SceneId;
};

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function snapshot(): SaveV2 {
  const g = useGame.getState();
  const p = usePlayer.getState();
  const st = useStats.getState();
  const s = useStory.getState();
  const so = useSocial.getState();
  const q = useQuests.getState();
  const inv = useInventory.getState();
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    clock: { ...g.clock },
    visitedZones: [...g.visitedZones],
    player: { hp: p.hp, focus: p.focus, x: p.x, z: p.z },
    stats: { academic: st.academic, violence: st.violence, diplomacy: st.diplomacy, reputation: st.reputation },
    story: { chapter: s.chapter, beat: s.beat, route: s.route, flags: [...s.flags], choices: { ...s.choices } },
    relationships: { ...so.relationships },
    visitedNpc: { ...so.visitedNpc },
    talkCounts: { ...so.talkCounts },
    quests: { ...q.quests },
    inventory: [...inv.items],
    scene: g.scene,
  };
}

// v0.17.0: exported — loadFlow.ts (the load orchestrator) applies it after
// resetting combat runtime. Parse/apply stay split so tests can pin each half.
export function applySave(d: SaveV2) {
  // v0.7.0 story rework: normalisasi beat/quest dari save lama.
  // 'ch2_gate' (fight gerbang) diganti 'ch2_key_error' (Kesalahan Kecil Aris)
  // — save lama yang sedang berada di tengah bab 2 dipulangkan ke beat
  // ch1_break supaya pemicu baru di tangga belakang bisa berjalan normal.
  if ((d.story?.beat as string) === 'ch2_gate') {
    d.story.beat = 'ch1_break';
    if (d.quests?.gate_trouble === 'active') {
      d.quests.gate_trouble = 'completed';
      d.quests.aris_incident = 'active';
    }
  }
  useGame.setState({
    phase: 'play',
    clock: { day: num(d.clock?.day, 0), minutes: num(d.clock?.minutes, 7 * 60 + 12) },
    visitedZones: Array.isArray(d.visitedZones) ? d.visitedZones : [],
    scene: d.scene ?? 'campus',
    ending: null,
    notifications: [],
    pendingChapter: null,
    fade: 'none',
  });
  usePlayer.setState({
    hp: num(d.player?.hp, 100),
    maxHp: 100,
    focus: num(d.player?.focus, 100),
    x: num(d.player?.x, 7),
    z: num(d.player?.z, 29),
    defeated: false,
  });
  useStats.setState({
    academic: num(d.stats?.academic, 68),
    violence: num(d.stats?.violence, 5),
    diplomacy: num(d.stats?.diplomacy, 8),
    reputation: num(d.stats?.reputation, 0),
  });
  // v0.17.0 hardening (audit J1): a corrupted/foreign save used to be able to
  // write ANY value into chapter/beat/route (cast-only). Route drives ending
  // resolution → enum-checked against ROUTES; chapter is validated against
  // the CHAPTERS registry; beat gets a type check (enum membership would need
  // a hand-maintained beat list that WILL drift — deliberately not done, see
  // DECISIONS #14). Garbage falls back to the chapter-1 defaults.
  const rawBeat: unknown = d.story?.beat;
  const safeBeat = (typeof rawBeat === 'string' && rawBeat.length > 0 ? rawBeat : 'ch1_explore') as StoryBeat;
  const rawRoute: unknown = d.story?.route;
  const safeRoute = ((ROUTES as readonly string[]).includes(rawRoute as string) ? rawRoute : 'none') as Route;
  const rawChapter = Math.round(num(d.story?.chapter, 1));
  const safeChapter = (CHAPTERS[rawChapter as ChapterId] ? rawChapter : 1) as ChapterId;
  useStory.setState({
    chapter: safeChapter,
    beat: safeBeat,
    route: safeRoute,
    flags: Array.isArray(d.story?.flags) ? d.story.flags : [],
    choices: d.story?.choices && typeof d.story.choices === 'object' ? d.story.choices : {},
  });
  const so = useSocial.getState();
  useSocial.setState({
    relationships: { ...so.relationships, ...(d.relationships ?? {}) },
    visitedNpc: { ...so.visitedNpc, ...(d.visitedNpc ?? {}) },
    talkCounts: { ...so.talkCounts, ...(d.talkCounts ?? {}) },
  });
  useQuests.setState({ quests: { ...useQuests.getState().quests, ...(d.quests ?? {}) } });
  useInventory.setState({ items: Array.isArray(d.inventory) ? d.inventory.filter((i) => typeof i === 'string') : [...STARTING_INVENTORY] });
}

const key = (slot: SlotId) => `${KEY_PREFIX}:${slot}`;

// v0.17.0: raw slot read for loadFlow.ts (the orchestrator). save.ts stays
// pure storage; slot-empty vs corrupt distinction is an orchestration concern.
export function slotRaw(slot: SlotId): string | null {
  try {
    return localStorage.getItem(key(slot));
  } catch {
    return null;
  }
}

export function saveGame(slot: SlotId = 'auto'): string {
  try {
    localStorage.setItem(key(slot), JSON.stringify(snapshot()));
    useGame.getState().notify('Game tersimpan', 'info');
    return '';
  } catch {
    return 'Gagal menyimpan progres.';
  }
}

// loadGame moved to game/loadFlow.ts (v0.17.0) — it resets combat runtime
// before applying, and save.ts must not import combat/combat.ts (cycle).

export function deleteSave(slot: SlotId) {
  try {
    localStorage.removeItem(key(slot));
  } catch {
    /* storage unavailable */
  }
}

export function hasSave(slot: SlotId): boolean {
  try {
    return !!localStorage.getItem(key(slot));
  } catch {
    return false;
  }
}

export function slotInfo(slot: SlotId): { chapter: number; savedAt: number | null } {
  try {
    const raw = localStorage.getItem(key(slot));
    if (!raw) return { chapter: 0, savedAt: null };
    const d = parseSave(JSON.parse(raw));
    return d ? { chapter: d.story.chapter, savedAt: d.savedAt } : { chapter: 0, savedAt: null };
  } catch {
    return { chapter: 0, savedAt: null };
  }
}

// v1 schema (old csl-save-v1) migration — best effort, preserves story basics.
// v0.17.0: relationship/visited maps are DERIVED from the NPC registry. The
// only cast knowledge that legitimately stays here is WHICH characters
// existed in the v1 era (Pak Budi was added later — he starts unvisited).
const V1_CAST: readonly string[] = ['aris', 'siti', 'bimo'];

export function migrateV1(old: Record<string, unknown>): SaveV2 | null {
  if (!old || typeof old !== 'object') return null;
  const flags = Array.isArray(old.flags) ? (old.flags as string[]) : [];
  const phase = old.phase;
  if (phase !== 'play') return null; // pre-opening v1 saves restart from scratch
  const legacyRel = old.relationship as Record<string, number> | undefined;
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    clock: { day: 0, minutes: 7 * 60 + 40 },
    visitedZones: ['courtyard'],
    player: { hp: 100, focus: 100, x: num((old.player as { x?: number })?.x, 7), z: num((old.player as { z?: number })?.z, 29) },
    stats: { academic: 68, violence: 5, diplomacy: 8, reputation: 0 },
    story: {
      chapter: 1,
      beat: 'ch1_explore',
      route: 'none',
      flags: flags.includes('helped_aris') ? ['helped_aris', 'opening_complete'] : flags.includes('walked_past_aris') ? ['ignored_aris', 'opening_complete'] : ['opening_complete'],
      choices: old.choice ? { o3_choice: String(old.choice) } : {},
    },
    relationships: Object.fromEntries(NPCS.map((n) => [n.id, num(legacyRel?.[n.id], 0)])) as Record<NpcId, number>,
    visitedNpc: Object.fromEntries(NPCS.map((n) => [n.id, V1_CAST.includes(n.id)])) as Record<NpcId, boolean>,
    quests: { explore_school: (old.quests as Record<string, string>)?.explore_school === 'complete' ? 'completed' : 'active' },
    inventory: [...STARTING_INVENTORY],
  };
}

export function parseSave(parsed: unknown): SaveV2 | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const d = parsed as Partial<SaveV2>;
  if (num(d.version, 0) !== SAVE_VERSION) {
    if (num((parsed as Record<string, unknown>).version, 0) === 1) return migrateV1(parsed as Record<string, unknown>);
    return null;
  }
  if (!d.story || !d.player) return null;
  return d as SaveV2;
}

// Check for a legacy v1 save and offer it on boot (one-time migration).
export function checkLegacySave(): SaveV2 | null {
  try {
    const raw = localStorage.getItem('csl-save-v1');
    if (!raw) return null;
    return parseSave(JSON.parse(raw));
  } catch {
    return null;
  }
}
