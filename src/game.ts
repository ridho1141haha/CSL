export type Phase = 'menu' | 'opening' | 'play';
export type GameMode = 'NORMAL_GAMEPLAY' | 'DIALOGUE' | 'CHOICE' | 'STATUS_MENU' | 'RELATIONSHIP_MENU' | 'QUEST_MENU' | 'INVENTORY_MENU' | 'MAP_MENU' | 'PAUSE' | 'SETTINGS' | 'COMBAT' | 'GAME_OVER' | 'ENDING';
export type Choice = 'help_aris' | 'walk_past';
export type NpcId = 'aris' | 'siti' | 'bimo';
export type Flag = 'started' | 'arrived' | 'helped_aris' | 'walked_past_aris' | 'siti_intervened' | 'bimo_observed' | 'opening_complete' | 'bimo_defeated';
export type Line = { speaker: string; text: string };
export type SaveData = {
  phase: Phase;
  flags: Flag[];
  choice: Choice | null;
  relationship: Record<NpcId, number>;
  visited: Record<NpcId, boolean>;
  player: { x: number; z: number };
  beat: 'intro' | 'choice' | 'bimo' | 'play';
  academic: number;
  focus: number;
  alignment: number;
  inventory: string[];
  quests: Record<string, 'active' | 'complete'>;
  enemyHp: number;
  hp: number;
};

export const SAVE_KEY = 'csl-save-v1';

export const openingLines: Line[] = [
  { speaker: 'REN', text: 'Sekolah baru.' },
  { speaker: 'REN', text: 'Jaga nilai. Jangan cari masalah. Lulus. Pergi.' },
  { speaker: 'REN', text: 'Cukup lihat, jangan ikut campur.' },
  { speaker: 'REN', text: 'Tapi... tempat ini memang beda.' },
];

export const choicePrompt: Line[] = [
  { speaker: 'REN', text: 'Mereka kelihatan butuh bantuan.' },
  { speaker: 'REN', text: 'Kalau aku ikut campur, masalahnya bisa pindah ke aku.' },
];

export const bimoLines: Line[] = [
  { speaker: 'SITI', text: 'Kalau kamu lihat ada yang dibully, jangan diam saja.' },
  { speaker: 'ARIS', text: 'Ren... makasih.' },
  { speaker: 'NARATOR', text: 'Di ujung koridor, seorang siswa memperhatikan Ren tanpa bicara.' },
  { speaker: 'NARATOR', text: 'Bimo.' },
];

export const playLines: Line[] = [
  { speaker: 'SITI', text: 'Kalau lihat siswa lain dibully, jangan diam saja.' },
  { speaker: 'ARIS', text: 'Ren... makasih sudah berhenti tadi.' },
];

export const freshSave = (): SaveData => ({
  phase: 'menu',
  flags: [],
  choice: null,
  relationship: { aris: 0, siti: 0, bimo: 0 },
  visited: { aris: false, siti: false, bimo: false },
  player: { x: 0, z: 4 },
  beat: 'intro',
  academic: 70,
  focus: 100,
  alignment: 0,
  inventory: ['Student ID'],
  quests: { explore_school: 'active' },
  enemyHp: 100,
  hp: 100,
});

export const parseSave = (raw: string | null): SaveData | null => {
  try {
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<SaveData>;
    const validNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
    if (!s || !['menu', 'opening', 'play'].includes(String(s.phase))) return null;
    if (!['intro', 'choice', 'bimo', 'play'].includes(String(s.beat))) return null;
    if (!s.player || !validNum(s.player.x) || !validNum(s.player.z)) return null;
    return {
      ...freshSave(),
      ...s,
      flags: Array.isArray(s.flags) ? s.flags as Flag[] : [],
      relationship: { ...freshSave().relationship, ...(s.relationship || {}) },
      visited: { ...freshSave().visited, ...(s.visited || {}) },
      player: { x: s.player.x, z: s.player.z },
      choice: s.choice === 'help_aris' || s.choice === 'walk_past' ? s.choice : null,
      beat: (s.beat as SaveData['beat']) || 'intro',
      academic: validNum(s.academic) ? Number(s.academic) : 70,
      focus: validNum(s.focus) ? Number(s.focus) : 100,
      alignment: validNum(s.alignment) ? Number(s.alignment) : 0,
      inventory: Array.isArray(s.inventory) ? s.inventory.filter((v): v is string => typeof v === 'string') : ['Student ID'],
      quests: s.quests && typeof s.quests === 'object' ? s.quests as SaveData['quests'] : { explore_school: 'active' },
      enemyHp: validNum(s.enemyHp) ? Number(s.enemyHp) : 100,
      hp: validNum(s.hp) ? Number(s.hp) : 100,
    };
  } catch {
    return null;
  }
};

export const loadSave = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const data = parseSave(raw);
    return { data, error: raw && !data ? 'Saved data is invalid or unsupported. Start a new game.' : '' };
  } catch {
    return { data: null, error: 'Storage unavailable. Progress may not persist.' };
  }
};

export const save = (data: SaveData) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return '';
  } catch {
    return 'Could not save progress.';
  }
};
