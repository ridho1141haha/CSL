import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { input } from '../input';
import { useGame } from '../../stores/gameStore';
import { useSettings } from '../../stores/settingsStore';
import { useDialogue } from '../../stores/dialogueStore';
import { useStory } from '../../stores/storyStore';
import { playerPos, camState, occluders } from '../runtime';
import { mobile } from '../mobile';
import { CAMERA_POSES } from '../../data/world';
import { CAM_BY_NODE } from '../../data/chapters';
import { SHOT_PRESETS, DEFAULT_SHOT } from '../../data/shots';
import { getDialogue } from '../../data/dialogue';
import { resolveCast, entityPosition } from '../systems/acting';
import { computeShot, type ShotResult } from '../systems/shot';
import { resolveCinematicCamera } from '../story/staging';
import { clampPitch, fpLookDir, reclampOnSwitch, FP_EYE, type CamMode } from './mode';

const lerpV = new THREE.Vector3();
const lookV = new THREE.Vector3();
// v0.17.0 perf: shared occlusion/transition temps — were 2-4 `new
// THREE.Vector3` per rendered frame inside useFrame (audit M1).
const occlDirV = new THREE.Vector3();
const occlPosV = new THREE.Vector3();
const transPosV = new THREE.Vector3();
const transLookV = new THREE.Vector3();
const rayV = new THREE.Raycaster();
const shotLookV = new THREE.Vector3();
const shotDirV = new THREE.Vector3();

// v0.12.0 FIX (user feedback: "cerita baru di kantin tapi kamera malah ke
// kelas"): cinematic poses used to lerp physically between scene cuts, so the
// camera FLEW across the map (through walls/classes) while the new scene's
// narration was already on screen. Now a pose change across more than
// POSE_CUT_DIST meters is an instant cut — masked by the NODE_FX fade-in that
// already fires on scene-change nodes (o2_1 / o3_1 / o4_1 / montages…).
const POSE_CUT_DIST = 6;

// Pure helper (unit-testable): should a pose change snap instead of lerp?
export function isPoseCut(
  prev: { x: number; y: number; z: number } | null,
  next: { x: number; y: number; z: number },
): boolean {
  if (!prev) return true; // first pose after mount → land instantly
  return Math.hypot(next.x - prev.x, next.y - prev.y, next.z - prev.z) > POSE_CUT_DIST;
}

// ---------------------------------------------------------------------------
// Dialogue shot resolution (mentor feedback #2) — DIALOGUE MODE ONLY.
// Speaker-driven framing computed from LIVE entity positions. Resolution chain
// per node: SHOT_PRESETS[node.cam] → DEFAULT_SHOT[speaker] → medium_speaker.
// Returns null when nothing is framable (FP opening, narrator-only lines,
// no placed entities) — callers fall back to the orbit rig.
//
// v0.14.1: CINEMATIC story scenes NO LONGER use this path. Live registries
// (actorPositions/npcPositions) are global across scenes, so an unstaged
// speaker used to resolve to a ghost position from an older scene (e.g. the
// opening's canteen bullies) and yank the camera away from the active story
// scene. Cinematic nodes resolve through resolveCinematicCamera() (story
// staging data) instead — see the CINEMATIC branch below.
// ---------------------------------------------------------------------------
function shotForNode(nodeId: string | null): ShotResult | null {
  if (!nodeId) return null;
  // the first-person opening keeps its authored CAM_BY_NODE poses — speaker
  // shots only make sense once the story is in third person
  if (!useStory.getState().flags.includes('opening_complete')) return null;
  const node = getDialogue(nodeId);
  if (!node) return null;
  const cast = resolveCast(node.portrait, node.speaker, node.emotion);
  const spk = cast.speaker ? entityPosition(cast.speaker) : null;
  const lis = cast.listener ? entityPosition(cast.listener) : null;
  if (!spk) return null; // narrator / unplaced speaker → static fallback
  const presetKey = node.cam ?? DEFAULT_SHOT[node.speaker] ?? 'medium_speaker';
  const preset = SHOT_PRESETS[presetKey];
  if (!preset) return null;
  return computeShot(preset, spk, lis);
}

