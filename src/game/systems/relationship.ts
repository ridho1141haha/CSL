// Relationship: -100..+100 with labeled tiers.
export const REL_MIN = -100;
export const REL_MAX = 100;

const TIERS: [number, string][] = [
  [75, 'CLOSE FRIEND'],
  [40, 'FRIEND'],
  [10, 'ACQUAINTANCE'],
  [-10, 'NEUTRAL'],
  [-40, 'SUSPICIOUS'],
  [-100, 'HOSTILE'],
];

export function clampRel(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(REL_MIN, Math.min(REL_MAX, Math.round(v)));
}

export function relLabel(v: number): string {
  for (const [min, label] of TIERS) if (v >= min) return label;
  return 'NEUTRAL';
}
