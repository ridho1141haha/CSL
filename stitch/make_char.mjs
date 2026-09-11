// Procedural low-poly student character -> char_proc.glb
// Usage: node stitch/make_char.mjs  (writes public/char_proc.glb)
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const mat = (hex) =>
  new THREE.MeshStandardMaterial({ color: hex, roughness: 0.85, metalness: 0 });

const SKIN = 0xd9a066, SHIRT = 0xf2f2f2, PANTS = 0x1f2a38,
      HAIR = 0x1a1a1a, SHOE = 0x222222;

function box(w, h, d, color, name, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.name = name; m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

const rig = new THREE.Group();
rig.name = 'StudentProc';

// Hip origin at y=0.9 (units: meters). Total height ~1.7.
const hips = new THREE.Group(); hips.name = 'Hips'; hips.position.y = 0.9; rig.add(hips);

const torso = box(0.42, 0.55, 0.24, SHIRT, 'Torso', 0, 0.28, 0); hips.add(torso);
const head = new THREE.Group(); head.name = 'Head'; head.position.y = 0.72; hips.add(head);
head.add(box(0.26, 0.28, 0.26, SKIN, 'Skull', 0, 0.14, 0));
head.add(box(0.28, 0.10, 0.28, HAIR, 'Hair', 0, 0.27, 0));
head.add(box(0.28, 0.14, 0.06, HAIR, 'Bangs', 0, 0.20, 0.12));

for (const side of [-1, 1]) {
  const shoulder = new THREE.Group();
  shoulder.name = side < 0 ? 'ArmL' : 'ArmR';
  shoulder.position.set(side * 0.27, 0.5, 0); hips.add(shoulder);
  shoulder.add(box(0.11, 0.5, 0.13, SHIRT, 'UpperArm', 0, -0.22, 0));
  shoulder.add(box(0.10, 0.12, 0.11, SKIN, 'Hand', 0, -0.52, 0));

  const leg = new THREE.Group();
  leg.name = side < 0 ? 'LegL' : 'LegR';
  leg.position.set(side * 0.11, 0, 0); hips.add(leg);
  leg.add(box(0.15, 0.8, 0.17, PANTS, 'Thigh+Shin', 0, -0.42, 0));
  leg.add(box(0.16, 0.09, 0.26, SHOE, 'Shoe', 0, -0.86, 0.04));
}

const exporter = new GLTFExporter();
const glb = await exporter.parseAsync(rig, { binary: true });
const out = join(root, 'public', 'char_proc.glb');
writeFileSync(out, Buffer.from(glb));
console.log('Wrote', out, `${(glb.byteLength / 1024).toFixed(1)} KB`);
