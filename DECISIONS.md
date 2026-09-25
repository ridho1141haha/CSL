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

## #13 char.glb is a static mesh (no skeleton) — IMPLEMENTED
Inspection: `skins: 0`, `animations: []` — a 58 MB model that cannot be animated. Decision: runtime characters (Ren + NPCs) use a stylized procedural figure with limb-swing animation; `Character` accepts an optional GLB override for when final animated models arrive. char.glb is no longer loaded at boot (cuts ~58 MB from initial load); school GLB remains.

## #14 Cinematic camera via node→pose map — IMPLEMENTED
Cutscenes map each dialogue node id to a camera pose (CAM_BY_NODE) + actor placements (OPENING_ACTORS). Runner is data-driven; new scenes need no code changes.

## #13 Cycle-free module graph — IMPLEMENTED (v0.17.0)
madge audit found 2 cycles rooted at dialogueStore ⇄ effects and save → combat. Policy: stores may import systems/data; systems may import stores; but the graph must be acyclic — enforced by `npm run check:cycles` (madge devDep). `loadGame` orchestration lives in `game/loadFlow.ts`; save.ts is pure storage. One dynamic-import edge remains (effects 'save' checkpoint) — documented, tolerated.

## #14 Registry completeness over registry count — IMPLEMENTED (v0.17.0)
No new "manager" layers. Instead the EXISTING registries became single-source: NpcDef carries storyCast/relTag/relQuote/hiddenWhen (stores/migration/UI/visibility derive); QuestDef carries waypoint/completeWhen/onComplete; ChapterDef carries defaultBeat/subtitleByRoute; SceneDef carries exits. Deliberately NOT done: a runtime StoryBeat enum-validation list (a hand-maintained beat set would drift — same disease we removed); type-level check only until a beat registry exists.

## #15 Character/actor asset seam — DEFERRED until first GLB (v0.17.0)
Repo has zero GLBs (audit). Character.tsx `Figure` + `actId` is THE choke point where a renderer switch (procedural vs GLB with fallback) will go; NpcDef visual fields (color/skin/hair/…) already form the procedural asset definition. No speculative loader code until a real asset exists (rule: no abstraction without a consumer).
