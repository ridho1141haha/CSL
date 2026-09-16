# Changelog

## 0.7.0 — 2026-09-16 (slow opening rework + NEUTRAL route)

Implementasi dua bagian GDD baru: **§"Alur yang lebih lambat"** (opening baru)
dan **§"Rute Netral"** (Bab 3–4 netral + Netral Ending). Total ending kini 4:
BAD / TRUE / BITTER / **NEUTRAL**.

### Added — slow opening "Minggu Pertama: Pria Tanpa Wajah" (replaces o1–o7)
- Opening sinematik first-person yang lebih lambat: 4 scene terpisah dengan
  fade-cut antar scene (36 node vs 24 sebelumnya) — Gerbang & Map Merah →
  Meja Baris Belakang (kenalan Aris, penghapus) → Peringatan Pertama di
  Lorong (Siti) → Bisik-Bisik Kantin (gosip SMA 4) & kemunculan Bimo +
  tiga pengikutnya.
- Kamera FP baru per beat: `fp_map_red`, `fp_class*`, `fp_siti_hall*`,
  `fp_canteen*`, `fp_bimo_entry` — termasuk shot interior kelas, lorong,
  dan kantin yang selama ini belum pernah dipakai cinematic.
- OPENING_ACTORS dirombak ke schema Spot `{ pos, face }` + slot `followers`
  (rombongan Bimo) — aktor kini punya arah hadap per node.
- NODE_FX `fade-in` di awal tiap scene untuk ritme lambat.

### Added — NEUTRAL route ("Dinding Dingin" → "Lulus Tanpa Nama")
- Bab 2 dirombak jadi **"Kesalahan Kecil Aris"** (GDD §Bab 2): Aris menumpahkan
  air ke sepatu anak geng inti Bimo di tangga belakang → garis cabang rute:
  - **[A] Mengabaikan** → `route: neutral` → montage 4 scene "Dinding Dingin &
    Keheningan Kelas" (bangku kosong, konfrontasi Siti, pengabaian Bimo,
    surat pengunduran diri Aris) → hari kelulusan di gerbang →
    **Netral Ending "Lulus Tanpa Nama"**.
  - **[B] Membela Aris** → encounter `stair_fight` (2 anak geng inti) →
    Bimo impressed → rooftop → rute bad/resistance (tidak berubah).
- StoryBeat baru: `ch2_key_error`, `ch3_neutral`, `ch4_neutral_grad`.
- Trigger StoryDirector: kartu BAB II dua-fase (card → scene), montage netral,
  dan pemicu graduasi saat pemain kembali ke gerbang.
- `chapterCardText` kini route-aware (BAB III/IV punya judul versi netral).
- EndingScreen punya varian `ending-neutral` (abu-abu pudar).
- Callback NPC rute netral: `bimo_neu_*` dan `siti_neu_*` (chapter ≥ 3).
- Aris tidak lagi muncul sebagai NPC di bab 4 rute netral (sudah pindah sekolah).
- Quest baru: `aris_incident` (bab 2), `graduation_day` (bab 4 netral).
- hidden event "Goresan di Bangku" kini bergantung flag `defended_aris`.

### Changed
- Quest `gate_trouble` dan encounter `gate_fight` diganti `aris_incident` /
  `stair_fight` (arena back_stairs, dua musuh).
- `ch2_win*` ditulis ulang untuk konteks pertarungan tangga belakang.
- Save lama dengan beat `ch2_gate` dinormalisasi ke `ch1_break` saat load —
  tanpa version bump (aman untuk save 0.6.x).
- Versi build chip: BUILD 0.7.0.

### Tests
- storyFlow: 4 test baru (cabang netral, cabang utama, rantai ending netral,
  peta BEAT_ENCOUNTER). Semua 89 test hijau.

## 0.6.0 — 2026-09-12 (dialogue overhaul — mentor feedback P0+P1)

Mentor feedback addressed: (1) natural dialogue, (2) dialogue camera framing the
speaker, (3) believable character behavior in conversations, (4) consequential
story choices, (5) hidden events/secret interactions, (6) side quests.

### Added — dialogue acting system (`systems/acting.ts`)
- Registry keyed by entity id (`ren`, NPC ids, story-actor ids). Every dialogue
  node updates it (via `dialogueStore`) with: who is talking, gaze targets,
  emotional energy (mapped from `Emotion`), gesture/nod timers.
