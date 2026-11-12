# CSL animation clips (30 fps, exported as named glTF animations in every character GLB)

| Game state (src) | Clip |
|---|---|
| `FigureAnim.speed < 0.15` | `Idle` |
| `speed >= 0.15`, `!run` | `Walk` (0.87 s cycle, authored for ~1.9-2.1 m/s; exported as `clips.Walk.speed` in build_report.json) |
| `run` | `Run` (0.53 s cycle; speed not measured, tune timeScale by eye) |
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

## Speed mismatch to decide on
`Player.tsx` uses WALK = 3.4 and RUN = 5.6 (arcade units). The Walk clip is authored for ~2 m/s, so playing it at 3.4 needs timeScale ~1.7 (cycle ~0.5 s) and some foot sliding remains. Options: clamp timeScale to ~1.0-1.5 and accept slide, or lower the game's speeds. That is a gameplay call, so it was left alone.

## Adapter notes (GlbFigure, not written yet)
- Use `AnimationMixer`; crossfade 0.15–0.25 s between clips; one-shots `LoopOnce` + `clampWhenFinished`.
- Gaze (`acting.gazeX/Z`) stays procedural: add yaw to `Head`/`Neck` bones after the mixer updates (as Figure does now).
- Mouth: `morphTargetInfluences[mesh.morphTargetDictionary.mouthOpen]` from `talkPhase`; blink on a timer via `blink`.
- Props (`HoldProp`) parent to bone `Hand_R`.

## Known limitations
- Pure FK, no IK: feet are grounded per frame but not planted against a moving ground (some foot sliding at odd speeds).
- No finger/face-expression clips; arm-cross poses are avoided (no forearm collision handling).
- Siti's skirt follows the thighs (front more than back) but is not simulated: it opens at the sides in full run and shows thighs under the hem when seated.
- Hand-authored procedural motion, not mocap: reads as clean game animation, not film-quality. Tune amplitudes in `csl_anim.py`.
