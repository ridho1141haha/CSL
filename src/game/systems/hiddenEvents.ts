import type { HiddenEventDef } from '../../types';
import { HIDDEN_EVENTS, HIDDEN_EVENT_FLAG } from '../../data/hiddenEvents';
import { periodFor } from './time';
import { evalCondition, type ConditionContext } from './conditions';
import { useStory } from '../../stores/storyStore';
import { useGame } from '../../stores/gameStore';
import { useSocial } from '../../stores/socialStore';
import { useQuests } from '../../stores/questStore';
import { useStats } from '../../stores/statsStore';
import { usePlayer } from '../../stores/playerStore';

// ============================================================================
// Hidden-event resolution (mentor feedback #5). Pure gating logic — the
// runner (StoryDirector) calls these once per throttled world tick.
// ============================================================================

export function conditionContext(): ConditionContext {
  const story = useStory.getState();
  return {
    flags: story.flags,
    chapter: story.chapter,
    route: story.route,
    beat: story.beat,
    quests: useQuests.getState().quests,
    relationships: useSocial.getState().relationships,
    stats: useStats.getState(),
    focus: usePlayer.getState().focus,
  };
}

function eventReady(e: HiddenEventDef, kind: 'zone' | 'npc'): boolean {
  const story = useStory.getState();
  if (story.flags.includes(HIDDEN_EVENT_FLAG(e.id))) return false; // already discovered
  if (e.trigger.k !== kind) return false;
  const game = useGame.getState();
  if (game.mode !== 'GAMEPLAY') return false; // never fire mid-cutscene/combat
  if (e.period && periodFor(game.clock.minutes).id !== e.period) return false;
  if (e.reqs && !evalCondition(e.reqs, conditionContext())) return false;
  return true;
}

// First zone-triggered event whose requirements are currently satisfied.
export function pickZoneEvent(zoneId: string | null): HiddenEventDef | null {
  if (!zoneId) return null;
  for (const e of HIDDEN_EVENTS) {
    if (e.zone !== zoneId) continue;
    if (eventReady(e, 'zone')) return e;
  }
  return null;
}

// Npc-triggered event for an interaction, if any. Takes priority over the
// NPC's regular dialogue root (the player "finds" the special moment).
export function pickNpcEvent(npcId: string): HiddenEventDef | null {
  for (const e of HIDDEN_EVENTS) {
    if (e.npc !== npcId) continue;
    if (eventReady(e, 'npc')) return e;
  }
  return null;
}

// Mark discovered (persisted via story flags → save-compatible) + toast.
export function discoverEvent(e: HiddenEventDef): void {
  useStory.getState().setFlag(HIDDEN_EVENT_FLAG(e.id));
  useGame.getState().notify(`Temuan tersembunyi: ${e.title}`, 'info');
}

export function isDiscovered(e: HiddenEventDef): boolean {
  return useStory.getState().flags.includes(HIDDEN_EVENT_FLAG(e.id));
}

export const HIDDEN_EVENT_COUNT = HIDDEN_EVENTS.length;
