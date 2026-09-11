import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { input } from '../input';
import { useGame } from '../../stores/gameStore';
import { usePlayer } from '../../stores/playerStore';
import { useCombat } from '../../stores/combatStore';
import { playerPos, camState } from '../runtime';
import { Figure } from '../npc/Character';
import { playerAnim, combatTick, camYaw } from '../combat/combat';
import { audio } from '../audio';

const WALK = 3.4;
const RUN = 5.6;
const JUMP_V = 4.9;

// Third-person controller: Rapier dynamic capsule + camera-relative movement
// with acceleration. Position is mirrored into runtime + store (throttled).
export function Player() {
  const body = useRef<RapierRigidBody>(null);
  const { rapier, world } = useRapier();
  const spawnX = usePlayer((s) => s.x);
  const spawnZ = usePlayer((s) => s.z);
  const posTimer = useRef(0);
  const stepTimer = useRef(0);
  const gravityHold = useRef(0);
  const spawnRef = useRef({ x: spawnX, z: spawnZ });

  const asBody = (b: RapierRigidBody) => b as unknown as Parameters<typeof combatTick>[1];

  useFrame((state, deltaRaw) => {
    const rb = body.current;
    if (!rb) return;
    const dt = Math.min(deltaRaw, 0.05);
    const game = useGame.getState();
    const mode = game.mode;
    const inControl = mode === 'GAMEPLAY' || mode === 'COMBAT';

    const t = rb.translation();
    const lv = rb.linvel();

    // keep above ground (safety)
    if (t.y < -2) {
      rb.setTranslation({ x: spawnRef.current.x, y: 1.2, z: spawnRef.current.z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    if (!inControl) {
      if (Math.abs(lv.x) > 0.01 || Math.abs(lv.z) > 0.01 || lv.y > 0.01) {
        rb.setLinvel({ x: 0, y: Math.min(lv.y, 0) * 0.5, z: 0 }, true);
      }
      syncFrom(t.x, t.z, 0, 0);
      updateAnim(dt, 0, false);
      input.endFrame();
      return;
    }

    // ---- combat mode: FSM-driven ----
    if (mode === 'COMBAT') {
      const combat = useCombat.getState();
      if (combat.phase === 'fighting' && combat.enemy()) {
        combatTick(dt, asBody(rb));
      } else {
        // combat resolving: freeze gently
        rb.setLinvel({ x: 0, y: lv.y, z: 0 }, true);
      }
      syncFrom(t.x, t.z, lv.x, lv.z);
      input.endFrame();
      return;
    }

    // ---- gameplay locomotion ----
    let ix = 0;
    let iz = 0;
    if (input.isDown('forward')) iz += 1;
    if (input.isDown('back')) iz -= 1;
    if (input.isDown('left')) ix -= 1;
    if (input.isDown('right')) ix += 1;
    const run = input.isDown('run');
    const speed = run ? RUN : WALK;

    let tx = 0;
    let tz = 0;
    if (ix || iz) {
      const len = Math.hypot(ix, iz);
      ix /= len;
      iz /= len;
      const yaw = camYaw();
      const fX = -Math.sin(yaw);
      const fZ = -Math.cos(yaw);
      const rX = -fZ;
      const rZ = fX;
      tx = (fX * iz + rX * ix) * speed;
      tz = (fZ * iz + rZ * ix) * speed;
    }

    const accel = ix || iz ? 12 : 16;
    const k = 1 - Math.exp(-accel * dt);
    const nvx = THREE.MathUtils.lerp(lv.x, tx, k);
    const nvz = THREE.MathUtils.lerp(lv.z, tz, k);

    // grounded check (ray down, exclude self) — BUG-3.4 fix: extended ray
    // length from 1.05 to 1.3 so small bumps/steps don't false-airborne the
    // player. Capsule center is at y≈0.75 (resting on ground at y=0); ray
    // 1.3 reaches y=-0.55, covering any reasonable step height.
    const ray = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 1.3, true, undefined, undefined, undefined, rb);
    const grounded = !!hit;
    playerPos.grounded = grounded;

    let vy = lv.y;
    if (grounded && input.justPressed('jump')) {
      vy = JUMP_V;
      audio.jump();
    }
    if (vy < 0) gravityHold.current += dt;
    else gravityHold.current = 0;
    if (!grounded && gravityHold.current > 0.08 && vy > -0.1) vy -= 0.4; // step-off grace

    rb.setLinvel({ x: nvx, y: vy, z: nvz }, true);

    // facing follows movement
    const hSpeed = Math.hypot(nvx, nvz);
    if (hSpeed > 0.4) {
      playerPos.facing = Math.atan2(nvx, nvz);
    }

    // footsteps
    if (grounded && hSpeed > 0.8) {
      stepTimer.current -= dt * hSpeed;
      if (stepTimer.current <= 0) {
        audio.step(run);
        stepTimer.current = run ? 2.1 : 1.7;
      }
    }

    updateAnim(dt, hSpeed, run);
    syncFrom(t.x, t.z, nvx, nvz);
    input.endFrame();
  });

  const syncFrom = (x: number, z: number, vx: number, vz: number) => {
    playerPos.x = x;
    playerPos.z = z;
    playerPos.y = 0;
    playerPos.vx = vx;
    playerPos.vz = vz;
    playerPos.speed = Math.hypot(vx, vz);
    posTimer.current += 1;
    if (posTimer.current >= 12) {
      posTimer.current = 0;
      const p = usePlayer.getState();
      if (Math.hypot(p.x - x, p.z - z) > 0.35) usePlayer.getState().setPos(x, z);
    }
  };

  const updateAnim = (dt: number, hSpeed: number, run: boolean) => {
    playerAnim.current.speed = hSpeed;
    playerAnim.current.run = run;
    if (playerAnim.current.hurtT >= 0) {
      playerAnim.current.hurtT += dt * 4;
      if (playerAnim.current.hurtT > 1) playerAnim.current.hurtT = -1;
    }
  };

  return (
    <RigidBody
      ref={body}
      type="dynamic"
      colliders={false}
      position={[spawnRef.current.x, 0.75, spawnRef.current.z]}
      lockRotations
      friction={0.1}
      restitution={0}
      linearDamping={0.4}
      ccd
    >
      <CapsuleCollider args={[0.45, 0.3]} />
      <PlayerFigure />
    </RigidBody>
  );
}

// The figure must face movement direction — handled via parent group updated in frame.
function PlayerFigure() {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y = playerPos.facing;
  });
  return (
    <group ref={group}>
      <Figure anim={playerAnim} color="#e2e8f0" accent="#38bdf8" nameTag={undefined} />
    </group>
  );
}
