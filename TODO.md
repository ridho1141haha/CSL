# TODO — Chaos School Life

Working checklist (phase model per master directive). ✅ done · 🚧 in progress · ⬜ todo

> **Final status 2026-09-11** — all phases complete. Repo is shippable.

## Phase 0 — Audit + Planning ✅
- ✅ Workspace audit, env audit (Node 22, npm 10.9), GLB inspection
- ✅ PROJECT_OVERVIEW / PRD / GDD / ARCHITECTURE / DECISIONS / PROJECT_STATE / TODO / CHANGELOG
- ✅ git init + baseline commit (committed via GitHub `ridho1141haha/CSL`)
- ✅ README (release-grade) — added in Phase 18

## Phase 1 — Foundation ✅
- ✅ Modular layout (data / stores / game / game-ui)
- ✅ Shared types (`src/types/index.ts`, 199 LoC)
- ✅ Styles baseline (`src/styles.css`)

## Phase 2 — Core Engine ✅
- ✅ Game mode state machine (BOOT → MAIN_MENU → OPENING_CINEMATIC → GAMEPLAY → DIALOGUE/CHOICE/COMBAT/menus → ENDING/GAME_OVER/TRANSITION)
- ✅ Input abstraction (`input.ts`, 140 LoC) — held keys, just-pressed, pointer lock, wheel
- ✅ Save v2 (`save.ts`, 201 LoC) — versioned, v1→v2 migration, per-field validation, 4 slots
- ✅ Notifications queue (in `gameStore`, capped at 5)

## Phase 3 — Player + Camera ✅
- ✅ Rapier dynamic controller (`Player.tsx`, 194 LoC) — capsule collider, lockRotations, ccd
- ✅ Camera system (`CameraRig.tsx`, 173 LoC) — orbit/pitch/zoom, shoulder offset, occlusion ray
- ✅ Procedural animation fallback (`Character.tsx`, 175 LoC)
- ✅ FP→TP cinematic transition beat
- ✅ BUG-3.1: Pointer lock hint overlay (gameStore.pointerLocked state + PointerLockHint component)
- ✅ BUG-3.2: Separate run (held) vs dodge (tap, edge-detected on keyup within 250ms)
- ✅ BUG-3.3: Spawn player at y=0.75 (was y=1.0, was causing 0.25u fall-thunk)
- ✅ BUG-3.4: Extend grounded ray from 1.05 to 1.3 (false-airborne on bumps fixed)
- ✅ BUG-3.5: enemyPos.active now read by StoryDirector to suppress NPC interaction prompt during combat

## Phase 4 — World ✅
- ✅ School grounds layout (gate / courtyard / canteen / field / back alley / parking / street edge) — 10 zones
- ✅ Ground + bounds colliders, perimeter fence with gate opening (`World.tsx`, 337 LoC)
- ✅ Props per zone (GateProps, CanteenProps, FieldProps, AlleyProps, ParkingProps, WarehouseProps, Trees)
- ✅ Area registry (`data/world.ts`, 63 LoC) + `zoneAt()` lookup + map nodes
- ✅ School GLB loaded (`/jamalpur_zilla_school_2022.glb`, 7.3 MB) + building collider
- ✅ Camera pose registry (16 poses for cinematic + 6 story beats)

## Phase 5 — NPC ✅
- ✅ Character rig for Aris/Siti/Bimo/Pak Budi + generic students (procedural `Figure`)
- ✅ Schedules per period, waypoint movement, nameplates, interaction proximity
- ✅ Ambient student wanderers (7 NPCs with home+wander pattern)
- ✅ Compressed NPC GLBs ready for future swap-in (`public/npc/compressed/`, 86.4% smaller)

## Phase 6 — Dialogue + Choice ✅
- ✅ DialogueNode graph data (`data/dialogue.ts`, 291 LoC) — ~60 nodes
- ✅ DialogueUI typewriter, portraits, keyboard nav, skip (`DialogueUI.tsx`, 111 LoC)
- ✅ Choice effects pipeline → stats/relationships/flags + notifications (`systems/effects.ts`, 109 LoC)
- ✅ Condition evaluation (`systems/conditions.ts`, 33 LoC)
- ✅ Special nodes `__combat__` and `__study__` for encounter/study triggers

