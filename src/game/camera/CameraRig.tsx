import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { input } from '../input';
import { useGame } from '../../stores/gameStore';
import { useSettings } from '../../stores/settingsStore';
import { useDialogue } from '../../stores/dialogueStore';
import { useStory } from '../../stores/storyStore';
import { playerPos, camState, occluders } from '../runtime';
import { CAMERA_POSES } from '../../data/world';
import { CAM_BY_NODE } from '../../data/chapters';

const lerpV = new THREE.Vector3();
const lookV = new THREE.Vector3();
const rayV = new THREE.Raycaster();

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
      // Pointer-lock mode: raw mouse movement (no button needed)
      if (document.pointerLockElement != null) {
        yaw.current -= e.movementX * 0.0026;
        pitch.current = THREE.MathUtils.clamp(pitch.current + e.movementY * 0.0018, 0.06, 0.85);
        return;
      }
      // Drag-look: hold ANY mouse button and move to orbit
      if (dragging && e.buttons > 0) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        yaw.current -= dx * 0.008;
        pitch.current = THREE.MathUtils.clamp(pitch.current + dy * 0.005, 0.06, 0.85);
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
    const dt = Math.min(deltaRaw, 0.05);
    const game = useGame.getState();
    const settings = useSettings.getState();
    const dialogue = useDialogue.getState();
    const story = useStory.getState();

    camState.yaw = yaw.current;
    const reduced = settings.reducedMotion;

    // ---------- cinematic / first-person ----------
    if (game.mode === 'CINEMATIC' || fp.current) {
      const node = dialogue.nodeId;
      if (node && node !== lastNode.current) {
        lastNode.current = node;
      }
      const poseKey = (node && CAM_BY_NODE[node]) || (fp.current ? 'fp_gate' : 'courtyard_view');
      const pose = CAMERA_POSES[poseKey] ?? CAMERA_POSES.fp_gate;
      const openingFp = !story.flags.includes('opening_complete');

      if (openingFp) {
        // smooth head-cam toward pose
        const k = reduced ? 1 : 1 - Math.exp(-3.2 * dt);
        camera.position.lerp(lerpV.set(pose.pos[0], pose.pos[1], pose.pos[2]), k);
        lookAt.current.lerp(lookV.set(pose.look[0], pose.look[1], pose.look[2]), k);
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
        const orbitPos = new THREE.Vector3(
          tx + Math.sin(yaw.current) * startDist,
          1.1 + startDist * pitch.current,
          tz + Math.cos(yaw.current) * startDist,
        );
        const orbitLook = new THREE.Vector3(tx, 1.35, tz);
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
        const k = reduced ? 1 : 1 - Math.exp(-2.6 * dt);
        camera.position.lerp(lerpV.set(pose.pos[0], pose.pos[1], pose.pos[2]), k);
        lookAt.current.lerp(lookV.set(pose.look[0], pose.look[1], pose.look[2]), k);
        camera.lookAt(lookAt.current);
      }
      return;
    }

    // ---------- third person ----------
    fp.current = false;
    const w = input.consumeWheel();
    if (w) targetDist.current = THREE.MathUtils.clamp(targetDist.current + w * 0.004, settings.camMin, settings.camMax);
    dist.current = THREE.MathUtils.lerp(dist.current, targetDist.current, 1 - Math.exp(-8 * dt));

    const tx = playerPos.x;
    const tz = playerPos.z;
    const shoulder = Math.cos(yaw.current) * 0.4;
    const shoulderZ = -Math.sin(yaw.current) * 0.4;

    let camX = tx + Math.sin(yaw.current) * dist.current + shoulder;
    let camY = 1.15 + dist.current * pitch.current;
    let camZ = tz + Math.cos(yaw.current) * dist.current + shoulderZ;

    // occlusion: pull in when blocked
    const look = lookV.set(tx + shoulder * 0.4, 1.35, tz + shoulderZ * 0.4);
    if (occluders.objects.length) {
      rayV.set(camera.position.lengthSq() > 0 ? camera.position : new THREE.Vector3(camX, camY, camZ), look);
      // ray from look toward camera
      const dir = new THREE.Vector3(camX, camY, camZ).sub(look);
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

    const k = reduced ? 1 : 1 - Math.exp(-9 * dt);
    camera.position.lerp(lerpV.set(camX + shakeX, camY + shakeY, camZ), k);
    lookAt.current.lerp(look, 1 - Math.exp(-11 * dt));
    camera.lookAt(lookAt.current);
  });

  return null;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
