import { describe, expect, it, beforeEach } from 'vitest';
import {
  acting,
  resolveCast,
  applyDialogueActing,
  clearDialogueActing,
  tickActing,
} from '../game/systems/acting';
import { useStory } from '../stores/storyStore';
import { useDialogue } from '../stores/dialogueStore';
import { playerPos, npcPositions, actorPositions } from '../game/runtime';

// Dialogue acting system (mentor feedback #3): cast resolution, gaze targets,
// talking flags, gesture/nod timers. Registry is reset between tests.

const reset = () => {
  useStory.getState().resetAll();
  useDialogue.getState().reset();
  for (const k of Object.keys(acting)) delete acting[k];
  playerPos.x = 7;
  playerPos.z = 29;
  npcPositions.aris = { x: 7.5, z: 28 };
  delete npcPositions.bimo;
  for (const k of Object.keys(actorPositions)) delete actorPositions[k];
};

describe('resolveCast', () => {
  beforeEach(reset);

  it('npc speaker → ren listener', () => {
    const c = resolveCast('aris', 'ARIS', 'worried');
    expect(c.speaker).toBe('aris');
    expect(c.listener).toBe('ren');
    expect(c.energy).toBeGreaterThan(0.4); // worried is expressive
  });

  it('ren speaker → nearest npc listener', () => {
    const c = resolveCast('ren', 'REN', 'tense');
    expect(c.speaker).toBe('ren');
    expect(c.listener).toBe('aris'); // 0.5m away, inside 4.5m radius
  });

  it('narrator lines produce no cast (idle only)', () => {
    const c = resolveCast('narrator', 'NARATOR', undefined);
    expect(c.speaker).toBeNull();
    expect(c.listener).toBeNull();
  });

  it('bully portrait resolves to a placed story actor', () => {
    actorPositions['bully1'] = { x: -7.6, z: 29.6 };
    const c = resolveCast('bully', 'BULLY', 'tense');
    expect(c.speaker).toBe('bully1');
  });
});

describe('applyDialogueActing', () => {
  beforeEach(reset);

  it('speaker talks toward listener, listener gazes back', () => {
    applyDialogueActing(resolveCast('aris', 'ARIS', 'firm'));
    expect(acting['aris'].talking).toBe(true);
    expect(acting['aris'].gazeX).toBeCloseTo(playerPos.x, 2);
    expect(acting['ren'].talking).toBe(false);
    expect(acting['ren'].gazeX).toBeCloseTo(npcPositions.aris.x, 2);
  });

  it('clearDialogueActing resets everyone', () => {
    applyDialogueActing(resolveCast('aris', 'ARIS', 'firm'));
    clearDialogueActing();
    expect(acting['aris'].talking).toBe(false);
    expect(Number.isNaN(acting['aris'].gazeX)).toBe(true);
  });
});

describe('tickActing', () => {
  beforeEach(reset);

  it('talking entities schedule gestures and never nods', () => {
    const s = resolveCast('aris', 'ARIS', 'tense');
    applyDialogueActing(s);
    const a = acting['aris'];
    // fast-forward cooldown
    for (let i = 0; i < 600; i++) tickActing(a, 0.016, false);
    expect(a.talkPhase).toBeGreaterThan(0);
    expect(a.nodT).toBe(-1);
  });

  it('listeners nod occasionally and never talk', () => {
    applyDialogueActing(resolveCast('aris', 'ARIS', 'firm'));
    const ren = acting['ren'];
    let nodded = false;
    for (let i = 0; i < 900; i++) {
      tickActing(ren, 0.016, false);
      if (ren.nodT >= 0) nodded = true;
    }
    expect(nodded).toBe(true);
    expect(ren.talking).toBe(false);
  });

  it('moving entities do not gesture (locomotion wins over acting)', () => {
    const s = resolveCast('aris', 'ARIS', 'tense');
    applyDialogueActing(s);
    const a = acting['aris'];
    for (let i = 0; i < 600; i++) tickActing(a, 0.016, true);
    expect(a.gesture).toBe(-1);
    expect(a.talkPhase).toBe(0);
  });
});

describe('dialogueStore ↔ acting integration', () => {
  beforeEach(reset);

  it('opening a node marks the speaker as talking', () => {
    useDialogue.getState().open('aris_gate_1');
    expect(acting['aris']).toBeDefined();
    expect(acting['aris'].talking).toBe(true);
    useDialogue.getState().close();
    expect(acting['aris'].talking).toBe(false);
  });
});
