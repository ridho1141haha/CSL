# TODO — Chaos School Life

Working checklist (phase model per master directive). ✅ done · 🚧 in progress · ⬜ todo

> **Synced 2026-09-11** against actual codebase review (not against CHANGELOG,
> which is over-optimistic). Status reflects what is actually shippable vs
> what is merely scaffolded code.
>
> Previous version of this file marked Phase 0-15 ✅ based on CHANGELOG 0.2.0
> claims — that was wrong. After deeper code review, several phases have
> **real bugs** that make them incomplete despite code existing.

---

## Phase 0 — Audit + Planning ✅
- ✅ Workspace audit, env audit (Node 22, npm 10.9), GLB inspection
- ✅ PROJECT_OVERVIEW / PRD / GDD / ARCHITECTURE / DECISIONS / PROJECT_STATE / TODO / CHANGELOG
- ✅ git init + baseline commit (committed via GitHub `ridho1141haha/CSL`)
- ⬜ README (release-grade — at Phase 18)

## Phase 1 — Foundation ✅
- ✅ Modular layout (data / stores / game / game-ui)
- ✅ Shared types (`src/types/index.ts`, 199 LoC) — comprehensive: Phase/GameMode/NpcId/Route/ChapterId/StoryBeat/Clock/ZoneId/Stats/QuestState/ItemCategory/Effect/Condition/Choice/Emotion/DialogueNode/CameraPose/CinStep/ChapterDef/EncounterDef/ItemDef/QuestDef/NpcDef/ZoneDef
- ✅ Styles baseline (`src/styles.css`)

## Phase 2 — Core Engine ✅
- ✅ Game mode state machine (BOOT → MAIN_MENU → OPENING_CINEMATIC → GAMEPLAY → DIALOGUE/CHOICE/COMBAT/menus → ENDING/GAME_OVER/TRANSITION) — 22 modes in `gameStore.ts`
- ✅ Input abstraction (`input.ts`, 140 LoC) — held keys, just-pressed, pointer lock, wheel
- ✅ Save v2 (`save.ts`, 201 LoC) — versioned, v1→v2 migration, per-field validation, 4 slots (auto/1/2/3)
- ✅ Notifications queue (in `gameStore`, capped at 5)

## Phase 3 — Player + Camera 🚧 (PARTIAL — has bugs)
- ✅ Rapier dynamic controller scaffolding (`Player.tsx`, 194 LoC) — capsule collider, lockRotations, ccd
- ✅ Camera system scaffolding (`CameraRig.tsx`, 173 LoC) — orbit/pitch/zoom, shoulder offset, occlusion ray
- ✅ Procedural animation fallback (`Character.tsx`, 175 LoC) — limb-swing Figure with attack/block/hurt/KO states
- ✅ FP→TP cinematic transition beat (in CameraRig `transitionT`)

### 🐛 BUGS FOUND (must fix before Phase 3 ✅):
- ⬜ **BUG-3.1: Pointer lock gating prevents camera orbit on first gameplay entry.**
  `CameraRig.tsx:36` — `if (document.pointerLockElement == null) return;` inside `onMove` handler.
  After FP→TP transition completes, the game sets `mode='GAMEPLAY'` but pointer lock only engages on click (`onClick` handler line 42). Player has no visual cue to click. New players will think the camera is broken.
  **Fix:** show "Klik untuk mengaktifkan kontrol" overlay when `mode=GAMEPLAY` && `pointerLockElement==null`.

- ⬜ **BUG-3.2: Run key conflicts with Dodge key.**
  `input.ts:28-29` — `ShiftLeft: ['run', 'dodge']` AND `ShiftRight: ['run', 'dodge']`. Both `run` and `dodge` fire on every Shift press. Per GDD §8: Shift hold = run, Shift tap = dodge. Current code can't distinguish tap vs hold — every Shift press triggers `justPressed('dodge')` in addition to `held.has('run')`.
  **Fix:** separate logic: `run` is held-state, `dodge` is edge-detected only on keyup-within-300ms (tap pattern).

- ⬜ **BUG-3.3: Player spawn position is `(7, 1.0, 29)` but ground is at y=0.**
  `Player.tsx:170` — `position={[spawnRef.current.x, 1.0, spawnRef.current.z]}`. Rapier capsule collider args=`[0.45, 0.3]` means half-height 0.45 + radius 0.3 = 0.75 above center. So capsule bottom is at y=1.0-0.75=0.25, slightly above ground (0). Player drops 0.25 units on spawn — minor but visible "thunk".
  **Fix:** set y=0.75 (resting on ground).

- ⬜ **BUG-3.4: Grounded ray cast too short — false negatives on slopes/steps.**
  `Player.tsx:105-106` — `world.castRay(ray, 1.05, true, ...)`. Ray length 1.05 from capsule center (y≈1.0) means it only hits ground at y≥-0.05. Any small bump or step makes player "airborne" → can't jump. GDD §17 doesn't specify; need to verify against school GLB geometry.
  **Fix:** extend to 1.3, or use `world.contactPair` for ground detection.

