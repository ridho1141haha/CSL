import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  ANIM_CLIPS,
  ONE_SHOT_CLIPS,
  CLIP_DURATIONS,
  isKnownClip,
  isOneShotClip,
  WALK_TIMESCALE,
  RUN_TIMESCALE,
  DEFAULT_FADE,
} from '../game/character/animCatalog';
import {
  CharacterAnimationController,
  bindableClips,
  TIER_PRIORITY,
} from '../game/character/CharacterAnimationController';
import { resolveLoopClip, CharacterAnimDirector, HOLD_CLIPS, type AnimSnapshot } from '../game/character/stateMapping';
import { isSkeletalRig } from '../game/character/GlbFigure';
import { CHARACTER_ASSETS } from '../game/character/assetManifest';
import { CHAR_GLB_PATHS, TINT_SLOT_MATERIALS, TINT_SLOT_ALIASES, type TintSlot } from '../game/npc/characters';
import type { HoldKind } from '../types';

// PHASE validation for the GLB character runtime integration.
// Everything here runs headless (AnimationMixer is pure data-driven math).

// ── helpers ─────────────────────────────────────────────────────────────────

/** Bone hierarchy matching the pipeline rig contract (README: Hips>Spine>Chest>Neck>Head, arms, legs). */
function makeRig(): THREE.Object3D {
  const root = new THREE.Object3D();
  const add = (parent: THREE.Object3D, name: string) => {
    const b = new THREE.Bone();
    b.name = name;
    parent.add(b);
    return b;
  };
  const hips = add(root, 'Hips');
  const spine = add(hips, 'Spine');
  const chest = add(spine, 'Chest');
  add(chest, 'Neck');
  add(chest, 'Head');
  add(chest, 'UpperArm_L');
  const uaR = add(chest, 'UpperArm_R');
  add(uaR, 'LowerArm_R');
  add(hips, 'UpperLeg_L');
  add(hips, 'UpperLeg_R');
  return root;
}

const clip = (name: string, tracks: string[]): THREE.AnimationClip =>
  new THREE.AnimationClip(
    name,
    1,
    tracks.map((t) => {
      const q1 = new THREE.Quaternion().toArray();
      const q2 = new THREE.Quaternion().toArray();
      return new THREE.QuaternionKeyframeTrack(t, [0, 1], [...q1, ...q2]) as unknown as THREE.KeyframeTrack;
    }),
  );

const snap = (over: Partial<AnimSnapshot> = {}): AnimSnapshot => ({
  speed: 0, run: false, attackT: -1, block: false, hurtT: -1, down: false, sit: false, crouch: false, act: null,
  ...over,
});

// ── catalog ─────────────────────────────────────────────────────────────────

describe('animation clip catalog (pipeline mirror)', () => {
  it('mirrors all 31 pipeline clips with unique names', () => {
    expect(ANIM_CLIPS).toHaveLength(31);
    expect(new Set(ANIM_CLIPS).size).toBe(31);
  });

  it('one-shot set matches ANIMATION_MAP.md (11 clips, all in catalog)', () => {
    expect(ONE_SHOT_CLIPS.size).toBe(11);
    for (const c of ONE_SHOT_CLIPS) expect(isKnownClip(c)).toBe(true);
    expect(isOneShotClip('Idle')).toBe(false);
    expect(isOneShotClip('Walk')).toBe(false);
    expect(isOneShotClip('Knocked_Down')).toBe(true);
    expect(isOneShotClip('Get_Up')).toBe(true);
  });

  it('every clip has a positive duration', () => {
    for (const c of ANIM_CLIPS) expect(CLIP_DURATIONS[c]).toBeGreaterThan(0);
  });

  it('speed time scales follow ANIMATION_MAP (walk speed/1.4, run speed/4.2, clamped)', () => {
    expect(WALK_TIMESCALE(1.4)).toBeCloseTo(1, 5);
    expect(RUN_TIMESCALE(4.2)).toBeCloseTo(1, 5);
    expect(WALK_TIMESCALE(99)).toBeLessThanOrEqual(2.2);
    expect(WALK_TIMESCALE(0)).toBeGreaterThanOrEqual(0.4);
    expect(RUN_TIMESCALE(99)).toBeLessThanOrEqual(2.0);
  });
});

