import { describe, expect, it, beforeEach } from 'vitest';
import { STORY_TRIGGERS } from '../data/story/triggers';
import { MONTAGE_ROOTS, STORY_TRIGGER_NODES, DIALOGUE } from '../data/dialogue';
import { QUEST_BY_ID } from '../data/quests';
import { REN_STAGING } from '../data/chapters';
import { CAM_BY_NODE } from '../data/chapters';
import { firstTrigger, triggerEligible } from '../game/systems/storyTriggers';
import { evalCondition, type ConditionContext } from '../game/systems/conditions';
import { useGame } from '../stores/gameStore';
import type { GameMode, SceneId, StoryBeat, Route, ZoneId } from '../types';

// ============================================================================
// v0.17.1 — STORY TRIGGER registry tests. StoryDirector no longer owns
// per-beat if-blocks; these tests lock the registry to the canon wiring the
// engine blocks used to encode:
//   • once-flags MUST be the historical save flag names (old saves already
//     carry them — renaming would re-fire montages on load),
//   • every trigger fires in its canon scenario and NOT in its neighbours',
//   • engine gating (mode tiers, scene guard, dialogue guard, order) matches
//     the removed engine code,
//   • quest completion rules for explore_school / rooftop_meeting are data.
// ============================================================================

const baseCtx: ConditionContext = {
  flags: [],
  chapter: 1,
  route: 'none',
  beat: 'ch1_explore',
  quests: {},
  relationships: {},
  stats: { academic: 0, violence: 0, diplomacy: 0, reputation: 0 },
  focus: 0,
};

const ctx = (over: Partial<ConditionContext>): ConditionContext => ({ ...baseCtx, ...over });

const engine = (over: { mode?: GameMode; scene?: SceneId; dialogueOpen?: boolean } = {}) => ({
  mode: 'GAMEPLAY' as GameMode,
  scene: 'campus' as SceneId,
  dialogueOpen: false,
  ...over,
});

const fire = (over: Partial<ConditionContext> = {}, eng?: Parameters<typeof engine>[0]) =>
  firstTrigger(STORY_TRIGGERS, ctx(over), engine(eng))?.id ?? null;

describe('story trigger registry: integrity', () => {
  it('registry order = evaluation order: montages first, gameplay triggers after', () => {
    const ids = STORY_TRIGGERS.map((t) => t.id);
    const firstGameplay = ids.findIndex((id) => !STORY_TRIGGERS.find((t) => t.id === id)!.duringCinematic);
    expect(firstGameplay).toBeGreaterThan(0);
    for (let i = 0; i < firstGameplay; i++) {
      expect(STORY_TRIGGERS[i].duringCinematic, `${ids[i]} harus montase`).toBe(true);
    }
  });

  it('every open node exists in DIALOGUE and has deterministic staging + camera', () => {
    for (const t of STORY_TRIGGERS) {
      if (!t.open) continue;
      expect(DIALOGUE[t.open], `${t.id}.open → ${t.open} hilang`).toBeDefined();
      expect(CAM_BY_NODE[t.open], `${t.open} tanpa cameraStage`).toBeDefined();
      expect(REN_STAGING[t.open], `${t.open} tanpa staging Ren`).toBeDefined();
    }
  });

  it('MONTAGE_ROOTS / STORY_TRIGGER_NODES are derived from the registry', () => {
    expect(MONTAGE_ROOTS).toEqual(
      STORY_TRIGGERS.filter((t) => t.duringCinematic && t.open).map((t) => t.open!),
    );
    expect(STORY_TRIGGER_NODES).toEqual(
      STORY_TRIGGERS.flatMap((t) => (t.open ? [t.open] : [])),
    );
  });

  it('SAVE COMPAT: once-flags keep the historical names the engine used', () => {
    // These exact strings live inside old csl-save-v2 payloads. Renaming any
    // of them would make an already-seen montage/scene fire again on load.
    expect(STORY_TRIGGERS.filter((t) => t.once).map((t) => t.once!)).toEqual([
      'bond_lib_done',
      'bond_pts_done',
      'neu_montage_done',
      'osis_montage_done',
      'bad_montage_done',
      'res_montage_done',
      'ch3_parking_started',
      'grad_scene_done',
      'neu_secret_done',
      'neu_secret_done',
      'bad_grad_done',
      'good_grad_done',
      'ch3_rooftop_started',
      'ch2_scene_started',
      'ch2_scene_opened',
    ]);
  });

  it('secret choice point pair shares ONE guard flag (first zone hit locks both)', () => {
    const out = STORY_TRIGGERS.find((t) => t.id === 'secret_out')!;
    const alley = STORY_TRIGGERS.find((t) => t.id === 'secret_alley')!;
    expect(out.once).toBe('neu_secret_done');
    expect(alley.once).toBe('neu_secret_done');
  });

  it('quest-arrival trigger one-shots via its own fire effect (no once flag)', () => {
    const fa = STORY_TRIGGERS.find((t) => t.id === 'find_aris')!;
    expect(fa.once).toBeUndefined();
    expect(fa.fire).toContainEqual({ k: 'quest', id: 'find_aris', state: 'completed', silent: true });
  });
});

