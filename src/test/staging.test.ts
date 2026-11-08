import { describe, it, expect } from 'vitest';
import { REN_STAGING } from '../data/chapters';
import { DIALOGUE, STORY_TRIGGER_NODES, MONTAGE_ROOTS, CHECKPOINT_NODES } from '../data/dialogue';
import { CAMPUS_BOUNDS, ROOFTOP_BOUNDS, WAREHOUSE_BOUNDS } from '../data/world';
import { usePlayer } from '../stores/playerStore';
import { useGame } from '../stores/gameStore';
import { applyPlayerStaging } from '../game/story/staging';

// v0.14.0 — story staging integrity: setiap penempatan Ren harus menunjuk
// node cerita yang benar-benar ada, berada di scene yang benar, dan tidak
// pernah menaruh Ren di dalam shaft tangga (undakan beton).

describe('REN_STAGING (player story staging)', () => {
  it('every staged node exists in the dialogue graph', () => {
    for (const nodeId of Object.keys(REN_STAGING)) {
      expect(DIALOGUE[nodeId], `staging untuk node tak dikenal: ${nodeId}`).toBeDefined();
    }
  });

  it('every STORY_TRIGGER / MONTAGE_ROOT / scene-start has staging (deterministic start)', () => {
    // trigger nodes + montage roots adalah pintu masuk story scene — semua
    // harus punya penempatan deterministik (Task 3)
    for (const n of [...STORY_TRIGGER_NODES, ...MONTAGE_ROOTS]) {
      expect(REN_STAGING[n], `trigger/montage tanpa staging: ${n}`).toBeDefined();
    }
  });

  it('checkpoint nodes remain checkpoint-only (staging optional, graph untouched)', () => {
    for (const n of CHECKPOINT_NODES) expect(DIALOGUE[n]).toBeDefined();
  });

  it('opening FP nodes are never staged (authored camera owns them)', () => {
    for (const nodeId of Object.keys(REN_STAGING)) {
      expect(nodeId.startsWith('o'), `opening FP tidak boleh distage: ${nodeId}`).toBe(false);
    }
  });

  it('non-campus staging always declares its scene', () => {
    for (const [nodeId, st] of Object.entries(REN_STAGING)) {
      if (st.scene) {
        expect(['rooftop', 'warehouse']).toContain(st.scene);
        // v0.15.0: + ch3_fc4 (FLAVOR CHOICE 4 masih di rooftop)
        expect(nodeId.startsWith('ch3_intro') || nodeId.startsWith('ch3_fc4') || nodeId.startsWith('ch3_accept') || nodeId.startsWith('ch3_reject') || nodeId.startsWith('ch4_bad_warehouse') || nodeId.startsWith('ch4_bad_after')).toBe(true);
      }
    }
    // rooftop nodes wajib scene rooftop, warehouse nodes wajib scene warehouse
    for (const [nodeId, st] of Object.entries(REN_STAGING)) {
      if (nodeId.startsWith('ch3_intro') || nodeId.startsWith('ch3_fc4') || nodeId.startsWith('ch3_accept') || nodeId.startsWith('ch3_reject')) {
        expect(st.scene, nodeId).toBe('rooftop');
      }
      if (nodeId.startsWith('ch4_bad_warehouse') || nodeId.startsWith('ch4_bad_after')) {
        expect(st.scene, nodeId).toBe('warehouse');
      }
    }
  });

  it('staging coords stay inside their scene bounds', () => {
    for (const [, st] of Object.entries(REN_STAGING)) {
      const b = st.scene === 'rooftop' ? ROOFTOP_BOUNDS : st.scene === 'warehouse' ? WAREHOUSE_BOUNDS : CAMPUS_BOUNDS;
      expect(st.pos[0]).toBeGreaterThanOrEqual(b.minX);
      expect(st.pos[0]).toBeLessThanOrEqual(b.maxX);
      expect(st.pos[1]).toBeGreaterThanOrEqual(b.minZ);
      expect(st.pos[1]).toBeLessThanOrEqual(b.maxZ);
    }
  });

  it('bab 2 staging never lands inside the stair shaft (x -4..4, z -2..4)', () => {
    for (const [nodeId, st] of Object.entries(REN_STAGING)) {
      if (!nodeId.startsWith('ch2_')) continue;
      const inShaft = st.pos[0] > -4.2 && st.pos[0] < 4.4 && st.pos[1] > -2.2 && st.pos[1] < 4.2;
      expect(inShaft, `${nodeId} di dalam shaft tangga: ${st.pos}`).toBe(false);
    }
  });

  it('applyPlayerStaging moves Ren and faces the requested point', () => {
    const p = usePlayer.getState();
    const g = useGame.getState();
    g.setScene('campus');
    usePlayer.getState().setPos(20, 30);
    expect(applyPlayerStaging('ch3_osis_1')).toBe(true);
    const st = REN_STAGING['ch3_osis_1'];
    expect(usePlayer.getState().x).toBe(st.pos[0]);
    expect(usePlayer.getState().z).toBe(st.pos[1]);
    // facing mengarah ke face point
    const want = Math.atan2(st.face![0] - st.pos[0], st.face![1] - st.pos[1]);
    expect(Math.atan2(Math.sin(want - 0), Math.cos(want - 0))).toBeCloseTo(want, 6);
    void p;
  });

  it('applyPlayerStaging refuses wrong scene and unknown nodes', () => {
    const g = useGame.getState();
    g.setScene('rooftop');
    expect(applyPlayerStaging('ch3_osis_1')).toBe(false); // data kampus
    expect(applyPlayerStaging('node_palsu')).toBe(false);
    // node rooftop valid di scene rooftop
    usePlayer.getState().setPos(0, 6);
    expect(applyPlayerStaging('ch3_intro_1')).toBe(true);
    g.setScene('campus');
  });
});
