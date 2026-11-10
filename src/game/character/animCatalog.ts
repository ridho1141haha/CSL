// CSL animation clip catalog — runtime mirror of the Blender pipeline clips.
//
// Source of truth: tools/blender/csl_anim.py (CLIPS + REVERSED) and
// tools/blender/ANIMATION_MAP.md. Clip names here MUST match the glTF
// animation names the pipeline bakes (one NLA track per clip, named exactly
// like the clip). Durations are from the Python table — used by tests and
// sanity checks, not by the mixer itself.

export const ANIM_CLIPS = [
  // locomotion
  'Idle', 'Walk', 'Run', 'Jump',
  // postures
  'Sit_Idle', 'Sit_Write', 'Sit_Lean_Forward', 'Sit_Down', 'Stand_Up',
  'Crouch_Idle', 'Pick_Up',
  // dialogue
  'Talk', 'Listen_Nod', 'Gesture_Palm', 'Gesture_Emphasis', 'Gesture_Chest',
  'Look_Around',
  // emotion idles (Emotion type in src/types)
  'Idle_Worried', 'Idle_Tense', 'Idle_Firm', 'Idle_Dark', 'Idle_Warm',
  // held props (HoldKind)
  'Hold_Phone', 'Hold_Book', 'Hold_Stack', 'Hold_Light',
  // combat
  'Attack_Punch', 'Block', 'Hurt', 'Knocked_Down',
  // recovery (REVERSED: Knocked_Down played backwards)
  'Get_Up',
] as const;

export type AnimClipName = (typeof ANIM_CLIPS)[number];

/** One-shots play once and clamp on the last frame (ANIMATION_MAP.md); everything else loops. */
export const ONE_SHOT_CLIPS: ReadonlySet<string> = new Set([
  'Jump', 'Sit_Down', 'Stand_Up', 'Pick_Up',
  'Gesture_Palm', 'Gesture_Emphasis', 'Gesture_Chest',
  'Attack_Punch', 'Hurt', 'Knocked_Down', 'Get_Up',
]);

export const CLIP_DURATIONS: Readonly<Record<AnimClipName, number>> = {
  Idle: 4.0, Walk: 1.0, Run: 0.64, Jump: 0.9,
  Sit_Idle: 4.0, Sit_Write: 2.0, Sit_Lean_Forward: 3.0,
  Sit_Down: 1.2, Stand_Up: 1.2, Crouch_Idle: 3.0, Pick_Up: 2.0,
  Talk: 3.0, Listen_Nod: 1.2, Gesture_Palm: 1.6, Gesture_Emphasis: 1.2,
  Gesture_Chest: 2.0, Look_Around: 4.0,
  Idle_Worried: 3.0, Idle_Tense: 3.0, Idle_Firm: 4.0, Idle_Dark: 5.0, Idle_Warm: 4.0,
  Hold_Phone: 4.0, Hold_Book: 4.0, Hold_Stack: 4.0, Hold_Light: 4.0,
  Attack_Punch: 0.8, Block: 1.2, Hurt: 0.6, Knocked_Down: 1.2, Get_Up: 1.2,
};

export const isOneShotClip = (name: string) => ONE_SHOT_CLIPS.has(name);
export const isKnownClip = (name: string) => (ANIM_CLIPS as readonly string[]).includes(name);

/** Default crossfade — ANIMATION_MAP.md prescribes 0.15–0.25 s. */
export const DEFAULT_FADE = 0.18;

/** Never-fail fallback: the character always has an idle to fall back to. */
export const FALLBACK_CLIP: AnimClipName = 'Idle';

/** Walk/Run time scales — ANIMATION_MAP.md: Walk 1.0 s cycle at speed/1.4, Run 0.64 s at speed/4.2. */
export const WALK_TIMESCALE = (speed: number) => Math.max(0.4, Math.min(2.2, speed / 1.4));
export const RUN_TIMESCALE = (speed: number) => Math.max(0.7, Math.min(2.0, speed / 4.2));
