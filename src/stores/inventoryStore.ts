import { create } from 'zustand';
import { ITEMS, STARTING_INVENTORY } from '../data/items';

type Store = {
  items: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  resetAll: () => void;
};

export const useInventory = create<Store>((set, get) => ({
  items: [...STARTING_INVENTORY],
  add: (id) => set((s) => (s.items.includes(id) || !ITEMS.some((i) => i.id === id) ? s : { items: [...s.items, id] })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i !== id) })),
  has: (id) => get().items.includes(id),
  resetAll: () => set({ items: [...STARTING_INVENTORY] }),
}));
