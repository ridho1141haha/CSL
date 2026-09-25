import { beforeEach, describe, expect, it } from 'vitest';
import { applySave, migrateV1, parseSave, saveGame, SAVE_VERSION } from '../game/save';
import { loadGame } from '../game/loadFlow';
import { NPCS } from '../data/npcs';
import { useGame } from '../stores/gameStore';
import { usePlayer } from '../stores/playerStore';
import { useStory } from '../stores/storyStore';
import { useSocial } from '../stores/socialStore';
import { useQuests } from '../stores/questStore';
import { useInventory } from '../stores/inventoryStore';
import { enemyPos } from '../game/runtime';
import type { SaveV2 } from '../game/save';

// v0.17.0 (audit J1): the save system had ZERO tests. These pin the v1
// migration, per-field defaults, the new enum/type hardening, and a full
// save→mutate→load roundtrip. vitest runs in node — a minimal localStorage
// stub backs the storage layer (save.ts wraps every access in try/catch, but
// we provide real behavior so the roundtrip is honest).
const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => void mem.clear(),
};

const resetStores = () => {
  useGame.getState().resetAll();
  usePlayer.setState({ hp: 100, focus: 100, x: 7, z: 29, defeated: false });
  useStory.setState({ chapter: 1, beat: 'ch1_explore', route: 'none', flags: [], choices: {} });
  useSocial.getState().resetAll();
  useQuests.setState({ quests: { explore_school: 'active' } });
  useInventory.setState({ items: ['student_card', 'phone'] });
  enemyPos.active = false;
};

const validV2 = (over: Partial<SaveV2> = {}): SaveV2 => ({
  version: SAVE_VERSION,
  savedAt: 1,
  clock: { day: 1, minutes: 480 },
  visitedZones: ['courtyard'],
  player: { hp: 80, focus: 55, x: 1, z: 2 },
  stats: { academic: 70, violence: 10, diplomacy: 12, reputation: 3 },
  story: { chapter: 2, beat: 'ch2_key_error', route: 'neutral', flags: ['f1'], choices: { a: 'b' } },
  relationships: { aris: 10, siti: -5, bimo: 3, budi: 0 },
  visitedNpc: { aris: true, siti: true, bimo: false, budi: false },
  quests: { explore_school: 'completed' },
  inventory: ['student_card'],
  scene: 'campus',
  ...over,
});

beforeEach(() => {
  mem.clear();
  resetStores();
});

describe('parseSave — version gate', () => {
  it('rejects null / non-objects / unknown versions', () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave('x')).toBeNull();
    expect(parseSave({})).toBeNull(); // version 0
    expect(parseSave({ version: 3, story: {}, player: {} })).toBeNull();
  });

  it('rejects v2 payloads without story or player', () => {
    expect(parseSave({ version: 2, story: {} })).toBeNull();
    expect(parseSave({ version: 2, player: {} })).toBeNull();
  });

  it('accepts a minimal v2 payload (defaults are applied later by applySave)', () => {
    const d = parseSave({ version: 2, story: { chapter: 1, beat: 'ch1_explore', route: 'none' }, player: {} });
    expect(d).not.toBeNull();
  });

  it('routes version 1 payloads into migrateV1', () => {
    const d = parseSave({ version: 1, phase: 'play', flags: [] });
    expect(d).not.toBeNull();
    expect(d?.version).toBe(SAVE_VERSION);
  });
});

describe('migrateV1 — legacy save migration', () => {
  const v1 = (over: Record<string, unknown> = {}) => ({
    version: 1,
    phase: 'play',
    flags: ['helped_aris'] as string[],
    choice: 'defend',
    relationship: { aris: 40, siti: 10, bimo: -20, mystery: 99 },
    player: { x: 3.5, z: 12 },
    quests: { explore_school: 'complete' },
    ...over,
  });

  it('preserves story basics: flags → route flags, choice → o3_choice', () => {
    const d = migrateV1(v1())!;
    expect(d).not.toBeNull();
    expect(d.story.flags).toEqual(['helped_aris', 'opening_complete']);
    expect(d.story.choices).toEqual({ o3_choice: 'defend' });
    expect(d.story.chapter).toBe(1);
    expect(d.story.beat).toBe('ch1_explore');
    expect(d.player.x).toBe(3.5);
    expect(d.player.z).toBe(12);
  });

  it('derives relationships from the NPC registry and drops unknown keys', () => {
    const d = migrateV1(v1())!;
    expect(d.relationships).toEqual({ aris: 40, siti: 10, bimo: -20, budi: 0 });
    expect(Object.keys(d.relationships).sort()).toEqual(NPCS.map((n) => n.id).sort());
  });

  it('v1-era cast starts visited; later additions (Pak Budi) do not', () => {
    const d = migrateV1(v1())!;
    expect(d.visitedNpc).toEqual({ aris: true, siti: true, bimo: true, budi: false });
  });

  it('maps walked_past_aris → ignored_aris; no flag → opening only', () => {
    expect(migrateV1(v1({ flags: ['walked_past_aris'] }))!.story.flags).toEqual(['ignored_aris', 'opening_complete']);
    expect(migrateV1(v1({ flags: ['unrelated'] }))!.story.flags).toEqual(['opening_complete']);
  });

  it('explores quest completion and rejects non-play phases', () => {
    expect(migrateV1(v1())!.quests.explore_school).toBe('completed');
    expect(migrateV1(v1({ quests: {} }))!.quests.explore_school).toBe('active');
    expect(migrateV1(v1({ phase: 'menu' }))).toBeNull();
    expect(migrateV1('junk' as unknown as Record<string, unknown>)).toBeNull();
  });
});