// ── state mapping (pure) ────────────────────────────────────────────────────

describe('state-to-animation mapping (pure resolver)', () => {
  it('maps the full gameplay state ladder', () => {
    expect(resolveLoopClip(snap())!.clip).toBe('Idle');
    expect(resolveLoopClip(snap({ speed: 1.0 }))!.clip).toBe('Walk');
    expect(resolveLoopClip(snap({ speed: 4.2, run: true }))!.clip).toBe('Run');
    expect(resolveLoopClip(snap({ block: true }))!.clip).toBe('Block');
    expect(resolveLoopClip(snap({ sit: true }))!.clip).toBe('Sit_Idle');
    expect(resolveLoopClip(snap({ crouch: true }))!.clip).toBe('Crouch_Idle');
    expect(resolveLoopClip(snap({ act: { talking: true, gesture: -1, nodT: -1 } }))!.clip).toBe('Talk');
    expect(resolveLoopClip(snap({ act: { talking: true, gesture: -1, nodT: 0.3 } }))!.clip).toBe('Listen_Nod');
  });

  it('maps held props to hold clips (HoldKind coverage)', () => {
    const cases: [HoldKind, string][] = [
      ['phone', 'Hold_Phone'], ['book', 'Hold_Book'], ['map', 'Hold_Book'],
      ['stack', 'Hold_Stack'], ['pencil', 'Hold_Light'], ['eraser', 'Hold_Light'], ['bottle', 'Hold_Light'],
    ];
    for (const [hold, expected] of cases) {
      expect(resolveLoopClip(snap({ hold }))!.clip).toBe(expected);
      expect(HOLD_CLIPS[hold]).toBe(expected);
    }
  });

  it('down state owns the body (no loop change; one-shot territory)', () => {
    expect(resolveLoopClip(snap({ down: true }))).toBeNull();
  });

  it('movement beats dialogue/posture (walking character keeps its walk cycle)', () => {
    expect(resolveLoopClip(snap({ speed: 1.0, act: { talking: true, gesture: -1, nodT: -1 } }))!.clip).toBe('Walk');
    expect(resolveLoopClip(snap({ speed: 1.0, sit: true }))!.clip).toBe('Walk');
  });
});

// ── clip binding filter ─────────────────────────────────────────────────────

describe('bindableClips (skeleton mismatch fallback)', () => {
  it('keeps clips that bind to existing bones and drops the rest', () => {
    const rig = makeRig();
    const good = clip('Good', ['Hips.quaternion', 'Spine.quaternion']);
    const bad = clip('Bad', ['Totally_Missing_Bone.position']);
    const mixed = clip('Mixed', ['Hips.quaternion', 'Another_Missing.position']);
    const kept = bindableClips(rig, [good, bad, mixed]);
    expect(kept.map((c) => c.name)).toEqual(['Good']);
  });

  it('returns empty for no clips', () => {
    expect(bindableClips(makeRig(), [])).toEqual([]);
  });
});

// ── controller ──────────────────────────────────────────────────────────────

