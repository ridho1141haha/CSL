import * as THREE from 'three';
import { DEFAULT_FADE, isOneShotClip } from './animCatalog';

// PHASE 3 — Animation controller over THREE.AnimationMixer.
//
// Design (per tools/blender/ANIMATION_MAP.md adapter notes):
//  - one mixer per character instance, created ONCE (never per frame);
//  - loop states crossfade into each other (0.15-0.25 s);
//  - one-shots (LoopOnce + clampWhenFinished) run to completion, then the
//    controller returns to the last requested loop state (or the one-shot's
//    `then` clip);
//  - one-shot arbitration (hardening pass): a one-shot is refused only when
//    its priority is STRICTLY lower than the active one. Equal-priority
//    different-name requests take over — the newest gameplay intent wins —
//    and the previous one-shot action is explicitly STOPPED, so exactly one
//    action ever drives the body and two one-shots never fight over the
//    same bones. Same-name requests are idempotent (no restart spam);
//  - stale `then` chains die with their one-shot: stop() cancels the action
//    (no finished event) and cancelOneShot() clears the chain explicitly;
//  - clips whose target nodes don't exist on this rig are filtered out by
//    the caller (bindableClips) so the mixer never warns per frame;
//  - dispose() is idempotent and releases mixer resources — the underlying
//    geometry/material/texture cache is owned elsewhere and never touched.

export type ClipTier =
  | 'posture'    // sit/crouch enter-exit chains
  | 'movement'   // walk/run
  | 'dialogue'   // talk/listen/gesture
  | 'action'     // hold / emotes
  | 'combat'     // attack/block/hurt/down
  | 'gameplay';  // jump etc.

export const TIER_PRIORITY: Record<ClipTier, number> = {
  gameplay: 50,
  combat: 40,
  dialogue: 30,
  action: 20,
  movement: 10,
  posture: 8,
};

type Entry = {
  action: THREE.AnimationAction;
  priority: number;
};

type LoopRequest = { name: string; timeScale: number };

export class CharacterAnimationController {
  readonly mixer: THREE.AnimationMixer;
  private readonly entries = new Map<string, Entry>();
  private loopState: LoopRequest | null = null;
  private currentLoop: string | null = null;
  private activeOneShot: { name: string; priority: number; then?: string } | null = null;
  private disposed = false;