describe('applySave — hardening (audit J1)', () => {
  it('normalizes a corrupted beat/route/chapter to safe defaults', () => {
    applySave(validV2({ story: { chapter: 99 as unknown as 2, beat: 42 as unknown as 'ch2_key_error', route: 'chaos' as unknown as 'neutral', flags: ['k'], choices: {} } }));
    const s = useStory.getState();
    expect(s.beat).toBe('ch1_explore');
    expect(s.route).toBe('none');
    expect(s.chapter).toBe(1);
    expect(s.flags).toEqual(['k']); // unrelated fields still restored
  });

  it('keeps valid enum values untouched', () => {
    applySave(validV2());
    const s = useStory.getState();
    expect(s.chapter).toBe(2);
    expect(s.beat).toBe('ch2_key_error');
    expect(s.route).toBe('neutral');
  });

  it('retired beat ch2_gate migrates to ch1_break with the quest swap', () => {
    applySave(validV2({ story: { chapter: 2, beat: 'ch2_gate' as unknown as 'ch2_key_error', route: 'none', flags: [], choices: {} }, quests: { gate_trouble: 'active' } }));
    const s = useStory.getState();
    expect(s.beat).toBe('ch1_break');
    expect(useQuests.getState().quests.gate_trouble).toBe('completed');
    expect(useQuests.getState().quests.aris_incident).toBe('active');
  });

  it('merges social maps over current state and never loses NPC keys', () => {
    applySave(validV2({ relationships: { aris: 55 } as SaveV2['relationships'] }));
    const rel = useSocial.getState().relationships;
    expect(rel.aris).toBe(55);
    for (const n of NPCS) expect(rel[n.id]).toBeDefined();
  });
});

describe('saveGame / loadGame — full roundtrip', () => {
  it('restores every persisted field and resets combat runtime', () => {
    useStory.getState().setFlag('roundtrip_flag');
    useSocial.getState().addRel('aris', 30);
    useQuests.setState({ quests: { ...useQuests.getState().quests, aris_notes: 'active' } });
    useInventory.setState({ items: ['student_card', 'teh_botol'] });
    usePlayer.setState({ hp: 77, focus: 40, x: -20, z: -3 });
    useGame.setState({ clock: { day: 2, minutes: 915 }, scene: 'rooftop' });
    enemyPos.active = true; // simulate a mid-combat save point

    expect(saveGame('1')).toBe('');

    // mutate AFTER saving — load must roll these back
    useStory.getState().setFlag('post_save_noise');
    useSocial.getState().addRel('aris', 100);
    usePlayer.setState({ x: 99, z: 99 });
    useGame.setState({ scene: 'campus' });

    expect(loadGame('1')).toBe('');
    expect(useStory.getState().flags).toContain('roundtrip_flag');
    expect(useStory.getState().flags).not.toContain('post_save_noise');
    expect(useSocial.getState().relationships.aris).toBe(30);
    expect(useQuests.getState().quests.aris_notes).toBe('active');
    expect(useInventory.getState().items).toEqual(['student_card', 'teh_botol']);
    expect(usePlayer.getState().hp).toBe(77);
    expect(usePlayer.getState().x).toBe(-20);
    expect(usePlayer.getState().z).toBe(-3);
    expect(useGame.getState().clock).toEqual({ day: 2, minutes: 915 });
    expect(useGame.getState().scene).toBe('rooftop');
    expect(useGame.getState().mode).toBe('GAMEPLAY');
    expect(enemyPos.active).toBe(false);
  });

  it('distinguishes an empty slot from a corrupt payload', () => {
    expect(loadGame('2')).toBe('Slot kosong.');
    saveGame('3');
    mem.set('csl-save-v2:3', '{not json');
    expect(loadGame('3')).toBe('Data save tidak valid.');
  });
});