describe('CharacterAnimationController', () => {
  const CLIPS = () => [
    clip('Idle', ['Spine.quaternion']),
    clip('Walk', ['Spine.quaternion', 'UpperLeg_L.quaternion', 'UpperLeg_R.quaternion']),
    clip('Run', ['Spine.quaternion', 'UpperLeg_L.quaternion']),
    clip('Sit_Idle', ['Spine.quaternion']),
    clip('Sit_Down', ['Spine.quaternion']),
    clip('Stand_Up', ['Spine.quaternion']),
    clip('Attack_Punch', ['UpperArm_R.quaternion']),
    clip('Hurt', ['Spine.quaternion']),
    clip('Knocked_Down', ['Hips.quaternion', 'Spine.quaternion']),
    clip('Get_Up', ['Hips.quaternion', 'Spine.quaternion']),
  ];

  it('plays a loop state, advances with delta time, respects time scale', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    expect(ctrl.setLoopState('Idle')).toBe(true);
    expect(ctrl.currentName).toBe('Idle');
    const idleAction = (ctrl as unknown as { entries: Map<string, { action: THREE.AnimationAction }> }).entries.get('Idle')!.action;
    expect(idleAction.isRunning()).toBe(true);
    ctrl.update(0.5);
    expect(idleAction.time).toBeCloseTo(0.5, 2);
    ctrl.setLoopState('Walk', 2);
    expect(ctrl.currentName).toBe('Walk');
    ctrl.update(DEFAULT_FADE + 0.05); // let the crossfade finish
    const walkAction = (ctrl as unknown as { entries: Map<string, { action: THREE.AnimationAction }> }).entries.get('Walk')!.action;
    expect(walkAction.getEffectiveWeight()).toBeCloseTo(1, 1);
    const t0 = walkAction.time;
    ctrl.update(0.1);
    expect(walkAction.time - t0).toBeCloseTo(0.2, 2); // 0.1 dt × timescale 2
    ctrl.dispose();
  });

  it('defers loop requests while a one-shot runs, resumes on finish', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    expect(ctrl.playOneShot('Attack_Punch', TIER_PRIORITY.combat)).toBe(true);
    expect(ctrl.currentName).toBe('Attack_Punch');
    // walking request mid-punch must NOT switch the body
    ctrl.setLoopState('Walk', 1);
    expect(ctrl.pendingLoop).toBe('Walk');
    expect(ctrl.currentName).toBe('Attack_Punch');
    // let the 0.8 s punch finish → walk resumes
    ctrl.update(1.0);
    expect(ctrl.currentName).toBe('Walk');
    ctrl.dispose();
  });

  it('arbitration: equal-priority different-name takes over, strictly lower refused, restart-safe', () => {
    // Hardening pass: the rule changed from `priority <=` to `priority <` —
    // the newest gameplay intent wins at equal tier and the interrupted
    // one-shot is explicitly stopped (was: silently left running).
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const entries = (ctrl as unknown as { entries: Map<string, { action: THREE.AnimationAction }> }).entries;
    ctrl.setLoopState('Idle');
    expect(ctrl.playOneShot('Attack_Punch', TIER_PRIORITY.combat)).toBe(true);
    // equal priority, different name → takeover; previous action terminated
    expect(ctrl.playOneShot('Hurt', TIER_PRIORITY.combat)).toBe(true);
    expect(entries.get('Attack_Punch')!.action.isRunning()).toBe(false);
    expect(entries.get('Attack_Punch')!.action.time).toBe(0);
    expect(ctrl.currentName).toBe('Hurt');
    // strictly lower → refused (unchanged)
    expect(ctrl.playOneShot('Sit_Down', TIER_PRIORITY.posture + 1)).toBe(false);
    expect(ctrl.currentName).toBe('Hurt');
    // same name → idempotent true, never restarts
    ctrl.update(0.2);
    const hurt = entries.get('Hurt')!.action;
    const t = hurt.time;
    expect(ctrl.playOneShot('Hurt', TIER_PRIORITY.combat)).toBe(true);
    expect(hurt.time).toBe(t); // no reset
    ctrl.dispose();
  });

  it('missing clips are a predictable no-op (fallback, no crash)', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    expect(ctrl.setLoopState('This_Clip_Does_Not_Exist')).toBe(false);
    expect(ctrl.playOneShot('Also_Missing', 99)).toBe(false);
    expect(ctrl.currentName).toBe('Idle');
    ctrl.dispose();
  });

  it('then-chain: Sit_Down transitions into Sit_Idle automatically', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    expect(ctrl.playOneShot('Sit_Down', TIER_PRIORITY.posture + 1, 'Sit_Idle')).toBe(true);
    ctrl.update(1.4); // 1.2 s clip + fade margin
    expect(ctrl.currentName).toBe('Sit_Idle');
    ctrl.dispose();
  });

  it('down → Knocked_Down clamps, recovery plays Get_Up then resumes idle', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ down: true }));
    expect(ctrl.currentName).toBe('Knocked_Down');
    dir.apply(snap({ down: true })); // held down — no restart
    expect(ctrl.currentName).toBe('Knocked_Down');
    dir.apply(snap({})); // released
    expect(ctrl.currentName).toBe('Get_Up');
    ctrl.update(1.4);
    expect(ctrl.currentName).toBe('Idle');
    ctrl.dispose();
  });

  it('director edge detection fires posture chains once, not per frame', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ sit: true }));
    expect(ctrl.currentName).toBe('Sit_Down');
    dir.apply(snap({ sit: true }));
    dir.apply(snap({ sit: true }));
    expect(ctrl.currentName).toBe('Sit_Down'); // no restart spam
    ctrl.update(1.4);
    expect(ctrl.currentName).toBe('Sit_Idle');
    dir.apply(snap({})); // stand up
    expect(ctrl.currentName).toBe('Stand_Up');
    ctrl.update(1.4);
    expect(ctrl.currentName).toBe('Idle');
    ctrl.dispose();
  });

  it('attack edge replays per new attack but does not restart mid-swing', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ attackT: 0.1 }));
    ctrl.update(0.05); // mixer advances only via update (as in GlbFigure's frame loop)
    const entries = (ctrl as unknown as { entries: Map<string, { action: THREE.AnimationAction }> }).entries;
    const punch = entries.get('Attack_Punch')!.action;
    const t0 = punch.time;
    dir.apply(snap({ attackT: 0.4 }));
    ctrl.update(0.05);
    dir.apply(snap({ attackT: 0.7 }));
    ctrl.update(0.05);
    expect(punch.time).toBeGreaterThan(t0); // still the same swing, advancing
    ctrl.dispose();
  });

  it('dispose is idempotent and stops all actions', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    ctrl.dispose();
    expect(() => ctrl.dispose()).not.toThrow();
    expect(ctrl.setLoopState('Idle')).toBe(false);
    const idleAction = (ctrl as unknown as { entries: Map<string, { action: THREE.AnimationAction }> }).entries.get('Idle')!.action;
    expect(idleAction.isRunning()).toBe(false);
  });
});

