import { create } from 'zustand';
import type { QuestState } from '../types';
import { QUESTS } from '../data/quests';

type Store = {
  quests: Record<string, QuestState>;
  setState: (id: string, state: QuestState) => void;
  stateOf: (id: string) => QuestState;
  activeMain: () => string[];
  resetAll: () => void;
};

const initialQuests = (): Record<string, QuestState> =>
  Object.fromEntries(QUESTS.map((q) => [q.id, q.id === 'explore_school' ? 'active' : 'locked'] as const));

export const useQuests = create<Store>((set, get) => ({
  quests: initialQuests(),
  setState: (id, state) =>
    set((s) => (s.quests[id] === state ? s : { quests: { ...s.quests, [id]: state } })),
  stateOf: (id) => get().quests[id] ?? 'locked',
  activeMain: () =>
    QUESTS.filter((q) => q.type === 'main' && get().quests[q.id] === 'active').map((q) => q.id),
  resetAll: () => set({ quests: initialQuests() }),
}));
