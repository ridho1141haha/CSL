import type { Condition, StoryBeat } from '../../types';
import { periodFor } from './time';
import { zoneAt } from '../../data/world';
import { playerPos } from '../runtime';
import { useGame } from '../../stores/gameStore';
import { useSocial } from '../../stores/socialStore';
import { useInventory } from '../../stores/inventoryStore';

export type ConditionContext = {
  flags: string[];
  chapter: number;
  route: string;
  // v0.17.1: story position — required so 'beat' conditions cannot silently
  // evaluate falsy (the switch below is exhaustive over Condition).
  beat: StoryBeat;
  quests: Record<string, string>;
  relationships: Record<string, number>;
  stats: { academic: number; violence: number; diplomacy: number; reputation: number };
  focus: number;
};

export function evalCondition(c: Condition | undefined, ctx: ConditionContext): boolean {
  if (!c) return true;
  switch (c.k) {
    case 'flag':
      return ctx.flags.includes(c.id) !== !!c.not;
    case 'chapter':
      return ctx.chapter === c.id;
    case 'chapterMin':
      return ctx.chapter >= c.id;
    case 'route':
      return ctx.route === c.id;
    case 'quest':
      return (ctx.quests[c.id] ?? 'locked') === c.state;
    case 'relAbove':
      return (ctx.relationships[c.target] ?? 0) > c.v;
    case 'statAbove':
      return ctx.stats[c.stat] > c.v;
    case 'focusAbove':
      return ctx.focus > c.v;
    case 'period':
      return periodFor(useGame.getState().clock.minutes).id === c.id;
    case 'zone':
      return useGame.getState().currentZone === c.id;
    // v0.17.1: story-position + exploration-history kinds — consumed by the
    // StoryTriggerDef registry and QuestDef.completeWhen. `visited` reads the
    // live game store directly, consistent with 'zone'/'period' above.
    case 'beat':
      return ctx.beat === c.id;
    case 'visited':
      return c.zones.every((z) => useGame.getState().visitedZones.includes(z));
    case 'talks':
      return (useSocial.getState().talkCounts[c.target] ?? 0) >= c.v;
    case 'and':
      return c.all.every((sub) => evalCondition(sub, ctx));
    // v0.17.0 combinators (audit H1) — nested arbitrarily; the switch stays
    // exhaustive over the Condition union so a new kind breaks the build here
    // instead of silently evaluating falsy.
    case 'any':
      return c.of.some((sub) => evalCondition(sub, ctx));
    case 'not':
      return !evalCondition(c.not, ctx);
    case 'item':
      return useInventory.getState().items.includes(c.id) !== !!c.not;
  }
}

// Convenience used by hidden-event checks: is the player inside a zone id
// right now (center-radius, scene-aware)?
export function playerInZone(zoneId: string): boolean {
  const g = useGame.getState();
  return zoneAt(playerPos.x, playerPos.z, g.scene, playerPos.y)?.id === zoneId;
}
