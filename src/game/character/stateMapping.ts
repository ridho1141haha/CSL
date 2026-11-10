import { CharacterAnimationController, TIER_PRIORITY } from './CharacterAnimationController';
import { RUN_TIMESCALE, WALK_TIMESCALE } from './animCatalog';
import type { HoldKind } from '../../types';

// PHASE 4 — gameplay state -> animation mapping.
//
// Priority ladder (task spec + ANIMATION_MAP.md): incapacitated (down) >
// one-shot gameplay action (attack/hurt) > dialogue action > movement >
// idle. Movement beats dialogue loops while actually moving (a character
// walking to a waypoint keeps its walk cycle; gestures only play standing
// still — identical to the legacy procedural gating in Figure).
//
// This module is PURE where possible (loop resolution) with one small stateful
// director that performs rising/falling-edge detection so posture chains
// (Sit_Down -> Sit_Idle, Stand_Up, Knocked_Down -> Get_Up) fire once, not
// every frame.

export type AnimSnapshot = {
  speed: number;
  run: boolean;
  attackT: number;
  block: boolean;
  hurtT: number;
  down: boolean;
  sit: boolean;
  crouch: boolean;
  hold?: HoldKind;
  act?: { talking: boolean; gesture: number; nodT: number } | null;
};

export const HOLD_CLIPS: Record<HoldKind, string> = {
  phone: 'Hold_Phone',
  book: 'Hold_Book',
  map: 'Hold_Book',
  stack: 'Hold_Stack',
  pencil: 'Hold_Light',
  eraser: 'Hold_Light',
  bottle: 'Hold_Light',
};

export const GESTURE_CLIPS = ['Gesture_Palm', 'Gesture_Emphasis', 'Gesture_Chest'] as const;

/**
 * Pure resolution of the LOOP state for a snapshot (one-shots are edge-driven,
 * see CharacterAnimDirector). Returns null when the current state should not
 * touch the loop state at all (e.g. clamped in Knocked_Down).
 */
export function resolveLoopClip(s: AnimSnapshot): { clip: string; timeScale: number } | null {
  if (s.down) return null; // one-shot clamp territory
  if (s.speed > 0.15) {
    return s.run
      ? { clip: 'Run', timeScale: RUN_TIMESCALE(s.speed) }
      : { clip: 'Walk', timeScale: WALK_TIMESCALE(s.speed) };
  }
  if (s.block) return { clip: 'Block', timeScale: 1 };
  if (s.sit) return { clip: 'Sit_Idle', timeScale: 1 };
  if (s.crouch) return { clip: 'Crouch_Idle', timeScale: 1 };
  const act = s.act;
  if (act && act.nodT >= 0) return { clip: 'Listen_Nod', timeScale: 1 };
  if (act && act.talking) return { clip: 'Talk', timeScale: 1 };
  if (s.hold) return { clip: HOLD_CLIPS[s.hold] ?? 'Idle', timeScale: 1 };
  return { clip: 'Idle', timeScale: 1 };
}

/**
 * Stateful edge detector: consumes a snapshot per frame and drives the
 * controller (loop states + one-shot chains). No per-frame allocations.
 */
export class CharacterAnimDirector {
  private lastDown = false;
  private lastAttack = false;
  private lastHurt = false;
  private lastSit = false;
  private lastGesture = -1;

  constructor(private readonly ctrl: CharacterAnimationController) {}

  apply(s: AnimSnapshot): void {
    const ctrl = this.ctrl;

    // 1) incapacitated: one-shot clamp, recovery via reversed clip.
    if (s.down) {
      if (!this.lastDown) ctrl.playOneShot('Knocked_Down', TIER_PRIORITY.combat);
      this.lastDown = true;
      return;
    }
    if (this.lastDown) {
      this.lastDown = false;
      // If the clamped Knocked_Down one-shot is still active (e.g. the mixer
      // was frozen while hidden), release it explicitly — an equal-priority
      // Get_Up would otherwise be refused.
      ctrl.stopOneShot(false);
      // Get_Up is a one-shot; the loop state below is applied when it finishes.
      ctrl.playOneShot('Get_Up', TIER_PRIORITY.combat);
    }

    // 2) combat one-shots (rising edges only — no restart spam).
    const attacking = s.attackT >= 0;
    if (attacking && !this.lastAttack) ctrl.playOneShot('Attack_Punch', TIER_PRIORITY.combat);
    this.lastAttack = attacking;
    const hurt = s.hurtT >= 0;
    if (hurt && !this.lastHurt) ctrl.playOneShot('Hurt', TIER_PRIORITY.combat);
    this.lastHurt = hurt;
    if (hurt || attacking) return; // loop state resumes automatically after the one-shot

    // 3) movement (walk/run) — also clears pending gesture bookkeeping.
    if (s.speed > 0.15) {
      const r = resolveLoopClip(s)!;
      ctrl.setLoopState(r.clip, r.timeScale);
      this.lastGesture = -1;
      return;
    }

    // 4) posture (sit/crouch) with enter/exit chains.
    if (s.sit) {
      if (!this.lastSit) ctrl.playOneShot('Sit_Down', TIER_PRIORITY.posture + 1, 'Sit_Idle');
      this.lastSit = true;
    } else if (this.lastSit) {
      this.lastSit = false;
      ctrl.playOneShot('Stand_Up', TIER_PRIORITY.posture + 1);
    }
    const loop = resolveLoopClip(s)!; // sit/crouch branch of the pure resolver
    ctrl.setLoopState(loop.clip, loop.timeScale);

    // 5) dialogue & props & idle — standing still only.
    const act = s.act;
    if (s.sit || s.crouch) return; // seated/idle posture owns the loop while seated
    if (act && act.nodT >= 0) return; // Listen_Nod already applied via resolver
    if (act && act.talking) return; // Talk already applied via resolver
    if (act && act.gesture >= 0) {
      if (act.gesture !== this.lastGesture) {
        const clip = GESTURE_CLIPS[act.gesture];
        if (clip) ctrl.playOneShot(clip, TIER_PRIORITY.dialogue);
        this.lastGesture = act.gesture;
      }
      return;
    }
    this.lastGesture = -1;
  }

  /** Test/debug introspection. */
  get edges(): { down: boolean; sit: boolean } {
    return { down: this.lastDown, sit: this.lastSit };
  }
}
