# Changelog

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
