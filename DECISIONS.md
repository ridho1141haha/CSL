# Decisions Log

Format: #N — decision, rationale, status (IMPLEMENTED / PROPOSED).

## #1 Canon roster vs PRD v0.1 — IMPLEMENTED
`../CSL_PRD.md` v0.1 lists Satria, Kayla, Pak Budi, Dimas, Salsabila. Master directive canon is **Ren, Aris, Siti, Bimo** (and matches existing code/story). Decision: directive canon wins. Dimas (gang leader role) merges into **Bimo**; Satria/Kayla/Salsabila omitted from this release; **Pak Budi** (teacher/academic gateway) retained — sourced from PRD, marked [PROPOSED] content.

## #2 char.glb has zero animations — IMPLEMENTED
Inspected GLB: `animations: []`. Current code assumes clips. Decision: `Character.tsx` supports GLB clips when present, else procedural fallback (idle sway/walk bob/lean). Final GLBs (Ren/Aris/Siti/Bimo) remain drop-in replaceable.

## #3 Combat hit detection at gameplay level — IMPLEMENTED
Rapier is used for locomotion/collision only. Attacks resolve via range+facing checks (deterministic, testable, cheap). Physics impulses not used for damage.

## #4 Audio = procedural WebAudio — IMPLEMENTED
No audio asset files exist. Synthesized SFX/music stings via WebAudio with MASTER/MUSIC/SFX/UI/AMBIENT buses; silent no-op fallback. Replaceable later by sample manifest.

## #5 Save v2 with v1 migration — IMPLEMENTED
Old `csl-save-v1` schema lacks chapter/route/time/inventory. New key `csl-save-v2`, versioned, per-field validated; v1 payloads migrated on load.

## #6 Playable area = school grounds; distant scenes framed cinematically — IMPLEMENTED
School GLB is an exterior. Grounds (gate, courtyard, canteen, field, back alley, parking, outside street edge) are walkable zones; rooftop scene (Ch.3) and warehouse finale (Bad Route) play as set-dressed cinematic arenas at dedicated map zones instead of full interiors. Keeps scope dense and shippable.

## #7 GLB duplication (root + public/) — IMPLEMENTED (kept, documented)
Root `char.glb`/`jamalpur_zilla_school_2022.glb` are byte-identical duplicates of `public/`. Kept as source originals; only `public/` is served. Compression attempt logged in PROJECT_STATE (Phase 16).

## #8 Menu-combat (J/K/L) replaced by real-time combat — IMPLEMENTED
Legacy menu combat violates PILLAR 4 and directive §42; fully replaced by real-time system.

## #9 Duplicate `story.ts` module retired — IMPLEMENTED
`src/story.ts` (older duplicate of `game.ts`, used only by a trivial test) is removed; data/story logic lives in `src/data` + stores; tests target pure systems.

## #10 Study mini-game content — PROPOSED
Five-question mixed quiz (Math/Bahasa/English) authored as [PROPOSED]; rewards Academic/Focus. Easy to re-skin per canon feedback.

## #11 Time advance model — IMPLEMENTED
No continuous real-time pressure: time advances on activities, dialogue completions, and area transitions (keeps exploration stress-free, per "do not force repetitive schedules").

## #12 Pak Budi NPC — PROPOSED (from PRD)
Teacher NPC near faculty area enabling study/class activities and academic consequences.
