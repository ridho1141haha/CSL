// Centralized character registry — single source of truth for every character
// model used in CSL (main cast + ambient NPC variants).
//
// v0.18.1 ambient variety fix: previously the only model resolution path was
// resolveCharModelId() in Character.tsx, which matches exact hex colors of the
// main cast — ambient students (muted grey palette) never matched and all fell
// through to 'ren'. This registry gives every NPC a stable, data-driven
// identity: base GLB + optional per-instance material tints.
//
// Asset reality (do not assume otherwise): public/models contains exactly five
// character GLBs (ren/aris/siti/bimo/budi) and no dedicated ambient models.
// All five share the same node/joint layout (Root/Torso/Head/Mouth/ArmL/ArmR/
// LegL/LegR, no skins, no animation clips — joints are posed in code), so any
// variant can use any base model with the existing animation system. Variety
// therefore comes from base-model choice + deterministic uniform tints, NOT
// from new assets.

export type CharModelId = 'ren' | 'aris' | 'siti' | 'bimo' | 'budi';

export const CHAR_GLB_PATHS: Record<CharModelId, string> = {
  ren: '/models/csl_char_ren.glb',
  aris: '/models/csl_char_aris.glb',
  siti: '/models/csl_char_siti.glb',
  bimo: '/models/csl_char_bimo.glb',
  budi: '/models/csl_char_budi.glb',
};

// Per-instance tint slots. Each slot maps to a material name that exists in
// ALL five character GLBs (verified — same 18-material layout in every file;
// only mat_head_tex carries a texture and is never tinted). Tinting clones
// only the touched materials on the cloned scene, so instances of the same
// base model never share tinted material state.
export type TintSlot = 'shirt' | 'shirt2' | 'tie' | 'pants' | 'skirt' | 'acc' | 'bag';

export const TINT_SLOT_MATERIALS: Record<TintSlot, string> = {
  shirt: 'mat_shirt',
  shirt2: 'mat_shirt2',
  tie: 'mat_tie',
  pants: 'mat_pants',
  skirt: 'mat_skirt',
  acc: 'mat_acc',
  bag: 'mat_bag',
};

export type CharacterVariant = {
  /** Stable identity — never derived from render order or array index. */
  id: string;
  /** Debug/human label (maps, logs, future tooling). */
  label: string;
  /** Base GLB to render. */
  model: CharModelId;
  /** Optional per-instance material overrides (undefined = baked look). */
  tint?: Partial<Record<TintSlot, string>>;
};

// ── Main cast ──────────────────────────────────────────────────────────────
// Identity is fully baked into each GLB (face texture + outfit). No tint —
// the render path stays byte-identical to the pre-registry behavior.
export const MAIN_CHARACTERS: Record<CharModelId, CharacterVariant> = {
  ren: { id: 'ren', label: 'Ren', model: 'ren' },
  aris: { id: 'aris', label: 'Aris', model: 'aris' },
  siti: { id: 'siti', label: 'Siti', model: 'siti' },
  bimo: { id: 'bimo', label: 'Bimo', model: 'bimo' },
  budi: { id: 'budi', label: 'Pak Budi', model: 'budi' },
};

// ── Ambient NPC variants ───────────────────────────────────────────────────
// Muted school-uniform palettes (SMA Indonesia: putih/abu + aksen dasi).
// Female variants ride the siti base (baked skirt mesh), staff variants ride
// the budi base, the rest spread across aris/bimo/ren. Ren's signature look
// (bright shirt) is avoided: the ren-base variant wears a dark sweater tint
// so no wanderer reads as "second Ren".
export const AMBIENT_VARIANTS: CharacterVariant[] = [
  { id: 'amb_v01', label: 'Murid — dasi amber', model: 'aris', tint: { tie: '#b45309', bag: '#57534e' } },
  { id: 'amb_v02', label: 'Murid — dasi teal', model: 'aris', tint: { tie: '#0f766e', acc: '#0f766e', bag: '#44403c' } },
  { id: 'amb_v03', label: 'Murid putri — dasi maroon', model: 'siti', tint: { tie: '#7c2d12', skirt: '#3f3f46' } },
  { id: 'amb_v04', label: 'Murid putri — dasi biru', model: 'siti', tint: { tie: '#1d4ed8', skirt: '#27272a', bag: '#4b5563' } },
  { id: 'amb_v05', label: 'Murid putri — dasi plum', model: 'siti', tint: { tie: '#9d174d', skirt: '#334155' } },
  { id: 'amb_v06', label: 'Murid — seragam putih hijau', model: 'bimo', tint: { shirt: '#e2e8f0', tie: '#166534' } },
  { id: 'amb_v07', label: 'Murid — seragam putih navy', model: 'bimo', tint: { shirt: '#cbd5e1', tie: '#1e40af', pants: '#3f3f46' } },
  { id: 'amb_v08', label: 'Staf sekolah — vest abu', model: 'budi', tint: { shirt: '#d6d3d1', tie: '#57534e', pants: '#292524' } },
  { id: 'amb_v09', label: 'Staf sekolah — vest cokelat', model: 'budi', tint: { shirt: '#e7e5e4', tie: '#713f12', pants: '#1c1917' } },
  { id: 'amb_v10', label: 'Murid — sweater slate', model: 'ren', tint: { shirt: '#475569', tie: '#e2e8f0', pants: '#1f2937' } },
];

// FNV-1a 32-bit — tiny, stable across sessions/platforms, no deps.
export function hashStableId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic variant assignment for an ambient NPC.
 * Pure function of the stable id — same id always resolves to the same
 * variant, independent of React render order, mount order, or quality
 * presets. Unknown ids still resolve (hash % table length) instead of
 * falling back to a single default model.
 */
export function ambientVariantFor(stableId: string): CharacterVariant {
  return AMBIENT_VARIANTS[hashStableId(stableId) % AMBIENT_VARIANTS.length];
}
