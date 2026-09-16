# Project State

Updated: 2026-09-16 (v0.8.0 — Gedung B bertingkat + perpustakaan)

## Development state

**v0.8.0** adds two campus buildings on top of v0.7.0's story work:
**Gedung B** — a 3-storey classroom block (x 24..44, z -16..-2) whose
floors are all reachable via a real walkable switchback stair core
(first multi-storey building with true vertical traversal; `zoneAt` is
now y-aware so L2/L3 zones resolve separately) — and the
**Perpustakaan** (x 23..39, z 16..24) with full interior (shelves,
reading tables, counter), which now hosts the neutral-route Siti
confrontation shots and Siti's after-school schedule. 91 unit tests
green; production build passing.

## Story routes (current)

- Opening: gate & map merah → classroom (Aris) → corridor (Siti) → canteen whispers + Bimo entrance.
- Bab 2 fork at the back stairs: [A] ignore → neutral route; [B] defend Aris → stair_fight → Bimo impressed → rooftop → bad/resistance (unchanged).
- Neutral: 4-scene montage (bruised Aris, Siti library confrontation — now framed inside the real library —, Bimo dismissal, Aris resignation letter) → graduation-day walk to the gate → ending.

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