describe('story trigger registry: canon scenarios', () => {
  it('montages fire on their beat (+route/chapter), in GAMEPLAY or CINEMATIC', () => {
    expect(fire({ beat: 'ch1_friendship' }, { mode: 'CINEMATIC' })).toBe('montage_lib');
    expect(fire({ beat: 'ch1_pts' }, { mode: 'CINEMATIC' })).toBe('montage_pts');
    expect(fire({ beat: 'ch3_neutral', route: 'neutral' })).toBe('montage_neutral');
    expect(fire({ beat: 'ch3_neutral', route: 'resistance' })).toBeNull(); // wrong route
    expect(fire({ beat: 'ch3_osis', chapter: 3 })).toBe('montage_osis');
    expect(fire({ beat: 'ch3_osis', chapter: 2 })).toBeNull(); // wrong chapter
    expect(fire({ beat: 'ch4_bad_warehouse', route: 'bad' })).toBe('montage_bad');
    expect(fire({ beat: 'ch4_res_search', route: 'resistance' })).toBe('montage_res');
  });

  it('montage once-flags block refire (already-seen montage stays closed)', () => {
    expect(fire({ beat: 'ch1_friendship', flags: ['bond_lib_done'] })).toBeNull();
    expect(fire({ beat: 'ch4_res_search', route: 'resistance', flags: ['res_montage_done'] })).toBeNull();
  });

  it('ambush needs beat + chapter + zone + quest active', () => {
    const over = { beat: 'ch3_parking' as StoryBeat, chapter: 3 as const, quests: { gang_ambush: 'active' } };
    useGame.setState({ currentZone: 'parking' });
    expect(fire(over, { mode: 'GAMEPLAY' })).toBe('ambush_parking');
    expect(fire({ ...over, quests: {} })).toBeNull(); // quest not active
    expect(fire({ ...over, chapter: 2 })).toBeNull();
    useGame.setState({ currentZone: null });
  });

  it('graduations are route/zone/flag gated', () => {
    useGame.setState({ currentZone: 'gate' });
    expect(fire({ beat: 'ch4_neutral_grad', chapter: 4, route: 'neutral' })).toBe('grad_neutral');
    expect(fire({ beat: 'ch4_neutral_grad', chapter: 4, route: 'bad' })).toBeNull();
    expect(fire({ beat: 'ch4_bad_grad', chapter: 4, route: 'bad' })).toBe('grad_bad');
    expect(
      fire({ beat: 'ch4_good_grad', chapter: 4, route: 'resistance', flags: ['restrained_bimo'] }),
    ).toBe('grad_good');
    // without CHOICE 3 "menahan emosi" the good graduation never fires
    expect(fire({ beat: 'ch4_good_grad', chapter: 4, route: 'resistance' })).toBeNull();
    useGame.setState({ currentZone: null });
  });

  it('SECRET CHOICE POINT: street → out, back_alley → secret battle, first hit locks both', () => {
    const secret = { beat: 'ch4_neu_secret' as StoryBeat, chapter: 4 as const, route: 'neutral' as Route };
    // zone condition lives in `when` — the runner passes currentZone through
    // gameStore, so simulate via evalCondition-level: patch currentZone.
    useGame.setState({ currentZone: 'street' });
    expect(fire(secret)).toBe('secret_out');
    useGame.setState({ currentZone: 'back_alley' });
    expect(fire(secret)).toBe('secret_alley');
    // after either branch fired, the shared once-flag blocks BOTH
    useGame.setState({ currentZone: 'street' });
    expect(fire({ ...secret, flags: ['neu_secret_done'] })).toBeNull();
    useGame.setState({ currentZone: null });
  });

  it('rooftop intro is scene-locked to rooftop', () => {
    const over = { beat: 'ch3_rooftop' as StoryBeat, chapter: 3 as const };
    expect(fire(over, { scene: 'rooftop' })).toBe('rooftop_intro');
    expect(fire(over, { scene: 'campus' })).toBeNull();
  });

  it('chapter 2 card + scene fire in order on the back stairs', () => {
    useGame.setState({ currentZone: 'back_stairs' });
    const stairs = { beat: 'ch1_break' as StoryBeat, quests: { aris_incident: 'active' } };
    expect(fire(stairs)).toBe('ch2_card');
    // card fired → beat moved (engine: chapter effect sets ch2_key_error)
    expect(
      fire({ beat: 'ch2_key_error', quests: { aris_incident: 'active' }, flags: ['ch2_scene_started'] }),
    ).toBe('ch2_scene');
    expect(
      fire({ beat: 'ch2_key_error', quests: { aris_incident: 'active' }, flags: ['ch2_scene_opened'] }),
    ).toBeNull();
    useGame.setState({ currentZone: null });
  });

  it('find_aris fires in back_alley OR street while the quest is active (ch4)', () => {
    useGame.setState({ currentZone: 'back_alley' });
    expect(fire({ beat: 'ch4_res_search', chapter: 4, quests: { find_aris: 'active' } })).toBe('find_aris');
    useGame.setState({ currentZone: 'street' });
    expect(fire({ beat: 'ch4_res_search', chapter: 4, quests: { find_aris: 'active' } })).toBe('find_aris');
    useGame.setState({ currentZone: 'gate' });
    expect(fire({ beat: 'ch4_res_search', chapter: 4, quests: { find_aris: 'active' } })).toBeNull();
    useGame.setState({ currentZone: null });
  });
});

