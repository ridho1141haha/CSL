# Project State

Updated: 2026-09-17 (v0.11.0 — GARIS MERAH final script: 3 choice points, 4 endings, team credits)

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
