// Shared game types. Data lives in src/data; logic in stores/systems.

export type Phase = 'boot' | 'menu' | 'play';
export type GameMode =
  | 'LOADING'
  | 'MAIN_MENU'
  | 'CINEMATIC'
  | 'GAMEPLAY'
  | 'DIALOGUE'
  | 'CHOICE'
  | 'COMBAT'
  | 'PAUSE'
  | 'STATUS_MENU'
  | 'RELATIONSHIP_MENU'
  | 'QUEST_MENU'
  | 'INVENTORY_MENU'
  | 'MAP_MENU'
  | 'PHONE_MENU'
  | 'SAVELOAD_MENU'
  | 'SETTINGS'
  | 'STUDY'
  | 'GAME_OVER'
  | 'ENDING'
  | 'TRANSITION';

export type NpcId = 'aris' | 'siti' | 'bimo' | 'budi';

export type Route = 'none' | 'bad' | 'resistance';

export type ChapterId = 1 | 2 | 3 | 4;

export type StoryBeat =
  | 'ch1_explore'
  | 'ch1_break'
  | 'ch2_gate'
  | 'ch2_aftermath'
  | 'ch3_rooftop'
  | 'ch4_bad_warehouse'
  | 'ch4_bad_aftermath'
  | 'ch4_res_search'
  | 'ch4_res_alley'
  | 'ch4_res_aftermath'
  | 'done';

export type Clock = { day: number; minutes: number };

export type ZoneId =
  | 'gate'
  | 'courtyard'
  | 'class_door'
  | 'canteen'
  | 'field'
  | 'parking'
  | 'back_alley'
  | 'back_stairs'
  | 'street'
  | 'warehouse';

export type Stats = {
  academic: number;
  violence: number;
  diplomacy: number;
  reputation: number;
};

export type QuestState = 'locked' | 'available' | 'active' | 'completed' | 'failed';
export type QuestType = 'main' | 'side';

export type ItemCategory = 'consumable' | 'quest' | 'key' | 'misc';

export type RelationshipDelta = { target: NpcId; delta: number };

export type Effect =
  | { k: 'flag'; id: string }
  | { k: 'rel'; target: NpcId; delta: number }
  | { k: 'stat'; stat: keyof Stats | 'focus'; delta: number }
  | { k: 'hp'; delta: number }
  | { k: 'quest'; id: string; state: QuestState }
  | { k: 'item'; id: string; remove?: boolean }
  | { k: 'time'; minutes: number }
  | { k: 'chapter'; id: ChapterId }
  | { k: 'beat'; id: StoryBeat }
  | { k: 'route'; id: Route }
  | { k: 'ending' }
  | { k: 'combat'; encounter: string }
  | { k: 'notify'; text: string }
  | { k: 'visit-zone'; zone: ZoneId }
  | { k: 'teleport'; x: number; z: number }
  | { k: 'study' };

export type Condition =
  | { k: 'flag'; id: string; not?: boolean }
  | { k: 'chapter'; id: ChapterId }
  | { k: 'route'; id: Route }
  | { k: 'quest'; id: string; state: QuestState }
  | { k: 'relAbove'; target: NpcId; v: number }
  | { k: 'statAbove'; stat: keyof Stats; v: number }
  | { k: 'focusAbove'; v: number }
  | { k: 'and'; all: Condition[] };

export type Choice = {
  id: string;
  text: string;
  next?: string;
  end?: boolean;
  effects?: Effect[];
  condition?: Condition;
};

export type Emotion = 'neutral' | 'calm' | 'tense' | 'worried' | 'firm' | 'dark' | 'warm';

export type DialogueNode = {
  id: string;
  speaker: string;
  text: string;
  emotion?: Emotion;
  portrait?: NpcId | 'ren' | 'narrator' | 'bully' | 'gang' | 'generic';
  next?: string;
  choices?: Choice[];
  effects?: Effect[];
  auto?: boolean; // cinematic: advance with camera beat, still click-to-skip
  end?: boolean;
};

export type CameraPose = {
  pos: [number, number, number];
  look: [number, number, number];
  fov?: number;
};

export type CinStep = {
  node?: string;       // dialogue node id to show during this step
  cam?: string;        // camera pose key (interpolated)
  wait?: number;       // seconds to hold after dialogue completes
  fx?: 'fade-out' | 'fade-in' | 'fp-to-tp' | 'shake';
};

export type ChapterDef = {
  id: ChapterId;
  title: string;
  subtitle: string;
  onStart?: Effect[];
  onComplete?: Effect[];
};

export type EncounterEnemy = {
  id: string;
  name: string;
  hp: number;
  dmg: number;
  speed: number;
  color: string;
  scale?: number;
};

export type EncounterDef = {
  id: string;
  arena: Exclude<ZoneId, 'class_door'>;
  enemies: EncounterEnemy[];
  onWin: string;   // dialogue node
  onLose?: string;
  music?: 'tense' | 'dark';
};

export type ItemDef = {
  id: string;
  name: string;
  category: ItemCategory;
  desc: string;
  use?: { hp?: number; focus?: number };
};

export type QuestDef = {
  id: string;
  title: string;
  type: QuestType;
  desc: string;
  objective: string;
  chapter: ChapterId;
};

export type NpcDef = {
  id: NpcId;
  name: string;
  role: string;
  color: string;
  accent: string;
  height: number;
  schedule: Partial<Record<string, [number, number]>>; // period -> [x, z]
  dialogueRoot: string; // dialogue node id used when interacted
};

export type ZoneDef = {
  id: ZoneId;
  label: string;
  center: [number, number];
  radius: number;
  map: [number, number]; // 0..1 map coords
};
