import { describe, expect, it } from 'vitest';
import { startState } from '../story';

describe('story state', () => {
  it('starts clean', () => {
    const state = startState();
    expect(state.phase).toBe('menu');
    expect(state.flags).toEqual([]);
    expect(state.relationship.aris).toBe(0);
  });
});
