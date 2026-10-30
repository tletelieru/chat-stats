export const DEFAULT_TIME_ZONE = 'America/Santiago';

const HOUR_MS = 3_600_000;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function utcOffsetMs(ts: number, timeZone: string): number {
  const values: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(ts)) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );
  return asUtc - Math.floor(ts / 1000) * 1000;
}

export function createOffsetCache(timeZone: string): (ts: number) => number {
  const cache = new Map<number, number>();
  return (ts) => {
    const block = Math.floor(ts / HOUR_MS);
    let offset = cache.get(block);
    if (offset === undefined) {
      offset = utcOffsetMs(block * HOUR_MS, timeZone);
      cache.set(block, offset);
    }
    return offset;
  };
}

export function wallTimeToTs(wallAsUtc: number, timeZone: string): number {
  const first = wallAsUtc - utcOffsetMs(wallAsUtc, timeZone);
  return wallAsUtc - utcOffsetMs(first, timeZone);
}
