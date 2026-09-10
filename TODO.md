# TODO — Chaos School Life

Working checklist (phase model per master directive). ✅ done · 🚧 in progress · ⬜ todo

## Phase 0 — Audit + Planning 🚧
- ✅ Workspace audit, env audit (Node 22, npm 10.9), GLB inspection, docx search (not found; `../CSL_PRD.md` reviewed)
- ✅ PROJECT_OVERVIEW / PRD / GDD / ARCHITECTURE / DECISIONS / PROJECT_STATE / TODO / CHANGELOG
- ⬜ git init + baseline commit
- ⬜ README (release-grade at Phase 18)

## Phase 1 — Foundation ⬜
- ⬜ Modular layout (data / stores / game / game-ui), shared types, styles baseline

## Phase 2 — Core Engine ⬜
- ⬜ Game mode state machine (BOOT…ENDING) in gameStore
- ⬜ Input abstraction (held keys, just-pressed, pointer lock, wheel)
- ⬜ Save v2 (versioned, migrate v1) + loading screen + boot flow
- ⬜ Notifications queue

## Phase 3 — Player + Camera ⬜
- ⬜ Rapier dynamic controller: WASD accel/decel, run, jump, gravity, ground check
- ⬜ Third-person camera: orbit/pitch/zoom, shoulder offset, lerp, occlusion
- ⬜ Procedural animation fallback + GLB clip support (character rig)
- ⬜ FP→TP cinematic transition

## Phase 4 — World ⬜
- ⬜ School grounds layout: gate / courtyard / canteen / field / back alley / parking / street edge zones
- ⬜ Ground + bounds colliders, props, landmarks, fog/lighting pass
- ⬜ Area registry (data/world.ts) + location label + map nodes

## Phase 5 — NPC ⬜
- ⬜ Character rig for Aris/Siti/Bimo/Pak Budi + generic students
- ⬜ Schedules per period, waypoint movement, nameplates, interaction proximity

## Phase 6 — Dialogue + Choice ⬜
- ⬜ DialogueNode graph data (id/speaker/text/emotion/next/choices/conditions/effects)
- ⬜ DialogueUI typewriter, portraits, keyboard nav, skip
- ⬜ Choice effects pipeline → stats/relationships/flags + notifications

## Phase 7 — Opening Vertical Slice ⬜
- ⬜ Canon scenes 1–6 (FP arrival → bullying encounter → first choice → Siti → Bimo notices → TP transition + HUD + EXPLORE objective)

## Phase 8 — Combat ⬜
- ⬜ Player: light/heavy attack, block, dodge; states IDLE…KO
- ⬜ Enemy FSM AI (detect/approach/attack/stagger/KO), encounter data
- ⬜ Hit pause, camera shake, flash VFX, damage feedback

## Phase 9 — Quest + School life ⬜
- ⬜ Quest system (MAIN/SIDE/EVENT; states) + quest menu
- ⬜ Time system + periods + NPC schedules integration
- ⬜ Study mini-game (PROPOSED content) + classroom activity + Pak Budi

## Phase 10 — Social ⬜
- ⬜ Relationship −100…+100 + labels; reputation states; violence/diplomacy accrual
- ⬜ Relationship menu with portraits/status

## Phase 11 — World expansion ⬜
- ⬜ Back alley set-dressing (Resistance finale arena), street edge, gate exterior conflict zone

## Phase 12 — Story expansion ⬜
- ⬜ Chapter 2 (gate conflict, first combat), Chapter 3 (rooftop proposition ACCEPT/REJECT)
- ⬜ Bad route (warehouse finale, arrest), Resistance route (Aris cornered → help/away)
- ⬜ EndingResolver + 3 endings (BAD/TRUE/BITTER) + chapter transitions

## Phase 13 — Full UI ⬜
- ⬜ HUD/objective/interact prompt, inventory (categories/use), map, phone, pause, settings, save/load slots, game over, ending screens

## Phase 14 — Audio + VFX ⬜
- ⬜ WebAudio synth buses + hooks (steps/attack/hit/dodge/UI/stings/ambience)
- ⬜ Transitions (fade), combat VFX pass

## Phase 15 — Polish ⬜
- ⬜ Lighting/materials pass, nameplates, camera feel, UI cohesion, menu keyboard nav

## Phase 16 — Optimization ⬜
- ⬜ Bundle audit; GLB compression attempt (gltf-transform) — log result
- ⬜ Render/perf guards (dpr clamp, shadows, throttled store writes, few bodies)

## Phase 17 — QA ⬜
- ⬜ Vitest suites: save, endingResolver, relationship, time, effects/conditions, study
- ⬜ Build passes (tsc + vite), zero blocking TS errors
- ⬜ Browser smoke test (menu→opening→choice→explore→combat→save) — log result

## Phase 18 — Release ⬜
- ⬜ Production build + preview verification
- ⬜ README (run/build/deploy/controls), final report
