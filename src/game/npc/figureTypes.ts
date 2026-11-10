import type { MutableRefObject } from 'react';
import type { HoldKind } from '../../types';
import type { CharModelId, TintSlot } from './characters';

// Shared figure contracts — one module so the legacy renderer (Character.tsx)
// and the skeletal adapter (GlbFigure.tsx) can both implement the SAME props
// contract without importing each other (no circular dependency).

export type FigureAnim = {
  speed: number;
  run: boolean;
  attackT: number;
  block: boolean;
  hurtT: number;
  down: boolean;
  sit: boolean;
  crouch: boolean;
};

export const makeAnim = (): FigureAnim => ({
  speed: 0,
  run: false,
  attackT: -1,
  block: false,
  hurtT: -1,
  down: false,
  sit: false,
  crouch: false,
});

export type FigureProps = {
  anim: MutableRefObject<FigureAnim>;
  color: string;
  accent: string;
  scale?: number;
  nameTag?: string;
  tag?: string;
  actId?: string;
  hold?: HoldKind;
  skin?: string;
  pants?: string;
  skirt?: string;
  hair?: { color: string; style: 'short' | 'wave' | 'ponytail' | 'buzz' };
  trim?: boolean;
  modelId?: CharModelId;
  // v0.18.1: per-instance material overrides from the character registry
  // (ambient variants). Undefined → baked GLB look, zero extra work — the
  // main cast never passes this, so their render path is unchanged.
  tint?: Partial<Record<TintSlot, string>>;
};