// ── hardening #1: one-shot interruption ─────────────────────────────────────

describe('one-shot interruption (hardening #1)', () => {
  const CLIPS = () => [
    clip('Idle', ['Spine.quaternion']),
    clip('Walk', ['Spine.quaternion', 'UpperLeg_L.quaternion', 'UpperLeg_R.quaternion']),
    clip('Sit_Idle', ['Spine.quaternion']),
    clip('Sit_Down', ['Spine.quaternion']),
    clip('Stand_Up', ['Spine.quaternion']),
    clip('Gesture_Palm', ['UpperArm_L.quaternion']),
    clip('Attack_Punch', ['UpperArm_R.quaternion']),
    clip('Hurt', ['Spine.quaternion']),
    clip('Knocked_Down', ['Hips.quaternion', 'Spine.quaternion']),
    clip('Get_Up', ['Hips.quaternion', 'Spine.quaternion']),
  ];
  const entries = (ctrl: CharacterAnimationController) =>
    (ctrl as unknown as { entries: Map<string, { action: THREE.AnimationAction }> }).entries;

  it('gesture is interrupted by attack: exactly one owner, old action terminated', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    expect(ctrl.playOneShot('Gesture_Palm', TIER_PRIORITY.dialogue)).toBe(true);
    ctrl.update(0.3); // gesture mid-run
    expect(entries(ctrl).get('Gesture_Palm')!.action.isRunning()).toBe(true);
    expect(ctrl.playOneShot('Attack_Punch', TIER_PRIORITY.combat)).toBe(true); // higher → interrupt
    expect(ctrl.currentName).toBe('Attack_Punch');
    expect(entries(ctrl).get('Gesture_Palm')!.action.isRunning()).toBe(false); // terminated, NOT left running
    expect(entries(ctrl).get('Gesture_Palm')!.action.time).toBe(0);
    // attack (0.8 s) finishes first and hands control back to the loop state
    ctrl.update(1.0);
    expect(ctrl.currentName).toBe('Idle');
    ctrl.dispose();
  });

  it('attack is interrupted by a higher-priority one-shot (gameplay tier)', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    expect(ctrl.playOneShot('Attack_Punch', TIER_PRIORITY.combat)).toBe(true);
    ctrl.update(0.2);
    expect(ctrl.playOneShot('Knocked_Down', TIER_PRIORITY.gameplay)).toBe(true);
    expect(ctrl.currentName).toBe('Knocked_Down');
    expect(entries(ctrl).get('Attack_Punch')!.action.isRunning()).toBe(false);
    ctrl.dispose();
  });

  it('loop state survives an interruption chain and resumes after the last one-shot', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Walk', 1);
    expect(ctrl.playOneShot('Gesture_Palm', TIER_PRIORITY.dialogue)).toBe(true);
    expect(ctrl.pendingLoop).toBe('Walk');
    expect(ctrl.playOneShot('Attack_Punch', TIER_PRIORITY.combat)).toBe(true); // interrupt
    expect(ctrl.pendingLoop).toBe('Walk'); // preserved through the chain
    ctrl.update(1.0); // attack finishes
    expect(ctrl.currentName).toBe('Walk');
    expect(entries(ctrl).get('Walk')!.action.isRunning()).toBe(true);
    ctrl.dispose();
  });

  it('stale finished events from an interrupted one-shot cannot hijack resume', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    expect(ctrl.playOneShot('Gesture_Palm', TIER_PRIORITY.dialogue)).toBe(true);
    ctrl.update(0.2);
    expect(ctrl.playOneShot('Knocked_Down', TIER_PRIORITY.combat)).toBe(true); // interrupted → stopped → no finished
    ctrl.update(1.4); // Knocked_Down (1.2 s) finishes → idle resumes
    expect(ctrl.currentName).toBe('Idle');
    ctrl.update(0.6); // past where the gesture WOULD have finished — nothing changes
    expect(ctrl.currentName).toBe('Idle');
    ctrl.dispose();
  });

  it('resume to the SAME loop name restores its faded-out weight (no weight-0 zombie)', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    ctrl.playOneShot('Knocked_Down', TIER_PRIORITY.combat); // crossfades Idle out
    ctrl.update(1.4); // finish → resume Idle (same name)
    expect(ctrl.currentName).toBe('Idle');
    expect(entries(ctrl).get('Idle')!.action.getEffectiveWeight()).toBeCloseTo(1, 2);
    ctrl.dispose();
  });
});

