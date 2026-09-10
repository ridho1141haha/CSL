# PRD — Chaos School Life

Version 0.2 — supersedes `../CSL_PRD.md` v0.1 (which is retained as historical source). Canon: master directive 2026-09.

## 1. Problem / Opportunity

Browser 3D games that combine school-life simulation, real-time action, and consequence-driven narrative are rare, especially with Indonesian-language storytelling. CSL targets that gap as an original IP (no copyrighted assets/content).

## 2. Target user & platform

- Desktop/laptop browser users (Chrome/Edge/Firefox), keyboard + mouse.
- Primary resolution 1920×1080; must remain usable at 1600×900, 1366×768, 1280×720, 1139×678.
- Performance P0: acceptable framerate on average laptop integrated graphics.

## 3. Product goals

1. A complete, shippable game: main menu → opening → 4 chapters → 3 endings.
2. Real-time manual combat (no autobattle), responsive third-person controller.
3. Social systems that make choices matter: relationships, reputation, academic, focus, violence, diplomacy.
4. School-life loop: time/periods, schedule, study activity, quests.
5. All content original; canon story preserved (see GDD §Story).

## 4. Feature set (MVP → release)

| Feature | Priority |
|---|---|
| Third-person controller (WASD, run, jump, collision) | P0 |
| Third-person camera (orbit, zoom, pitch, collision-aware) | P0 |
| First-person opening cinematic → third-person transition | P0 |
| Data-driven dialogue + choices with effects | P0 |
| Real-time combat (light/heavy attack, block, dodge, enemy AI) | P0 |
| Story: Ch.1–4, routes, 3 endings + EndingResolver | P0 |
| Save/load (versioned, localStorage) | P0 |
| HUD + full menu set (status, relationships, quests, inventory, map, phone, pause, settings) | P1 |
| Quest system (main/side/event) | P1 |
| Relationship & reputation systems | P1 |
| Academic / focus / violence / diplomacy stats | P1 |
| School time + NPC schedules | P1 |
| Study mini-game | P1 |
| Notifications (queued) | P1 |
| Audio (procedural WebAudio hooks) | P2 |
| VFX (hit pause, camera shake, transitions) | P2 |
| Accessibility basics (contrast, reduced motion, volumes, keyboard nav) | P2 |

## 5. Non-goals (current)

Large open world, mobile-first polish, multiplayer, deep daily simulation, stealth systems, controller/mobile input (architecture supports later).

## 6. Success criteria

See master directive §93 (final acceptance checklist). Minimum content per `../CSL_PRD.md` §14: 3 endings, core NPCs, core quests, basic real-time combat, working save system — all must be real and playable.

## 7. Open questions

| Item | Decision |
|---|---|
| Roster conflict with PRD v0.1 | Resolved — directive canon (DECISIONS.md #1) |
| Interior navigation of school GLB | Playable area = school grounds; interiors/rooftop via cinematic framing (DECISIONS.md #6) |
| Final GLB character models | Placeholder + procedural animation; swap-in supported (DECISIONS.md #2) |
| Mobile | Deferred |
