import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { input } from '../input';
import { useGame } from '../../stores/gameStore';
import { usePlayer } from '../../stores/playerStore';
import { useCombat } from '../../stores/combatStore';
import { playerPos, camState, npcPositions, crowdPositions, enemyPos } from '../runtime';
import { resolveOverlaps, stripIntoVelocity, nearbyBodies } from '../systems/collision';
import { approachFacing, camForwardAngle } from '../systems/facing';
import { useSettings } from '../../stores/settingsStore';
import { Figure } from '../npc/Character';
import { acting } from '../systems/acting';
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
  // v0.16.0 spawn-settle pin (real time). On every mount AND after every
  // fall-through respawn the rapier body used to sink through the not-yet-
  // stepped ground colliders, hit the y<-2 respawn, and yo-yo with the
  // camera yanking (headless repro: 4 respawns / 15 s — on weak devices this
  // reads as "karakter stuck ga bisa jalan"). Pinning the body at y=1.2 for
  // 0.75 s of REAL time lets the collider graph finish mounting, then the
  // body drops gently onto the floor. Respawn re-arms the pin.
  const groundHoldUntil = useRef(typeof performance !== 'undefined' ? performance.now() + 2500 : 0);

  const asBody = (b: RapierRigidBody) => b as unknown as Parameters<typeof combatTick>[1];

  // BUG-FIX: Teleport effect. When store x/z changes (e.g. ch4_bad_warehouse
  // teleport to warehouse), move the rigid body to the new position. Without
  // this, the teleport effect only updates the store; the rigid body stays at
  // its old position and the player never visually relocates.
  useEffect(() => {
    const rb = body.current;
    if (!rb) return;
    const current = rb.translation();
    const dx = spawnX - current.x;
    const dz = spawnZ - current.z;
    // Only teleport if the position changed significantly (>1 unit) —
    // avoids fighting with normal physics motion on small store updates.
    if (Math.hypot(dx, dz) > 1.0) {
      rb.setTranslation({ x: spawnX, y: 0.75, z: spawnZ }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      // v0.16.0: re-arm the settle pin — story teleports and scene changes
      // mount new world bundles; without the pin the body sinks through the
      // floor until their colliders step for the first time.
      groundHoldUntil.current = performance.now() + 2500;
      // Also update runtime playerPos so camera/combat read the new position
      playerPos.x = spawnX;
      playerPos.z = spawnZ;
      spawnRef.current = { x: spawnX, z: spawnZ };
    }
  }, [spawnX, spawnZ]);

  useFrame((state, deltaRaw) => {
    const rb = body.current;
    if (!rb) return;
    const dt = Math.min(deltaRaw, 0.05);
    const game = useGame.getState();
    const mode = game.mode;
    const inControl = mode === 'GAMEPLAY' || mode === 'COMBAT';

    const t = rb.translation();
    const lv = rb.linvel();

    // spawn-settle pin — hold the body above the floor until colliders are
    // live (see groundHoldUntil above). Runs in every mode: a teleport or
    // scene change mid-cutscene must settle the same way. Releases EARLY the
    // moment a ground ray hits — fast devices never see the float.
    if (groundHoldUntil.current > 0) {
      if (performance.now() < groundHoldUntil.current) {
        rb.setTranslation({ x: t.x, y: 1.2, z: t.z }, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        const settleRay = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: 0, y: -1, z: 0 });
        const settleHit = world.castRay(settleRay, 2.0, true, undefined, undefined, undefined, rb);
        if (settleHit) {
          // a ray hit means the collider graph is live — drop normally right
          // away (fast devices never see the float; slow ones hold ≤ 2.5 s)
          groundHoldUntil.current = 0;
        }
        syncFrom(t.x, 1.2, t.z, 0, 0);
        return;
      }
      groundHoldUntil.current = 0;
    }

    // keep above ground (safety)
    if (t.y < -2) {
      rb.setTranslation({ x: spawnRef.current.x, y: 1.2, z: spawnRef.current.z }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      // v0.16.0: re-arm the settle pin — the old plain respawn made the body
      // fall through the same missing colliders again in a loop.
      groundHoldUntil.current = performance.now() + 2500;
      return;
    }

    if (!inControl) {
      if (Math.abs(lv.x) > 0.01 || Math.abs(lv.z) > 0.01 || lv.y > 0.01) {
        rb.setLinvel({ x: 0, y: Math.min(lv.y, 0) * 0.5, z: 0 }, true);
      }
      syncFrom(t.x, t.y, t.z, 0, 0);
      updateAnim(dt, 0, false);
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
        // v0.15.2: anti-stuck — mode COMBAT tanpa encounter aktif (start()
        // gagal karena id tak dikenal, atau store tertinggal dalam keadaan
        // reset) tidak boleh membekukan pemain selamanya; pulihkan kontrol.
        // Fase transien 'won'/'lost' masih membawa encounterId → tetap freeze
        // 1 frame sampai finishCombatWin/onLose memindahkan mode.
        if (!combat.encounterId) useGame.getState().setMode('GAMEPLAY');
      }
      syncFrom(t.x, t.y, t.z, lv.x, lv.z);
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
    let nvx = THREE.MathUtils.lerp(lv.x, tx, k);
    let nvz = THREE.MathUtils.lerp(lv.z, tz, k);

    // v0.16.0 character collision — figures are kinematic visuals (no rapier
    // colliders), so without this the player walks straight through NPCs,
    // ambient students and (in combat) the enemy. Slide around bodies + push
    // out of any existing overlap.
    const bodies = nearbyBodies([npcPositions, crowdPositions], t.x, t.z);
    if (enemyPos.active) {
      const ex = enemyPos.x - t.x;
      const ez = enemyPos.z - t.z;
      if (Math.abs(ex) <= 1.4 && Math.abs(ez) <= 1.4) bodies.push({ x: enemyPos.x, z: enemyPos.z });
    }
    if (bodies.length) {
      for (const o of bodies) {
        if (Math.hypot(t.x - o.x, t.z - o.z) < 0.9) {
          const sv = stripIntoVelocity(nvx, nvz, t.x, t.z, o.x, o.z);
          nvx = sv.vx;
          nvz = sv.vz;
        }
      }
      const res = resolveOverlaps({ x: t.x, z: t.z }, bodies);
      if (res.hit) {
        rb.setTranslation({ x: res.x, y: t.y, z: res.z }, true);
        t.x = res.x;
        t.z = res.z;
      }
    }

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

    // facing follows movement; while standing it follows the CAMERA
    // (v0.16.1 "arah hadap mengikuti kamera"): rotating the orbit/drag camera
    // with no keys held now turns the body with it, instead of freezing on
    // the last walk direction. The target is the exact angle a W-press would
    // produce, so releasing a key never snaps the figure.
    const hSpeed = Math.hypot(nvx, nvz);
    if (hSpeed > 0.4) {
      playerPos.facing = Math.atan2(nvx, nvz);
    } else {
      playerPos.facing = approachFacing(playerPos.facing, camForwardAngle(camYaw()), dt);
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
    syncFrom(t.x, t.y, t.z, nvx, nvz);
  });

  const syncFrom = (x: number, y: number, z: number, vx: number, vz: number) => {
    playerPos.x = x;
    playerPos.z = z;
    // v0.8.0: true feet height (capsule center − 0.75). Ground floors read ~0,
    // Gedung B L2 ≈ 3.5 / L3 ≈ 7.0 — drives y-aware zoneAt (upper-floor zones).
    playerPos.y = y - 0.75;
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
// Figure geometry: legs bottom at y=-0.03 (relative to Figure root).
// RigidBody capsule center is at y=0.75 (so capsule bottom touches ground y=0).
// To make Figure's feet touch ground, offset Figure root by y=-0.75 relative to RigidBody.
function PlayerFigure() {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const game = useGame.getState();
    // v0.13.0: hide Ren's body while the FP head-cam is active in gameplay /
    // combat — otherwise the figure fills the whole screen. Story modes
    // (DIALOGUE / CINEMATIC) always show the body: their cameras are
    // authored third-person shots that need Ren in frame.
    const s = useSettings.getState();
    const fpActive = s.camMode === 'first' && (game.mode === 'GAMEPLAY' || game.mode === 'COMBAT');
    g.visible = !fpActive;
    const act = acting['ren'];
    // During dialogue Ren turns his body toward the conversation partner
    // (mentor #3 — body orientation). In gameplay the body follows movement.
    if ((game.mode === 'DIALOGUE' || game.mode === 'CINEMATIC') && act && !Number.isNaN(act.gazeX)) {
      const desired = Math.atan2(act.gazeX - playerPos.x, act.gazeZ - playerPos.z);
      let local = desired - playerPos.facing;
      local = Math.atan2(Math.sin(local), Math.cos(local));
      const clamped = Math.max(-1.1, Math.min(1.1, local));
      g.rotation.y = playerPos.facing + THREE.MathUtils.lerp(0, clamped, 0.85);
    } else {
      g.rotation.y = playerPos.facing;
    }
  });
  return (
    <group ref={group} position={[0, -0.75, 0]}>
      <Figure anim={playerAnim} color="#e2e8f0" accent="#38bdf8" nameTag={undefined} actId="ren" />
    </group>
  );
}