// ── hardening #2: posture transition cancellation ───────────────────────────

describe('posture transition cancellation (hardening #2)', () => {
  const CLIPS = () => [
    clip('Idle', ['Spine.quaternion']),
    clip('Sit_Idle', ['Spine.quaternion']),
    clip('Sit_Down', ['Spine.quaternion']),
    clip('Stand_Up', ['Spine.quaternion']),
    clip('Attack_Punch', ['UpperArm_R.quaternion']),
  ];
  const entries = (ctrl: CharacterAnimationController) =>
    (ctrl as unknown as { entries: Map<string, { action: THREE.AnimationAction }> }).entries;

  it('1. Sit_Down completes normally → Sit_Idle', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ sit: true }));
    ctrl.update(1.4);
    expect(ctrl.currentName).toBe('Sit_Idle');
    ctrl.dispose();
  });

  it('2. Sit_Down cancelled mid-chain → Stand_Up; chained Sit_Idle never wins', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ sit: true }));
    ctrl.update(0.3); // sit-down halfway
    dir.apply(snap({})); // gameplay state changed: stand
    expect(ctrl.currentName).toBe('Stand_Up'); // immediate takeover, chain dead
    ctrl.update(1.4);
    expect(ctrl.currentName).toBe('Idle'); // newest snapshot wins — NOT Sit_Idle
    ctrl.dispose();
  });

  it('3. Sit_Idle → Stand_Up', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ sit: true }));
    ctrl.update(1.4);
    expect(ctrl.currentName).toBe('Sit_Idle');
    dir.apply(snap({})); // stand
    expect(ctrl.currentName).toBe('Stand_Up');
    ctrl.update(1.4);
    expect(ctrl.currentName).toBe('Idle');
    ctrl.dispose();
  });

  it('4. rapid sit toggling never restarts the same clip nor wedges the director', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    for (const sit of [true, false, true, false]) {
      dir.apply(snap({ sit }));
      expect(['Sit_Down', 'Stand_Up']).toContain(ctrl.currentName); // exactly one posture one-shot in control
      ctrl.update(0.15);
    }
    dir.apply(snap({}));
    ctrl.update(1.6);
    expect(ctrl.currentName).toBe('Idle');
    expect(dir.edges.sit).toBe(false);
    ctrl.dispose();
  });

  it('5. newest gameplay snapshot beats an already-scheduled chain (cancelOneShot API)', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    expect(ctrl.playOneShot('Sit_Down', TIER_PRIORITY.posture + 1, 'Sit_Idle')).toBe(true);
    expect(ctrl.cancelOneShot('Sit_Down')).toBe(true);
    expect(ctrl.currentName).toBe('Idle');
    ctrl.update(1.4); // past Sit_Down length: the Sit_Idle chain never fires
    expect(ctrl.currentName).toBe('Idle');
    expect(ctrl.cancelOneShot('Sit_Down')).toBe(false); // idempotent no-op
    ctrl.dispose();
  });

  it('stale sit chain dies even when a combat one-shot refuses Stand_Up', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ sit: true }));
    ctrl.update(0.3); // Sit_Down active
    dir.apply(snap({ attackT: 0.1 })); // combat rises while still seated
    expect(ctrl.currentName).toBe('Attack_Punch'); // combat takes over the body
    dir.apply(snap({ attackT: 0.2 })); // hmm — director returns early while attacking; sit flag dropped by gameplay
    ctrl.update(1.0); // attack finishes → newest snapshot (standing) resumes — not Sit_Idle
    expect(ctrl.currentName).toBe('Idle');
    ctrl.dispose();
  });
});

