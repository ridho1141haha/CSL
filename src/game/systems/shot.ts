import type { DialogueShot } from '../../types';

// ============================================================================
// DIALOGUE SHOT MATH (mentor feedback #2) — pure, testable, renderer-agnostic.
//
// Given speaker/listener world positions and a shot spec, produce a camera
// position + look target. CameraRig lerps toward it and applies occlusion.
// The conversation axis (speaker→listener) drives framing so shots stay
// coherent no matter where the conversation happens on the map.
// ============================================================================

export type Vec2 = { x: number; z: number };
export type ShotResult = { pos: Vec2; look: Vec2; height: number; lookHeight: number; dur: number };

const KIND_DEFAULTS: Record<string, { dist: number; height: number; lookHeight: number; dur: number }> = {
  close:  { dist: 1.8, height: 1.5,  lookHeight: 1.42, dur: 3.2 },
  medium: { dist: 2.7, height: 1.62, lookHeight: 1.35, dur: 2.6 },
  wide:   { dist: 5.6, height: 3.1,  lookHeight: 1.3,  dur: 2.0 },
  ots:    { dist: 2.15, height: 1.55, lookHeight: 1.42, dur: 3.0 },
  two:    { dist: 3.7, height: 1.7,  lookHeight: 1.35, dur: 2.4 },
};

// Perpendicular offset as a fraction of distance — keeps the camera slightly
// off the conversation axis so shots read as "framed" instead of head-on, and
// clears the listener's head in the near foreground (OTS style).
const ANGLE_BIAS: Record<string, number> = {
  close: 0.42,
  medium: 0.5,
  wide: 0.5,
  ots: 0.36,
  two: 0.55,
};

export function computeShot(
  shot: DialogueShot,
  speaker: Vec2,
  listener: Vec2 | null,
): ShotResult {
  const d = KIND_DEFAULTS[shot.kind] ?? KIND_DEFAULTS.medium;
  const dist = shot.dist ?? d.dist;
  const height = shot.height ?? d.height;
  const dur = shot.dur ?? d.dur;

  // subject the camera frames
  const subjectIsListener = shot.subject === 'listener' && listener != null;
  const subject = subjectIsListener ? listener! : speaker;
  const other = subjectIsListener ? speaker : listener;

  // conversation axis: subject → other. No other party → keep the player's
  // last facing axis via a gentle default (south → north).
  let ax = 0;
  let az = -1;
  if (other) {
    ax = other.x - subject.x;
    az = other.z - subject.z;
    const len = Math.hypot(ax, az) || 1;
    ax /= len;
    az /= len;
  }

  // side of the axis the camera sits on
  const side = shot.side ?? 1;

  // Classic shot-reverse-shot: the camera sits on the OTHER party's side of
  // the subject (over the listener's shoulder when framing the speaker), with
  // a perpendicular offset so it reads as a 3/4 view instead of head-on.
  const px = ax * dist + -az * side * dist * ANGLE_BIAS[shot.kind]!;
  const pz = az * dist + ax * side * dist * ANGLE_BIAS[shot.kind]!;

  // look target: subject head, or the midpoint (two-shots)
  const lookMid = shot.look === 'midpoint' && other;
  const lookX = lookMid ? (subject.x + other!.x) / 2 : subject.x + ax * 0.35;
  const lookZ = lookMid ? (subject.z + other!.z) / 2 : subject.z + az * 0.35;

  return {
    pos: { x: subject.x + px, z: subject.z + pz },
    look: { x: lookX, z: lookZ },
    height,
    lookHeight: d.lookHeight,
    dur,
  };
}
