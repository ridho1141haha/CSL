import type { Emotion } from '../../types';
import { playerPos, npcPositions, actorPositions } from '../runtime';
import { NPC_BY_ID } from '../../data/npcs';

// ============================================================================
// DIALOGUE ACTING REGISTRY (mentor feedback #3)
//
// A tiny per-entity state record the renderer (Figure) consumes each frame.
// Written by dialogueStore whenever a node advances; read by Character.tsx.
// No per-scene hardcoding: every dialogue drives acting from its node data
// (speaker portrait + emotion). Pure numbers, zero allocations per frame.
// ============================================================================

export type ActingState = {
  talking: boolean;          // speaking right now (mouth + gestures on)
  gazeX: number;             // world point to look toward (x/z); NaN = free
  gazeZ: number;
  energy: number;            // 0..1 — emotional intensity, scales amplitudes
  gesture: number;           // active gesture id (-1 = none)
  gestureT: number;          // 0..1 gesture progress
  gestureCooldown: number;   // seconds until next gesture may start
  nodT: number;              // 0..1 listening-nod progress (-1 = idle)
  nodCooldown: number;
  talkPhase: number;         // mouth oscillation phase (speech rhythm)
  seed: number;              // per-entity phase offset (idle variation)
};

const blank = (seed: number): ActingState => ({
  talking: false,
  gazeX: NaN,
  gazeZ: NaN,
  energy: 0.3,
  gesture: -1,
  gestureT: 0,
  gestureCooldown: 1.5 + seed,
  nodT: -1,
  nodCooldown: 2 + seed * 0.5,
  talkPhase: 0,
  seed,
});

// Keyed by entity id: 'ren', npc ids, and story-actor ids ('bully1','gang1'…).
export const acting: Record<string, ActingState> = {};

function ensure(id: string): ActingState {
  let s = acting[id];
  if (!s) {
    // deterministic seed from id so idle variation is stable per entity
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
    s = acting[id] = blank((h % 100) / 60);
  }
  return s;
}

// Emotion → intensity. Keeps gestures/nods believable: Bimo ('dark') barely
// moves, tense lines get more body, warm lines open up.
const EMOTION_ENERGY: Record<Emotion, number> = {
  neutral: 0.3,
  calm: 0.24,
  warm: 0.42,
  worried: 0.5,
  firm: 0.58,
  tense: 0.7,
  dark: 0.38,
};

// Portrait key → runtime entity id the acting system understands.
// Story actors reuse the character ids ('aris','siti','bimo'); bullies/gang
// resolve to their first placed actor so they can gaze/talk too.
function speakerEntityId(portrait: string | undefined, speaker: string): string | null {
  if (speaker === 'NARATOR') return null;
  if (!portrait || portrait === 'generic' || portrait === 'narrator') return null;
  if (portrait === 'ren') return 'ren';
  if (portrait === 'bully') return placedActor('bully');
  if (portrait === 'gang') return placedActor('gang');
  return NPC_BY_ID[portrait] ? portrait : null;
}

function placedActor(prefix: string): string | null {
  for (const id of Object.keys(actorPositions)) if (id.startsWith(prefix)) return id;
  return null;
}

// Nearest main NPC to the player — used to find the listener when Ren speaks.
function nearestNpcToPlayer(maxDist: number): string | null {
  let best: string | null = null;
  let bestD = maxDist;
  for (const [id, p] of Object.entries(npcPositions)) {
    const d = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
    if (d < bestD) { best = id; bestD = d; }
  }
  return best;
}

export type DialogueCast = {
  speaker: string | null;
  listener: string | null;
  energy: number;
};

// Resolve who is in frame from a dialogue node's speaker/portrait/emotion.
// The listener looks at the speaker and vice versa; narrator lines leave both
// free (idle sway only).
export function resolveCast(portrait: string | undefined, speaker: string, emotion: Emotion | undefined): DialogueCast {
  const energy = EMOTION_ENERGY[emotion ?? 'neutral'];
  const spk = speakerEntityId(portrait, speaker);
  if (!spk) return { speaker: null, listener: null, energy };

  if (spk === 'ren') {
    // Ren speaking: the listener is whoever he is talking to (nearest NPC /
    // placed actor). Fall back to no listener — camera picks a solo framing.
    const lis = nearestNpcToPlayer(4.5);
    return { speaker: 'ren', listener: lis, energy };
  }
  // NPC speaking: the listener is Ren (they are talking to him).
  return { speaker: spk, listener: 'ren', energy };
}

