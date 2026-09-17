// Shared game types. Data lives in src/data; logic in stores/systems.

export type Phase = 'boot' | 'menu' | 'play';

// Multi-scene world. 'campus' is the main grounds; rooftop & warehouse are
// smaller scenes mounted on demand (see data/world.ts SCENES + SceneRoot).
export type SceneId = 'campus' | 'rooftop' | 'warehouse';
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

// Route 'neutral' (v0.7.0): Ren mengabaikan Aris saat insiden tangga belakang —
// memasuki alur "Dinding Dingin" menuju Netral Ending "Lulus Tanpa Nama".
export type Route = 'none' | 'bad' | 'resistance' | 'neutral';

export type ChapterId = 1 | 2 | 3 | 4;

export type StoryBeat =
  | 'ch1_explore'
  | 'ch1_break'
  // v0.7.0: Bab 2 reworked — "Kesalahan Kecil Aris" replaces the gate fight
  | 'ch2_key_error'
  | 'ch2_aftermath'
  // v0.11.0 GARIS MERAH: bab 3 dibuka montase OSIS, lalu sergapan parkiran,
  // lalu rooftop. Rute bad berakhir di kelulusan; rute resistance berakhir
  // di FINAL BOSS Bimo → CHOICE 3 → kelulusan (good) / penangkapan (bad 2).
  | 'ch3_osis'          // montase pendekatan OSIS pending
  | 'ch3_parking'       // sergapan parkiran [FIGHT 2] pending
  | 'ch3_rooftop'
  // v0.7.0: neutral route beats
  | 'ch3_neutral'        // montage "Dinding Dingin" pending
  | 'ch4_neutral_grad'   // graduation-day trigger pending (gate)
  | 'ch4_bad_warehouse'
  | 'ch4_bad_aftermath'
  | 'ch4_bad_grad'       // GARIS MERAH: bad ending 1 di gerbang
  | 'ch4_res_search'
  | 'ch4_res_alley'
  | 'ch4_res_aftermath'
  | 'ch4_res_bimo'       // GARIS MERAH: FINAL BOSS Bimo
  | 'ch4_good_grad'      // GARIS MERAH: good ending di gerbang
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
  | 'warehouse'
  // interior zones (campus scene)
  | 'hall'
  | 'classroom'
  | 'teacher_room'
  // v0.8.0: Gedung B (3-storey classroom building) + library
  | 'gedung_b'
  | 'kelas_10a'
  | 'kelas_12a'
  | 'kelas_12b'
  | 'ruang_osis'
  | 'library'
  // rooftop scene
  | 'rooftop'
  | 'rooftop_door'
  // warehouse scene (interior)
  | 'warehouse_in'
  | 'warehouse_door';

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

// ---------------------------------------------------------------------------
// Dialogue camera shots (mentor feedback #2). A DialogueShot is resolved at
// runtime from the speaker/listener world positions (see systems/shot.ts).
// Nodes reference a preset by key (data/shots.ts SHOT_PRESETS).
// ---------------------------------------------------------------------------
export type ShotKind = 'close' | 'medium' | 'wide' | 'ots' | 'two';

export type DialogueShot = {
  kind: ShotKind;
  subject?: 'speaker' | 'listener' | 'player'; // default: speaker
  side?: -1 | 1;      // over-the-shoulder side (default 1)
  dist?: number;      // camera distance override (m)
  height?: number;    // camera height override (m)
  look?: 'subject' | 'midpoint'; // default subject
  dur?: number;       // smoothing constant (higher = faster settle)
};

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
  | { k: 'scene'; id: SceneId; spawn?: [number, number] }
  | { k: 'teleport'; x: number; z: number }
  | { k: 'study' }
  | { k: 'save' };

export type Condition =
  | { k: 'flag'; id: string; not?: boolean }
  | { k: 'chapter'; id: ChapterId }
  | { k: 'chapterMin'; id: ChapterId }
  | { k: 'route'; id: Route }
  | { k: 'quest'; id: string; state: QuestState }
  | { k: 'relAbove'; target: NpcId; v: number }
  | { k: 'statAbove'; stat: keyof Stats; v: number }
  | { k: 'focusAbove'; v: number }
  | { k: 'period'; id: string }        // time-of-day window (systems/time PeriodId)
  | { k: 'zone'; id: ZoneId }          // player currently inside zone
  | { k: 'talks'; target: NpcId; v: number } // has talked to NPC >= v times
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
  cam?: string; // SHOT_PRESETS key — speaker-driven framing (optional; static CAM_BY_NODE is the fallback)
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
  arena: Exclude<ZoneId, 'class_door'>; // flavor only — fights happen in place
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

// Hidden/optional interaction (mentor feedback #5). Data-driven; runner lives
// inside StoryDirector's world scan. Discovered events persist as `he_<id>`
// story flags — no save-schema change required.
export type HiddenEventTrigger =
  | { k: 'zone' }                 // fired on entering the required zone
  | { k: 'npc' }                  // fired on interacting with the required NPC
  | { k: 'zone-npc' };            // zone entry while the NPC requirement also matches (reserved)

export type HiddenEventDef = {
  id: string;
  title: string;                  // shown in the discovery toast + journal
  trigger: HiddenEventTrigger;
  zone?: ZoneId;                  // required zone (trigger k: zone)
  npc?: NpcId;                    // required NPC (trigger k: npc)
  period?: string;                // optional time-of-day requirement
  reqs?: Condition;               // optional extra requirements (flags/rel/stats…)
  dialogue: string;               // node opened on discovery
  oneTime?: boolean;              // default true
};

// v0.12.0: props that a Figure can hold in its hands (story-support detail).
export type HoldKind = 'book' | 'map' | 'pencil' | 'eraser' | 'stack' | 'bottle' | 'phone';

export type NpcDef = {
  id: NpcId;
  name: string;
  role: string;
  color: string;
  accent: string;
  height: number;
  schedule: Partial<Record<string, [number, number]>>; // period -> [x, z]
  // v0.12.0: when the NPC arrives at a waypoint marked `sit` below, it sits
  // (classroom desks) and turns toward this world point while seated
  sitAt?: string[]; // period ids where the NPC sits after arriving
  sitFace?: [number, number]; // look-at point while seated
  dialogueRoot: string; // dialogue node id used when interacted
  // stylized-realistic look overrides (see game/npc/Character.tsx Figure)
  skin?: string;
  pants?: string;
  skirt?: string; // color — presence enables skirt mesh
  hair?: { color: string; style: 'short' | 'wave' | 'ponytail' | 'buzz' };
};

export type ZoneDef = {
  id: ZoneId;
  label: string;
  center: [number, number];
  radius: number;
  map?: [number, number]; // optional legacy minimap coords (MapPanel derives from bounds)
  // v0.8.0: optional vertical window [minY, maxY] — multi-storey buildings
  // reuse the same (x, z) footprint per floor, so upper-floor zones only
  // match when the player's y is inside the range (see zoneAt).
  y?: [number, number];
};