- `Figure` consumes the registry: head yaw toward the conversation partner,
  mouth opens/closes while talking, 3 subtle gesture cycles (open palm /
  emphasis / hand-to-chest) scaled by energy, listening nods every 2–5s,
  breathing idle. Ambient students stay on the cheap idle path.
- Ren turns his body toward the partner during conversations.

### Added — dialogue camera (`systems/shot.ts`, `data/shots.ts`)
- Data-driven shot presets (`close/medium/wide/ots/two`, subject/side/dist/
  height/look/dur). Nodes reference presets via `cam`; speakers without an
  explicit preset get a default per speaker role (narrator → wide, NPC → OTS
  over Ren's shoulder).
- `CameraRig` resolves shots from LIVE speaker/listener positions (new
  `actorPositions` runtime registry + stale-position cleanup on NPC unmount)
  in both CINEMATIC (post-opening) and a new DIALOGUE branch, with per-shot
  occlusion pull-in. Static `CAM_BY_NODE` poses remain as fallback and for the
  untouched first-person opening.

### Added — hidden events (`data/hiddenEvents.ts`, `systems/hiddenEvents.ts`)
- 9 data-driven discoveries (zone / NPC / time-of-day / flag gated): rooftop
  carving, alley gang mark, canteen rumor, field gloves, parking patrol
  schedule, Pak Budi's after-school story, the "tolong" desk carving, the OSIS
  anonymous-report notice, Bimo's personal alley warning.
- Rewards: items (`sarung_tangan`, `coretan_atap`), relationship/focus/stats,
  and info flags that feed NPC dialogue. Discovery persists as a story flag
  (save-compatible, no schema bump) and shows in the agenda journal
  ("TEMUAN TERSEMBUNYI x/9").

### Added — side quests (extends existing quest system, no new store)
- `aris_notes` (borrow → actually study), `canteen_teh` (Siti's lunch favor),
  `field_training` (dusk training: violence/hp), `alley_check` (gang patrol
  evidence for Siti). Activation through condition-gated dialogue choices;
  completion through world state in StoryDirector's existing scan.

### Changed — dialogue rework (canon preserved)
- Per-character voice guide documented in `data/dialogue.ts` (Aris hesitant,
  Siti structured, Bimo minimal/cold, Pak Budi formal, Ren dry).
- Repeat-visit variation via condition-gated choices (first meeting vs. known),
  callbacks to earlier choices (`helped_aris`, `bimo_impressed`, route,
  reputation ≥15, academic >80) — early decisions now echo later.
- New condition kinds: `chapterMin`, `period`, `zone`, `talks`. `socialStore`
  tracks `talkCounts` (persisted, optional in the save schema).

### Fixed — E-interaction regression (latent, caught by new QA)
- `input.endFrame()` ran at the end of the Player's frame — but R3F executes
  frames in mount order and the Player mounts BEFORE `StoryDirector`, so
  `justPressed('interact')` was always read from an already-cleared set.
  Cleanup now lives in an `InputJanitor` mounted after StoryDirector; `wheel`
  moved to explicit-consume only (CameraRig).

### QA
- `scripts/qa-mentor.mjs` (Playwright desktop): seeded mid-game save → gameplay
  → E-interact → ARIS dialogue with speaker-driven framing → condition-gated
  choices verified; 0 console errors.
- Test suite: **85/85** (27 new: shot math 8, acting 10, hidden events 9).

## 0.5.0 — 2026-09-12 (mobile rescue pack + character overhaul)

### Fixed — CRITICAL: blank world on mobile (root cause found)
- **Troika `<Text>` name tags fetched a Roboto webfont from a CDN at runtime.** On phone networks the fetch hangs → the component suspends with no `Suspense` boundary between `<Physics>` and the NPC list → React hides the ENTIRE canvas subtree → sky-colored blank world while the DOM dialogue kept working (exactly the reported screenshot). Name tags are now **canvas-sprite based** (`NameTagSprite`): zero network, zero suspense, amber-bordered dossier style.
- Previously-suspected GPU overload is now ALSO handled (belt & suspenders):
  - `game/mobile.ts` device tiering — phones get dpr ≤1.5, antialias off, `'basic'` shadows, 1024px shadow maps, reduced geometry segments, half the ambient crowd.
  - `webglcontextlost` handler with `preventDefault()` + recovery reporting (was: permanent silent death).
  - Render-loop watchdog (`mobile.markFrame` petted by `CameraRig`): a dead loop surfaces a "RENDER TERHENTI — MUAT ULANG" chip instead of a silent freeze.
  - `DiagnosticsChip`: JS errors / unhandled rejections / context loss print as a small on-screen mono line — blank screens can never be information-less again.

### Added — touch controls
- `game-ui/TouchControls.tsx`: virtual joystick (walk; rim = run), right-half camera drag pad, action cluster (E/↑ in gameplay; ATK/HEV/BLK/DGE in combat), top-right pause, landscape suggestion in portrait.
- `input.ts` extended: touch axes merged into `isDown()` (movement/run read both keyboard and joystick), action injectors, per-frame look-delta consumed by `CameraRig`.

### Changed — character overhaul (stylized-realistic + PBR)
- `npc/Character.tsx`: shared procedural **fabric weave normal + roughness maps** (one 128px texture set cached across all figures), material cache keyed by color/kind, upgraded silhouette (flattened chest capsule, hips block, neck, shoulder caps), detailed face (sclera + iris + catchlight, nose, mouth), pleated skirt with hem band, socks + soled shoes, button details.
- Tier-aware: shadow casting off + reduced segment counts on phones; draw-call budget halved for ambient students (`Npcs` filters every other ambient on low tier).

### QA
- `scripts/qa-mobile.mjs` + `scripts/qa-landscape.mjs` (Playwright, Pixel 7 emulation): menu → prolog → dialogue → world render verified, 0 console errors; landscape choice UI + pause verified.
- Test suite: **58/58** (6 new tier-classification tests).

## 0.4.0 — 2026-09-12 (Stitch-style UI overhaul + cleanup)

### Added
- **Design system "STITCH"** (dark terminal dossier): panel #111319, amber/red/cyan accents, Anton + JetBrains Mono + Space Grotesk, corner brackets, chips, segmented bars — applied to MainMenu, HUD, DialogueUI, all FullMenu panels, loading/game-over/ending screens; UI copy localized to Indonesian.
- FullMenu titles as dual-tone "X // Y" with per-menu eyebrow labels.

### Removed
- Unused assets: old school GLBs (×2), char.glb, all NPC GLB + preview files (14), stitch generator scripts (4).


## 0.3.1 — 2026-09-11 (PBR pass + blank-screen hotfix)

### Fixed
- **CRITICAL blank screen on mobile:** `<Environment preset="city">` downloaded an HDR from an external CDN (`raw.githack.com`) at runtime; on flaky mobile networks the fetch failed and crashed the entire Canvas subtree — the world turned into an empty sky while the dialogue DOM kept working. Replaced with a **local** `<Environment frames={1}>` built from in-scene Lightformers (zero network) for all three scenes.
- **Loaded-game camera hardening:** `CameraRig.fp` was only cleared by the opening's FP→TP transition; continuing a save straight into GAMEPLAY/COMBAT kept the cinematic branch alive and lerped the camera to the campus `fp_gate` pose even in rooftop/warehouse scenes (black screen staring at a wall). The rig now snaps to third-person orbit when `opening_complete` is set.
- **Scene error fallback:** `SceneErrorBoundary` + `Suspense` inside the Canvas — if any world component ever throws, gameplay continues on a lit fallback plane instead of a dead void.
- **Mirrored 3D signs:** `KELUAR` (warehouse) and `TANGGA` (rooftop bulkhead) were seen from their back face; `SchoolSign` gained a `rotY` option and both now read correctly.
- **Opening composition:** `fp_students` had the camera clipped inside the main building's east wall; `fp_end` stared at a blank facade 5 m away beside the door gap. Both re-posed to clear sightlines (canteen walkway / entrance reverse shot).
- **Troika font CDN dependency:** signs now load Carlito from `public/fonts/` instead of the default Roboto fetched from `fonts.gstatic.com`.

### Added — procedural PBR materials (request: "texture nya pake PBR biar lebih realistis")
- `world/pbr.tsx`: zero-network PBR factory — 16 tileable surface sets (concrete, plaster, plaster_in, pavers, asphalt, grass, dirt, brick, wood, tile, terrazzo, metal, corrugated, roof, bark, foliage), each generated at runtime into 256px canvases with **albedo + normal (Sobel) + roughness** maps, wrapped/cached, integer-quantized repeat clones to bound VRAM on mobile.
- `<Pbr>` drop-in `<meshStandardMaterial>` replacement; applied across every scene:
  - **Campus:** grass field, asphalt street/parking/alley, concrete sidewalks/yard/warehouse yard, paver courtyard + paths, plaster facades, standing-seam roofs, concrete gate pillars/steps/stair/bleachers, corrugated warehouse shell + containers + bike shed, wood crates/benches/planters, bark + foliage trees.
  - **Interior:** terrazzo hall/corridor, tiled classroom + canteen, wood teacher room/desks/chairs/benches.
  - **Rooftop:** concrete deck, city blocks, metal AC/tank, wood pallets.
  - **Warehouse:** stained concrete floor, corrugated walls/roof/containers (real ribbing via normal map — the fake stripe meshes are gone), wood crates/pallets/shelf boxes.
- Local `<Environment>` maps for rooftop (sky) and warehouse (dim) so metals keep reflections; warehouse lighting lifted (ambient 0.62, lamps 22) so the duel arena stays readable while keeping the night mood.

## 0.3.0 — 2026-09-11 (world v2: multi-scene rebuild, no school GLB)

### Added
- **Multi-scene world architecture** (`SceneId`: campus / rooftop / warehouse) with `gameStore.requestScene()` — fade-out → scene swap → teleport → fade-in transitions, `sceneLoading` overlay, stale-zone reset between scenes.
- **Campus rebuilt from scratch** (`CampusWorld` + `CampusInterior` + shared `props.tsx` wall-segment system that generates visuals and Rapier colliders from one data array). The 7.3MB `jamalpur_zilla_school_2022.glb` is removed from `public/`; the whole world is now procedural geometry.
- **Accessible school interior:** entrance hall, lockers, bulletin boards, corridor with storage core, classroom 1-X (desks/chairs/blackboard/clock), teacher room (meeting table/cabinets), canteen building with serving counter, display case, tables and stools — all with furniture colliders.
- **Rooftop scene (Bab III):** parapets, stair bulkhead with exit trigger, AC units, water tank, antenna, clotheslines, distant city skyline; Bimo stands at the north parapet for the proposition cinematic.
- **Warehouse scene (Bab IV bad route):** container stacks, crates, shelving, forklift, oil drums, catwalk, hanging lamps + skylight shafts, dim hangar fog; the warehouse duel now happens inside the scene via `{ k: 'scene' }` effect.
- **Scene-aware story wiring:** `back_stairs` zone now transitions into the rooftop scene when `rooftop_meeting` is active (chapter 3 cinematic starts on arrival); accept/reject checkpoints return the player to campus before route montages; rooftop/warehouse exit triggers return to campus; scene field persisted in save v2 snapshots.
- `world.test.ts` (11 specs): scene registry, scene-aware `zoneAt`, zone/bounds integrity, NPC waypoints inside campus bounds, camera-pose coverage, scene-transition effects on story nodes. Suite is now **52/52**.

### Changed
- Stylized-realistic character upgrade (`Figure`): capsule limbs, shaped hair styles (short/wave/ponytail/buzz), facial features (eyes/brows/jaw), collar + tie, optional skirt, per-NPC skin/pants/hair data — animation interface unchanged.
- `zoneAt()` is scene-aware; zones split into per-scene registries (`SCENES`); MapPanel renders the current scene's schematic; NPC schedules repositioned to the new campus layout; opening/cinematic actor coordinates remapped; new `whin`/`whin_close` camera poses for the warehouse interior; new zone-flavor nodes (classroom, warehouse exterior).
- Campus layout plan: street/gate/courtyard south, main building center (x −16..16, z 4..28), canteen east, parking east, field west, rear yard + stair shaft north, back alley north-east, warehouse exterior north-west.
- Fade CSS reworked: `fade-in` now reveals (opacity 1→0) instead of re-darkening; scene transition overlay with spinner added.

## 0.2.1 — 2026-09-11 (story-flow bugfix pass)

### Fixed
- **CRITICAL soft-lock (Resistance route):** the Chapter 4 resistance montage (`ch4_res_1..4`) ended with `end: true` while still in CINEMATIC mode; `close()` only restores `DIALOGUE→GAMEPLAY` and the FP→TP transition is a one-shot opening-only exit, so the game froze on a camera pose with no UI and no input — chapter 4 was unfinishable on this route. CameraRig now returns control when a post-opening cinematic has no dialogue node left to show.
- **Game over wiped the run:** dying in any fight offered only "COBA LAGI" (= full restart to the opening). GameOverScreen now offers "MUAT SAVE TERAKHIR" (load auto slot) next to restart.
- **Ghost combat state after load:** `loadGame` now resets the combat store, procedural anim state (`down`) and `enemyPos.active`, so loading after a KO no longer renders the character lying down or suppresses NPC interaction prompts.
- **Post-ending auto-save corruption:** "MENU UTAMA" from the ending screen overwrote the auto slot with a non-playable post-ending snapshot; it no longer saves once an ending is set.
- **Duplicate unguarded montage trigger:** StoryDirector had a second bad-route montage block without the `bad_montage_done` guard (would replay the montage from a mid-montage save); removed (the guarded block handles entry).

### Added
- `{ k: 'save' }` effect type routed through the central effects pipeline; story checkpoints now auto-save to the auto slot at: start of Chapter 3 (`ch2_close`), start of Chapter 4 bad route (`ch3_accept_2`), start of Chapter 4 resistance route (`ch3_reject_2`), and before the alley search (`ch4_res_3`).
- Story-flow regression suite (`src/test/storyFlow.test.ts`, 11 specs): full node reachability from every runtime entry point (no dead content), canon route/ending effect wiring, montage beat ↔ encounter mapping, checkpoint presence.

### Changed
- Zone-flavor node map moved to `src/data/dialogue.ts` (`ZONE_FLAVOR`) as the single source of truth shared by StoryDirector and tests.

## 0.2.0 — 2026-09-10 (Phase 0–18 full development pass)

### Added
- Project management docs (PROJECT_OVERVIEW, PRD v0.2, GDD v0.2, ARCHITECTURE, DECISIONS, PROJECT_STATE, TODO, README) + git init.
- Modular architecture: `src/data`, `src/stores`, `src/game` (systems/runtime), `src/game-ui`.
- Input abstraction; game-mode state machine (BOOT → MAIN_MENU → OPENING_CINEMATIC → GAMEPLAY → DIALOGUE/CHOICE/COMBAT/menus → ENDING/GAME_OVER/TRANSITION).
- Save system v2: versioned localStorage save with v1→v2 migration and validation.
- Third-person controller (Rapier dynamic body: acceleration, run, jump, ground check) and camera system (orbit/pitch/zoom/shoulder offset/occlusion, cinematic override, first-person opening → third-person transition).
- Data-driven dialogue graph (conditions/effects), typewriter dialogue UI with portraits and keyboard navigation; central notifications queue.
- Opening vertical slice following canon scenes 1–6 (FP arrival, bullying encounter, mandatory first choice Help/Walk Past, Siti intervention, Bimo observation, FP→TP handoff).
- Real-time combat: light/heavy attacks, block, dodge, enemy FSM AI, hit pause, camera shake, damage feedback (replaces legacy menu combat).
- Quest system, school time + periods, NPC schedules, study mini-game, inventory (categories + consumables), school map, diegetic phone (Messages/Contacts/Schedule/Notes).
- Social systems: relationships (−100…+100 + labels), reputation, academic, focus, violence, diplomacy.
- Story chapters 2–4: gate conflict combat, rooftop proposition (ACCEPT/REJECT), Bad route warehouse finale, Resistance route final test, EndingResolver + BAD/TRUE/BITTER endings with canon text.
- WebAudio procedural audio (buses + gameplay/UI hooks), VFX (hit pause, shake, fades), settings (camera, volumes, reduced motion, screen shake), accessibility basics, full keyboard menu navigation.
- Test suites for pure systems (save, endingResolver, relationship, time, effects, study).

### Fixed
- NPC interaction coordinates now share one source of truth with rendering.
- Physics colliders enabled (ground/bounds); player collides and jumps.
- Per-frame input-driven movement replaces per-keypress movement.
- Movement no longer writes the entire save to localStorage every step (throttled + explicit save points).
- HUD values read live state (no hardcoded 485/500, 240/300).
- Duplicate `story.ts` retired; tests target real systems.

### Changed
- Canon roster locked to Ren/Aris/Siti/Bimo (PRD v0.1 roster superseded — see DECISIONS.md #1).

## 0.1.0 — baseline (pre-audit)
- Initial prototype: menu, opening dialogue + first choice, basic camera/NPC/dialogue, menu combat, localStorage save v1.