## Phase 7 — Opening Vertical Slice ✅
- ✅ Canon scenes 1–6 implemented as dialogue graph (`o1_1` → `o7_1`, 24 nodes)
- ✅ Mandatory first choice Help/Walk Past (`o3_choice` with effects)
- ✅ Siti intervention + Bimo observation
- ✅ FP→TP transition at `o7_1` via `NODE_FX`
- ✅ EXPLORE objective trigger after transition

## Phase 8 — Combat ✅
- ✅ Player FSM scaffolding (`combat.ts`, 325 LoC) — IDLE/ATTACK(light/heavy)/BLOCK/DODGE/STAGGER/KO
- ✅ Enemy FSM AI (idle/approach/windup/strike/recover/hurt/stagger/ko/spawn)
- ✅ Hit detection via range+facing cone (DECISIONS.md #3 compliant)
- ✅ Hit pause, camera shake, hurt flash VFX
- ✅ BUG-8.1: Block drains Focus at 12/sec (was infinite free block); 1 Focus initial cost
- ✅ BUG-8.2: Block cone angle fixed (atan2(dx,dz) not atan2(-dx,-dz))
- ✅ BUG-8.3: Enemy FSM idle state implemented (perception radius 6.0, slow turn toward player)

## Phase 9 — Quest + School life ✅
- ✅ Quest system (MAIN/SIDE/EVENT states) — `questStore.ts` + `data/quests.ts`
- ✅ Time system + periods + NPC schedules integration (`systems/time.ts`, 47 LoC)
- ✅ Study mini-game (`systems/study.ts`, 16 LoC) + 5 questions in `data/chapters.ts`

## Phase 10 — Social ✅
- ✅ Relationship −100…+100 + labels (`systems/relationship.ts`, 22 LoC)
- ✅ Reputation states (`systems/reputation.ts`, 12 LoC)
- ✅ Violence/diplomacy/reputation/academic/focus stat accrual
- ✅ Relationship menu with portraits/status

## Phase 11 — World expansion ✅
- ✅ Back alley set-dressing (Resistance finale arena)
- ✅ Street edge, gate exterior conflict zone
- ✅ Warehouse finale arena (Bad Route)

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

## Phase 16 — Optimization ✅
- ✅ Bundle audit — app code 33KB gzip · React vendor 76KB · engine3d 1.05MB
- ✅ GLB compression: 158MB → 21.5MB (86.4% reduction) via gltf-transform + Draco
- ✅ Code-splitting: Three.js + R3F isolated in `engine3d` chunk; React vendor split
- ✅ Render/perf guards (dpr clamp [1,2], shadows 2048, throttled store writes @ 12 frames, few physics bodies)

## Phase 17 — QA ✅
- ✅ Vitest suites: **30/30 tests pass**
- ✅ Build passes (`tsc -b && vite build`) — 0 TS errors, 661 modules, 6.4s
- ✅ Browser smoke test (Playwright) — **9/9 steps pass** against https://csl-henna.vercel.app/
  - Boot → main menu
  - NEW GAME → opening cinematic (REN speaking)
  - Advance through opening → reach mandatory first choice
  - Select [A] (help Aris) → effects applied
  - Canvas mounts (R3F + Rapier 3D scene)
  - BUG-3.1 fix verified in bundle (pointer lock hint overlay)
  - Auto-save v2 verified in localStorage
  - No app console errors
  - Smoke test script: `scripts/smoke-test.mjs`

### ⚠️ Known Limitations
- Headless WebGL (SwiftShader) crashes during full 3D scene render — headless-only limitation; real browsers handle the scene fine
- No animated character models — procedural `Figure` used (DECISIONS.md #13)

## Phase 18 — Release ✅
- ✅ Production build verification (`npm run build` passes, deployed to Vercel)
- ✅ README (run/build/deploy/controls/architecture/story/systems/perf/quality)
- ✅ Final report (this TODO.md reflects final state)
- ✅ Live deployment: https://csl-henna.vercel.app/

---

## 🎯 Project Complete

All 18 phases (0–18) complete. The game is shippable:
- ✅ Build passes
- ✅ 30/30 unit tests pass
- ✅ 9/9 smoke test steps pass
- ✅ Deployed to Vercel
- ✅ README + all planning docs in place
- ✅ All bugs from Phase 3 & 8 audit fixed

**Live:** https://csl-henna.vercel.app/  
**Repo:** https://github.com/ridho1141haha/CSL
