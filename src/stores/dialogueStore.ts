import { create } from 'zustand';
import { getDialogue, SPECIAL_NODES } from '../data/dialogue';
import { applyEffects } from '../game/systems/effects';
import { useGame } from './gameStore';
import { useStory } from './storyStore';
import { useCombat } from './combatStore';
import type { Choice } from '../types';

// Encounter selection by story beat when a dialogue reaches __combat__
// (exported: asserted by test/storyFlow.test.ts)
export const BEAT_ENCOUNTER: Record<string, string> = {
  ch2_gate: 'gate_fight',
  ch4_bad_warehouse: 'warehouse_fight',
  ch4_res_alley: 'alley_fight',
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

export const useDialogue = create<Store>((set, get) => ({
  nodeId: null,
  awaitingChoice: false,

  open: (id, cinematic = false) => {
    const game = useGame.getState();
    game.setMode(cinematic ? 'CINEMATIC' : 'DIALOGUE');
    set({ nodeId: id, awaitingChoice: false });
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
      const encounter = BEAT_ENCOUNTER[beat] ?? 'gate_fight';
      get().close();
      applyEffects([{ k: 'combat', encounter }]);
      return;
    }
    if (node.next === SPECIAL_NODES.study) {
      get().close();
      useGame.getState().setMode('STUDY');
      return;
    }
    set({ nodeId: node.next });
  },

  choose: (choice) => {
    const { nodeId } = get();
    if (!nodeId) return;
    const node = getDialogue(nodeId);
    if (!node || !node.choices?.some((c) => c.id === choice.id)) return;
    useStory.getState().recordChoice(nodeId, choice.id);
    if (choice.effects) applyEffects(choice.effects);
    set({ awaitingChoice: false });
    if (choice.next) set({ nodeId: choice.next });
    else get().close();
  },

  close: () => {
    set({ nodeId: null, awaitingChoice: false });
    const game = useGame.getState();
    // DIALOGUE returns to gameplay. CINEMATIC exit is owned by the camera
    // transition (FP→TP) so the opening can land before control resumes.
    if (game.mode === 'DIALOGUE') game.setMode('GAMEPLAY');
  },

  reset: () => set({ nodeId: null, awaitingChoice: false }),
}));

export const getDialogueState = () => useDialogue.getState();
