# CSL character pipeline (Blender 4.5 LTS)

Geometry is generated in pure Python (`csl_geometry.py`, testable without Blender); `csl_blender.py` builds the rigged scene and exports GLB.

## Asset location contract (runtime ⇆ pipeline)

The game loads character GLBs from `public/models/<file>` (Vite `public/`, referenced as `/models/...` — see `src/game/character/assetManifest.ts` and `src/game/npc/characters.ts`). This pipeline writes `<spec.file>.glb` (`ren`, `aris`, `siti`, `bimo`, `pak_budi`) into `--out`. To ship a build into the game:

```bash
cp assets/characters/ren.glb      public/models/csl_char_ren.glb
cp assets/characters/aris.glb     public/models/csl_char_aris.glb
cp assets/characters/siti.glb     public/models/csl_char_siti.glb
cp assets/characters/bimo.glb     public/models/csl_char_bimo.glb
cp assets/characters/pak_budi.glb public/models/csl_char_budi.glb
```

The runtime auto-detects the rig: a GLB with `SkinnedMesh` + animation clips is rendered through the skeletal adapter (`src/game/character/GlbFigure.tsx`, clip names from `ANIMATION_MAP.md`); the legacy joint-rig GLBs keep the procedural path. New pipeline materials are named `CSL_<slot>` — the ambient tint registry (`TINT_SLOT_ALIASES`) accepts both `mat_<slot>` (legacy) and `CSL_<slot>` (pipeline).

## Run
```bash
# 0. optional, no Blender needed: front/side preview + tri stats
python3 tools/blender/preview_pure.py preview.png

# 1. build all 5 named characters -> GLB + .blend
blender -b --python tools/blender/build_characters.py -- --out assets/characters
#    only some:  ... -- --out assets/characters --only aris,siti

# 2. contact sheets (rest pose + 3/4 presentation)
blender -b --python tools/blender/contact_sheet.py -- --dir assets/characters --out assets/characters/sheets

# 3. validate GLBs (bones, UVs, skin, tris, feet-at-0, no external files)
node tools/blender/validate_glb.mjs assets/characters
```
On Windows use the full path to `blender.exe`.

## Rig contract (all characters identical)
Bone names use underscores, NOT dots (`UpperArm_L`): three.js GLTFLoader strips `.` from node names, so `UpperArm.L` would load as `UpperArmL`.
`Root > Hips > Spine > Chest > Neck > Head`; `Chest > UpperArm_{L,R} > LowerArm_{L,R} > Hand_{L,R}`; `Hips > UpperLeg_{L,R} > LowerLeg_{L,R} > Foot_{L,R}`.
Rest pose: standing, arms hanging 9° out. Left = +X in Blender. Feet at z=0. Face forward = -Y in Blender (+Z in three.js).

## Meshes per character
`<Name>_Body` (shirt/accent/trousers|skirt/belt/sock/shoe/sole/skin), `<Name>_Head` (skin, eyes, brows, mouth; morph targets `mouthOpen`, `blink`), `<Name>_Hair`.

## Known limitations of this first pass
- Flat-colour PBR materials (7-13 per character), no texture atlas yet -> ~13 draw calls. Atlas bake is the next optimisation.
- Face/hands/hair are lofted shapes, not sculpted. Silhouettes and proportions are right; fine detail (fingers, ears, hair strands, shirt wrinkles) is not.
- No animation clips; the plan is bone-driven procedural animation in GlbFigure (see CSL_CHARACTER_PACK_PLAN.md).
- `csl_blender.py` / `contact_sheet.py` / export were written against the Blender 4.5 API but NOT executed by the author (no Blender in the authoring sandbox). Expect to fix small API errors on first run.
