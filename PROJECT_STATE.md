# Project State

Updated: 2026-09-22 (v0.14.1 — fix kamera sinematik mengikuti story scene aktif: resolver staging murni resolveCinematicCamera, ghost actorPositions dibersihkan, story scene ch2/pasca-kombat kini CINEMATIC, cameraStage lengkap & benar lokasi; 178 test)

## v0.14.1 Snapshot (2026-09-22)

**Kamera sinematik = milik story scene aktif (bukan tebakan):**
- `resolveCinematicCamera(nodeId)` (game/story/staging.ts, murni & teruji):
  `node.cam` (preset shot dialogue, speaker/listener wajib distage) →
  pose authoran `CAM_BY_NODE` → null (CameraRig memframing Ren yang
  distage — tidak ada lagi konstanta 'courtyard_view').
- Kamera CINEMATIC TIDAK membaca registry live (actorPositions/npcPositions)
  — posisi hantu scene lama (bullies kantin o4, gang tangga ch2, Bimo rooftop)
  tidak lagi menyeret kamera dari scene aktif. Registry live hanya untuk mode
  DIALOGUE (obrolan NPC yang memang berdiri di depan pemain).
- `storyCastSpots(nodeId)` = ekspansi cast (konvensi id sama dgn CinematicActors);
  `stagedEntityPosition(nodeId, id)` = posisi dari DATA staging.
- `StoryActor` cleanup `actorPositions[id]` saat unmount (anti-hantu, cermin
  guard ScheduledNpc).
- Story scene selalu CINEMATIC: ch2 (`StoryDirector`) + 5 node onWin
  (`finishCombatWin`) dibuka `cinematic=true` → aktor SCENE_ACTORS terpasang,
  pose authoran aktif.
- cameraStage/actorStages dilengkapi dari audit 146 node: ch2_close,
  ch4_bad_4/4b, ch3_osis_* (hall_* memframing spot Siti), ch4_res_1/4
  (courtyard); Bimo rooftop/gudang + Aris/Siti courtyard pindah ke
  SCENE_ACTORS (hardcode App dihapus).
- Guard test (test/cinema.test.ts): INVARIANT LOKASI — look-target pose
  wajib ≤18 m dari entity scene yang distage; semua node sinematik wajib
  punya keputusan kamera; regresi hantu kantin/kelas/rooftop.
- Follow-up (bukan kamera): ch2_win_6 (Bimo menyaksi) & n3_2/n3_4 (suara
  gang) speaker sah tapi aktornya belum distage — kamera aman (pose authoran),
  konten render menyusul bila diperlukan.

## v0.14.0 Snapshot (2026-09-18)

**Story staging (WHERE/WHO/POSE/CAMERA/DIALOGUE):**
- `REN_STAGING` (data/chapters.ts, PlayerStaging { pos, face?, scene? }) —
  posisi deterministik Ren per node cerita. Diterapkan `<StoryPlayerStaging/>`
  (App) via `applyPlayerStaging()` (game/story/staging.ts) saat node terbuka;
  setPos → rigid-body teleport existing, facing langsung ke playerPos.facing.
- Aturan: opening FP (o*) tidak distage; node kombat biar combat yang pegang;
  scene non-kampus wajib field `scene` (rooftop/warehouse koordinat lokal);
  bab 2 wajib x ≥ 4.4 (shaft tangga x -4..4 z -2..4 = undakan). Semua diuji
  test/staging.test.ts. FIX n2: Siti + Ren kini di interior perpustakaan
  (sinkron kamera library_*).
- `startStoryScene(nodeId, cinematic?)` = pintu masuk deterministik (Task 3)
  yang tetap satu jalur dengan trigger lain (staging otomatis di node open).

**Struktur cerita (src/data/story/):**
- opening / chapter2 / chapter3 / routes{neutral,bad,resistance} /
  endings{neutralEnding,bad1Ending,goodEnding,bad2Ending} / npc / discoveries /
  ambient + index.ts perakit. data/dialogue.ts = re-export shim (0 import
  churn). endingResolver tetap murni; scene ending terpisah per file dan
  teruji pairwise-disjoint (test/storyStructure.test.ts).

**Mission nav & transition:**
- HUD obj-card: [TELEPORT] (requestScene campus + fade; objective TIDAK auto-
  selesai) / [JALAN] (hint waypoint ◆ + jarak, kontrol tetap pemain).
