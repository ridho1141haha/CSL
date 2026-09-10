export type StoryFlag =
  | 'started'
  | 'arrived'
  | 'met_aris'
  | 'helped_aris'
  | 'walked_past_aris'
  | 'siti_intervened'
  | 'bimo_observed'
  | 'opening_complete';

export type StoryChoice = 'help_aris' | 'walk_past';

export type NpcId = 'aris' | 'siti' | 'bimo';

export type GamePhase = 'menu' | 'opening' | 'play';

export type DialogueLine = {
  speaker: string;
  text: string;
};

export type SaveState = {
  phase: GamePhase;
  flags: StoryFlag[];
  choice?: StoryChoice;
  visited: Record<NpcId, boolean>;
  relationship: {
    aris: number;
    siti: number;
    bimo: number;
  };
};

export const introScript: DialogueLine[] = [
  { speaker: 'REN', text: 'Sekolah baru.' },
  { speaker: 'REN', text: 'Jaga nilai. Jangan cari masalah. Lulus. Pergi.' },
  { speaker: 'REN', text: 'Cukup lihat, jangan ikut campur.' },
];

export const arisIntro: DialogueLine[] = [
  { speaker: 'ARIS', text: 'T-tolong...' },
  { speaker: 'BULLY', text: 'Kamu lambat lagi.' },
  { speaker: 'SITI', text: 'Berhenti. Sekarang.' },
  { speaker: 'SITI', text: 'Kamu siswa baru, ya? Jangan diam saja kalau lihat orang diperlakukan begitu.' },
  { speaker: 'ARIS', text: 'Ren... makasih.' },
];

export const bimoLine: DialogueLine[] = [
  { speaker: 'NARATOR', text: 'Di ujung koridor, seorang siswa memperhatikan Ren tanpa bicara.' },
  { speaker: 'NARATOR', text: 'Bimo.' },
];

export const startState = (): SaveState => ({
  phase: 'menu',
  flags: [],
  visited: { aris: false, siti: false, bimo: false },
  relationship: { aris: 0, siti: 0, bimo: 0 },
});

export const saveKey = 'csl-save-v1';

export const loadState = (): SaveState => {
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return startState();
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return {
      ...startState(),
      ...parsed,
      flags: Array.isArray(parsed.flags) ? parsed.flags as StoryFlag[] : [],
      visited: { ...startState().visited, ...(parsed.visited || {}) },
      relationship: { ...startState().relationship, ...(parsed.relationship || {}) },
    };
  } catch {
    return startState();
  }
};

export const persistState = (state: SaveState) => {
  localStorage.setItem(saveKey, JSON.stringify(state));
};
