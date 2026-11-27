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
import { clampPitch, fpLookDir, FP_EYE } from './mode';

const lerpV = new THREE.Vector3();
const lookV = new THREE.Vector3();
const transPosV = new THREE.Vector3();
const transLookV = new THREE.Vector3();
const rayV = new THREE.Raycaster();
const shotLookV = new THREE.Vector3();
const shotDirV = new THREE.Vector3();

const POSE_CUT_DIST = 6;

export function isPoseCut(
  prev: { x: number; y: number; z: number } | null,
  next: { x: number; y: number; z: number },
): boolean {
  if (!prev) return true;
  return Math.hypot(next.x - prev.x, next.y - prev.y, next.z - prev.z) > POSE_CUT_DIST;
}

function shotForNode(nodeId: string | null): ShotResult | null {
  if (!nodeId) return null;
  if (!useStory.getState().flags.includes('opening_complete')) return null;
  const node = getDialogue(nodeId);
  if (!node) return null;
  const cast = resolveCast(node.portrait, node.speaker, node.emotion);
  const spk = cast.speaker ? entityPosition(cast.speaker) : null;
  const lis = cast.listener ? entityPosition(cast.listener) : null;
  if (!spk) return null;
  const presetKey = node.cam ?? DEFAULT_SHOT[node.speaker] ?? 'medium_speaker';
  const preset = SHOT_PRESETS[presetKey];
  if (!preset) return null;
  return computeShot(preset, spk, lis);
}

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

