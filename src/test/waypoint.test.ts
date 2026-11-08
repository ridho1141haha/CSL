import { describe, it, expect } from 'vitest';
import { QUESTS } from '../data/quests';
import { ZONE_BY_ID } from '../data/world';
import { pickActiveQuest, questTargetFor, distanceToTarget } from '../game/waypoint';

const CTX = { visited: [] as string[], px: 7, pz: 36 }; // courtyard spawn area

describe('waypoint targets (v0.10.0)', () => {
  it('every quest in the registry resolves to a target', () => {
    for (const q of QUESTS) {
      const t = questTargetFor(q, CTX);
      expect(t, `quest ${q.id} has no waypoint target`).not.toBeNull();
      expect(t!.pos).toHaveLength(2);
      expect(Number.isFinite(t!.pos[0])).toBe(true);
      expect(Number.isFinite(t!.pos[1])).toBe(true);
    }
  });

  it('targets point at real zones (map highlighting stays valid)', () => {
    for (const q of QUESTS) {
      const t = questTargetFor(q, CTX);
      if (t?.zoneId) expect(ZONE_BY_ID[t.zoneId], `${q.id} → unknown zone`).toBeDefined();
    }
  });

  it('explore_school points at the nearest unvisited landmark', () => {
    const q = QUESTS.find((x) => x.id === 'explore_school')!;
    // standing on the field → field is closest
    const t1 = questTargetFor(q, { visited: [], px: -33, pz: 15 });
    expect(t1?.zoneId).toBe('field');
    // field already visited → skips to another unvisited one
    const t2 = questTargetFor(q, { visited: ['field'], px: -33, pz: 15 });
    expect(t2?.zoneId).not.toBe('field');
    // everything visited → no marker at all
    const t3 = questTargetFor(q, { visited: ['courtyard', 'canteen', 'field', 'back_alley'], px: 7, pz: 36 });
    expect(t3).toBeNull();
  });

  it('story beats map to their authored locations', () => {
    const byId = (id: string) => QUESTS.find((q) => q.id === id)!;
    expect(questTargetFor(byId('aris_incident'), CTX)?.zoneId).toBe('back_stairs');
    expect(questTargetFor(byId('rooftop_meeting'), CTX)?.zoneId).toBe('back_stairs');
    expect(questTargetFor(byId('warehouse_call'), CTX)?.zoneId).toBe('warehouse');
    expect(questTargetFor(byId('graduation_day'), CTX)?.zoneId).toBe('gate');
    expect(questTargetFor(byId('osis_form'), CTX)?.zoneId).toBe('teacher_room');
    expect(questTargetFor(byId('study_habit'), CTX)?.zoneId).toBe('classroom');
    expect(questTargetFor(byId('canteen_teh'), CTX)?.zoneId).toBe('canteen');
    expect(questTargetFor(byId('field_training'), CTX)?.zoneId).toBe('field');
    expect(questTargetFor(byId('alley_check'), CTX)?.zoneId).toBe('back_alley');
  });
});

describe('active quest picker', () => {
  it('prefers the main quest when both are active', () => {
    const q = pickActiveQuest({ explore_school: 'active', canteen_teh: 'active' });
    expect(q?.type).toBe('main');
    expect(q?.id).toBe('explore_school');
  });

  it('falls back to side quests when no main quest is active', () => {
    const q = pickActiveQuest({ canteen_teh: 'active' });
    expect(q?.id).toBe('canteen_teh');
  });

  it('returns null with nothing active', () => {
    expect(pickActiveQuest({})).toBeNull();
    expect(pickActiveQuest({ explore_school: 'completed', canteen_teh: 'failed' })).toBeNull();
  });
});

describe('distance readout', () => {
  it('measures ground distance to the target', () => {
    const t = questTargetFor(QUESTS.find((q) => q.id === 'graduation_day')!, CTX);
    expect(t).not.toBeNull();
    // gate center is (7, 44.5), player at (7, 36) → 8.5 m
    expect(distanceToTarget(t, 7, 36)).toBeCloseTo(8.5, 5);
  });

  it('is 0 without a target (HUD shows no distance chip)', () => {
    expect(distanceToTarget(null, 0, 0)).toBe(0);
  });
});
