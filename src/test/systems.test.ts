import { describe, expect, it } from 'vitest';
import { clampRel, relLabel } from '../game/systems/relationship';
import { repLabel } from '../game/systems/reputation';
import { advance, formatHhmm, periodFor, clockLabel } from '../game/systems/time';
import { scoreStudy } from '../game/systems/study';
import { resolveEnding } from '../game/systems/endingResolver';
import { evalCondition } from '../game/systems/conditions';
import type { Condition } from '../types';
import { parseSave, migrateV1 } from '../game/save';

describe('relationship', () => {
  it('clamps to [-100, 100]', () => {
    expect(clampRel(150)).toBe(100);
    expect(clampRel(-150)).toBe(-100);
    expect(clampRel(NaN)).toBe(0);
  });
  it('labels tiers correctly', () => {
    expect(relLabel(-80)).toBe('HOSTILE');
    expect(relLabel(-20)).toBe('SUSPICIOUS');
    expect(relLabel(0)).toBe('NEUTRAL');
    expect(relLabel(30)).toBe('ACQUAINTANCE');
    expect(relLabel(60)).toBe('FRIEND');
    expect(relLabel(90)).toBe('CLOSE FRIEND');
  });
});

describe('reputation', () => {
  it('starts UNKNOWN', () => {
    expect(repLabel(0, { violence: 0, diplomacy: 0 })).toBe('UNKNOWN');
  });
  it('respected vs troublemaker by behavior lean', () => {
    expect(repLabel(50, { violence: 10, diplomacy: 40 })).toBe('RESPECTED');
    expect(repLabel(50, { violence: 40, diplomacy: 10 })).toBe('TROUBLEMAKER');
  });
  it('feared at high points + violence', () => {
    expect(repLabel(80, { violence: 60, diplomacy: 10 })).toBe('FEARED');
  });
});

describe('time', () => {
  it('formats hh:mm', () => {
    expect(formatHhmm(7 * 60 + 5)).toBe('07:05');
    expect(formatHhmm(14 * 60)).toBe('14:00');
  });
  it('advances and rolls days', () => {
    expect(advance({ day: 0, minutes: 23 * 60 }, 90)).toEqual({ day: 1, minutes: 30 });
  });
  it('loops the school week', () => {
    expect(advance({ day: 4, minutes: 20 * 60 }, 300).day).toBe(0);
  });
  it('periods map to schedule', () => {
    expect(periodFor(7 * 60).id).toBe('arrive');
    expect(periodFor(10 * 60 + 10).id).toBe('break');
    expect(periodFor(12 * 60 + 30).id).toBe('lunch');
    expect(periodFor(15 * 60).id).toBe('after');
  });
  it('clock label includes day and time', () => {
    expect(clockLabel({ day: 0, minutes: 7 * 60 + 12 })).toContain('SENIN');
    expect(clockLabel({ day: 0, minutes: 7 * 60 + 12 })).toContain('07:12');
  });
});

describe('study scoring', () => {
  it('rewards correct answers', () => {
    const r = scoreStudy(5, 5);
    expect(r.academicDelta).toBe(15);
    expect(r.focusDelta).toBe(10);
  });
  it('penalizes misses slightly', () => {
    const r = scoreStudy(2, 5);
    expect(r.academicDelta).toBe(6);
    expect(r.focusDelta).toBe(4 - 3);
  });
  it('clamps input', () => {
    expect(scoreStudy(9, 5).correct).toBe(5);
  });
});

describe('ending resolver (canon GARIS MERAH)', () => {
  const base = { flags: [], stats: { academic: 70, violence: 5, diplomacy: 8, reputation: 20 }, focus: 50, relationships: {} };
  it('bad route → Tunduk Pada Kekuasaan', () => {
    const e = resolveEnding({ ...base, route: 'bad' });
    expect(e.id).toBe('bad');
    expect(e.title).toBe('Tunduk Pada Kekuasaan');
  });
  it('resistance + restrained_bimo → True (Lulus Bersama)', () => {
    const e = resolveEnding({ ...base, route: 'resistance', flags: ['restrained_bimo'] });
    expect(e.id).toBe('true');
    expect(e.title).toBe('Lulus Bersama');
  });
  it('resistance + brutal_bimo → Bitter (Rantai Dendam)', () => {
    const e = resolveEnding({ ...base, route: 'resistance', flags: ['brutal_bimo'] });
    expect(e.id).toBe('bitter');
    expect(e.title).toBe('Rantai Dendam');
  });
  it('v0.7.0: neutral route → Lulus Tanpa Nama', () => {
    const e = resolveEnding({ ...base, route: 'neutral' });
    expect(e.id).toBe('neutral');
    expect(e.title).toBe('Lulus Tanpa Nama');
  });
  // v0.15.0 — doc SUB-CABANG 1B: dua SECRET BAD ENDING rute netral
  it('v0.15.0: neutral + secret battle kalah → Bonyok Tanpa Nama', () => {
    const e = resolveEnding({ ...base, route: 'neutral', flags: ['secret_fought_lost'] });
    expect(e.id).toBe('neutral_lost');
    expect(e.title).toBe('Bonyok Tanpa Nama');
  });
  it('v0.15.0: neutral + secret battle menang → Kemenangan Terlambat', () => {
    const e = resolveEnding({ ...base, route: 'neutral', flags: ['secret_fought_won'] });
    expect(e.id).toBe('neutral_won');
    expect(e.title).toBe('Kemenangan Terlambat');
  });
  it('v0.15.0: secret flag menang atas route neutral biasa (urutan resolusi)', () => {
    const e = resolveEnding({ ...base, route: 'neutral', flags: ['secret_fought_won', 'secret_fought_lost'] });
    expect(['neutral_lost', 'neutral_won']).toContain(e.id);
  });
});

