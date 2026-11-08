// ============================================================================
// systems/storyTriggers.ts — generic story trigger matching (v0.17.1).
//
// PURE module: no React, no useFrame. StoryDirector feeds it a snapshot
// (condition context + engine state) and executes the returned trigger via
// the EXISTING pipelines (story.setFlag / applyEffects / dialogue.open).
// Nothing here knows any individual beat/flag/quest id — content lives in
// data/story/triggers.ts.
//
// Gating rules mirror the original StoryDirector blocks exactly:
//   1. once-flag present               → skip (one-shot guard, save-compat)
//   2. a dialogue is open              → skip (never open dialogue over dialogue)
//   3. mode tier: triggers marked
//      duringCinematic may fire in
//      GAMEPLAY *or* CINEMATIC;        → otherwise GAMEPLAY only
//   4. scene: trigger.scene (default
//      'campus') must equal the
//      current scene                   → protects vs async requestScene swaps
//   5. when-condition must hold        → existing evalCondition
// ============================================================================

import type { GameMode, SceneId, StoryTriggerDef } from '../../types';
import { evalCondition, type ConditionContext } from './conditions';

export type TriggerEngineState = {
  mode: GameMode;
  scene: SceneId;
  dialogueOpen: boolean;
};

export function triggerEligible(
  t: StoryTriggerDef,
  ctx: ConditionContext,
  engine: TriggerEngineState,
): boolean {
  if (t.once && ctx.flags.includes(t.once)) return false;
  if (engine.dialogueOpen) return false;
  const modeOk = t.duringCinematic
    ? engine.mode === 'GAMEPLAY' || engine.mode === 'CINEMATIC'
    : engine.mode === 'GAMEPLAY';
  if (!modeOk) return false;
  if ((t.scene ?? 'campus') !== engine.scene) return false;
  return evalCondition(t.when, ctx);
}

/** First trigger that fires this frame, in registry order — or null. */
export function firstTrigger(
  list: StoryTriggerDef[],
  ctx: ConditionContext,
  engine: TriggerEngineState,
): StoryTriggerDef | null {
  for (const t of list) {
    if (triggerEligible(t, ctx, engine)) return t;
  }
  return null;
}