- ⬜ **BUG-3.5: `enemyPos.active` set but never read.**
  `runtime.ts:5` declares `enemyPos.active` (line 28 of CombatScene sets it true), but no code reads it. Dead state. Either remove or use to gate non-combat NPC proximity checks.

- ⬜ **VERIFY-3.6: No browser smoke test yet.**
  Phase 3 functionality is **code-complete but unverified in-browser**. Need to confirm:
  - Player actually moves on WASD
  - Camera actually orbits on mouse move (after click)
  - Jump works
  - Run vs walk distinguishable
  - FP→TP transition smooth
  - No fall-through-ground on spawn

## Phase 4 — World ✅
- ✅ School grounds layout (gate / courtyard / canteen / field / back alley / parking / street edge) — 10 zones in `data/world.ts`
- ✅ Ground + bounds colliders, perimeter fence with gate opening (`World.tsx`, 337 LoC)
- ✅ Props per zone (GateProps, CanteenProps, FieldProps, AlleyProps, ParkingProps, WarehouseProps, Trees)
- ✅ Area registry (`data/world.ts`, 63 LoC) + `zoneAt()` lookup + map nodes
- ✅ School GLB loaded (`/jamalpur_zilla_school_2022.glb`, 7.3 MB) + building collider
- ✅ Camera pose registry (16 poses for cinematic + 6 story beats) in `CAMERA_POSES`

## Phase 5 — NPC ✅
- ✅ Character rig for Aris/Siti/Bimo/Pak Budi + generic students (procedural `Figure`)
- ✅ Schedules per period, waypoint movement, nameplates, interaction proximity (`Npc.tsx`, 138 LoC + `data/npcs.ts`, 91 LoC)
- ✅ Ambient student wanderers (7 NPCs with home+wander pattern)
- ⬜ Animated GLB models — DECISIONS.md #13: char.glb has no skeleton; `Character.tsx` accepts GLB override but no animated GLB exists yet. Compressed NPC GLBs in `public/npc/compressed/` ready for future swap-in (158 MB → 21.5 MB).

## Phase 6 — Dialogue + Choice ✅
- ✅ DialogueNode graph data (`data/dialogue.ts`, 291 LoC) — ~60 nodes
- ✅ DialogueUI typewriter, portraits, keyboard nav, skip (`DialogueUI.tsx`, 111 LoC)
- ✅ Choice effects pipeline → stats/relationships/flags + notifications (`systems/effects.ts`, 109 LoC)
- ✅ Condition evaluation (`systems/conditions.ts`, 33 LoC)
- ✅ Special nodes `__combat__` and `__study__` for encounter/study triggers

## Phase 7 — Opening Vertical Slice ✅
- ✅ Canon scenes 1–6 implemented as dialogue graph (`o1_1` → `o7_1`, 24 nodes)
- ✅ Mandatory first choice Help/Walk Past (`o3_choice` with effects)
- ✅ Siti intervention + Bimo observation (`o4_*` → `o6_*`)
- ✅ FP→TP transition at `o7_1` via `NODE_FX`
- ✅ EXPLORE objective trigger after transition

