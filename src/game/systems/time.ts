import type { Clock } from '../../types';

export const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'] as const;

export type PeriodId = 'arrive' | 'class' | 'break' | 'class2' | 'lunch' | 'class3' | 'after';
export type Period = { id: PeriodId; label: string };

// Configurable school schedule (GDD §5.3)
const PERIOD_TABLE: { id: PeriodId; from: number; to: number; label: string }[] = [
  { id: 'arrive', from: 6 * 60, to: 8 * 60, label: 'Menuju Kelas' },
  { id: 'class', from: 8 * 60, to: 10 * 60, label: 'Pelajaran' },
  { id: 'break', from: 10 * 60, to: 11 * 60, label: 'Istirahat' },
  { id: 'class2', from: 11 * 60, to: 12 * 60, label: 'Pelajaran' },
  { id: 'lunch', from: 12 * 60, to: 13 * 60 + 30, label: 'Istirahat Siang' },
  { id: 'class3', from: 13 * 60 + 30, to: 14 * 60, label: 'Pelajaran' },
  { id: 'after', from: 14 * 60, to: 23 * 60 + 59, label: 'Pulang Sekolah' },
];

export function periodFor(minutes: number): Period {
  const m = Math.max(0, Math.min(24 * 60 - 1, minutes));
  const found = PERIOD_TABLE.find((p) => m >= p.from && m < p.to);
  return found ? { id: found.id, label: found.label } : { id: 'after', label: 'Pulang Sekolah' };
}

export function formatHhmm(minutes: number): string {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function advance(clock: Clock, minutes: number): Clock {
  let day = clock.day;
  let total = clock.minutes + Math.max(0, Math.round(minutes));
  while (total >= 24 * 60) {
    total -= 24 * 60;
    day += 1;
  }
  // School week loops (Senin–Jumat); events compress time anyway.
  if (day >= DAYS.length) day = day % DAYS.length;
  return { day, minutes: total };
}

export function clockLabel(clock: Clock): string {
  const period = periodFor(clock.minutes);
  return `${DAYS[clock.day]} // ${formatHhmm(clock.minutes)} — ${period.label}`;
}
