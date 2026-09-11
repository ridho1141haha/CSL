// Shared per-frame runtime state (mutable, outside React/store).
// Player writes; camera/NPCs/combat read. Store updates are throttled.

export const playerPos = { x: 7, y: 1, z: 29, vx: 0, vz: 0, speed: 0, grounded: true, facing: Math.PI };
// BUG-3.5: `active` flag is now read by StoryDirector to skip NPC interaction
// while combat is in progress (prevents "talk to NPC" prompt from flickering
// during enemy encounters).
export const enemyPos = { x: 0, y: 1, z: 0, active: false };

// Occlusion registry: world meshes the camera should avoid clipping into.
export const occluders: { objects: object[] } = { objects: [] };
export function registerOccluders(objs: object[]) {
  occluders.objects = objs;
}

// Camera azimuth shared for camera-relative movement & NPC facing.
export const camState = { yaw: 0, shake: 0 };

// NPC positions (updated by ScheduledNpc) for interaction checks.
export const npcPositions: Record<string, { x: number; z: number }> = {};

export function requestShake(mag: number) {
  camState.shake = Math.max(camState.shake, mag);
}
