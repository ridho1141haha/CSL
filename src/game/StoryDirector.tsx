import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../stores/gameStore';
import { useStory } from '../stores/storyStore';
import { useQuests } from '../stores/questStore';
import { useSocial } from '../stores/socialStore';
import { useStats } from '../stores/statsStore';
import { usePlayer } from '../stores/playerStore';
import { useDialogue } from '../stores/dialogueStore';
import { input } from './input';
import { playerPos, npcPositions, enemyPos } from './runtime';
import { zoneAt, SCENES } from '../data/world';
import { NPC_BY_ID } from '../data/npcs';
import { QUESTS } from '../data/quests';
import { ZONE_FLAVOR } from '../data/dialogue';
import { STORY_TRIGGERS } from '../data/story/triggers';
import { applyEffects } from './systems/effects';
import { evalCondition, type ConditionContext } from './systems/conditions';
import { firstTrigger } from './systems/storyTriggers';
import { pickZoneEvent, pickNpcEvent, discoverEvent } from './systems/hiddenEvents';

// Per-frame world↔story glue. v0.17.1: every story-specific branch is gone —
// beat triggers live in data/story/triggers.ts (STORY_TRIGGERS), quest
// completion rules live on QuestDef (completeWhen/onComplete). What remains
// here is GENERIC machinery only: registry-driven interaction, the trigger
// loop, scene exits, zone flavor, hidden events and the quest-completion loop.
// Adding a story beat should never require touching this file again.
export function StoryDirector() {
  const zoneTimer = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const game = useGame.getState();
    const story = useStory.getState();
    const quests = useQuests.getState();
    const dialogue = useDialogue.getState();

    // ---------- interaction (E) — campus NPCs only ----------
    if (
      input.justPressed('interact') &&
      game.mode === 'GAMEPLAY' &&
      !enemyPos.active &&
      game.scene === 'campus'
    ) {
      let best: { id: string; d: number } | null = null;
      for (const [id, p] of Object.entries(npcPositions)) {
        const d = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
        if (d < 2.3 && (!best || d < best.d)) best = { id, d };
      }
      if (best) {
        const def = NPC_BY_ID[best.id];
        if (def) {
          useSocial.getState().visit(def.id as never);
          // hidden npc-moments take priority over the regular dialogue root —
          // talking to an NPC at the right time can reveal secret content
          const ev = pickNpcEvent(def.id);
          if (ev) {
            discoverEvent(ev);
            dialogue.open(ev.dialogue);
            return;
          }
          dialogue.open(def.dialogueRoot);
          return;
        }
      }
    }

    // interact prompt (throttled with zone check)
    zoneTimer.current += dt;
    if (zoneTimer.current < 0.2) return;
    zoneTimer.current = 0;

    // prompt: nearest NPC (campus only; hidden during combat)
    let near: string | null = null;
    if (!enemyPos.active && game.scene === 'campus') {
      for (const [id, p] of Object.entries(npcPositions)) {
        const d = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
        if (d < 2.3) {
          const def = NPC_BY_ID[id];
          if (def) near = def.name;
        }
      }
    }
    game.setInteractTarget(near);

    // ---------- story triggers (v0.17.1: DATA, data/story/triggers.ts) ----------
    // Was ~15 hardcoded per-beat if-blocks (montages, parking ambush,
    // graduations, secret choice point, ch2 card/scene, find_aris). The
    // registry is evaluated in data order; the first eligible trigger fires
    // (set once-flag → apply fire effects → open its dialogue), one per frame,
    // exactly like the old early-returning branches.
    const storyCtx: ConditionContext = {
      flags: story.flags,
      chapter: story.chapter,
      route: story.route,
      beat: story.beat,
      quests: quests.quests,
      relationships: useSocial.getState().relationships,
      stats: useStats.getState(),
      focus: usePlayer.getState().focus,
    };
    const trigger = firstTrigger(STORY_TRIGGERS, storyCtx, {
      mode: game.mode,
      scene: game.scene,
      dialogueOpen: !!dialogue.nodeId,
    });
    if (trigger) {
      if (trigger.once) story.setFlag(trigger.once);
      if (trigger.fire) applyEffects(trigger.fire);
      if (trigger.open) dialogue.open(trigger.open, true);
      return;
    }

    if (game.mode !== 'GAMEPLAY') return;

    // ---------- scene exits (v0.17.0: data on SceneDef.exits) ----------
    // Rooftop keeps its chapter-3 gate via the exit's chapterMin.
    {
      const cur = SCENES[game.scene];
      for (const ex of cur.exits ?? []) {
        if (game.currentZone !== ex.zone) continue;
        if (ex.chapterMin !== undefined && story.chapter < ex.chapterMin) continue;
        game.requestScene(ex.to, ex.spawn);
        return;
      }
    }

    // ---------- zone discovery + flavor (scene-aware, y-aware for Gedung B) ----------
    const zone = zoneAt(playerPos.x, playerPos.z, game.scene, playerPos.y);
    if (zone) {
      if (game.currentZone !== zone.id) {
        game.setCurrentZone(zone.id);
        game.visitZone(zone.id);
      }
      const flavor = ZONE_FLAVOR[zone.id];
      if (flavor && !story.flags.includes(`zone_seen_${zone.id}`)) {
        story.setFlag(`zone_seen_${zone.id}`);
        dialogue.open(flavor);
        return;
      }
    }

    // ---------- hidden events (mentor #5) ----------
    // Zone-triggered discoveries. Evaluated every tick (not only on zone
    // change) because period/chapter requirements can become true while the
    // player stands still. One-time guard lives inside eventReady.
    const hidden = pickZoneEvent(game.currentZone);
    if (hidden) {
      discoverEvent(hidden);
      dialogue.open(hidden.dialogue);
      return;
    }

    // ---------- quest completions (v0.17.0+: rules are DATA on QuestDef) ----------
    // When an active quest's `completeWhen` holds, its `onComplete` effects
    // run once (the effects themselves flip the quest state). One completion
    // per tick (return) — QUESTS array order decides ties, as before.
    for (const def of QUESTS) {
      if (!def.completeWhen || !def.onComplete) continue;
      if (quests.quests[def.id] !== 'active') continue;
      if (evalCondition(def.completeWhen, storyCtx)) {
        applyEffects(def.onComplete);
        return;
      }
    }
  });

  return null;
}

// SCENES import is used implicitly through requestScene defaults; keep a
// type-level reference so bundlers don't tree-shake scene definitions that
// tests and the map panel rely on.
void SCENES;