// ── hardening #3: priority ladder verification ──────────────────────────────

describe('priority ladder (hardening #3)', () => {
  const CLIPS = () => [
    clip('Idle', ['Spine.quaternion']),
    clip('Walk', ['Spine.quaternion', 'UpperLeg_L.quaternion', 'UpperLeg_R.quaternion']),
    clip('Run', ['Spine.quaternion', 'UpperLeg_L.quaternion']),
    clip('Talk', ['Spine.quaternion']),
    clip('Sit_Down', ['Spine.quaternion']),
    clip('Gesture_Palm', ['UpperArm_L.quaternion']),
    clip('Attack_Punch', ['UpperArm_R.quaternion']),
    clip('Hurt', ['Spine.quaternion']),
    clip('Knocked_Down', ['Hips.quaternion', 'Spine.quaternion']),
    clip('Get_Up', ['Hips.quaternion', 'Spine.quaternion']),
  ];
  const entries = (ctrl: CharacterAnimationController) =>
    (ctrl as unknown as { entries: Map<string, { action: THREE.AnimationAction }> }).entries;

  it('down beats combat: an active attack is taken over by Knocked_Down', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ attackT: 0.1 }));
    expect(ctrl.currentName).toBe('Attack_Punch');
    dir.apply(snap({ attackT: 0.3, down: true })); // downed mid-swing
    expect(ctrl.currentName).toBe('Knocked_Down');
    expect(entries(ctrl).get('Attack_Punch')!.action.isRunning()).toBe(false);
    ctrl.dispose();
  });

  it('down beats movement: walk is deferred while downed and resumes after Get_Up', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ speed: 1.0 }));
    expect(ctrl.currentName).toBe('Walk');
    dir.apply(snap({ down: true, speed: 1.0 }));
    expect(ctrl.currentName).toBe('Knocked_Down');
    expect(ctrl.pendingLoop).toBe('Walk');
    dir.apply(snap({ speed: 1.0 })); // released mid-clip
    expect(ctrl.currentName).toBe('Get_Up');
    ctrl.update(1.4);
    expect(ctrl.currentName).toBe('Walk'); // movement is the resumed loop
    ctrl.dispose();
  });

  it('down beats dialogue: Talk loop is replaced while downed', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ act: { talking: true, gesture: -1, nodT: -1 } }));
    expect(ctrl.currentName).toBe('Talk');
    dir.apply(snap({ down: true, act: { talking: true, gesture: -1, nodT: -1 } }));
    expect(ctrl.currentName).toBe('Knocked_Down');
    ctrl.dispose();
  });

  it('combat interrupts dialogue one-shots; dialogue cannot interrupt combat', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    expect(ctrl.playOneShot('Gesture_Palm', TIER_PRIORITY.dialogue)).toBe(true);
    expect(ctrl.playOneShot('Attack_Punch', TIER_PRIORITY.combat)).toBe(true); // interrupt
    expect(ctrl.currentName).toBe('Attack_Punch');
    expect(ctrl.playOneShot('Gesture_Palm', TIER_PRIORITY.dialogue)).toBe(false); // refused
    expect(ctrl.currentName).toBe('Attack_Punch');
    ctrl.dispose();
  });

  it('posture does not interrupt higher tiers', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    ctrl.setLoopState('Idle');
    ctrl.playOneShot('Attack_Punch', TIER_PRIORITY.combat);
    expect(ctrl.playOneShot('Sit_Down', TIER_PRIORITY.posture + 1)).toBe(false);
    expect(ctrl.currentName).toBe('Attack_Punch');
    ctrl.dispose();
  });

  it('movement is the loop resumed after a one-shot finishes (Run variant)', () => {
    const rig = makeRig();
    const ctrl = new CharacterAnimationController(rig, CLIPS());
    const dir = new CharacterAnimDirector(ctrl);
    ctrl.setLoopState('Idle');
    dir.apply(snap({ speed: 4.2, run: true }));
    expect(ctrl.currentName).toBe('Run');
    dir.apply(snap({ speed: 4.2, run: true, attackT: 0.1 })); // attack while running
    expect(ctrl.currentName).toBe('Attack_Punch');
    expect(ctrl.pendingLoop).toBe('Run');
    ctrl.update(1.0);
    expect(ctrl.currentName).toBe('Run');
    ctrl.dispose();
  });
});

