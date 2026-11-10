// CSL asset manifest — single source of truth for character GLB locations.
//
// PHASE 1 (character runtime integration): the Blender pipeline
// (tools/blender/build_characters.py) exports rigged GLBs with skeletal
// animation clips. This manifest fixes the contract between the pipeline
// output and the runtime so both sides can evolve independently:
//
//   - RUNTIME location (source of truth for the game): public/models/<glb>.
//     Served by Vite from public/, referenced as /models/<file> — matches
//     CHAR_GLB_PATHS in game/npc/characters.ts (which stays the runtime
//     path table; this manifest adds the pipeline mapping on top).
//   - PIPELINE output: `blender -b --python tools/blender/build_characters.py
//     -- --out <dir>` writes <file>.glb per csl_specs.py (`ren`, `aris`,
//     `siti`, `bimo`, `pak_budi`) + blend/<file>.blend + build_report.json.
//
// The pipeline file names differ from the runtime names (pak_budi vs
// csl_char_budi) — the mapping below is the bridge. Until rigged GLBs are
// exported and copied into public/models, the runtime keeps loading the
// legacy joint-rig GLBs (auto-detected at load time — see GlbFigure).

export type CharacterAssetEntry = {
  /** Runtime character id (game/npc/characters.ts CharModelId). */
  id: string;
  /** Path the runtime loads (Vite public/ root-relative). */
  glb: string;
  /** File name produced by tools/blender/csl_specs.py SPECS[file]. */
  pipelineFile: string;
};

export const CHARACTER_ASSETS: CharacterAssetEntry[] = [
  { id: 'ren', glb: '/models/csl_char_ren.glb', pipelineFile: 'ren' },
  { id: 'aris', glb: '/models/csl_char_aris.glb', pipelineFile: 'aris' },
  { id: 'siti', glb: '/models/csl_char_siti.glb', pipelineFile: 'siti' },
  { id: 'bimo', glb: '/models/csl_char_bimo.glb', pipelineFile: 'bimo' },
  { id: 'budi', glb: '/models/csl_char_budi.glb', pipelineFile: 'pak_budi' },
];

/** Sync command documented for bringing pipeline output into the runtime. */
export const PIPELINE_SYNC_STEPS = [
  'blender -b --python tools/blender/build_characters.py -- --out assets/characters',
  'node tools/blender/validate_glb.mjs assets/characters',
  'cp assets/characters/ren.glb public/models/csl_char_ren.glb',
  'cp assets/characters/aris.glb public/models/csl_char_aris.glb',
  'cp assets/characters/siti.glb public/models/csl_char_siti.glb',
  'cp assets/characters/bimo.glb public/models/csl_char_bimo.glb',
  'cp assets/characters/pak_budi.glb public/models/csl_char_budi.glb',
];

// Keep the two tables honest: every manifest entry must agree with the
// runtime path table (checked by unit test, not by convention).
export function manifestFor(id: string): CharacterAssetEntry | undefined {
  return CHARACTER_ASSETS.find((a) => a.id === id);
}
