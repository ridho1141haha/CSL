import type { DialogueShot } from '../types';

// Dialogue camera shot presets (mentor feedback #2). Dialogue nodes reference
// these by key via `cam`. The camera resolves them from live speaker/listener
// positions (systems/shot.ts), so the same preset works anywhere on the map.
//
// shot vocabulary:
//   close  — tight on the speaker's face (emotional beats)
//   medium — standard single (default conversation shot)
//   ots    — over the listener's shoulder toward the speaker
//   two    — both parties, midpoint look
//   wide   — scene-setting wide (narration, establishing beats)

export const SHOT_PRESETS: Record<string, DialogueShot> = {
  // single shots on whoever is speaking
  close_speaker: { kind: 'close' },
  medium_speaker: { kind: 'medium' },
  wide_scene: { kind: 'wide' },

  // over-the-shoulder: camera over the LISTENER's shoulder framing the speaker
  ots_speaker: { kind: 'ots', subject: 'speaker' },
  ots_speaker_left: { kind: 'ots', subject: 'speaker', side: -1 },

  // reaction shots — frame the listener while the other talks off-screen
  close_listener: { kind: 'close', subject: 'listener' },
  medium_listener: { kind: 'medium', subject: 'listener' },

  // both parties
  two_shot: { kind: 'two', look: 'midpoint' },
  two_wide: { kind: 'wide', subject: 'speaker', look: 'midpoint' },

  // Ren's internal lines during NPC conversations: keep the NPC in frame edge
  ren_close: { kind: 'close', subject: 'player' },
  ren_ots: { kind: 'ots', subject: 'player' },
};

// Default shot per speaker role when a node has no explicit `cam`.
// Narrator lines frame the scene wide; NPC lines go over Ren's shoulder.
export const DEFAULT_SHOT: Record<string, string> = {
  NARATOR: 'wide_scene',
  REN: 'ren_ots',
};