describe('conditions', () => {
  const ctx = {
    flags: ['helped_aris'],
    chapter: 2,
    route: 'none',
    quests: { explore_school: 'completed' },
    relationships: { aris: 10 },
    stats: { academic: 70, violence: 5, diplomacy: 8, reputation: 0 },
    focus: 50,
  };
  it('flag checks with not', () => {
    expect(evalCondition({ k: 'flag', id: 'helped_aris' }, ctx)).toBe(true);
    expect(evalCondition({ k: 'flag', id: 'helped_aris', not: true }, ctx)).toBe(false);
  });
  it('and-composition', () => {
    expect(evalCondition({ k: 'and', all: [{ k: 'flag', id: 'helped_aris' }, { k: 'chapter', id: 2 }] }, ctx)).toBe(true);
    expect(evalCondition({ k: 'and', all: [{ k: 'flag', id: 'helped_aris' }, { k: 'chapter', id: 3 }] }, ctx)).toBe(false);
  });
  // v0.17.0 combinators (audit H1)
  it('any-composition is an inclusive OR over nested conditions', () => {
    expect(evalCondition({ k: 'any', of: [{ k: 'flag', id: 'nope' }, { k: 'flag', id: 'helped_aris' }] }, ctx)).toBe(true);
    expect(evalCondition({ k: 'any', of: [{ k: 'flag', id: 'nope' }, { k: 'chapter', id: 3 }] }, ctx)).toBe(false);
    expect(evalCondition({ k: 'any', of: [] }, ctx)).toBe(false); // empty OR = false
  });
  it('not negates any nested condition (including combinators)', () => {
    expect(evalCondition({ k: 'not', not: { k: 'flag', id: 'helped_aris' } }, ctx)).toBe(false);
    expect(evalCondition({ k: 'not', not: { k: 'flag', id: 'nope' } }, ctx)).toBe(true);
    expect(evalCondition({ k: 'not', not: { k: 'any', of: [{ k: 'flag', id: 'nope' }] } }, ctx)).toBe(true);
  });
  it('combinators nest arbitrarily (the alley_check quest rule shape)', () => {
    const rule: Condition = { k: 'any', of: [{ k: 'zone', id: 'back_alley' }, { k: 'and', all: [{ k: 'flag', id: 'helped_aris' }, { k: 'not', not: { k: 'chapterMin', id: 3 } }] }] };
    expect(evalCondition(rule, ctx)).toBe(true);
  });
  it('quest + rel checks', () => {
    expect(evalCondition({ k: 'quest', id: 'explore_school', state: 'completed' }, ctx)).toBe(true);
    expect(evalCondition({ k: 'relAbove', target: 'aris', v: 5 }, ctx)).toBe(true);
  });
});

describe('save v2', () => {
  it('rejects garbage', () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave('x')).toBeNull();
    expect(parseSave({})).toBeNull();
  });
  it('migrates a v1 play-phase save', () => {
    const v1 = {
      phase: 'play',
      flags: ['helped_aris'],
      choice: 'help_aris',
      relationship: { aris: 2, siti: 1 },
      player: { x: 3, z: 4 },
      quests: { explore_school: 'complete' },
    };
    const v2 = migrateV1(v1);
    expect(v2).not.toBeNull();
    expect(v2!.story.flags).toContain('helped_aris');
    expect(v2!.story.choices.o3_choice).toBe('help_aris');
    expect(v2!.relationships.aris).toBe(2);
    expect(v2!.version).toBe(2);
  });
  it('v1 pre-play save restarts fresh', () => {
    expect(migrateV1({ phase: 'menu', flags: [] })).toBeNull();
  });
});
