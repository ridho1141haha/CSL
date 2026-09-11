import type { Stats } from '../../types';

export type RepState = 'UNKNOWN' | 'KNOWN' | 'RESPECTED' | 'TROUBLEMAKER' | 'FEARED';

// Reputation points accumulate from events. The *label* depends on points and
// how Ren's behavior leans (violence vs diplomacy).
export function repLabel(points: number, stats: Pick<Stats, 'violence' | 'diplomacy'>): RepState {
  if (points >= 70 && stats.violence >= 50 && stats.violence > stats.diplomacy) return 'FEARED';
  if (points >= 45) return stats.violence > stats.diplomacy ? 'TROUBLEMAKER' : 'RESPECTED';
  if (points >= 20) return 'KNOWN';
  return 'UNKNOWN';
}
