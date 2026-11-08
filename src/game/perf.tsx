import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cullRegistry, cullDecision, perfState } from './runtime';
import { useSettings } from '../stores/settingsStore';
import { qualityConfig, adaptiveDpr } from './quality';
import { mobile } from './mobile';

// ============================================================================
// perf.tsx — v0.9.0 render optimizations (user request: "menurunkan grafik,
// yang ga keliatan ga dirender, loading screen").
//
// GraphicsManager — applies the selected quality preset to the live renderer:
//   dpr cap, shadowMap on/off. Mounted once inside <Canvas>.
//
// CullingManager — throttled sweep over the cull registry (registered by
// <Cull> wrappers in the world). A bundle is hidden when it is fully outside
// the camera frustum (beyond the preset safety margin) or, for 'interior'
// bundles, when it sits beyond `interiorRange` meters (walls hide it anyway,
// fog covers the swap). Sweeps run ~8×/second — cheap vs. the draw-call and
// shadow-pass savings of hiding hundreds of meshes at once.
//
// WorldReadyProbe — flips perfState.worldReady after the first rendered
// frames; the boot loading gate waits for it so "MEMUAT" reflects reality.
// ============================================================================

const SWEEP_INTERVAL = 0.12; // seconds between culling sweeps

const _frustum = new THREE.Frustum();
const _projScreen = new THREE.Matrix4();
const _sphere = new THREE.Sphere();

export function GraphicsManager() {
  const quality = useSettings((s) => s.quality);
  const setDpr = useThree((s) => s.setDpr);
  const gl = useThree((s) => s.gl);

  // v0.14.3 adaptive dpr — safety net for weak GPUs (user laptop still
  // stuttered at RENDAH). ~1 FPS sample per window; sustained <42 fps steps
  // dpr down 15% (floor 0.55), sustained >56 fps climbs back toward the
  // preset dpr. Pure logic lives in quality.adaptiveDpr (unit-tested).
  const base = useRef(qualityConfig(quality, mobile.tier).dpr);
  const cur = useRef(base.current);
  const acc = useRef(0);
  const frames = useRef(0);

  useEffect(() => {
    const cfg = qualityConfig(quality, mobile.tier);
    base.current = cfg.dpr;
    cur.current = cfg.dpr; // preset changes reset the adaptive state
    setDpr(cfg.dpr);
    if (gl.shadowMap.enabled !== cfg.shadows) {
      gl.shadowMap.enabled = cfg.shadows;
      // stale shadow buffers must go before the next render picks the new size
      gl.shadowMap.needsUpdate = true;
    }
  }, [quality, setDpr, gl]);

  useFrame((_, deltaRaw) => {
    if (!perfState.worldReady) return; // ignore boot/compile spikes
    acc.current += deltaRaw;
    frames.current++;
    if (acc.current < 1.2) return; // 1.2s window = stable sample + hysteresis
    const fps = frames.current / acc.current;
    acc.current = 0;
    frames.current = 0;
    const next = adaptiveDpr(base.current, cur.current, fps);
    if (next !== cur.current) {
      cur.current = next;
      setDpr(next);
    }
  });

  return null;
}

export function CullingManager() {
  const camera = useThree((s) => s.camera);
  const quality = useSettings((s) => s.quality);
  const acc = useRef(0);

  // restore everything we hid before unmounting (scene swaps mid-sweep)
  useEffect(() => {
    return () => {
      for (const e of cullRegistry.entries) {
        (e.obj as THREE.Object3D).visible = true;
      }
    };
  }, []);

  useFrame((_, delta) => {
    acc.current += delta;
    if (acc.current < SWEEP_INTERVAL || cullRegistry.entries.length === 0) return;
    acc.current = 0;

    const cfg = qualityConfig(quality, mobile.tier);
    camera.updateMatrixWorld();
    _projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_projScreen);

    let hidden = 0;
    for (const e of cullRegistry.entries) {
      const o = e.obj as THREE.Object3D;
      _sphere.center.set(e.center[0], e.center[1], e.center[2]);
      _sphere.radius = e.radius;
      const inFrustum = _frustum.intersectsSphere(_sphere);
      const shouldHide = cullDecision(e, camera.position, {
        interiorRange: cfg.interiorRange,
        margin: cfg.cullMargin,
        inFrustum,
        farRange: cfg.fogFar, // v0.14.3: bundles fully past the fog are invisible
      });
      o.visible = !shouldHide;
      if (shouldHide) hidden++;
    }
    perfState.hiddenBundles = hidden;
    perfState.lastCullSweepAt = Date.now();
  });

  return null;
}

export function WorldReadyProbe() {
  const frames = useRef(0);
  useFrame(() => {
    if (perfState.worldReady) return;
    frames.current++;
    // two rendered frames = shaders compiled & first world draw actually done
    if (frames.current >= 2) perfState.worldReady = true;
  });
  return null;
}