// Occlusion pull-in for shots: raycast look-target → camera through the
// world's registered occluders, clamp distance so walls never clip the frame.
function clampShotOcclusion(shot: ShotResult) {
  if (!occluders.objects.length) return;
  shotLookV.set(shot.look.x, shot.lookHeight, shot.look.z);
  shotDirV.set(shot.pos.x - shotLookV.x, shot.height - shotLookV.y, shot.pos.z - shotLookV.z);
  const len = shotDirV.length();
  if (len < 0.01) return;
  shotDirV.divideScalar(len);
  rayV.set(shotLookV, shotDirV);
  rayV.far = len;
  const hits = rayV.intersectObjects(occluders.objects as THREE.Object3D[], true);
  if (hits.length && hits[0].distance < len) {
    const d = Math.max(0.9, hits[0].distance - 0.28);
    shot.pos = { x: shotLookV.x + shotDirV.x * d, z: shotLookV.z + shotDirV.z * d };
    shot.height = shotLookV.y + shotDirV.y * d;
  }
}

// Lerp the camera toward a resolved shot and aim it. Returns true when applied.
function applyShot(
  camera: THREE.Camera,
  lookAt: THREE.Vector3,
  shot: ShotResult,
  dt: number,
  reduced: boolean,
): boolean {
  clampShotOcclusion(shot);
  const k = reduced ? 1 : 1 - Math.exp(-shot.dur * dt);
  camera.position.lerp(lerpV.set(shot.pos.x, shot.height, shot.pos.z), k);
  lookAt.lerp(lookV.set(shot.look.x, shot.lookHeight, shot.look.z), k);
  camera.lookAt(lookAt);
  return true;
}

