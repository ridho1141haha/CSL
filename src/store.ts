import { create } from 'zustand';
import { bimoLines, choicePrompt, freshSave, loadSave, openingLines, save, type Choice, type Flag, type GameMode, type Line, type NpcId, type Phase, type SaveData } from './game';

type State = SaveData & {
  dialogue: Line[];
  line: number;
  awaitingChoice: boolean;
  error: string;
  gameMode: GameMode;
  startGame: () => void;
  setPhase: (phase: Phase) => void;
  setMode: (gameMode: GameMode) => void;
  setDialogue: (dialogue: Line[]) => void;
  nextLine: () => void;
  openChoice: () => void;
  makeChoice: (choice: Choice) => void;
  flag: (flag: Flag) => void;
  visit: (npc: NpcId) => void;
  move: (dx: number, dz: number) => void;
  reset: () => void;
  interact: () => void;
  combatAction: (action: 'strike' | 'guard' | 'focus') => void;
  dismissDialogue: () => void;
  restart: () => void;
};

const initial = loadSave();

const persist = (state: State) => {
  const { dialogue, line, awaitingChoice, error, ...data } = state;
  return save(data);
};

export const useGameStore = create<State>((set, get) => ({
  ...(initial.data || freshSave()),
  error: initial.error,
  gameMode: initial.data?.phase === 'play' ? 'NORMAL_GAMEPLAY' : initial.data?.phase === 'opening' ? 'DIALOGUE' : 'PAUSE',
  dialogue: [],
  line: 0,
  awaitingChoice: false,

  startGame: () => {
    const next = { ...freshSave(), phase: 'opening' as const, flags: ['started'] as Flag[] };
    save(next);
    set({ ...next, dialogue: openingLines, line: 0, awaitingChoice: false, error: '' });
    set({ gameMode: 'DIALOGUE' });
  },

  setPhase: (phase) => {
    set({ phase });
    persist(get());
  },

  setMode: (gameMode) => set({ gameMode }),

  setDialogue: (dialogue) => set({ dialogue, line: 0 }),

  nextLine: () => {
    const { dialogue, line } = get();
    if (line < dialogue.length - 1) return set({ line: line + 1 });
    const state = get();
    if (state.phase === 'opening' && state.beat === 'intro') {
      set({ beat: 'choice', dialogue: choicePrompt, line: 0, awaitingChoice: true, gameMode: 'CHOICE' });
      return;
    }
    if (state.phase === 'opening' && state.beat === 'bimo') {
      const next = { ...state, phase: 'play' as const, beat: 'play' as const, flags: Array.from(new Set([...state.flags, 'opening_complete'])) as Flag[], visited: { aris: true, siti: true, bimo: true } };
      save(next);
      set({ phase: 'play', beat: 'play', flags: next.flags, visited: next.visited, gameMode: 'NORMAL_GAMEPLAY' });
      return;
    }
    if (state.phase === 'play') set({ dialogue: [], line: 0, gameMode: state.dialogue[0]?.speaker === 'BIMO' ? 'COMBAT' : 'NORMAL_GAMEPLAY' });
  },

  openChoice: () => set({ beat: 'choice', dialogue: choicePrompt, line: 0, awaitingChoice: true, gameMode: 'CHOICE' }),

  makeChoice: (choice) => {
    const state = get();
    const flags = Array.from(new Set([...state.flags, choice === 'help_aris' ? 'helped_aris' : 'walked_past_aris', 'siti_intervened', 'bimo_observed'])) as Flag[];
    const relationship = {
      ...state.relationship,
      aris: state.relationship.aris + (choice === 'help_aris' ? 2 : -1),
      siti: state.relationship.siti + 1,
    };
    const next = { ...state, choice, flags, relationship, beat: 'bimo' as const, awaitingChoice: false, dialogue: bimoLines, line: 0 };
    save(next);
    set({ choice, flags, relationship, beat: 'bimo', awaitingChoice: false, dialogue: bimoLines, line: 0, gameMode: 'DIALOGUE' });
  },

  flag: (flag) => {
    if (get().flags.includes(flag)) return;
    const flags = [...get().flags, flag] as Flag[];
    set({ flags });
    persist(get());
  },

  visit: (npc) => {
    const visited = { ...get().visited, [npc]: true };
    set({ visited });
    persist(get());
  },

  move: (dx, dz) => {
    const player = { x: get().player.x + dx, z: get().player.z + dz };
    set({ player });
    persist(get());
  },

  reset: () => {
    localStorage.removeItem('csl-save-v1');
    const next = freshSave();
    set({ ...next, dialogue: [], line: 0, awaitingChoice: false, error: '', gameMode: 'PAUSE' });
  },

  interact: () => {
    const state = get();
    if (state.gameMode !== 'NORMAL_GAMEPLAY') return;
    const npcs: [NpcId, number, number, Line[]][] = [
      ['aris', -2.5, 1.5, [{ speaker: 'ARIS', text: 'Kamu Ren, kan? Lorong ini kelihatan biasa, tapi jangan lengah.' }]],
      ['siti', -0.8, -1, [{ speaker: 'SITI', text: 'Kalau mau bertahan di Yuson, jaga nilai dan temanmu.' }]],
      ['bimo', 8, -6, [{ speaker: 'BIMO', text: 'Anak baru. Tunjukkan apa yang kamu punya.' }]],
    ];
    const nearby = npcs.find(([, x, z]) => Math.hypot(state.player.x - x, state.player.z - z) < 2.2);
    if (!nearby) return;
    const [npc, , , lines] = nearby;
    if (npc === 'bimo') return set({ dialogue: lines, line: 0, gameMode: 'DIALOGUE' });
    const visited = { ...state.visited, [npc]: true };
    const quests = { ...state.quests, explore_school: 'complete' as const };
    set({ visited, quests, dialogue: lines, line: 0, gameMode: 'DIALOGUE' });
    persist(get());
  },

  dismissDialogue: () => set({ dialogue: [], line: 0, gameMode: 'NORMAL_GAMEPLAY' }),

  combatAction: (action) => {
    const state = get();
    if (state.gameMode !== 'COMBAT') return;
    if (action === 'strike') {
      const enemyHp = Math.max(0, state.enemyHp - (state.focus >= 10 ? 24 : 12));
      const focus = Math.max(0, state.focus - 10);
      if (enemyHp === 0) {
        const quests = { ...state.quests, survive_bimo: 'complete' as const };
        const flags = Array.from(new Set([...state.flags, 'bimo_defeated'])) as Flag[];
        set({ enemyHp, focus, quests, flags, gameMode: 'NORMAL_GAMEPLAY' });
        persist(get());
      } else {
        const hp = Math.max(0, state.hp - 8);
        set({ enemyHp, focus, hp, gameMode: hp === 0 ? 'GAME_OVER' : 'COMBAT' });
      }
    } else if (action === 'focus') set({ focus: Math.min(100, state.focus + 25) });
    else set({ focus: Math.min(100, state.focus + 8) });
    persist(get());
  },

  restart: () => {
    const next = { ...freshSave(), phase: 'opening' as const, flags: ['started'] as Flag[] };
    save(next);
    set({ ...next, dialogue: openingLines, line: 0, awaitingChoice: false, error: '', gameMode: 'DIALOGUE' });
  },
}));
