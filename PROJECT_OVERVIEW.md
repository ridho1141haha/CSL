# CHAOS SCHOOL LIFE — Project Overview

- **Game:** Chaos School Life (CSL)
- **Genre:** Action-Adventure, Narrative, Social Simulation
- **Platform:** Web browser (desktop primary)
- **Tech:** React + TypeScript + Vite + React Three Fiber + Drei + Rapier + Zustand
- **Perspective:** Third-person gameplay, first-person cinematic opening
- **Status:** In development (see PROJECT_STATE.md)

## One-liner

Ren, a transfer student at SMA Yuson, just wants good grades and a quiet graduation — but the school runs on bullying and gang influence, and every choice he makes changes who he becomes.

## Canonical source of truth

1. Master directive (2026-09) — canon characters **REN, ARIS, SITI, BIMO**, location **SMA YUSON**, chapter structure, route/ending structure.
2. `../CSL_PRD.md` (v0.1) — original PRD; contains a **superseded** character roster (see DECISIONS.md #1).
3. `/mnt/data/Final project (1).docx` — **not found** on this machine; directive canon applies.

## Core loop

Daily activity → explore school → interact with NPCs → quests/events → player choices → real-time combat / story events → next chapter → final choice → ending (TRUE / BITTER / BAD).

## The three endings (canon)

| Ending | Title | Trigger |
|---|---|---|
| BAD | "Rantai Dendam" | Accept Bimo's offer (Chapter 3) |
| TRUE | "Kebenaran & Solidaritas" | Reject Bimo → help Aris in the final test |
| BITTER | "Lulus Tapi Sendirian" | Reject Bimo → walk away from Aris |

## Development approach

Vertical slices, playable at every phase, phase order defined in the master directive (Phases 0–18). Status tracked in PROJECT_STATE.md and TODO.md.
