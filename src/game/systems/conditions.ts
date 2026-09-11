import type { Condition } from '../../types';

export type ConditionContext = {
  flags: string[];
  chapter: number;
  route: string;
  quests: Record<string, string>;
  relationships: Record<string, number>;
  stats: { academic: number; violence: number; diplomacy: number; reputation: number };
  focus: number;
};

export function evalCondition(c: Condition | undefined, ctx: ConditionContext): boolean {
  if (!c) return true;
  switch (c.k) {
    case 'flag':
      return ctx.flags.includes(c.id) !== !!c.not;
    case 'chapter':
      return ctx.chapter === c.id;
    case 'route':
      return ctx.route === c.id;
    case 'quest':
      return (ctx.quests[c.id] ?? 'locked') === c.state;
    case 'relAbove':
      return (ctx.relationships[c.target] ?? 0) > c.v;
    case 'statAbove':
      return ctx.stats[c.stat] > c.v;
    case 'focusAbove':
      return ctx.focus > c.v;
    case 'and':
      return c.all.every((sub) => evalCondition(sub, ctx));
  }
}
