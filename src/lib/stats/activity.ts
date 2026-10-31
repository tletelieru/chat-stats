import { DAY_MS, HOUR_MS, dayKey, monthKey } from './context';
import type { Accumulator, PassContext } from './context';
import type { Activity, PeriodCount, PersonActivity } from './types';

const HEAT_CELLS = 7 * 24;
const TYPICAL_RATIO = 0.01;

const partOfDay = (hour: number) => (hour < 6 ? 0 : hour < 12 ? 1 : hour < 19 ? 2 : 3);

function indexOfMax(values: number[]): number | null {
  let best = -1;
  let bestValue = 0;
  values.forEach((value, index) => {
    if (value > bestValue) {
      best = index;
      bestValue = value;
    }
  });
  return best === -1 ? null : best;
}

function typicalHours(heat: number[], total: number): [number | null, number | null] {
  const hours = new Array<number>(24).fill(0);
  heat.forEach((value, cell) => (hours[cell % 24] += value));
  const threshold = Math.max(1, total * TYPICAL_RATIO);
  const active = hours.flatMap((count, hour) => (count >= threshold ? [hour] : []));
  return active.length ? [active[0], active[active.length - 1]] : [null, null];
}

function groupPeriods(
  days: [number, number[]][],
  people: number,
  keyOf: (day: number) => string,
): PeriodCount[] {
  const periods = new Map<string, number[]>();
  for (const [day, counts] of days) {
    const key = keyOf(day);
    let totals = periods.get(key);
    if (!totals) {
      totals = new Array<number>(people).fill(0);
      periods.set(key, totals);
    }
    counts.forEach((count, person) => (totals[person] += count));
  }
  return [...periods].map(([period, perPerson]) => ({ period, perPerson }));
}

const weekStart = (day: number) => dayKey(day - ((day + 3) % 7));

export function createActivity(context: PassContext): Accumulator<Activity> {
  const { columns, people, localTs } = context;
  const { author } = columns;

  const days = new Map<number, number[]>();
  const heat = new Array<number>(HEAT_CELLS).fill(0);
  const perPerson = Array.from({ length: people }, () => ({
    heat: new Array<number>(HEAT_CELLS).fill(0),
    parts: new Array<number>(4).fill(0),
    total: 0,
  }));

  let lastDay = NaN;
  let lastCounts: number[] = [];

  return {
    add(index) {
      const local = localTs(index);
      const day = Math.floor(local / DAY_MS);
      if (day !== lastDay) {
        lastDay = day;
        const known = days.get(day);
        lastCounts = known ?? new Array<number>(people).fill(0);
        if (!known) days.set(day, lastCounts);
      }

      const person = author[index];
      lastCounts[person]++;

      const hour = Math.floor((local - day * DAY_MS) / HOUR_MS);
      const weekday = (((day + 4) % 7) + 7) % 7;
      const cell = weekday * 24 + hour;
      heat[cell]++;
      const state = perPerson[person];
      state.heat[cell]++;
      state.parts[partOfDay(hour)]++;
      state.total++;
    },

    result() {
      const sorted = [...days].sort((a, b) => a[0] - b[0]);
      const total = (counts: number[]) => counts.reduce((sum, value) => sum + value, 0);

      let busiestDay: Activity['busiestDay'] = null;
      let longestStreak: Activity['longestStreak'] = null;
      let longestGap: Activity['longestGap'] = null;
      let streakStart = 0;

      sorted.forEach(([day, counts], position) => {
        const count = total(counts);
        if (!busiestDay || count > busiestDay.count) busiestDay = { day: dayKey(day), count };

        if (position > 0) {
          const previous = sorted[position - 1][0];
          if (day !== previous + 1) {
            streakStart = position;
            const gap = day - previous - 1;
            if (!longestGap || gap > longestGap.days) {
              longestGap = { days: gap, from: dayKey(previous), to: dayKey(day) };
            }
          }
        }

        const length = position - streakStart + 1;
        if (!longestStreak || length > longestStreak.days) {
          longestStreak = { days: length, from: dayKey(sorted[streakStart][0]), to: dayKey(day) };
        }
      });

      return {
        days: sorted.map(([day, counts]) => ({
          day: dayKey(day),
          total: total(counts),
          perPerson: counts,
        })),
        weeks: groupPeriods(sorted, people, weekStart),
        months: groupPeriods(sorted, people, (day) => monthKey(day * DAY_MS)),
        heat,
        perPerson: perPerson.map((state): PersonActivity => {
          const [earliestHour, latestHour] = typicalHours(state.heat, state.total);
          const hours = new Array<number>(24).fill(0);
          const weekdays = new Array<number>(7).fill(0);
          state.heat.forEach((value, cell) => {
            hours[cell % 24] += value;
            weekdays[Math.floor(cell / 24)] += value;
          });
          return {
            heat: state.heat,
            topHour: indexOfMax(hours),
            topWeekday: indexOfMax(weekdays),
            partsOfDay: state.parts,
            earliestHour,
            latestHour,
          };
        }),
        busiestDay,
        longestStreak,
        longestGap,
      };
    },
  };
}