- requestScene same-scene kini fade out→setPos→in (= transitionToScene);
  sceneLoading guard anti-transisi-tumpuk.

**BGM:**
- audio.ts += MusicDirector + musicDecision (murni) + PATTERNS prosedural
  (menu/school_day/school_evening/tension/combat/neutral/ending_*). Satu
  pemantau interval-1s di App memanggil bgm.sync (komponen lain tidak boleh
  main musik). Fade out→ganti→in via gain track di atas bus MUSIC; volume
  tetap ikut setelan MUSIC. bgm.reset() dipakai saat ending/reset store.

## v0.13.0 Snapshot (2026-09-18)

**Mode kamera (src/game/camera/mode.ts — murni, teruji):**
- `CamMode` = 'third' | 'first'; `clampPitch(mode)` — TP 0.06..0.85, FP
  -1.05..1.2 (+ = lihat bawah); `fpLookDir(yaw,pitch)` forward (-sin,-cos)·cos
  (konvensi orbit sama); `FP_EYE` 1.52 m di atas kaki.
- settingsStore += `camMode` (persist localStorage, default 'third').
- CameraRig: cabang gameplay kini bercabang FP/TP. FP hard-attach tanpa lerp
  (anti swim/through-wall), shake skala 0.22; TP kini mengikuti
  `smoothY = lerp(smoothY, playerPos.y, 1-e^(-9dt))` — lantai 2/3 Gedung B tak
  lagi menenggelamkan kamera. Mode switch → re-clamp pitch + snap 1 frame.
- App.tsx: tombol **V** toggle FP/TP di GAMEPLAY/COMBAT + notify;
  SettingsPanel: dropdown MODE KAMERA; Hud: crosshair `.fp-crosshair` saat FP
  + chip V KAMERA; PlayerFigure visible=false saat FP gameplay/kombat.
- Aturan main: DIALOGUE/CINEMATIC SELALU tampilkan badan Ren (shot butuh dia);
  wheel zoom hanya TPS; opening `fp_gate` tidak terpengaruh camMode.

## v0.12.0 Snapshot (2026-09-17)

**Arsitektur baru:**
- `src/game/story/StoryProps.tsx` — prop dunia pendukung cerita (kotak pensil
  jatuh, buku berserakan, botol, genangan air) per-node via `STORY_PROPS`
  (data/chapters.ts). Dipasang di App hanya untuk scene campus.
- Figure (Character.tsx) menerima `hold` (map/book/pencil/eraser/stack/bottle/
  phone) + state `sit`/`crouch` di FigureAnim dengan blending 0..1.
- `isPoseCut` (CameraRig) — hard-cut kamera saat pose sinematik pindah >6 m.
- quality.ts += `texScale`/`aniso` (256/192/128 px; aniso 4/2/1) — dibaca pbr
  sekali saat tekstur pertama dibangun.
- NpcDef += `sitAt` (periode duduk) & `sitFace` (titik hadap). Aris kursi
  (-4.0,11.3), Siti (-6.75,11.3), keduanya menghadap papan tulis.
- FPViewModel (App.tsx) — map merah/buku catatan di tangan Ren saat opening FP.

**Geometri gedung utama (v0.12.0):**
- Inti gudang (z 16..21) jadi lorong tembus lobi→koridor; pintu dobel z=21
  (x ±1.45, w 1.9); dinding z=16 inti DIHAPUS; bukaan vestibule x=±2 z 4..5.4
  + lintel; Vestibule punya lantai/plafon/lampu; papan pengumuman ke dinding
  barat lobi; jalur beton kantin (15.9, 3; 10.4×4.6) + lampu (11.4, 5.6).
- Verifikasi: scripts/qa-walkability.mjs 12/12 (raycast fisika, control solid).

**Staging bab 2:** aktor timur shaft tangga (gang 6.3/7.3, Aris 4.5–5.2,
prop buku/botol/genangan 4.85–5.85) — DI DALAM shaft ada undakan, jangan
menaruh aktor di x<4.2. Zona back_stairs r 7.5.

## Development state