// ── rig detection ───────────────────────────────────────────────────────────

describe('isSkeletalRig (renderer routing)', () => {
  it('legacy joint-rig GLBs (plain meshes, no clips) are NOT skeletal', () => {
    // exactly the situation of today's public/models files
    const legacy = new THREE.Group();
    legacy.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()));
    expect(isSkeletalRig(legacy, [])).toBe(false);
    expect(isSkeletalRig(legacy, undefined)).toBe(false);
  });

  it('skinned mesh without clips is not skeletal (nothing to play)', () => {
    const g = new THREE.Group();
    const sm = new THREE.SkinnedMesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial());
    g.add(sm);
    expect(isSkeletalRig(g, [])).toBe(false);
  });

  it('skinned mesh + clips routes to the skeletal adapter', () => {
    const g = new THREE.Group();
    g.add(new THREE.SkinnedMesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial()));
    expect(isSkeletalRig(g, [clip('Idle', ['Hips.quaternion'])])).toBe(true);
  });
});

// ── registry / asset compatibility ──────────────────────────────────────────

describe('asset + registry compatibility (integration surface)', () => {
  it('manifest GLB paths agree with the runtime path table', () => {
    expect(CHARACTER_ASSETS).toHaveLength(5);
    for (const a of CHARACTER_ASSETS) {
      expect(CHAR_GLB_PATHS[a.id as keyof typeof CHAR_GLB_PATHS]).toBe(a.glb);
    }
    const files = CHARACTER_ASSETS.map((a) => a.pipelineFile).sort();
    expect(files).toEqual(['aris', 'bimo', 'pak_budi', 'ren', 'siti'].sort());
  });

  it('tint aliases keep the legacy name as primary and never target the face material', () => {
    const slots = Object.keys(TINT_SLOT_ALIASES) as TintSlot[];
    expect(slots.sort()).toEqual(Object.keys(TINT_SLOT_MATERIALS).sort());
    for (const s of slots) {
      expect(TINT_SLOT_ALIASES[s][0]).toBe(TINT_SLOT_MATERIALS[s]);
      expect(new Set(TINT_SLOT_ALIASES[s]).size).toBe(TINT_SLOT_ALIASES[s].length);
      for (const name of TINT_SLOT_ALIASES[s]) expect(name).not.toBe('mat_head_tex');
    }
    // pipeline counterpart names exist for the slots that matter on rigged models
    expect(TINT_SLOT_ALIASES.shirt).toContain('CSL_shirt');
    expect(TINT_SLOT_ALIASES.tie).toContain('CSL_accent');
    expect(TINT_SLOT_ALIASES.pants).toContain('CSL_trousers');
    expect(TINT_SLOT_ALIASES.skirt).toContain('CSL_skirt');
  });
});
