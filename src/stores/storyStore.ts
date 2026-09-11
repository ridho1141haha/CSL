import { create } from 'zustand';
import type { ChapterId, Route, StoryBeat } from '../types';

type Store = {
  chapter: ChapterId;
  beat: StoryBeat;
  route: Route;
  flags: string[];
  choices: Record<string, string>;

  setChapter: (c: ChapterId) => void;
  setBeat: (b: StoryBeat) => void;
  setRoute: (r: Route) => void;
  setFlag: (f: string) => void;
  hasFlag: (f: string) => boolean;
  recordChoice: (key: string, id: string) => void;
  resetAll: () => void;
};

export const useStory = create<Store>((set, get) => ({
  chapter: 1,
  beat: 'ch1_explore',
  route: 'none',
  flags: [],
  choices: {},

  setChapter: (chapter) => set({ chapter }),
  setBeat: (beat) => set({ beat }),
  setRoute: (route) => set({ route }),
  setFlag: (f) => set((s) => (s.flags.includes(f) ? s : { flags: [...s.flags, f] })),
  hasFlag: (f) => get().flags.includes(f),
  recordChoice: (key, id) => set((s) => ({ choices: { ...s.choices, [key]: id } })),
  resetAll: () => set({ chapter: 1, beat: 'ch1_explore', route: 'none', flags: [], choices: {} }),
}));