**v0.11.0** integrates the final **GARIS MERAH** script (the team's narrative
canon for the final project demo): dialogue rewritten in the casual
school-kid register (Ren gue / Siti lu / Bimo lo / Aris aku-kamu) exactly
per the approved draft; story restructured around **three choice points**
and **four endings**. Chapter 3 (action route) now opens with the OSIS
approach montage (Siti corridor talk) and the **parking ambush FIGHT 2**
(new `parking_fight` encounter + `gang_ambush` quest + waypoint), before the
rooftop proposition (CHOICE 2, final wording). The **bad route** no longer
ends in a police raid — Ren becomes the gang's executor (extortion montage +
warehouse job), Aris starts fearing him, and he **graduates as the new gang
leader**: BAD ENDING 1 "Tunduk Pada Kekuasaan". The **resistance route**
climaxes with Aris's hostage situation in the back alley (Siti secretly
recording evidence), the goons fight, then the **FINAL BOSS duel vs Bimo**
(new `bimo_fight`, HP 150) and **CHOICE 3**: restrain → police + principal
arrive with the OSIS recording, Bimo's gang arrested, graduation photo with
Aris (new glasses) & Siti and the tea box → GOOD ENDING "Lulus Bersama";
brutal → Bimo critical in hospital, Ren reported/expelled/arrested → BAD
ENDING 2 "Rantai Dendam". Neutral route keeps "Lulus Tanpa Nama". The main
menu KREDIT button now opens a team-roles overlay (Ridho / Naufal / Fadlan /
Marcell) per the final project report. 120 unit tests green; tsc clean;
production build passing.

**v0.10.0** adds atmosphere and navigation on top of v0.9.0's render work:
(1) **day/night cycle** — campus & rooftop skies chase the school clock
through 7 keyframes (dawn→noon→golden hour→night) via `DayNightRig` +
`src/game/daynight.ts`; `TimeFlow` drifts the clock +1 min/3s while roaming,
hard-clamped to the current period end so period-gated quest triggers stay
intact (cap 19:30 in 'after' for reachable golden hour); (2) **objective
waypoints** — `src/game/waypoint.ts` maps every quest to a zone target,
`ObjectiveWaypoint` floats a wall-piercing diamond+beam over it in-world, and
the HUD mission card shows live distance (poll 400ms, no per-frame renders);
(3) **map fixes** — per-scene visited count (was global across scenes), same-
center zone nodes stacked with floor chips (Kelas 10-A/12-A/12-B), ◆ TUJUAN
marker, current-zone highlight, player heading arrow, scene-aware header tag,
and ESC now always closes overlays (map no longer race-opens PAUSE);
(4) **control/accessibility settings** — camera sensitivity, invert Y,
dialogue text speed, subtitle size (persisted, live-applied on all camera
input paths). 119 unit tests green; qa-nav smoke PASS (no console errors);
production build passing.

**v0.9.0** is a render-optimization pass on top of v0.8.0's buildings:
(1) **graphics quality presets** (auto/high/medium/low in Settings, persisted
to localStorage; live-applied DPR/shadow-map/Sky/fog via `GraphicsManager`,
`src/game/quality.ts`); (2) **render culling** — `<Cull>` bundles registered
in `runtime.ts` get hidden by `CullingManager` when fully outside the camera
frustum or beyond the interior range (whole Gedung B floors, room interiors,
library, greenery, props — hundreds of meshes dropped per sweep, throttled
~8 Hz, safe for the camera occlusion raycast); (3) **real loading screen** —
desktop devices prewarm the world during boot/menu and the bar tracks asset
progress + world-first-frame readiness (`WorldReadyProbe`/`BootGate`, fail-open
on dead render loops). Also fixed a v0.3-era bug where root Canvas lights and
per-scene lights both ran — shadow maps rendered twice.

**v0.8.0** adds two campus buildings on top of v0.7.0's story work:
**Gedung B** — a 3-storey classroom block (x 24..44, z -16..-2) whose
floors are all reachable via a real walkable switchback stair core
(first multi-storey building with true vertical traversal; `zoneAt` is
now y-aware so L2/L3 zones resolve separately) — and the
**Perpustakaan** (x 23..39, z 16..24) with full interior (shelves,
reading tables, counter), which now hosts the neutral-route Siti
confrontation shots and Siti's after-school schedule.

## Story routes (current — canon GARIS MERAH, v0.11.0)

- Opening (bab 1, first person): gate & map merah → classroom (Aris + bully
  line) → corridor (Siti warning, lu-register) → canteen whispers + Bimo
  entrance.
- **CHOICE 1** (bab 2, back stairs, water spill): [A] ignore Aris → neutral
  route; [B] help Aris → FIGHT 1 (stair fight) → Bimo impressed.
