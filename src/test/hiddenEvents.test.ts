import { describe, expect, it, beforeEach } from 'vitest';
import { pickZoneEvent, pickNpcEvent, discoverEvent, isDiscovered } from '../game/systems/hiddenEvents';
import { HIDDEN_EVENTS, HIDDEN_EVENT_FLAG } from '../data/hiddenEvents';
import { useStory } from '../stores/storyStore';
import { useGame } from '../stores/gameStore';
import { useSocial } from '../stores/socialStore';
import { useQuests } from '../stores/questStore';
import { useStats } from '../stores/statsStore';
import { usePlayer } from '../stores/playerStore';

// Hidden-event system (mentor feedback #5): data-driven discovery with
// zone / npc / period / flag / chapter / talk-count requirements.

const reset = () => {
  useStory.getState().resetAll();
  useGame.getState().resetAll();
  useSocial.getState().resetAll();
  useQuests.getState().resetAll();
  useStats.getState().resetAll();
  usePlayer.getState().resetAll();
  useGame.getState().setPhase('play');
  useGame.getState().setMode('GAMEPLAY');
};

describe('hidden events: data integrity', () => {
  it('every event has a unique id and its dialogue node exists', async () => {
    const ids = new Set<string>();
    for (const e of HIDDEN_EVENTS) {
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
      const { DIALOGUE } = await import('../data/dialogue');
      expect(DIALOGUE[e.dialogue], `${e.id} dialogue node missing`).toBeDefined();
    }
  });

  it('discovery flag prefix is deterministic', () => {
    expect(HIDDEN_EVENT_FLAG('he_alley_mark')).toBe('he_alley_mark');
  });
});

describe('zone-triggered events', () => {
  beforeEach(reset);

  it('alley marking requires chapter >= 2', () => {
    useStory.getState().setChapter(1);
    useGame.getState().setCurrentZone('back_alley');
    expect(pickZoneEvent('back_alley')).toBeNull();
    useStory.getState().setChapter(2);
    expect(pickZoneEvent('back_alley')?.id).toBe('he_alley_mark');
  });

  it('period gate: field gloves only appear after school', () => {
    useStory.getState().setChapter(2);
    useGame.getState().setCurrentZone('field');
    useGame.setState({ clock: { day: 0, minutes: 10 * 60 + 15 } }); // break
    expect(pickZoneEvent('field')).toBeNull();
    useGame.setState({ clock: { day: 0, minutes: 15 * 60 } }); // after school
    expect(pickZoneEvent('field')?.id).toBe('he_field_gloves');
  });

  it('classroom desk carving requires the helped_aris choice', () => {
    useGame.getState().setCurrentZone('classroom');
    expect(pickZoneEvent('classroom')).toBeNull();
    useStory.getState().setFlag('helped_aris');
    expect(pickZoneEvent('classroom')?.id).toBe('he_classroom_desk');
  });

  it('one-time: discovered events never fire again', () => {
    useStory.getState().setChapter(2);
    useGame.getState().setCurrentZone('back_alley');
    const ev = pickZoneEvent('back_alley');
    expect(ev).not.toBeNull();
    discoverEvent(ev!);
    expect(isDiscovered(ev!)).toBe(true);
    expect(pickZoneEvent('back_alley')).toBeNull();
  });

  it('does not fire outside gameplay (cinematic/combat guard)', () => {
    useStory.getState().setChapter(2);
    useGame.getState().setCurrentZone('back_alley');
    useGame.getState().setMode('CINEMATIC');
    expect(pickZoneEvent('back_alley')).toBeNull();
    useGame.getState().setMode('GAMEPLAY');
    expect(pickZoneEvent('back_alley')).not.toBeNull();
  });
});

describe('npc-triggered events', () => {
  beforeEach(reset);

  it('bimo warning requires chapter >= 2 + after school', () => {
    useStory.getState().setChapter(1);
    useGame.getState().advanceTime(15 * 60);
    expect(pickNpcEvent('bimo')).toBeNull();
    useStory.getState().setChapter(2);
    expect(pickNpcEvent('bimo')?.id).toBe('he_bimo_warning');
  });

  it('budi story only after school', () => {
    useGame.setState({ clock: { day: 0, minutes: 8 * 60 } }); // class period
    expect(pickNpcEvent('budi')).toBeNull();
    useGame.setState({ clock: { day: 0, minutes: 15 * 60 } }); // after school
    expect(pickNpcEvent('budi')?.id).toBe('he_budi_late');
  });
});