// First-person camera rig + cinematic / dialogue story framing (v0.20.0).
// GAMEPLAY & COMBAT are strictly first-person head-cam (third-person removed).
export function CameraRig() {
  const { camera } = useThree();
  const yaw = useRef(Math.PI);
  const pitch = useRef(0.08);
  const fpOpening = useRef(true);
  const transitionT = useRef(-1);
  const transitionFrom = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3() });
  const lastNode = useRef<string | null>(null);
  const lookAt = useRef(new THREE.Vector3(0, 1.5, 20));
  const lastPose = useRef<{ key: string | null; pos: THREE.Vector3 }>({ key: null, pos: new THREE.Vector3() });
  const smoothY = useRef(0);
  const smoothInit = useRef(false);

  useEffect(() => {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onMove = (e: MouseEvent) => {
      const game = useGame.getState();
      if (game.mode !== 'GAMEPLAY' && game.mode !== 'COMBAT' && game.mode !== 'PAUSE') return;
      const { sensitivity, invertY } = useSettings.getState();
      const inv = invertY ? -1 : 1;
      if (document.pointerLockElement != null) {
        yaw.current -= e.movementX * 0.0026 * sensitivity;
        pitch.current = clampPitch(pitch.current + e.movementY * 0.0018 * sensitivity * inv);
        return;
      }
      if (dragging && e.buttons > 0) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        yaw.current -= dx * 0.008 * sensitivity;
        pitch.current = clampPitch(pitch.current + dy * 0.005 * sensitivity * inv);
      }
    };
    const onDown = (e: MouseEvent) => {
      const game = useGame.getState();
      if (game.phase !== 'play') return;
      if (game.mode === 'GAMEPLAY' || game.mode === 'COMBAT') {
        if (document.pointerLockElement == null) {
          input.requestLock();
        }
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
    mobile.markFrame();
    const dt = Math.min(deltaRaw, 0.05);
    const game = useGame.getState();
    const settings = useSettings.getState();
    const dialogue = useDialogue.getState();
    const story = useStory.getState();

    // Drain wheel unconditionally (unused in pure first-person)
    input.consumeWheel();

    if (game.mode === 'GAMEPLAY' || game.mode === 'COMBAT') {
      const look = input.consumeLook();
      if (look.dx || look.dy) {
        const inv = settings.invertY ? -1 : 1;
        yaw.current -= look.dx * 0.0042 * settings.sensitivity;
        pitch.current = clampPitch(pitch.current + look.dy * 0.0028 * settings.sensitivity * inv);
      }
    }

    camState.yaw = yaw.current;
    const reduced = settings.reducedMotion;

    if (fpOpening.current && story.flags.includes('opening_complete') && (game.mode === 'GAMEPLAY' || game.mode === 'COMBAT')) {
      fpOpening.current = false;
      transitionT.current = -1;
    }

    // ---------- cinematic / opening ----------
    if (game.mode === 'CINEMATIC' || fpOpening.current) {
      const node = dialogue.nodeId;
      if (node && node !== lastNode.current) {
        lastNode.current = node;
      }
      const poseKey = (node && CAM_BY_NODE[node]) || 'fp_gate';
      const pose = CAMERA_POSES[poseKey] ?? CAMERA_POSES.fp_gate;
      const openingFp = !story.flags.includes('opening_complete');
      if (openingFp) {
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
      } else if (fpOpening.current) {
        // Smooth transition from opening pose straight into first-person eye point
        if (transitionT.current < 0) {
          transitionT.current = 0;
          transitionFrom.current.pos.copy(camera.position);
          transitionFrom.current.look.copy(lookAt.current);
        }
        transitionT.current = Math.min(1, transitionT.current + dt / (reduced ? 0.4 : 1.2));
        const e = easeInOut(transitionT.current);
        const eyeY = playerPos.y + FP_EYE;
        const dir = fpLookDir(yaw.current, pitch.current);
        const targetPos = transPosV.set(playerPos.x, eyeY, playerPos.z);
        const targetLook = transLookV.set(playerPos.x + dir.x * 8, eyeY + dir.y * 8, playerPos.z + dir.z * 8);
        camera.position.lerpVectors(transitionFrom.current.pos, targetPos, e);
        lookAt.current.lerpVectors(transitionFrom.current.look, targetLook, e);
        camera.lookAt(lookAt.current);
        if (transitionT.current >= 1) {
          fpOpening.current = false;
          transitionT.current = -1;
          if (game.mode === 'CINEMATIC') {
            game.setMode('GAMEPLAY');
            game.notify('Tujuan: Jelajahi SMA Yuson', 'quest');
          }
        }
      } else {
        if (
          !dialogue.nodeId &&
          !fpOpening.current &&
          story.flags.includes('opening_complete') &&
          game.pendingChapter == null
        ) {
          game.setMode('GAMEPLAY');
          return;
        }
        const cam = resolveCinematicCamera(dialogue.nodeId);
        if (cam?.kind === 'shot') {
          applyShot(camera, lookAt.current, cam.shot, dt, reduced);
        } else if (cam?.kind === 'pose') {
          const cPose = CAMERA_POSES[cam.key]!;
          const cut = cam.key !== lastPose.current.key && isPoseCut(lastPose.current.key === cam.key ? null : lastPose.current.pos, { x: cPose.pos[0], y: cPose.pos[1], z: cPose.pos[2] });
          if (cut || reduced) {
            camera.position.set(cPose.pos[0], cPose.pos[1], cPose.pos[2]);
            lookAt.current.set(cPose.look[0], cPose.look[1], cPose.look[2]);
          } else {
            const k = 1 - Math.exp(-2.6 * dt);
            camera.position.lerp(lerpV.set(cPose.pos[0], cPose.pos[1], cPose.pos[2]), k);
            lookAt.current.lerp(lookV.set(cPose.look[0], cPose.look[1], cPose.look[2]), k);
          }
          lastPose.current.key = cam.key;
          lastPose.current.pos.copy(camera.position);
          camera.lookAt(lookAt.current);
        } else {
          const shot = computeShot(SHOT_PRESETS.medium_speaker, { x: playerPos.x, z: playerPos.z }, null);
          applyShot(camera, lookAt.current, shot, dt, reduced);
        }
      }
      return;
    }

    // ---------- dialogue (NPC conversation framing) ----------
    if (game.mode === 'DIALOGUE' && !fpOpening.current) {
      const shot = shotForNode(dialogue.nodeId);
      if (shot) {
        applyShot(camera, lookAt.current, shot, dt, reduced);
        return;
      }
    }

    // ---------- pure first-person head-cam (GAMEPLAY & COMBAT) ----------
    fpOpening.current = false;

    if (!smoothInit.current) {
      smoothInit.current = true;
      smoothY.current = playerPos.y;
    }
    smoothY.current = THREE.MathUtils.lerp(smoothY.current, playerPos.y, 1 - Math.exp(-9 * dt));

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
  });

  return null;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
