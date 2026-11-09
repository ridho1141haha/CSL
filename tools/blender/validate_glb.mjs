// Dependency-free GLB validator.  node tools/blender/validate_glb.mjs assets/characters
import fs from 'node:fs'; import path from 'node:path';
const REQUIRED = ['Root','Hips','Spine','Chest','Neck','Head','UpperArm_L','LowerArm_L','Hand_L','UpperArm_R','LowerArm_R','Hand_R','UpperLeg_L','LowerLeg_L','Foot_L','UpperLeg_R','LowerLeg_R','Foot_R'];
const BUDGET = { main: [3000, 25000], ambient: [1000, 8000] };
function walk(d){ return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):e.name.endsWith('.glb')?[path.join(d,e.name)]:[]); }
function parse(file){
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546C67) throw new Error('not a GLB');
  const jl = b.readUInt32LE(12); const json = JSON.parse(b.slice(20, 20+jl).toString());
  return { json, bytes: b.length };
}
let bad = 0; const rows = [];
for (const f of walk(process.argv[2] || 'assets/characters')) {
  const { json: g, bytes } = parse(f); const issues = [];
  let tris = 0, minY = Infinity, maxY = -Infinity;
  for (const m of g.meshes || []) for (const p of m.primitives) {
    tris += g.accessors[p.indices].count / 3;
    const a = g.accessors[p.attributes.POSITION];
    if (a.min) { minY = Math.min(minY, a.min[1]); maxY = Math.max(maxY, a.max[1]); }
    if (p.attributes.TEXCOORD_0 === undefined) issues.push('missing UV');
    if (p.attributes.NORMAL === undefined) issues.push('missing normals');
    if (g.skins && p.attributes.JOINTS_0 === undefined) issues.push('mesh not skinned');
    if (p.material === undefined) issues.push('primitive without material');
  }
  const names = new Set((g.nodes || []).map(n => n.name));
  const missing = REQUIRED.filter(n => !names.has(n)); if (missing.length) issues.push('missing bones: ' + missing.join(','));
  if (!g.skins || g.skins.length !== 1) issues.push('expected exactly 1 skin');
  if (Math.abs(minY) > 0.01) issues.push('feet not at y=0 (' + minY.toFixed(3) + ')');
  if ((g.buffers||[]).some(x => x.uri)) issues.push('external buffer');
  if ((g.images||[]).some(x => x.uri && !x.uri.startsWith('data:'))) issues.push('external image');
  const morphs = new Set(); for (const m of g.meshes||[]) (m.extras?.targetNames||[]).forEach(n=>morphs.add(n));
  const amb = f.includes('ambient'); const [lo, hi] = amb ? BUDGET.ambient : BUDGET.main;
  if (tris > hi) issues.push(`tris ${tris} > ${hi}`);
  rows.push({ file: path.basename(f), tris, prims: (g.meshes||[]).reduce((s,m)=>s+m.primitives.length,0), mats: (g.materials||[]).length, height: (maxY-minY).toFixed(3), KB: (bytes/1024).toFixed(1), morphs: [...morphs].join('/'), issues: issues.join('; ') || 'OK' });
  if (issues.length) bad++;
}
console.table(rows); process.exit(bad ? 1 : 0);