// Apply a node's cast: speaker talks toward listener, listener gazes back.
// Called by dialogueStore on open/advance/choose.
export function applyDialogueActing(cast: DialogueCast) {
  // reset everyone (cheap: only the 2-4 ids that exist in registries)
  for (const s of Object.values(acting)) {
    s.talking = false;
    s.gesture = -1;
    s.gestureT = 0;
    s.gazeX = NaN;
    s.gazeZ = NaN;
  }
  const spk = cast.speaker ? ensure(cast.speaker) : null;
  const lis = cast.listener ? ensure(cast.listener) : null;
  if (spk) {
    spk.talking = true;
    spk.energy = cast.energy;
    if (lis) { spk.gazeX = entityX(cast.listener!); spk.gazeZ = entityZ(cast.listener!); }
  }
  if (lis) {
    lis.talking = false;
    lis.energy = Math.min(1, cast.energy * 0.6);
    if (spk) { lis.gazeX = entityX(cast.speaker!); lis.gazeZ = entityZ(cast.speaker!); }
  }
}

// Clear all acting (dialogue closed) — figures return to plain idle.
export function clearDialogueActing() {
  for (const s of Object.values(acting)) {
    s.talking = false;
    s.gesture = -1;
    s.gestureT = 0;
    s.nodT = -1;
    s.gazeX = NaN;
    s.gazeZ = NaN;
  }
}

// Per-frame timer tick for one entity. Gesture/nod scheduling lives here so
// the renderer only reads values (and so the behaviour is testable).
// Subtle by design: gestures fire every 1–3s, nods every 2–5s, amplitudes
// scale with emotional energy and are capped low (no exaggerated movement).
export function tickActing(s: ActingState, dt: number, moving: boolean) {
  if (s.talking && !moving) {
    s.talkPhase += dt * (7 + s.energy * 6);
    if (s.gesture >= 0) {
      s.gestureT += dt / 1.15;
      if (s.gestureT >= 1) {
        s.gesture = -1;
        s.gestureT = 0;
        s.gestureCooldown = 1.1 + Math.random() * 1.7;
      }
    } else {
      s.gestureCooldown -= dt;
      if (s.gestureCooldown <= 0) {
        const r = Math.random();
        // high energy (tense/firm) favours emphasis; low energy (calm) open palm;
        // 'chest' reserved for emotional lines of any level
        s.gesture = s.energy > 0.55
          ? (r < 0.55 ? 1 : r < 0.8 ? 0 : 2)
          : s.energy < 0.35
            ? (r < 0.6 ? 0 : 2)
            : (r < 0.4 ? 0 : r < 0.75 ? 1 : 2);
        s.gestureT = 0;
      }
    }
  } else {
    s.gesture = -1;
    s.gestureT = 0;
    s.talkPhase = 0;
  }

  if (!s.talking && !moving && !Number.isNaN(s.gazeX)) {
    if (s.nodT >= 0) {
      s.nodT += dt / 0.9;
      if (s.nodT >= 1) {
        s.nodT = -1;
        s.nodCooldown = 2.2 + Math.random() * 3;
      }
    } else {
      s.nodCooldown -= dt;
      if (s.nodCooldown <= 0) s.nodT = 0;
    }
  } else if (s.talking) {
    s.nodT = -1;
  }
}

function entityPosition(id: string): { x: number; z: number } | null {
  if (id === 'ren') return { x: playerPos.x, z: playerPos.z };
  // actor placements win over scheduled NPCs: during cinematics the scheduled
  // NPC is unmounted (hideMain) and only the story actor reflects the scene
  return actorPositions[id] ?? npcPositions[id] ?? null;
}
export { entityPosition };
function entityX(id: string): number {
  return entityPosition(id)?.x ?? NaN;
}
function entityZ(id: string): number {
  return entityPosition(id)?.z ?? NaN;
}
