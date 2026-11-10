# CSL animation clips (30 fps; clip set defined in `csl_anim.py`, baked as named glTF animations by `csl_blender.add_animations()`)

> Export status: NOT YET VERIFIED — no Blender run has produced these GLBs so
> far (no Blender available in the authoring or integration sandboxes). Until
> a validated export lands in `public/models/`, the runtime renders the legacy
> joint-rig GLBs through the procedural path.

| Game state (src) | Clip |
|---|---|
| `FigureAnim.speed < 0.15` | `Idle` |
| `speed >= 0.15`, `!run` | `Walk` (1.0 s cycle; scale timeScale by `speed / 1.4`) |
| `run` | `Run` (0.64 s cycle; timeScale `speed / 4.2`) |
| player jump (Player.tsx) | `Jump` |
| `sit` | `Sit_Down` -> `Sit_Idle` ; leaving: `Stand_Up` |
| `sit` + writing/class scenes | `Sit_Write`, `Sit_Lean_Forward` (listening/worried) |
| `crouch` | `Crouch_Idle` ; picking things up: `Pick_Up` |
| `attackT >= 0` | `Attack_Punch` |
| `block` | `Block` |
| `hurtT >= 0` | `Hurt` |
| `down` | `Knocked_Down` (clamp last frame) ; recovery `Get_Up` |
| `acting.talking` | `Talk` (+ morph `mouthOpen` driven by `talkPhase`) |
| `acting.nodT >= 0` | `Listen_Nod` |
| `acting.gesture` 0 / 1 / 2 | `Gesture_Palm` / `Gesture_Emphasis` / `Gesture_Chest` |
| idle, no gaze target | `Look_Around` (optional) |
| dialogue `Emotion` neutral/calm | `Idle` |
| `worried` / `tense` / `firm` / `dark` / `warm` | `Idle_Worried` / `Idle_Tense` / `Idle_Firm` / `Idle_Dark` (Bimo) / `Idle_Warm` |
| `hold: phone` / `book`,`map` / `stack` / `pencil`,`eraser`,`bottle` | `Hold_Phone` / `Hold_Book` / `Hold_Stack` / `Hold_Light` |

One-shots (not looping): Jump, Sit_Down, Stand_Up, Pick_Up, Gesture_*, Attack_Punch, Hurt, Knocked_Down, Get_Up.
Everything else loops. Clips animate root-less (in place): the game moves the body. Hips carry the vertical offset, feet are ground-locked at bake time.

## Runtime adapter (implemented — `src/game/character/`)
- `GlbFigure.tsx` renders rigged GLBs (`SkeletonUtils.clone`, per-instance skeleton); `Figure` routes per-GLB and falls back to the legacy procedural `LegacyFigure` for joint-rig models. Clip names here must match `ANIM_CLIPS` in `animCatalog.ts` (tested).
- `CharacterAnimationController.ts`: one `AnimationMixer` per instance; crossfade 0.18 s between loop states; one-shots `LoopOnce` + `clampWhenFinished`, resumed loop state stored separately.
- One-shot arbitration: refused only when STRICTLY lower priority; equal-priority different-name requests TAKE OVER (newest gameplay intent wins) and the previous one-shot is explicitly `stop()`-ed — exactly one controlling one-shot, no bone conflicts. `cancelOneShot(name)` kills a specific one-shot and its `then` chain (used for stale posture chains).
- three.js gotcha (cost us a bug): once a fade-out completes, `_updateWeight` AUTO-DISABLES the action ("faded out, disable") and `setEffectiveWeight` then yields effective 0 forever — resumes must `reset()` before `play()`.
- Gaze (`acting.gazeX/Z`) stays procedural: yaw applied to the `Head` bone after the mixer update. Mouth: `morphTargetInfluences[mouthOpen]` from `talkPhase`; blink on a deterministic timer.
- Props (`HoldProp`) parent to bone `Hand_R`.

## Known limitations
- Pure FK, no IK: feet are grounded per frame but not planted against a moving ground (some foot sliding at odd speeds).
- No finger/face-expression clips; arm-cross poses are avoided (no forearm collision handling).
- Siti's skirt follows the thighs but is not simulated: it can split slightly in deep sit/crouch/jump.
- Hand-authored procedural motion, not mocap: reads as clean game animation, not film-quality. Tune amplitudes in `csl_anim.py`.