- Action route (bab 3): OSIS montage (Siti offers gang-violation data) →
  `gang_ambush` quest → **FIGHT 2** at the parking (`parking_fight`) →
  rooftop call → **CHOICE 2**: [A] accept → bad route; [B] reject →
  resistance route.
- Bad route (bab 4): executor montage (extortion, Aris fear) → warehouse
  job (`warehouse_fight`) → walk to the gate → **BAD ENDING 1 "Tunduk Pada
  Kekuasaan"** (graduates as the new gang leader).
- Resistance route (bab 4): retaliation montage (Siti promises to record) →
  `find_aris` → hostage scene in the back alley (Siti recording) → goons
  fight (`alley_fight`) → **FINAL BOSS Bimo** (`bimo_fight`) → **CHOICE 3**:
  [A] restrain → arrest scene → gate graduation with Aris & Siti → **GOOD
  ENDING "Lulus Bersama"**; [B] brutal → arrest & expulsion → **BAD ENDING 2
  "Rantai Dendam"**.
- Neutral route (bab 3-4): 4-scene montage (bruised Aris — cold "lo" register,
  Siti library confrontation inside the real library, Bimo dismissal, Aris
  resignation letter) → graduation-day walk to the gate → **NEUTRAL ENDING
  "Lulus Tanpa Nama"**.
- 4 endings total, resolved by `endingResolver` (route + CHOICE 3 flags
  `restrained_bimo` / `brutal_bimo`).

## Campus landmarks (current)

- Main building (accessible ground floor: hall, corridor, classroom, teacher room) + stair shaft → rooftop scene.
- **Gedung B (v0.8.0):** 3 floors, north open-air corridor, switchback stair, Kelas 10-A / 12-A / 12-B + Ruang OSIS / UKS / Loker, per-floor zones with y windows. Room doors (swung open) + lintels on every floor.
- Main-building classroom & teacher room also have doors (v0.8.0 `Door` component in props.tsx).
- **Perpustakaan (v0.8.0):** shelves, reading tables, loket; library zone, hidden events, Siti's `after` spot. Findable via the courtyard directional signpost (Perpustakaan/Kantin/Gedung B/Lapangan), facade sign, and the Indonesian-labeled map node.
- Canteen (accessible interior), parking, field, back alley, rear yard, warehouse exterior (+ warehouse interior scene).

## What already existed (audited 2026-09-10)

- Vite + React 18 + TS 5.9 + R3F 8 + Drei + Rapier 1.4 + Zustand 5 + Vitest 2. Node v22.17.1, npm 10.9.2. Not a git repo (initialized during Phase 0).
- Working: main menu (partial), opening dialogue + first choice (Help/Walk Past), basic third-person-ish camera with pointer lock, placeholder NPC meshes (Aris/Siti/Bimo), menu-based combat (J/K/L), localStorage save/load with validation, game over + restart, school GLB + character GLB rendering, 1 trivial test.
- Assets: `public/jamalpur_zilla_school_2022.glb` (7.6 MB, exterior school), `public/char.glb` (58 MB, 17 meshes, **no animations**), identical duplicates at repo root. `stitch/` UI mockups (main menu, status/quest/map) — implemented direction.

## What was broken (found in audit; fixes tracked in TODO/CHANGELOG)

1. NPC render positions ≠ interaction positions (Siti un-interactable at her visible spot).
2. Physics effectively disabled (`colliders={false}` everywhere) — no collision at all.
3. Movement per-keypress (OS auto-repeat dependent), not per-frame input.
4. Store persisted entire state to localStorage on every movement step.
5. Hardcoded HUD numbers (485/500 HP, 240/300 focus) inconsistent with combat (hp/100).
6. `story.ts` duplicate of `game.ts` (only test used it).
7. 58 MB uncompressed character GLB — heavy for web (compression attempted in Phase 16).
8. Menu-combat ≠ directive requirement (real-time).
9. No git repo; build artifacts (vite.config.js/.d.ts) generated into workspace.

## What is missing (planned)

Modular architecture, input abstraction, real player controller (jump/run/collision), camera system (FP→TP), data-driven dialogue/choices with effects, notifications, quest/relationship/reputation/stats systems, school time + schedules, study mini-game, inventory/map/phone, save v2, audio, VFX, chapters 2–4 with 3 endings, full UI set, accessibility, tests, production build QA.

## Recommended next phases

Phase 1–3 (foundation, core engine, player+camera) then vertical slice per TODO.md.
