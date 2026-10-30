import { createOffsetCache } from '~/lib/time';
import type { Columns } from './columns';
import type { Filter, MessageRef, Ranked } from './types';

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;

const PREVIEW_LENGTH = 120;

export type PassContext = {
  columns: Columns;
  filter: Filter;
  people: number;
  localTs: (index: number) => number;
};

export type Accumulator<T> = {
  add: (index: number, prev: number, startsConvo: boolean) => void;
  result: () => T;
};

export function createContext(columns: Columns, filter: Filter): PassContext {
  const base = createOffsetCache(filter.timeZone);
  const perAuthor = new Map<number, (ts: number) => number>();
  for (const [author, zone] of Object.entries(filter.participantTimeZones ?? {})) {
    perAuthor.set(Number(author), createOffsetCache(zone));
  }

  const { ts, author } = columns;
  const localTs =
    perAuthor.size === 0
      ? (index: number) => ts[index] + base(ts[index])
      : (index: number) => ts[index] + (perAuthor.get(author[index]) ?? base)(ts[index]);

  return { columns, filter, people: columns.people.length, localTs };
}

export function messageRef(columns: Columns, index: number): MessageRef {
  return {
    ts: columns.ts[index],
    author: columns.author[index],
    preview: columns.text[index].slice(0, PREVIEW_LENGTH),
  };
}

export function topRanked(counts: Map<string, number>, limit: number): Ranked[] {
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

export const dayKey = (dayIndex: number) => new Date(dayIndex * DAY_MS).toISOString().slice(0, 10);

export const monthKey = (localMs: number) => new Date(localMs).toISOString().slice(0, 7);
