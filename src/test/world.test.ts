import { describe, it, expect } from 'vitest';
import { SCENES, CAMPUS_ZONES, ROOFTOP_ZONES, WAREHOUSE_ZONES, zoneAt, PLAYER_SPAWN } from '../data/world';
import { NPCS } from '../data/npcs';
import { DIALOGUE } from '../data/dialogue';
import { CAMERA_POSES } from '../data/world';
import { CAM_BY_NODE } from '../data/chapters';

// World v2: multi-scene layout rebuilt without the school GLB. These specs
// pin the scene registry, scene-aware zone lookup, NPC placement inside the
// campus bounds, and the scene-transition effects wired into the story graph.

describe('world v2 — scene registry', () => {
  it('exposes exactly three scenes with complete definitions', () => {
    expect(Object.keys(SCENES).sort()).toEqual(['campus', 'rooftop', 'warehouse']);
    for (const scene of Object.values(SCENES)) {
      expect(scene.label.length).toBeGreaterThan(0);
      expect(scene.bounds.minX).toBeLessThan(scene.bounds.maxX);
      expect(scene.bounds.minZ).toBeLessThan(scene.bounds.maxZ);
      expect(scene.zones.length).toBeGreaterThan(0);
    }
  });

  it('spawns the player inside every scene bounds', () => {
    for (const scene of Object.values(SCENES)) {
      const [x, z] = scene.spawn;
      expect(x).toBeGreaterThanOrEqual(scene.bounds.minX);
      expect(x).toBeLessThanOrEqual(scene.bounds.maxX);
      expect(z).toBeGreaterThanOrEqual(scene.bounds.minZ);
      expect(z).toBeLessThanOrEqual(scene.bounds.maxZ);
    }
    expect(PLAYER_SPAWN).toEqual(SCENES.campus.spawn);
  });

  it('keeps zone ids unique per scene and zones inside bounds', () => {
    for (const scene of Object.values(SCENES)) {
      const ids = scene.zones.map((z) => z.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const z of scene.zones) {
        const [x, zz] = z.center;
        expect(x).toBeGreaterThanOrEqual(scene.bounds.minX - z.radius);
        expect(x).toBeLessThanOrEqual(scene.bounds.maxX + z.radius);
        expect(zz).toBeGreaterThanOrEqual(scene.bounds.minZ - z.radius);
        expect(zz).toBeLessThanOrEqual(scene.bounds.maxZ + z.radius);
        expect(z.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('world v2 — zoneAt is scene-aware', () => {
  it('finds campus zones with campus coords', () => {
    expect(zoneAt(7, 44.5, 'campus')?.id).toBe('gate');
    expect(zoneAt(7, 36, 'campus')?.id).toBe('courtyard');
    expect(zoneAt(-9, 9, 'campus')?.id).toBe('classroom');
    expect(zoneAt(28, 8, 'campus')?.id).toBe('canteen');
    expect(zoneAt(-36, -27, 'campus')?.id).toBe('warehouse');
  });

  it('finds rooftop and warehouse zones with scene-local coords', () => {
    expect(zoneAt(0, 8.5, 'rooftop')?.id).toBe('rooftop_door');
    expect(zoneAt(0, -2, 'rooftop')?.id).toBe('rooftop');
    expect(zoneAt(0, 9.5, 'warehouse')?.id).toBe('warehouse_door');
    expect(zoneAt(0, -1, 'warehouse')?.id).toBe('warehouse_in');
  });

  it('does not leak zones across scenes', () => {
    // (0, 8.5) in the warehouse is open floor, not the rooftop door
    expect(zoneAt(0, 8.5, 'warehouse')?.id).not.toBe('rooftop_door');
    // campus gate coords are meaningless on the rooftop
    expect(zoneAt(7, 44.5, 'rooftop')).toBeNull();
  });
});

describe('world v2 — NPC placement', () => {
  it('keeps every scheduled waypoint inside the campus bounds', () => {
    const b = SCENES.campus.bounds;
    for (const npc of NPCS) {
      for (const [period, wp] of Object.entries(npc.schedule)) {
        const [x, z] = wp as [number, number];
        expect(x, `${npc.id}.${period}`).toBeGreaterThanOrEqual(b.minX + 1);
        expect(x, `${npc.id}.${period}`).toBeLessThanOrEqual(b.maxX - 1);
        expect(z, `${npc.id}.${period}`).toBeGreaterThanOrEqual(b.minZ + 1);
        expect(z, `${npc.id}.${period}`).toBeLessThanOrEqual(b.maxZ - 1);
      }
    }
  });
});

describe('world v2 — camera poses', () => {
  it('defines a pose for every node that requests one', () => {
    for (const [node, poseKey] of Object.entries(CAM_BY_NODE)) {
      expect(CAMERA_POSES[poseKey], `pose ${poseKey} for ${node}`).toBeDefined();
    }
  });
});

describe('world v2 — scene transitions in the story graph', () => {
  it('returns the player to campus after the rooftop chapter 3 branch', () => {
    for (const id of ['ch3_accept_2', 'ch3_reject_2']) {
      const effects = DIALOGUE[id]?.effects ?? [];
      expect(
        effects.some((e) => e.k === 'scene' && (e as { id: string }).id === 'campus'),
        `${id} should send the player back to campus`
      ).toBe(true);
    }
  });

  it('moves the bad route into the warehouse scene for the duel', () => {
    const effects = DIALOGUE['ch4_bad_warehouse']?.effects ?? [];
    expect(
      effects.some((e) => e.k === 'scene' && (e as { id: string }).id === 'warehouse'),
      'ch4_bad_warehouse should transition into the warehouse scene'
    ).toBe(true);
  });
});

describe('world v2 — zone registries', () => {
  it('splits interior zones from legacy outdoor ids', () => {
    const campusIds = CAMPUS_ZONES.map((z) => z.id);
    for (const id of ['hall', 'classroom', 'teacher_room']) expect(campusIds).toContain(id);
    expect(ROOFTOP_ZONES.map((z) => z.id)).toEqual(['rooftop', 'rooftop_door']);
    expect(WAREHOUSE_ZONES.map((z) => z.id)).toEqual(['warehouse_in', 'warehouse_door']);
  });
});
