import { useRef } from 'react';
import * as THREE from 'three';
import type { HoldKind } from '../../types';

// Shared visual parts for both character renderers (legacy joint Figure and
// the skeletal GlbFigure). Extracted so the adapter can reuse them without a
// circular import between the two renderers.

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function NameSprite({ text, tag, y = 1.95 }: { text: string; tag?: string; y?: number }) {
  const tex = useRef<THREE.CanvasTexture | null>(null);
  if (!tex.current && typeof document !== 'undefined') {
    const W = 512;
    const H = tag ? 148 : 112;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(10,13,20,0.72)';
    roundRect(g, 6, 6, W - 12, H - 12, 18);
    g.fill();
    g.strokeStyle = 'rgba(245,158,11,0.85)';
    g.lineWidth = 4;
    roundRect(g, 6, 6, W - 12, H - 12, 18);
    g.stroke();
    g.textAlign = 'center';
    g.fillStyle = '#f1f3f9';
    g.font = '700 56px "Space Grotesk", Arial, sans-serif';
    g.fillText(text, W / 2, tag ? 68 : 86);
    if (tag) {
      g.fillStyle = '#f59e0b';
      g.font = '600 34px "JetBrains Mono", monospace';
      g.fillText(tag, W / 2, 122);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    tex.current = t;
  }
  const w = 1.35;
  const h = tag ? 0.42 : 0.34;
  return (
    <sprite position={[0, y, 0]} scale={[w, h, 1]}>
      <spriteMaterial map={tex.current ?? undefined} transparent depthTest={false} />
    </sprite>
  );
}

export function HoldProp({ kind, cylSeg }: { kind: HoldKind; cylSeg: number }) {
  const hand: [number, number, number] = [0.0, -0.42, 0.03];
  if (kind === 'pencil') {
    return (
      <group position={hand} rotation={[1.25, 0, 0.2]}>
        <mesh castShadow position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.17, 8]} />
          <meshStandardMaterial color="#e8a33d" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.115, 0]}>
          <coneGeometry args={[0.011, 0.03, 8]} />
          <meshStandardMaterial color="#d9c9a3" roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (kind === 'eraser') {
    return (
      <group position={hand}>
        <mesh castShadow>
          <boxGeometry args={[0.055, 0.024, 0.036]} />
          <meshStandardMaterial color="#eef2f7" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0, -0.012]}>
          <boxGeometry args={[0.056, 0.025, 0.014]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.55} />
        </mesh>
      </group>
    );
  }
  if (kind === 'book') {
    return (
      <group position={[0.02, -0.4, 0.12]} rotation={[0.55, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.026, 0.17]} />
          <meshStandardMaterial color="#5a4a35" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.004, 0.004]}>
          <boxGeometry args={[0.215, 0.02, 0.15]} />
          <meshStandardMaterial color="#e7dcc3" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.016, 0]}>
          <boxGeometry args={[0.012, 0.024, 0.172]} />
          <meshStandardMaterial color="#3f352a" roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (kind === 'map') {
    return (
      <group position={[0.01, -0.38, 0.1]} rotation={[0.5, 0, 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.012, 0.34]} />
          <meshStandardMaterial color="#b3282d" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.008, 0]}>
          <boxGeometry args={[0.225, 0.004, 0.3]} />
          <meshStandardMaterial color="#f1e8d8" roughness={0.85} />
        </mesh>
      </group>
    );
  }
  if (kind === 'stack') {
    return (
      <group position={[0.05, -0.38, 0.14]} rotation={[0.35, 0.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.05, 0.22]} />
          <meshStandardMaterial color="#d9c9a3" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.015, 0.05, 0.01]} rotation={[0, 0.12, 0]}>
          <boxGeometry args={[0.28, 0.045, 0.2]} />
          <meshStandardMaterial color="#5a7ea0" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.01, 0.092, -0.01]} rotation={[0, -0.08, 0]}>
          <boxGeometry args={[0.26, 0.04, 0.19]} />
          <meshStandardMaterial color="#6b8f6a" roughness={0.8} />
        </mesh>
      </group>
    );
  }
  if (kind === 'bottle') {
    return (
      <group position={hand}>
        <mesh castShadow position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.042, 0.046, 0.2, cylSeg]} />
          <meshStandardMaterial color="#8ec7e8" roughness={0.15} metalness={0.1} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.035, 8]} />
          <meshStandardMaterial color="#2f6db1" roughness={0.5} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[0.005, -0.4, 0.05]} rotation={[0.35, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.078, 0.155, 0.012]} />
        <meshStandardMaterial color="#11151c" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.066, 0.135, 0.004]} />
        <meshStandardMaterial color="#7fb7d9" emissive="#9fd3ef" emissiveIntensity={0.55} roughness={0.25} />
      </mesh>
    </group>
  );
}
