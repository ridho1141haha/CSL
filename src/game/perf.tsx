import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cullRegistry, cullDecision, perfState } from './runtime';
import { useSettings } from '../stores/settingsStore';
import { qualityConfig, resolveQuality, adaptiveDpr } from './quality';
import { mobile } from './mobile';

const SWEEP_INTERVAL = 0.12;

const _frustum = new THREE.Frustum();
const _projScreen = new THREE.Matrix4();
const _sphere = new THREE.Sphere();

export function GraphicsManager() {
  const quality = useSettings((s) => s.quality);
  const setDpr = useThree((s) => s.setDpr);
  const gl = useThree((s) => s.gl);

  const base = useRef(qualityConfig(quality, mobile.tier).dpr);
  const cur = useRef(base.current);
  const acc = useRef(0);
  const frames = useRef(0);

  useEffect(() => {
    const cfg = qualityConfig(quality, mobile.tier);
    const resolved = resolveQuality(quality, mobile.tier);
    base.current = cfg.dpr;
    cur.current = cfg.dpr;
    setDpr(cfg.dpr);

    // High graphics: use PCFSoftShadowMap + slightly richer ACES Filmic exposure
    const targetShadowType = resolved === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    gl.toneMappingExposure = resolved === 'high' ? 1.08 : 1.0;

    if (gl.shadowMap.enabled !== cfg.shadows || gl.shadowMap.type !== targetShadowType) {
      gl.shadowMap.enabled = cfg.shadows;
      gl.shadowMap.type = targetShadowType;
      gl.shadowMap.needsUpdate = true;
    }
  }, [quality, setDpr, gl]);

  useFrame((_, deltaRaw) => {
    if (!perfState.worldReady) return;
    acc.current += deltaRaw;
    frames.current++;
    if (acc.current < 1.2) return;
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
        farRange: cfg.fogFar,
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
    if (frames.current >= 2) perfState.worldReady = true;
  });
  return null;
}