describe('story trigger registry: engine gating', () => {
  const t = STORY_TRIGGERS.find((x) => x.id === 'montage_lib')!; // duringCinematic
  const g = STORY_TRIGGERS.find((x) => x.id === 'grad_neutral')!; // gameplay-only

  it('duringCinematic triggers accept GAMEPLAY and CINEMATIC, nothing else', () => {
    const c = ctx({ beat: 'ch1_friendship' });
    expect(triggerEligible(t, c, engine({ mode: 'GAMEPLAY' }))).toBe(true);
    expect(triggerEligible(t, c, engine({ mode: 'CINEMATIC' }))).toBe(true);
    expect(triggerEligible(t, c, engine({ mode: 'DIALOGUE' }))).toBe(false);
    expect(triggerEligible(t, c, engine({ mode: 'COMBAT' }))).toBe(false);
    expect(triggerEligible(t, c, engine({ mode: 'TRANSITION' }))).toBe(false);
  });

  it('gameplay-only triggers reject CINEMATIC', () => {
    useGame.setState({ currentZone: 'gate' });
    const c = ctx({ beat: 'ch4_neutral_grad', chapter: 4, route: 'neutral' });
    expect(triggerEligible(g, c, engine({ mode: 'CINEMATIC' }))).toBe(false);
    expect(triggerEligible(g, c, engine({ mode: 'GAMEPLAY' }))).toBe(true);
    useGame.setState({ currentZone: null });
  });

  it('an open dialogue blocks every trigger', () => {
    expect(triggerEligible(t, ctx({ beat: 'ch1_friendship' }), engine({ dialogueOpen: true }))).toBe(false);
    expect(triggerEligible(g, ctx({ beat: 'ch4_neutral_grad', chapter: 4, route: 'neutral' }), engine({ dialogueOpen: true }))).toBe(false);
  });

  it('default scene is campus; montage scene guard survives async scene swaps', () => {
    expect(triggerEligible(t, ctx({ beat: 'ch1_friendship' }), engine({ scene: 'rooftop' }))).toBe(false);
  });

  it('registry order wins: montage beats are checked before gameplay beats', () => {
    // beat ch1_pts during CINEMATIC must answer montage_pts, not any later trigger
    expect(firstTrigger(STORY_TRIGGERS, ctx({ beat: 'ch1_pts' }), engine({ mode: 'CINEMATIC' }))?.id).toBe('montage_pts');
  });
});

describe('quest completion as data (v0.17.1)', () => {
  beforeEach(() => {
    useGame.setState({ visitedZones: [], clock: { day: 0, minutes: 8 * 60 } });
  });

  it('explore_school completes only after ALL four zones are visited on beat ch1_explore', () => {
    const q = QUEST_BY_ID.explore_school;
    expect(q.completeWhen).toBeDefined();
    const c = ctx({ beat: 'ch1_explore' });
    expect(evalCondition(q.completeWhen!, c)).toBe(false);
    for (const z of ['courtyard', 'canteen', 'field'] as ZoneId[]) {
      useGame.getState().visitZone(z);
    }
    expect(evalCondition(q.completeWhen!, c)).toBe(false); // back_alley missing
    useGame.getState().visitZone('back_alley');
    expect(evalCondition(q.completeWhen!, c)).toBe(true);
    // beat moved on without completion → stays incomplete (original guard)
    expect(evalCondition(q.completeWhen!, ctx({ beat: 'ch1_break' }))).toBe(false);
  });

  it('rooftop_meeting arrival rule = back_stairs zone in chapter 3', () => {
    const q = QUEST_BY_ID.rooftop_meeting;
    expect(q.completeWhen).toBeDefined();
    useGame.setState({ currentZone: 'back_stairs' });
    expect(evalCondition(q.completeWhen!, ctx({ chapter: 3 }))).toBe(true);
    expect(evalCondition(q.completeWhen!, ctx({ chapter: 2 }))).toBe(false);
    useGame.setState({ currentZone: null });
  });
});

describe('new condition/effect primitives (v0.17.1)', () => {
  it('beat condition mirrors ConditionContext.beat', () => {
    expect(evalCondition({ k: 'beat', id: 'ch3_parking' }, ctx({ beat: 'ch3_parking' }))).toBe(true);
    expect(evalCondition({ k: 'beat', id: 'ch3_parking' }, ctx({ beat: 'ch1_explore' }))).toBe(false);
  });

  it('visited condition requires every listed zone (reads live game store)', () => {
    useGame.setState({ visitedZones: ['courtyard'] });
    expect(evalCondition({ k: 'visited', zones: ['courtyard'] }, baseCtx)).toBe(true);
    expect(evalCondition({ k: 'visited', zones: ['courtyard', 'field'] }, baseCtx)).toBe(false);
  });
});
