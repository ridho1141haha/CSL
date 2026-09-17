// ============================================================================
// waypoint.ts — objective targets (v0.10.0, user request: penunjuk arah /
// waypoint). Pure module: maps the active quest to a world position the
// ObjectiveWaypoint (campus scene) and the HUD tracker can both point at.
//
// Data lives here instead of on QuestDef so the quest list stays narrative —
// targets may also be computed (explore_school points at the nearest
// unvisited landmark instead of one fixed spot).
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
  switch (quest.id) {
    case 'aris_incident': return zoneTarget(quest, 'back_stairs');
    case 'rooftop_meeting': return zoneTarget(quest, 'back_stairs');
    case 'warehouse_call': return zoneTarget(quest, 'warehouse');
    case 'find_aris': return zoneTarget(quest, 'back_alley');
    case 'graduation_day': return zoneTarget(quest, 'gate');
    case 'osis_form': return zoneTarget(quest, 'teacher_room');
    case 'study_habit': return zoneTarget(quest, 'classroom');
    case 'aris_notes': return zoneTarget(quest, 'classroom');
    case 'canteen_teh': return zoneTarget(quest, 'canteen');
    case 'field_training': return zoneTarget(quest, 'field');
    case 'alley_check': return zoneTarget(quest, 'back_alley');
    default: return null;
  }
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
