import { describe, it, expect } from 'vitest';
import { classifyTier } from '../game/mobile';

// v0.5.0 — device tier classification (mobile rescue pack)

describe('classifyTier', () => {
  it('phone (touch + mobile UA) → low tier', () => {
    expect(classifyTier({ mobileUA: true, touch: true, shortSide: 390 })).toBe('low');
  });

  it('small tablet (touch, small short side) → low tier', () => {
    expect(classifyTier({ mobileUA: false, touch: true, shortSide: 480 })).toBe('low');
  });

  it('desktop with mouse → high tier', () => {
    expect(classifyTier({ mobileUA: false, touch: false, shortSide: 1080 })).toBe('high');
  });

  it('touch laptop (big screen) → high tier', () => {
    expect(classifyTier({ mobileUA: false, touch: true, shortSide: 800, cores: 8, memoryGB: 16 })).toBe('high');
  });

  it('weak desktop (few cores) → low tier', () => {
    expect(classifyTier({ mobileUA: false, touch: false, shortSide: 1080, cores: 2, memoryGB: 8 })).toBe('low');
  });

  it('defaults cores/memory generously when unknown', () => {
    // no cores/memory info: assume capable hardware
    expect(classifyTier({ mobileUA: false, touch: false, shortSide: 1440 })).toBe('high');
  });
});