// Third-person camera + cinematic override (GDD §17).
// GAMEPLAY: pointer-lock orbit, pitch clamp, wheel zoom, shoulder offset,
// occlusion pull-in, shake. CINEMATIC: pose per dialogue node (CAM_BY_NODE),
// with a scripted first-person → third-person transition at the opening end.
export function CameraRig() {
  const { camera } = useThree();
  const yaw = useRef(Math.PI);
  const pitch = useRef(0.32);
  const dist = useRef(4.6);
  const fp = useRef(true); // first-person opening phase
  const transitionT = useRef(-1); // -1 = idle; 0..1 = FP→TP transition running
  const transitionFrom = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3() });
  const lastNode = useRef<string | null>(null);
  const lookAt = useRef(new THREE.Vector3(0, 1.5, 20));
  const targetDist = useRef(4.6);
  const lastPose = useRef<{ key: string | null; pos: THREE.Vector3 }>({ key: null, pos: new THREE.Vector3() });
  // v0.13.0: first-person / third-person gameplay modes
  const lastCamMode = useRef<CamMode>('third');
  const smoothY = useRef(0);
  const smoothInit = useRef(false);

  // Camera control: drag-look (primary) + pointer lock (optional enhancement).
  // Primary: hold LMB and move mouse to orbit camera. Always works.
  // Optional: click to request pointer lock (cursor hidden, direct mouse look).
  // If pointer lock engages, raw movementX/Y drives camera. If it fails
  // silently (some browsers reject it), drag-look still works.
  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onMove = (e: MouseEvent) => {
      const game = useGame.getState();
      if (game.mode !== 'GAMEPLAY' && game.mode !== 'COMBAT' && game.mode !== 'PAUSE') return;
      // v0.10.0: user-tunable look feel (settings persist to localStorage)
      const { sensitivity, invertY } = useSettings.getState();
      const inv = invertY ? -1 : 1;
      const mode = useSettings.getState().camMode;
      // Pointer-lock mode: raw mouse movement (no button needed)
      if (document.pointerLockElement != null) {
        yaw.current -= e.movementX * 0.0026 * sensitivity;
        pitch.current = clampPitch(mode, pitch.current + e.movementY * 0.0018 * sensitivity * inv);
        return;
      }
      // Drag-look: hold ANY mouse button and move to orbit
      if (dragging && e.buttons > 0) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        yaw.current -= dx * 0.008 * sensitivity;
        pitch.current = clampPitch(mode, pitch.current + dy * 0.005 * sensitivity * inv);
      }
    };
    const onDown = (e: MouseEvent) => {
      const game = useGame.getState();
      if (game.phase !== 'play') return;
      if (game.mode === 'GAMEPLAY' || game.mode === 'COMBAT') {
        // Try pointer lock (optional — if it works, great; if not, drag-look covers it)
        if (document.pointerLockElement == null) {
          input.requestLock();
        }
        // Always enable drag-look as fallback
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onUp = () => { dragging = false; };
    const onLockChange = () => {
      useGame.getState().setPointerLocked(document.pointerLockElement != null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('pointerlockchange', onLockChange);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, []);

  useFrame((_, deltaRaw) => {
    // render-loop heartbeat — DiagnosticsChip watches this to detect a dead
    // WebGL loop (the v0.4.x mobile "blank world" failure mode)
    mobile.markFrame();
    const dt = Math.min(deltaRaw, 0.05);
    const game = useGame.getState();
    const settings = useSettings.getState();
    const dialogue = useDialogue.getState();
    const story = useStory.getState();

    // touch look-drag (v0.5.0): works in GAMEPLAY/COMBAT, same feel as mouse drag
    if (game.mode === 'GAMEPLAY' || game.mode === 'COMBAT') {
      const look = input.consumeLook();
      if (look.dx || look.dy) {
        const inv = settings.invertY ? -1 : 1;
        yaw.current -= look.dx * 0.0042 * settings.sensitivity;
        pitch.current = clampPitch(settings.camMode, pitch.current + look.dy * 0.0028 * settings.sensitivity * inv);
      }
    } else {
      // wheel is explicit-consume only since the input janitor took over
      // endFrame — drain it outside gameplay so it can't pile up into a zoom
      // jump when control resumes
      input.consumeWheel();
    }

    camState.yaw = yaw.current;
    const reduced = settings.reducedMotion;

    // LOADED-GAME hardening: CONTINUE restores a mid-game save straight into
    // GAMEPLAY/COMBAT. fp.current is only cleared by the opening's FP→TP
    // transition, so without this guard the camera would lerp to the campus
    // fp_gate pose even in the rooftop/warehouse scenes — a black screen
    // staring at the inside of a wall. If the opening is already complete,
    // skip straight to third-person orbit.
    if (fp.current && story.flags.includes('opening_complete') && (game.mode === 'GAMEPLAY' || game.mode === 'COMBAT')) {
      fp.current = false;
      transitionT.current = -1;
    }

    // ---------- cinematic / first-person ----------
    if (game.mode === 'CINEMATIC' || fp.current) {
      const node = dialogue.nodeId;
      if (node && node !== lastNode.current) {
        lastNode.current = node;
      }
      const poseKey = (node && CAM_BY_NODE[node]) || 'fp_gate';
      const pose = CAMERA_POSES[poseKey] ?? CAMERA_POSES.fp_gate;
      const openingFp = !story.flags.includes('opening_complete');
      if (openingFp) {
        // v0.12.0: hard cut between scenes, smooth head-cam inside a scene
        const cut = poseKey !== lastPose.current.key && isPoseCut(lastPose.current.key === poseKey ? null : lastPose.current.pos, { x: pose.pos[0], y: pose.pos[1], z: pose.pos[2] });
        if (cut || reduced) {
          camera.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
          lookAt.current.set(pose.look[0], pose.look[1], pose.look[2]);
        } else {
          const k = 1 - Math.exp(-3.2 * dt);
          camera.position.lerp(lerpV.set(pose.pos[0], pose.pos[1], pose.pos[2]), k);
          lookAt.current.lerp(lookV.set(pose.look[0], pose.look[1], pose.look[2]), k);
        }
        lastPose.current.key = poseKey;
        lastPose.current.pos.copy(camera.position);
        camera.lookAt(lookAt.current);
      } else if (fp.current) {
        // FP→TP transition at the end of the opening
        if (transitionT.current < 0) {
          transitionT.current = 0;
          transitionFrom.current.pos.copy(camera.position);
          transitionFrom.current.look.copy(lookAt.current);
        }
        transitionT.current = Math.min(1, transitionT.current + dt / (reduced ? 0.6 : 2.4));
        const e = easeInOut(transitionT.current);
        const startDist = 3.2;
        const tx = playerPos.x;
        const tz = playerPos.z;
        const orbitPos = transPosV.set(
          tx + Math.sin(yaw.current) * startDist,
          1.1 + startDist * pitch.current,
          tz + Math.cos(yaw.current) * startDist,
        );
        const orbitLook = transLookV.set(tx, 1.35, tz);
        camera.position.lerpVectors(transitionFrom.current.pos, orbitPos, e);
        lookAt.current.lerpVectors(transitionFrom.current.look, orbitLook, e);
        camera.lookAt(lookAt.current);
        if (transitionT.current >= 1) {
          fp.current = false;
          transitionT.current = -1;
          if (game.mode === 'CINEMATIC') {
            game.setMode('GAMEPLAY');
            game.notify('Tujuan: Jelajahi SMA Yuson', 'quest');
          }
        }
      } else {
        // third-person cinematic (rooftop / montage beats)
        // BUG-FIX (soft-lock): late-game cinematic chains that end with
        // `end: true` (e.g. the resistance montage ch4_res_1..4) close the
        // dialogue while still in CINEMATIC mode. close() deliberately only
        // restores DIALOGUE→GAMEPLAY, and the FP→TP transition is a one-shot
        // opening-only exit — so nothing ever returned control here. The
        // player was left on a frozen camera with no UI and no input.
        // Camera owns CINEMATIC exit (see dialogueStore.close), so when the
        // graph has no node left to show past the opening, hand back control.
        if (
          !dialogue.nodeId &&
          !fp.current &&
          story.flags.includes('opening_complete') &&
          game.pendingChapter == null
        ) {
          game.setMode('GAMEPLAY');
          return;
        }
        // v0.14.1: the ACTIVE STORY SCENE owns the camera. Resolution comes
        // from staging data only — node.cam shot (validated against the node's
        // cast) → authored CAM_BY_NODE pose → frame the staged Ren. Live
        // registries are never consulted here, so a ghost position from an
        // older scene (opening canteen bullies, previous rooftop staging)
        // can no longer pull the camera away from the scene in progress.
        const cam = resolveCinematicCamera(dialogue.nodeId);
        if (cam?.kind === 'shot') {
          applyShot(camera, lookAt.current, cam.shot, dt, reduced);
        } else if (cam?.kind === 'pose') {
          const pose = CAMERA_POSES[cam.key]!;
          // v0.12.0: same hard-cut rule for third-person montage poses
          const cut = cam.key !== lastPose.current.key && isPoseCut(lastPose.current.key === cam.key ? null : lastPose.current.pos, { x: pose.pos[0], y: pose.pos[1], z: pose.pos[2] });
          if (cut || reduced) {
            camera.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
            lookAt.current.set(pose.look[0], pose.look[1], pose.look[2]);
          } else {
            const k = 1 - Math.exp(-2.6 * dt);
            camera.position.lerp(lerpV.set(pose.pos[0], pose.pos[1], pose.pos[2]), k);
            lookAt.current.lerp(lookV.set(pose.look[0], pose.look[1], pose.look[2]), k);
          }
          lastPose.current.key = cam.key;
          lastPose.current.pos.copy(camera.position);
          camera.lookAt(lookAt.current);
        } else {
          // no authored camera staging for this node → frame the staged Ren
          // (medium single). Ren is placed by applyPlayerStaging before the
          // dialogue shows, so this default can never point at another zone.
          const shot = computeShot(SHOT_PRESETS.medium_speaker, { x: playerPos.x, z: playerPos.z }, null);
          applyShot(camera, lookAt.current, shot, dt, reduced);
        }
      }
      return;
    }

    // ---------- dialogue (post-opening NPC conversations) ----------
    // Mentor feedback #2: NPC talks get real shot framing (close/OTS/two…)
    // instead of the raw orbit rig. Falls back to the orbit below when no
    // shot can be resolved (e.g. narrator-only lines with nobody placed).
    if (game.mode === 'DIALOGUE' && !fp.current) {
      const shot = shotForNode(dialogue.nodeId);
      if (shot) {
        applyShot(camera, lookAt.current, shot, dt, reduced);
        return;
      }
    }

    // ---------- gameplay camera (v0.13.0: first-person / third-person) ----------
    fp.current = false;

    // Mode switch (settings toggle or V key): re-clamp pitch so a stale FP
    // look-up can't drive the TP orbit under the floor, and snap this frame.
    const switched = lastCamMode.current !== settings.camMode;
    if (switched) {
      lastCamMode.current = settings.camMode;
      pitch.current = reclampOnSwitch(settings.camMode, pitch.current);
    }

    // Smoothed floor height under the feet. playerPos.y is feet height
    // (0 on ground, ≈3.5 / 7.0 on Gedung B L2/L3) — following it fixes the
    // orbit camera sinking into upper floors; smoothing keeps jumps from
    // yanking the rig. Wheel is drained every frame in both modes so it
    // never piles up while FP ignores it.
    if (!smoothInit.current) {
      smoothInit.current = true;
      smoothY.current = playerPos.y;
    }
    smoothY.current = THREE.MathUtils.lerp(smoothY.current, playerPos.y, 1 - Math.exp(-9 * dt));

    const w = input.consumeWheel();

    if (settings.camMode === 'first') {
      // ---- first-person head-cam ----
      // Hard-attach to the eye point (no position lerp): FP must never lag
      // behind the body or swim while strafing. Look direction comes from
      // the shared yaw/pitch (same convention as the orbit rig).
      let sx = 0;
      let sy = 0;
      if (camState.shake > 0.001 && settings.screenShake) {
        sx = (Math.random() - 0.5) * camState.shake * 0.22;
        sy = (Math.random() - 0.5) * camState.shake * 0.22;
        camState.shake = Math.max(0, camState.shake - dt * 1.8);
      } else camState.shake = 0;
      const eyeY = smoothY.current + FP_EYE;
      const dir = fpLookDir(yaw.current, pitch.current);
      camera.position.set(playerPos.x + sx, eyeY + sy, playerPos.z);
      lookAt.current.set(playerPos.x + dir.x * 8, eyeY + dir.y * 8, playerPos.z + dir.z * 8);
      camera.lookAt(lookAt.current);
      return;
    }

    // ---- third-person orbit ----
    if (w) targetDist.current = THREE.MathUtils.clamp(targetDist.current + w * 0.004, settings.camMin, settings.camMax);
    dist.current = THREE.MathUtils.lerp(dist.current, targetDist.current, 1 - Math.exp(-8 * dt));

    const tx = playerPos.x;
    const tz = playerPos.z;
    const shoulder = Math.cos(yaw.current) * 0.4;
    const shoulderZ = -Math.sin(yaw.current) * 0.4;

    let camX = tx + Math.sin(yaw.current) * dist.current + shoulder;
    let camY = smoothY.current + 1.15 + dist.current * pitch.current;
    let camZ = tz + Math.cos(yaw.current) * dist.current + shoulderZ;

    // occlusion: pull in when blocked
    const look = lookV.set(tx + shoulder * 0.4, smoothY.current + 1.35, tz + shoulderZ * 0.4);
    if (occluders.objects.length) {
      rayV.set(camera.position.lengthSq() > 0 ? camera.position : occlPosV.set(camX, camY, camZ), look);
      // ray from look toward camera
      const dir = occlDirV.set(camX, camY, camZ).sub(look);
      const len = dir.length();
      rayV.set(look, dir.normalize());
      rayV.far = len;
      const hits = rayV.intersectObjects(occluders.objects as THREE.Object3D[], true);
      if (hits.length && hits[0].distance < len) {
        const d = Math.max(1.2, hits[0].distance - 0.3);
        camX = look.x + dir.x * -d;
        camY = look.y + dir.y * -d;
        camZ = look.z + dir.z * -d;
      }
    }

    // shake
    let shakeX = 0;
    let shakeY = 0;
    if (camState.shake > 0.001 && settings.screenShake) {
      shakeX = (Math.random() - 0.5) * camState.shake * 0.35;
      shakeY = (Math.random() - 0.5) * camState.shake * 0.35;
      camState.shake = Math.max(0, camState.shake - dt * 1.8);
    } else camState.shake = 0;

    // v0.13.0: snap on a just-happened FP→TP switch — the camera is still at
    // the eye point and lerping from there would fly it across the room.
    const k = switched || reduced ? 1 : 1 - Math.exp(-9 * dt);
    camera.position.lerp(lerpV.set(camX + shakeX, camY + shakeY, camZ), k);
    lookAt.current.lerp(look, 1 - Math.exp(-11 * dt));
    camera.lookAt(lookAt.current);
  });

  return null;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
