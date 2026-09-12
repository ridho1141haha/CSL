import { describe, expect, it } from 'vitest';
import {
  CHECKPOINT_NODES,
  DIALOGUE,
  MONTAGE_ROOTS,
  SPECIAL_NODES,
  STORY_TRIGGER_NODES,
  ZONE_FLAVOR,
} from '../data/dialogue';
import { ENCOUNTERS } from '../data/quests';
import { HIDDEN_EVENTS } from '../data/hiddenEvents';
import { OPENING_ROOT } from '../data/chapters';
import { NPCS } from '../data/npcs';
import { BEAT_ENCOUNTER } from '../stores/dialogueStore';

// Story-flow regression tests. The dialogue graph is wired to the runtime from
// several directions (StoryDirector triggers, montage roots, combat onWin,
// NPC roots, hidden events, zone flavor). A broken link in any direction used
// to produce dead content or a permanent soft-lock (see CHANGELOG 0.2.1).

describe('story flow: node reachability', () => {
  // Entry points mirror the runtime wiring: StoryDirector.open(...) targets,
  // montage roots opened after the ch3 choice, finishCombatWin onWin nodes,
  // NPC interaction roots, hidden-event discovery nodes and per-zone flavor.
  const entryPoints = [
    OPENING_ROOT,
    ...MONTAGE_ROOTS,
    ...STORY_TRIGGER_NODES,
    ...Object.values(ENCOUNTERS).map((e) => e.onWin),
    ...NPCS.map((n) => n.dialogueRoot),
    ...Object.values(ZONE_FLAVOR),
    ...HIDDEN_EVENTS.map((e) => e.dialogue),
  ];

  it('all entry points exist', () => {
    for (const id of entryPoints) {
      expect(DIALOGUE[id], `entry point ${id} missing from DIALOGUE`).toBeDefined();
    }
  });

  it('zone flavor map points at real nodes for every non-class zone', () => {
    // every mapped flavor node must exist (StoryDirector opens it on entry)
    for (const nodeId of Object.values(ZONE_FLAVOR)) {
      expect(DIALOGUE[nodeId], `zone flavor node ${nodeId} missing`).toBeDefined();
    }
  });

  it('every dialogue node is reachable from some entry point (no dead content)', () => {
    const seen = new Set<string>();
    const walk = (id: string) => {
      if (seen.has(id) || SPECIAL_NODES.combat === id || SPECIAL_NODES.study === id) return;
      const node = DIALOGUE[id];
      if (!node) return;
      seen.add(id);
      if (node.next) walk(node.next);
      for (const c of node.choices ?? []) if (c.next) walk(c.next);
    };
    for (const id of entryPoints) walk(id);
    const orphans = Object.keys(DIALOGUE).filter((id) => !seen.has(id));
    expect(orphans, `nodes unreachable from any runtime entry point: ${orphans.join(', ')}`).toEqual([]);
  });
});

describe('story flow: route + ending reachability (canon)', () => {
  const effectsOf = (id: string) => DIALOGUE[id]?.effects ?? [];
  const choice = (nodeId: string, choiceId: string) => {
    const c = DIALOGUE[nodeId]?.choices?.find((x) => x.id === choiceId);
    expect(c, `choice ${choiceId} on ${nodeId}`).toBeDefined();
    return c!;
  };
  const hasEffect = (effects: { k: string }[], k: string) => effects.some((e) => e.k === k);

  it('ch3 choice sets the two canon routes', () => {
    expect(choice('ch3_choice', 'accept_bimo').effects).toContainEqual({ k: 'route', id: 'bad' });
    expect(choice('ch3_choice', 'reject_bimo').effects).toContainEqual({ k: 'route', id: 'resistance' });
  });

  it('each route sets its montage beat so StoryDirector can open the montage', () => {
    // montage blocks fire on beat ch4_bad_warehouse / ch4_res_search
    expect(effectsOf('ch3_accept_2')).toContainEqual({ k: 'beat', id: 'ch4_bad_warehouse' });
    expect(effectsOf('ch3_reject_2')).toContainEqual({ k: 'beat', id: 'ch4_res_search' });
    for (const root of MONTAGE_ROOTS) expect(DIALOGUE[root]).toBeDefined();
  });

  it('encounter beats are wired: every StoryDirector combat trigger beat maps to an encounter', () => {
    // the REAL map used by dialogueStore.advance() when a node hits __combat__
    for (const [beat, encounterId] of Object.entries(BEAT_ENCOUNTER)) {
      expect(
        Object.values(ENCOUNTERS).some((e) => e.id === encounterId),
        `beat ${beat} maps to unknown encounter ${encounterId}`,
      ).toBe(true);
    }
    // and every combat-entry beat is covered by it (no accidental gate_fight fallback)
    expect(Object.keys(BEAT_ENCOUNTER).sort()).toEqual(['ch2_gate', 'ch4_bad_warehouse', 'ch4_res_alley']);
  });

  it('BAD ending fires from the warehouse raid chain', () => {
    expect(hasEffect(effectsOf('ch4_bad_raid_5'), 'ending')).toBe(true);
  });

  it('TRUE ending: helping Aris in the alley sets the resolver flag + ending', () => {
    expect(choice('ch4_res_choice', 'help_aris_final').effects).toContainEqual({ k: 'flag', id: 'helped_aris_final' });
    expect(hasEffect(effectsOf('ch4_res_win_4'), 'ending')).toBe(true);
  });

  it('BITTER ending: walking away ends the story without the TRUE flag', () => {
    expect(choice('ch4_res_choice', 'walk_away_final').effects).toContainEqual({ k: 'flag', id: 'ignored_aris_final' });
    expect(hasEffect(effectsOf('ch4_res_away_2'), 'ending')).toBe(true);
  });
});

describe('story flow: auto-save checkpoints', () => {
  it('chapter/route transitions persist a checkpoint', () => {
    for (const id of CHECKPOINT_NODES) {
      const effects = DIALOGUE[id]?.effects ?? [];
      expect(
        effects.some((e) => e.k === 'save'),
        `${id} must carry a { k: 'save' } checkpoint effect (death recovery)`,
      ).toBe(true);
    }
  });

  it('combat win nodes open a follow-up dialogue (no silent victory)', () => {
    for (const enc of Object.values(ENCOUNTERS)) {
      expect(DIALOGUE[enc.onWin], `${enc.id}.onWin`).toBeDefined();
    }
  });
});
