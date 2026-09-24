import { create } from 'zustand';
import { getDialogue, SPECIAL_NODES } from '../data/dialogue';
import { ENCOUNTERS } from '../data/quests';
import { applyEffects } from '../game/systems/effects';
import { resolveCast, applyDialogueActing, clearDialogueActing } from '../game/systems/acting';
import { useGame } from './gameStore';
import { useStory } from './storyStore';
import { useCombat } from './combatStore';
import type { Choice } from '../types';

// Encounter selection by story beat when a dialogue reaches __combat__
// (exported: asserted by test/storyFlow.test.ts)
// v0.7.0: ch2_gate → ch2_key_error + stair_fight (Bab 2 "Kesalahan Kecil Aris")
// v0.11.0 GARIS MERAH: ch3_parking → parking_fight (FIGHT 2), ch4_res_bimo →
// bimo_fight (FIGHT 3 FINAL BOSS Ren vs Bimo)
export const BEAT_ENCOUNTER: Record<string, string> = {
  ch2_key_error: 'stair_fight',
  ch3_parking: 'parking_fight',
  ch4_bad_warehouse: 'warehouse_fight',
  ch4_res_alley: 'alley_fight',
  ch4_res_bimo: 'bimo_fight',
  // v0.15.0: secret battle rute netral (doc SUB-CABANG 1B) — kalah/menang
  // dua-duanya hasil cerita (onLose → "Bonyok Tanpa Nama", onWin →
  // "Kemenangan Terlambat").
  ch4_neu_secret: 'secret_fight',
};

type Store = {
  nodeId: string | null;
  awaitingChoice: boolean;

  open: (id: string, cinematic?: boolean) => void;
  advance: () => void;
  choose: (choice: Choice) => void;
  close: () => void;
  reset: () => void;
};

// Mentor feedback #3: every node change updates the acting registry (who
// talks, who listens, emotional energy) so the procedural characters act the
// conversation. One funnel — open/advance/choose all pass through here.
function actNode(nodeId: string | null) {
  const node = nodeId ? getDialogue(nodeId) : null;
  if (!node) {
    clearDialogueActing();
    return;
  }
  applyDialogueActing(resolveCast(node.portrait, node.speaker, node.emotion));
}

export const useDialogue = create<Store>((set, get) => ({
  nodeId: null,
  awaitingChoice: false,

  open: (id, cinematic = false) => {
    const game = useGame.getState();
    game.setMode(cinematic ? 'CINEMATIC' : 'DIALOGUE');
    set({ nodeId: id, awaitingChoice: false });
    actNode(id);
  },

  advance: () => {
    const { nodeId, awaitingChoice } = get();
    if (!nodeId || awaitingChoice) return;
    const node = getDialogue(nodeId);
    if (!node) return void get().close();

    if (node.effects) applyEffects(node.effects);

    if (node.choices && node.choices.length) {
      set({ awaitingChoice: true });
      return;
    }
    if (node.end || !node.next) return void get().close();
    if (node.next === SPECIAL_NODES.combat) {
      const beat = useStory.getState().beat;
      // v0.15.2: fail-safe — dulu fallback 'gate_fight' yang SUDAH DIHAPUS
      // dari ENCOUNTERS sejak v0.7.0. start() gagal diam-diam → mode COMBAT
      // tanpa phase 'fighting' → Player membekukan pemain selamanya (stuck
      // ga bisa jalan, tanpa musuh, tanpa jalan keluar). Kini beat tanpa
      // encounter valid TIDAK memulai combat dan pulih ke GAMEPLAY.
      const encounter = BEAT_ENCOUNTER[beat];
      get().close();
      if (encounter && ENCOUNTERS[encounter]) {
        applyEffects([{ k: 'combat', encounter }]);
      } else {
        console.warn(`[combat] beat "${beat}" tidak punya encounter valid — combat dilewati`);
        useGame.getState().setMode('GAMEPLAY');
      }
      return;
    }
    if (node.next === SPECIAL_NODES.study) {
      get().close();
      clearDialogueActing();
      useGame.getState().setMode('STUDY');
      return;
    }
    set({ nodeId: node.next });
    actNode(node.next);
  },

  choose: (choice) => {
    const { nodeId } = get();
    if (!nodeId) return;
    const node = getDialogue(nodeId);
    if (!node || !node.choices?.some((c) => c.id === choice.id)) return;
    useStory.getState().recordChoice(nodeId, choice.id);
    if (choice.effects) applyEffects(choice.effects);
    set({ awaitingChoice: false });
    if (choice.next) {
      set({ nodeId: choice.next });
      actNode(choice.next);
    } else {
      get().close();
    }
  },

  close: () => {
    set({ nodeId: null, awaitingChoice: false });
    clearDialogueActing();
    const game = useGame.getState();
    // DIALOGUE returns to gameplay. CINEMATIC exit is owned by the camera
    // transition (FP→TP) so the opening can land before control resumes.
    if (game.mode === 'DIALOGUE') game.setMode('GAMEPLAY');
  },

  reset: () => {
    set({ nodeId: null, awaitingChoice: false });
    clearDialogueActing();
  },
}));

export const getDialogueState = () => useDialogue.getState();
