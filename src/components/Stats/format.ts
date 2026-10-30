export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const HOURS = Array.from({ length: 24 }, (_, hour) => `${hour}`.padStart(2, '0'));
export const PARTS_OF_DAY = [
  'Night (0–6)',
  'Morning (6–12)',
  'Afternoon (12–19)',
  'Evening (19–24)',
];
export const RESPONSE_BUCKETS = ['< 1 min', '1–5 min', '5–30 min', '30 min–1 h', '1–6 h', '≥ 6 h'];

export const number = (value: number) => Math.round(value).toLocaleString();
export const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
export const date = (ts: number | null, timeZone: string) =>
  ts === null ? '–' : new Intl.DateTimeFormat('sv-SE', { timeZone, dateStyle: 'short' }).format(ts);
export const dateTime = (ts: number, timeZone: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone, dateStyle: 'short', timeStyle: 'short' }).format(ts);

export function duration(ms: number | null): string {
  if (ms === null) return '–';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
}

export const hour = (value: number | null) => (value === null ? '–' : `${HOURS[value]}:00`);
export const weekday = (value: number | null) => (value === null ? '–' : WEEKDAYS[value]);