## Phase 8 — Combat 🚧 (PARTIAL — has bugs)
- ✅ Player FSM scaffolding (`combat.ts`, 325 LoC) — IDLE/ATTACK(light/heavy)/BLOCK/DODGE/STAGGER/KO
- ✅ Enemy FSM AI (spawn/approach/windup/strike/recover/hurt/stagger/ko)
- ✅ Hit detection via range+facing cone (DECISIONS.md #3 compliant)
- ✅ Hit pause, camera shake, hurt flash VFX

### 🐛 BUGS FOUND:
- ⬜ **BUG-8.1: Block can be held infinitely with no stamina cost.**
  `combat.ts:138` — `playerCombat.block = input.mouse.right && player.focus > 0;` but `block` never decrements Focus. Per GDD §5.2: block is a state, but design intent is Focus-cost-on-block. Currently free infinite block.
  **Fix:** drain Focus while blocking (e.g., 2/sec); release block when Focus hits 0.

- ⬜ **BUG-8.2: Block hit detection cone uses wrong angle math.**
  `combat.ts:232` — `Math.abs(angleDiff(Math.atan2(-dx, -dz), player.facing))`. Player faces `atan2(vx, vz)` (movement direction). Enemy at `(dx, dz)` from player. To block, player should face enemy: `atan2(dx, dz)`. Using `-dx, -dz` is the angle from enemy to player, which is reversed.
  **Fix:** use `atan2(dx, dz)` (player looking toward enemy).

- ⬜ **BUG-8.3: Enemy FSM has no `idle` or `detect` state in transition logic.**
  Type declares `idle | approach | windup | strike | recover | hurt | stagger | ko | spawn` (line 41) but switch statement (line 203) only handles spawn/approach/windup/strike/recover/hurt/stagger/ko. `idle` declared but never entered — enemy is always immediately approaching.
  **Fix:** add `idle` case (wait until player within perception radius, then transition to `approach`).

- ⬜ **VERIFY-8.4: No browser smoke test.** Need to confirm combat feels physical, hit pause works, enemy AI doesn't get stuck.

## Phase 9 — Quest + School life ✅
- ✅ Quest system (MAIN/SIDE/EVENT states) — `questStore.ts` + `data/quests.ts` (92 LoC)
- ✅ Time system + periods + NPC schedules integration (`systems/time.ts`, 47 LoC)
- ✅ Study mini-game (`systems/study.ts`, 16 LoC) + 5 questions in `data/chapters.ts`

## Phase 10 — Social ✅
- ✅ Relationship −100…+100 + labels (`systems/relationship.ts`, 22 LoC)
- ✅ Reputation states (`systems/reputation.ts`, 12 LoC)
- ✅ Violence/diplomacy/reputation/academic/focus stat accrual
- ✅ Relationship menu with portraits/status (`RelationshipsPanel`)

## Phase 11 — World expansion ✅
- ✅ Back alley set-dressing (Resistance finale arena)
- ✅ Street edge, gate exterior conflict zone
- ✅ Warehouse finale arena (Bad Route) — `WarehouseProps` in `World.tsx`

## Phase 12 — Story expansion ✅
- ✅ Chapter 2 (gate conflict → first combat)
- ✅ Chapter 3 (rooftop proposition ACCEPT/REJECT)
- ✅ Bad route (warehouse finale → arrest → expelled)
- ✅ Resistance route (Aris cornered → help/walk away)
- ✅ EndingResolver + 3 endings (BAD/TRUE/BITTER) — `systems/endingResolver.ts`, 47 LoC, pure function

## Phase 13 — Full UI ✅
- ✅ HUD (`Hud.tsx`, 91 LoC) + CombatHud
- ✅ Inventory/Map/Phone/Pause/Settings/SaveLoad/Game Over/Ending screens
- ✅ Diegetic phone (Messages/Contacts/Schedule/Notes)
- ✅ Full keyboard navigation in menus (arrows + WASD + Esc)

## Phase 14 — Audio + VFX ✅
- ✅ WebAudio synth buses (MASTER/MUSIC/SFX/UI/AMBIENT) — `audio.ts`, 175 LoC
- ✅ Hooks: footsteps, jump, attack, hit, dodge, UI hover/click, chapter sting, ambient
- ✅ VFX: hit pause, camera shake, hurt flash, fade transitions

## Phase 15 — Polish ✅
- ✅ Lighting: ACES tonemapping, fog, shadow map 2048, hemisphere + directional
- ✅ Nameplates, camera feel, UI cohesion
- ✅ Menu keyboard nav (arrows + WASD + Esc)

## Phase 16 — Optimization 🚧
- ✅ Bundle audit — 3.4 MB JS / 1.16 MB gzip (Three.js dominates; acceptable)
- ✅ GLB compression — completed 2026-09-11
  - NPC `.glb` models: **158 MB → 21.5 MB (86.4% reduction)**
  - Output in `public/npc/compressed/`
  - ⬜ Swap-in deferred: game currently uses procedural `Figure`, not GLB. Compressed files ready for future animated swap.
- ✅ Render/perf guards (dpr clamp [1,2], shadows 2048, throttled store writes @ 12 frames, few physics bodies)
- ⬜ Code-splitting for Three.js chunks (optional — bundle acceptable)
- ⬜ Texture compression for school GLB (7.3 MB → target 2 MB)

## Phase 17 — QA 🚧
- ✅ Vitest suites: **30/30 tests pass**
  - `src/test/systems.test.ts` (22 tests)
  - `src/test/dialogue.test.ts` (8 tests)
- ✅ Build passes (`tsc -b && vite build`) — fixed 3 TS errors 2026-09-11
- ⬜ **Browser smoke test — NOT DONE.** Critical gap.
  Need to verify: menu→opening→choice→explore→combat→save→load→ending

## Phase 18 — Release ⬜
- ⬜ Production build verification (`npm run build` passes ✅; `npm run preview` untested)
- ⬜ README (run/build/deploy/controls)
- ⬜ Final report
- ⬜ Bug fixes for Phase 3 & Phase 8 (see above) before declaring "done"

---

## Priority Bug Fix List (blockers for Phase 3 ✅)

1. **BUG-3.1** Pointer lock UX — show "click to control" hint
2. **BUG-3.2** Run/Dodge key conflict — separate tap vs hold
3. **BUG-3.3** Spawn position floating 0.25u
4. **BUG-3.4** Grounded ray too short
5. **BUG-8.1** Block free infinite — drain Focus
6. **BUG-8.2** Block hit cone reversed angle
7. **BUG-8.3** Enemy FSM missing idle state
8. **VERIFY-3.6 + 8.4** Browser smoke test
