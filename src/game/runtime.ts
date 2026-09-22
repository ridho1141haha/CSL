// Shared per-frame runtime state (mutable, outside React/store).
// Player writes; camera/NPCs/combat read. Store updates are throttled.

import { mobile } from './mobile';

export const playerPos = { x: 7, y: 1, z: 29, vx: 0, vz: 0, speed: 0, grounded: true, facing: Math.PI };

// v0.9.0: desktop-class devices build the world during boot/menu so the
// loading screen covers real engine work and "MULAI" lands in a ready scene.
// Low-tier phones keep lazy mounting (battery + memory).
export const PREWARM = typeof window !== 'undefined' && !mobile.lowSpec;
// BUG-3.5: `active` flag is now read by StoryDirector to skip NPC interaction
// while combat is in progress (prevents "talk to NPC" prompt from flickering
// during enemy encounters).
export const enemyPos = { x: 0, y: 1, z: 0, active: false };

// Occlusion registry: world meshes the camera should avoid clipping into.
export const occluders: { objects: object[] } = { objects: [] };
export function registerOccluders(objs: object[]) {
  occluders.objects = objs;
}

// ---------------------------------------------------------------------------
// v0.9.0 render-culling registry ("yang ga keliatan ga dirender").
// World bundles register here (see <Cull> in world/props.tsx); CullingManager
// hides a bundle when it is fully outside the camera frustum ('frustum' mode)
// or when its interior detail sits beyond `interiorRange` meters ('interior'
// mode — walls hide it anyway, fog covers the swap). Pure data + helpers so
// it stays unit-testable without WebGL.
// ---------------------------------------------------------------------------
export type CullMode = 'frustum' | 'interior';
export type CullEntry = {
  id: number;
  obj: object; // THREE.Object3D
  center: [number, number, number];
  radius: number;
  mode: CullMode;
};

export const cullRegistry: { entries: CullEntry[]; nextId: number } = { entries: [], nextId: 1 };
export const perfState = {
  /** set by WorldReadyProbe once the world has actually rendered frames */
  worldReady: false,
  /** last sweep stats (diagnostics chip) */
  hiddenBundles: 0,
  lastCullSweepAt: 0,
};

export function registerCull(entry: Omit<CullEntry, 'id'>): number {
  const id = cullRegistry.nextId++;
  cullRegistry.entries.push({ ...entry, id });
  return id;
}

export function unregisterCull(id: number): void {
  const i = cullRegistry.entries.findIndex((e) => e.id === id);
  if (i >= 0) cullRegistry.entries.splice(i, 1);
}

export function resetCullRegistry(): void {
  cullRegistry.entries = [];
  cullRegistry.nextId = 1;
}

/** Pure sphere-vs-frustum + range decision used by CullingManager. */
export function cullDecision(
  entry: Pick<CullEntry, 'center' | 'radius' | 'mode'>,
  camPos: { x: number; y: number; z: number },
  opts: { interiorRange: number; margin: number; inFrustum: boolean; farRange?: number },
): boolean {
  const d2 = (entry.center[0] - camPos.x) ** 2 + (entry.center[1] - camPos.y) ** 2 + (entry.center[2] - camPos.z) ** 2;
  if (entry.mode === 'interior' && d2 > opts.interiorRange * opts.interiorRange) return true; // hide
  // v0.14.3 fog culling: beyond fogFar the fragment color IS the fog color, so
  // a bundle whose near edge sits past it contributes nothing on screen —
  // hidden even while inside the frustum (radius keeps the near edge safe).
  if (opts.farRange !== undefined) {
    const far = opts.farRange + entry.radius;
    if (d2 > far * far) return true; // fully fogged out → hide
  }
  if (opts.inFrustum) return false; // visible
  const reach = entry.radius + opts.margin;
  return d2 > reach * reach; // fully outside frustum AND far → hide
}

// Camera azimuth shared for camera-relative movement & NPC facing.
export const camState = { yaw: 0, shake: 0 };

// NPC positions (updated by ScheduledNpc) for interaction checks.
export const npcPositions: Record<string, { x: number; z: number }> = {};

// Cinematic story-actor positions (updated by StoryActor) — lets the dialogue
// camera + acting system frame/aim at bullies, gang members, route actors etc.
// Keyed by actor id ('bully1', 'gang1', 'aris'…).
export const actorPositions: Record<string, { x: number; z: number }> = {};

export function requestShake(mag: number) {
  camState.shake = Math.max(camState.shake, mag);
}

// TEMP DEBUG (remove before release): expose runtime + key stores on window.
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__csl = { playerPos, camState };
}
