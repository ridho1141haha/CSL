import { create } from 'zustand';
import type { Clock, GameMode, Phase, SceneId, ZoneId } from '../types';
import { advance } from '../game/systems/time';
import type { Ending } from '../game/systems/endingResolver';
import { SCENES } from '../data/world';
import { usePlayer } from './playerStore';

export type NotificationKind = 'info' | 'quest' | 'social' | 'warn';
export type Notification = { id: number; text: string; kind: NotificationKind };

let notifSeq = 1;

type Store = {
  phase: Phase;
  mode: GameMode;
  clock: Clock;
  scene: SceneId;
  sceneLoading: boolean;
  visitedZones: ZoneId[];
  currentZone: ZoneId | null;
  notifications: Notification[];
  ending: Ending | null;
  pendingChapter: number | null; // triggers chapter transition card
  fade: 'none' | 'out' | 'in';
  error: string;
  interactTarget: string | null;
  pointerLocked: boolean; // BUG-3.1: drives "click to control" overlay

  boot: () => void;
  setPhase: (p: Phase) => void;
  setMode: (m: GameMode) => void;
  notify: (text: string, kind?: NotificationKind) => void;
  dismissNotification: (id: number) => void;
  visitZone: (z: ZoneId) => void;
  setCurrentZone: (z: ZoneId | null) => void;
  advanceTime: (minutes: number) => void;
  setEnding: (e: Ending | null) => void;
  requestChapterCard: (id: number) => void;
  clearChapterCard: () => void;
  setFade: (f: 'none' | 'out' | 'in') => void;
  setError: (e: string) => void;
  setInteractTarget: (name: string | null) => void;
  setPointerLocked: (v: boolean) => void;
  setScene: (s: SceneId) => void;
  requestScene: (id: SceneId, spawn?: [number, number]) => void;
  resetAll: () => void;
};

export const useGame = create<Store>((set, get) => ({
  phase: 'boot',
  mode: 'LOADING',
  clock: { day: 0, minutes: 7 * 60 + 12 },
  scene: 'campus',
  sceneLoading: false,
  visitedZones: [],
  currentZone: null,
  notifications: [],
  ending: null,
  pendingChapter: null,
  fade: 'none',
  error: '',
  interactTarget: null,
  pointerLocked: false,

  boot: () => set({ phase: 'menu', mode: 'MAIN_MENU' }),
  setPhase: (phase) => set({ phase }),
  setMode: (mode) => set({ mode }),
  notify: (text, kind = 'info') =>
    set((s) => ({ notifications: [...s.notifications.slice(-4), { id: notifSeq++, text, kind }] })),
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  visitZone: (z) =>
    set((s) => (s.visitedZones.includes(z) ? s : { visitedZones: [...s.visitedZones, z] })),
  setCurrentZone: (currentZone) => set({ currentZone }),
  advanceTime: (minutes) => set((s) => ({ clock: advance(s.clock, minutes) })),
  setEnding: (ending) => set({ ending }),
  requestChapterCard: (id) => set({ pendingChapter: id, mode: 'TRANSITION' }),
  clearChapterCard: () => set({ pendingChapter: null }),
  setFade: (fade) => set({ fade }),
  setError: (error) => set({ error }),
  setInteractTarget: (interactTarget) => set((s) => (s.interactTarget === interactTarget ? s : { interactTarget })),
  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  setScene: (scene) => set({ scene }),
  // Multi-scene transition: fade out → swap scene bundle → teleport player →
  // fade in. If already in the target scene, just reposition the player.
  requestScene: (id, spawn) => {
    const g = get();
    if (g.scene === id) {
      if (spawn) usePlayer.getState().setPos(spawn[0], spawn[1]);
      return;
    }
    if (g.sceneLoading) return; // a transition is already running
    g.setFade('out');
    set({ sceneLoading: true });
    window.setTimeout(() => {
      const st = get();
      st.setScene(id);
      // stale zone ids from the previous scene must not leak into the new one
      st.setCurrentZone(null);
      const sp = spawn ?? SCENES[id].spawn;
      usePlayer.getState().setPos(sp[0], sp[1]);
      st.notify(`Memasuki: ${SCENES[id].label}`, 'info');
      st.setFade('in');
      window.setTimeout(() => {
        get().setFade('none');
        set({ sceneLoading: false });
      }, 700);
    }, 480);
  },
  resetAll: () =>
    set({
      phase: 'menu',
      mode: 'MAIN_MENU',
      clock: { day: 0, minutes: 7 * 60 + 12 },
      scene: 'campus',
      sceneLoading: false,
      visitedZones: [],
      currentZone: null,
      notifications: [],
      ending: null,
      pendingChapter: null,
      fade: 'none',
      error: '',
      interactTarget: null,
      pointerLocked: false,
    }),
}));

export const getGame = () => useGame.getState();
