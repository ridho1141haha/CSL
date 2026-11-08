// ============================================================================
// waypoint.ts — objective targets (v0.10.0, user request: penunjuk arah /
// waypoint). Pure module: maps the active quest to a world position the
// ObjectiveWaypoint (campus scene) and the HUD tracker can both point at.
//
// v0.17.0: the per-quest target zone lives ON QuestDef (`waypoint`) — this
// module now only carries the one COMPUTED target (explore_school points at
// the nearest unvisited landmark instead of one fixed spot).
// ============================================================================

import type { QuestDef, QuestState, ZoneDef } from '../types';
import { QUESTS } from '../data/quests';
import { ZONE_BY_ID } from '../data/world';

export type WaypointTarget = {
  questId: string;
  /** zone the marker sits in (for map highlighting); null for raw positions */
  zoneId: string | null;
  label: string;
  /** world (campus) position */
  pos: [number, number];
  /** marker height (zone y-window midpoint when the zone is floor-bound) */
  y: number;
};

function zoneTarget(quest: QuestDef, zoneId: string): WaypointTarget | null {
  const z: ZoneDef | undefined = ZONE_BY_ID[zoneId];
  if (!z) return null;
  return {
    questId: quest.id,
    zoneId: z.id,
    label: z.label,
    pos: [z.center[0], z.center[1]],
    y: z.y ? (z.y[0] + z.y[1]) / 2 : 2.1,
  };
}

// explore_school: "kunjungi halaman, kantin, lapangan, dan gang belakang" —
// point at whichever of the four is closest but not yet visited.
const EXPLORE_CANDIDATES = ['courtyard', 'canteen', 'field', 'back_alley'];

export function questTargetFor(
  quest: QuestDef,
  ctx: { visited: readonly string[]; px: number; pz: number },
): WaypointTarget | null {
  if (quest.id === 'explore_school') {
    let best: WaypointTarget | null = null;
    let bestD = Infinity;
    for (const id of EXPLORE_CANDIDATES) {
      if (ctx.visited.includes(id)) continue;
      const t = zoneTarget(quest, id);
      if (!t) continue;
      const d = Math.hypot(ctx.px - t.pos[0], ctx.pz - t.pos[1]);
      if (d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  }
  // v0.17.0: data-driven target (QuestDef.waypoint) — a new quest with a
  // `waypoint` zone gets its marker without touching this file. Quests with
  // no waypoint and no computed rule resolve to null (no marker).
  if (quest.waypoint) return zoneTarget(quest, quest.waypoint);
  return null;
}

/**
 * The quest the waypoint/tracker/map should show. Preference: first ACTIVE
 * main quest (QUESTS is chapter-ordered), else first active side quest —
 * same intent as the old `QUESTS.find(...)` in Hud/MapPanel but consistent
 * across all three surfaces.
 */
export function pickActiveQuest(quests: Record<string, QuestState>): QuestDef | null {
  const main = QUESTS.find((q) => q.type === 'main' && quests[q.id] === 'active');
  if (main) return main;
  return QUESTS.find((q) => q.type === 'side' && quests[q.id] === 'active') ?? null;
}

/** Ground distance player → target (meters, 0 when no target). */
export function distanceToTarget(target: WaypointTarget | null, px: number, pz: number): number {
  if (!target) return 0;
  return Math.hypot(px - target.pos[0], pz - target.pos[1]);
}
