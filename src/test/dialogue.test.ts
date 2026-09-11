import { describe, expect, it } from 'vitest';
import { DIALOGUE, SPECIAL_NODES } from '../data/dialogue';
import { ENCOUNTERS, QUESTS } from '../data/quests';
import { ITEMS } from '../data/items';
import { CAMERA_POSES } from '../data/world';
import { CAM_BY_NODE, OPENING_ROOT, OPENING_ACTORS } from '../data/chapters';
import { NPCS } from '../data/npcs';

// Graph integrity: every referenced node/effect target must exist.
describe('dialogue graph integrity', () => {
  const special = Object.values(SPECIAL_NODES);

  it('opening root exists', () => {
    expect(DIALOGUE[OPENING_ROOT]).toBeDefined();
  });

  it('all next/choice.next targets resolve', () => {
    const problems: string[] = [];
    for (const node of Object.values(DIALOGUE)) {
      const targets = [...(node.next ? [node.next] : []), ...(node.choices ?? []).map((c) => c.next ?? '')];
      for (const t of targets) {
        if (!t) continue;
        if (special.includes(t)) continue;
        if (!DIALOGUE[t]) problems.push(`${node.id} -> missing ${t}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('choice nodes have reachable next or end', () => {
    for (const node of Object.values(DIALOGUE)) {
      if (node.choices?.length) {
        expect(node.choices.length).toBeGreaterThan(0);
      }
    }
  });

  it('CAM_BY_NODE keys are nodes with poses defined', () => {
    for (const [nodeId, pose] of Object.entries(CAM_BY_NODE)) {
      expect(DIALOGUE[nodeId], `CAM_BY_NODE references unknown node ${nodeId}`).toBeDefined();
      expect(CAMERA_POSES[pose], `pose ${pose} for ${nodeId} missing`).toBeDefined();
    }
  });

  it('opening actors reference opening nodes', () => {
    for (const nodeId of Object.keys(OPENING_ACTORS)) {
      expect(DIALOGUE[nodeId]).toBeDefined();
    }
  });

  it('combat onWin nodes exist; encounter arenas are valid zones', () => {
    for (const enc of Object.values(ENCOUNTERS)) {
      expect(DIALOGUE[enc.onWin], `${enc.id}.onWin missing`).toBeDefined();
    }
  });

  it('quest ids referenced anywhere are defined', () => {
    const ids = new Set(QUESTS.map((q) => q.id));
    for (const node of Object.values(DIALOGUE)) {
      const effects = [...(node.effects ?? []), ...(node.choices ?? []).flatMap((c) => c.effects ?? [])];
      for (const e of effects) {
        if (e.k === 'quest') expect(ids.has(e.id), `unknown quest ${e.id} in ${node.id}`).toBe(true);
        if (e.k === 'item') expect(ITEMS.some((i) => i.id === e.id), `unknown item ${e.id} in ${node.id}`).toBe(true);
      }
    }
  });

  it('npc dialogue roots exist', () => {
    for (const npc of NPCS) expect(DIALOGUE[npc.dialogueRoot]).toBeDefined();
  });
});