  constructor(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(root);
    for (const clip of clips) {
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      const loop = !isOneShotClip(clip.name);
      if (loop) action.setLoop(THREE.LoopRepeat, Infinity);
      else {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      this.entries.set(clip.name, { action, priority: TIER_PRIORITY.gameplay });
    }
    this.mixer.addEventListener('finished', this.onFinished);
  }

  has(name: string): boolean {
    return this.entries.has(name);
  }

  get currentName(): string | null {
    return this.activeOneShot?.name ?? this.currentLoop;
  }

  get pendingLoop(): string | null {
    return this.loopState?.name ?? null;
  }

  /**
   * Request the loop state the character should sit in (idle/walk/run/sit...).
   * While a one-shot is active the request is only remembered — it is applied
   * when the one-shot finishes. Safe to call every frame.
   */
  setLoopState(name: string, timeScale = 1): boolean {
    const entry = this.entries.get(name);
    if (!entry || this.disposed) return false;
    this.loopState = { name, timeScale };
    if (!this.activeOneShot) this.applyLoop(name, timeScale);
    return true;
  }

  private applyLoop(name: string, timeScale: number, fade = DEFAULT_FADE) {
    const entry = this.entries.get(name)!;
    if (name === this.currentLoop) {
      // Same clip — do not restart the CYCLE unless the action is actually
      // gone. three.js AUTO-DISABLES an action once its fade-out completes
      // (_updateWeight: "faded out, disable") and setEffectiveWeight then
      // computes effective 0 forever (`enabled ? weight : 0`) — so a resume
      // after a one-shot MUST reset() (re-enable) before playing.
      const action = entry.action;
      if (!action.isRunning() || action.getEffectiveWeight() < 0.99) {
        action.reset().setEffectiveWeight(1).play();
      }
      action.setEffectiveTimeScale(timeScale);
      return;
    }
    const prev = this.currentLoop ? this.entries.get(this.currentLoop)?.action : null;
    const next = entry.action;
    next.reset().setEffectiveTimeScale(timeScale).setEffectiveWeight(1).play();
    if (prev && prev !== next) prev.crossFadeTo(next, fade, false);
    this.currentLoop = name;
  }

  /**
   * Play a one-shot. Returns false (no-op) only when the clip is missing or
   * a STRICTLY higher-priority one-shot is already running. Arbitration:
   *  - same name already playing → true, idempotent (no restart spam);
   *  - strictly lower priority → false (refused);
   *  - equal or higher priority, different name → takeover: the previous
   *    one-shot action is explicitly stopped (exactly one controlling
   *    one-shot, no bone conflicts) and the new one starts at full weight —
   *    there is no meaningful crossfade source because the loop underneath
   *    is already faded out.
   */
  playOneShot(name: string, priority: number, then?: string): boolean {
    const entry = this.entries.get(name);
    if (!entry || this.disposed) return false;
    let takeover = false;
    if (this.activeOneShot) {
      if (this.activeOneShot.name === name) return true; // already playing
      if (priority < this.activeOneShot.priority) return false; // refused
      // Interrupt: terminate the previous one-shot NOW. stop() resets its
      // weight/time and deactivates it — it cannot fire `finished` and its
      // `then` chain dies with it (activeOneShot is replaced below).
      const prevEntry = this.entries.get(this.activeOneShot.name);
      if (prevEntry && prevEntry.action !== entry.action) prevEntry.action.stop();
      takeover = true;
    }
    const prev = this.currentLoop ? this.entries.get(this.currentLoop)?.action : null;
    const next = entry.action;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
    // Crossfade only from a loop action that still carries visual weight;
    // after an interruption or a cancelled chain the loop sits at weight 0,
    // so blending from it would just ramp through the bind pose.
    const prevMeaningful = !!prev && prev !== next && prev.isRunning() && prev.getEffectiveWeight() > 0.01;
    if (prevMeaningful && !takeover) prev!.crossFadeTo(next, Math.min(DEFAULT_FADE, 0.12), false);
    this.activeOneShot = { name, priority, then: then && this.entries.has(then) ? then : undefined };
    return true;
  }

  private onFinished = (e: { action: THREE.AnimationAction }) => {
    if (this.disposed || !this.activeOneShot) return;
    const finished = this.activeOneShot;
    // Ignore finishes from stale actions (interrupted ones also fire).
    const entry = this.entries.get(finished.name);
    if (!entry || entry.action !== e.action) return;
    this.activeOneShot = null;
    // Re-apply whatever loop state is wanted now (then-chain wins).
    const resume = finished.then ?? this.loopState?.name ?? null;
    if (resume) {
      this.loopState = { name: resume, timeScale: finished.then ? 1 : this.loopState?.timeScale ?? 1 };
      this.applyLoop(resume, this.loopState.timeScale);
    }
  };

  /**
   * Cancel a specific one-shot (e.g. a stale Sit_Down whose gameplay state
   * already changed): stops its action immediately and kills its `then`
   * chain. The last loop state is NOT applied automatically — the caller
   * decides what runs next (usually a follow-up playOneShot or the newest
   * setLoopState). Returns false when that clip is not the active one-shot.
   */
  cancelOneShot(name: string): boolean {
    if (this.disposed || !this.activeOneShot || this.activeOneShot.name !== name) return false;
    const entry = this.entries.get(name);
    if (entry) entry.action.stop();
    this.activeOneShot = null;
    return true;
  }

  /** Explicit stop of the active one-shot, optionally resuming the loop state. */
  stopOneShot(fadeToLoop = true): void {
    if (!this.activeOneShot) return;
    const entry = this.entries.get(this.activeOneShot.name);
    if (entry) entry.action.stop();
    this.activeOneShot = null;
    if (fadeToLoop && this.loopState) this.applyLoop(this.loopState.name, this.loopState.timeScale);
  }

  update(dt: number): void {
    if (this.disposed) return;
    this.mixer.update(dt);
  }

  /** Stop everything and release mixer resources. Idempotent. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.removeEventListener('finished', this.onFinished);
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}

/**
 * Keep only clips whose target nodes exist on this rig instance. Prevents
 * per-frame "No target node" warnings when a GLB ships clips that reference
 * bones this particular model doesn't have (skeleton mismatch fallback).
 */
export function bindableClips(root: THREE.Object3D, clips: THREE.AnimationClip[]): THREE.AnimationClip[] {
  const nodeCache = new Map<string, boolean>();
  return clips.filter((clip) =>
    clip.tracks.every((track) => {
      const nodeName = track.name.split('.')[0];
      let ok = nodeCache.get(nodeName);
      if (ok === undefined) {
        // findNode returns NULL (not undefined) when the node doesn't exist.
        ok = !!THREE.PropertyBinding.findNode(root, nodeName);
        nodeCache.set(nodeName, ok);
      }
      return ok;
    }),
  );
}
