# CSL character pipeline (Blender 4.5 LTS)

Geometry is generated in pure Python (`csl_geometry.py`, testable without Blender); `csl_blender.py` builds the rigged scene and exports GLB.

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
- Textures: one procedural 1024x512 sRGB atlas per character (`csl_atlas.py`: skin, face, shirt weave, trousers twill, hair strands, shoe, accent + a swatch palette), embedded in the GLB -> ONE material, 3 meshes = 3 draw calls (Body, Head, Hair). `--flat` in build_characters.py gives the old 13 flat materials. Atlas UVs replace the per-part unwrap (re-unwrap in Blender if you want hand-painted textures).
- Face/hands/hair are procedural shapes, not sculpted: eyelids/brows/nose/two-part lips, 5-finger hands with a relaxed curl (no finger bones), hair clumps per style, shirt placket/buttons/pocket+badge/collar, belt buckle. ~8-9k tris per named character. Still reads as stylised game-low-poly, not film quality; a hand-sculpt pass or a licensed base mesh would be the next quality step.
- No animation clips; the plan is bone-driven procedural animation in GlbFigure (see CSL_CHARACTER_PACK_PLAN.md).
- `csl_blender.py` / `contact_sheet.py` / export were written against the Blender 4.5 API but NOT executed by the author (no Blender in the authoring sandbox). Expect to fix small API errors on first run.
