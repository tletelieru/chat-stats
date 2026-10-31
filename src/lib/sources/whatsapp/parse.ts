import { UNATTRIBUTED_CALL } from '~/lib/model';
import type { Chat, Message, Participant } from '~/lib/model';
import { DEFAULT_TIME_ZONE, wallTimeToTs } from '~/lib/time';
import { matchAndroidHeader } from './android';
import { matchIosHeader } from './ios';
import { classifyBody } from './media';

export type HeaderMatch = {
  date: [string, string, string];
  hour: string;
  minute: string;
  second?: string;
  meridiem?: string;
  body: string;
};

type DateOrder = 'dmy' | 'mdy' | 'ymd';

type PendingMessage = {
  id: number;
  header: HeaderMatch;
  author: string;
  body: string;
  isCall?: boolean;
};

export type WhatsAppOptions = {
  name?: string;
  timeZone?: string;
};

const LEADING_MARKS = new RegExp('^[\\u200e\\u200f\\ufeff]+');
const SPACES = new RegExp('[\\u202f\\u00a0]', 'g');
const LRM = String.fromCharCode(0x200e);
const CALL_LINE = /^- \[(?:call|llamada)\]$/i;
const SYSTEM_HEAD =
  /(cambió el|cambió la|changed the|changed this|creó el grupo|created group|añadió a|added|eliminó a|removed)/i;

function detectOrder(headers: HeaderMatch[]): DateOrder {
  for (const { date } of headers) {
    if (date[0].length === 4) return 'ymd';
    if (Number(date[0]) > 12) return 'dmy';
    if (Number(date[1]) > 12) return 'mdy';
  }
  return 'dmy';
}

function toWallTime({ date, hour, minute, second, meridiem }: HeaderMatch, order: DateOrder) {
  const [a, b, c] = date.map(Number);
  const [year, month, day] = order === 'ymd' ? [a, b, c] : order === 'mdy' ? [c, a, b] : [c, b, a];
  let hours = Number(hour);
  if (meridiem) hours = (hours % 12) + (meridiem.toLowerCase() === 'p' ? 12 : 0);
  return Date.UTC(
    year < 100 ? 2000 + year : year,
    month - 1,
    day,
    hours,
    Number(minute),
    Number(second ?? 0),
  );
}

function splitAuthor(body: string): { author: string; body: string } | null {
  if (body.startsWith(LRM)) return null;
  const separator = body.indexOf(': ');
  const end = separator === -1 && body.endsWith(':') ? body.length - 1 : separator;
  if (end <= 0) return null;
  const author = body.slice(0, end);
  if (SYSTEM_HEAD.test(author)) return null;
  const rest = body.slice(end + 2);
  if (rest.startsWith(LRM)) {
    const classified = classifyBody(rest);
    if (classified.kind === 'text' && !classified.deleted) return null;
  }
  return { author, body: rest };
}

export function parseWhatsAppText(input: string, options: WhatsAppOptions = {}): Chat {
  const timeZone = options.timeZone ?? DEFAULT_TIME_ZONE;
  const pending: PendingMessage[] = [];
  const headers: HeaderMatch[] = [];
  let current: PendingMessage | null = null;

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.replace(LEADING_MARKS, '').replace(SPACES, ' ');
    const header = matchAndroidHeader(line) ?? matchIosHeader(line);

    if (!header) {
      if (current) current.body += `\n${rawLine}`;
      continue;
    }

    headers.push(header);
    if (CALL_LINE.test(header.body.trim())) {
      pending.push({ id: pending.length, header, author: '', body: '', isCall: true });
      current = null;
      continue;
    }
    const split = splitAuthor(header.body);
    current = split ? { id: pending.length, header, author: split.author, body: split.body } : null;
    if (current) pending.push(current);
  }

  const order = detectOrder(headers);
  const participants = new Map<string, Participant>();

  const firstAuthor = pending.find(({ isCall }) => !isCall)?.author;

  const messages = pending.flatMap(({ id, header, author, body, isCall }): Message[] => {
    if (isCall) {
      if (firstAuthor === undefined) return [];
      return [
        {
          id: String(id),
          ts: wallTimeToTs(toWallTime(header, order), timeZone),
          author: firstAuthor,
          kind: 'call',
          callOutcome: UNATTRIBUTED_CALL,
        },
      ];
    }
    if (!participants.has(author)) participants.set(author, { id: author, name: author });
    return [
      {
        id: String(id),
        ts: wallTimeToTs(toWallTime(header, order), timeZone),
        author,
        ...classifyBody(body),
      },
    ];
  });

  messages.sort((a, b) => a.ts - b.ts);

  return {
    source: 'whatsapp',
    name: options.name ?? [...participants.values()].map(({ name }) => name).join(', '),
    participants: [...participants.values()],
    messages,
  };
}
