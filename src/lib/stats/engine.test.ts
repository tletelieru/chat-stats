import { describe, expect, it, vi } from 'vitest';
import { generateChat } from '~/fixtures/generate';
import type { Chat, Message } from '~/lib/model';
import { createOffsetCache, utcOffsetMs, wallTimeToTs } from '~/lib/time';
import { applyPeople, buildColumns, lowerBound } from './columns';
import { computeStats, createStatsCache } from './engine';
import { percentile, quickselect } from './quickselect';
import { tokenizeTexts } from './tokenize';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const T0 = Date.UTC(2026, 0, 5, 12);
const GAP = 6 * HOUR;
const FILTER = { gapMs: GAP, timeZone: 'UTC' };

const msg = (
  id: number,
  minutes: number,
  author: string,
  extra: Partial<Message> = {},
): Message => ({
  id: String(id),
  ts: T0 + minutes * MINUTE,
  author,
  kind: 'text',
  text: 'hola',
  ...extra,
});

const chat = (messages: Message[]): Chat => ({
  source: 'telegram',
  name: 'Test',
  participants: [
    { id: 'a', name: 'Ana' },
    { id: 'b', name: 'Beto' },
  ],
  messages,
});

const sample = chat([
  msg(1, 0, 'a', { text: 'hola cine?' }),
  msg(2, 2, 'b', { text: 'jajaja dale 😂', replyTo: '1' }),
  msg(3, 3, 'b', { kind: 'voice', text: undefined, durationSec: 30 }),
  msg(4, 13, 'a', { reactions: [{ emoji: '😂', by: 'b' }] }),
  msg(5, 500, 'b', { kind: 'sticker', text: undefined, stickerEmoji: '😎' }),
  msg(6, 501, 'b'),
  msg(7, 502, 'b'),
  msg(8, 503, 'a', { kind: 'sticker', text: undefined, stickerEmoji: '😎' }),
  msg(9, 504, 'a', { kind: 'call', text: undefined, durationSec: 60, callOutcome: 'hangup' }),
  msg(10, 505, 'b', { kind: 'call', text: undefined, callOutcome: 'missed' }),
  msg(11, 506, 'a', { kind: 'service', text: undefined }),
]);

const stats = computeStats(buildColumns(sample), FILTER);

describe('computeStats on a hand-checked chat', () => {
  it('counts overview totals without calls or service messages', () => {
    expect(stats.overview.messages).toBe(8);
    expect(stats.overview.perPerson[0].messages).toBe(3);
    expect(stats.overview.perPerson[1].messages).toBe(5);
    expect(stats.overview.perPerson[1].share).toBeCloseTo(5 / 8);
    expect(stats.overview.daysActive).toBe(1);
  });

  it('finds who starts and ends conversations', () => {
    expect(stats.conversations.total).toBe(2);
    expect(stats.conversations.started).toEqual([1, 1]);
    expect(stats.conversations.ended).toEqual([2, 0]);
    expect(stats.conversations.longestSilence?.durationMs).toBe(487 * MINUTE);
    expect(stats.conversations.longest).toMatchObject({ durationMs: 13 * MINUTE, messages: 4 });
  });

  it('computes response times only within a conversation', () => {
    const [ana, beto] = stats.responses;
    expect(beto.count).toBe(1);
    expect(beto.avgMs).toBe(2 * MINUTE);
    expect(beto.shortest?.question.preview).toBe('hola cine?');
    expect(ana.count).toBe(2);
    expect(ana.medianMs).toBe(MINUTE);
    expect(ana.longest?.ms).toBe(10 * MINUTE);
    expect(ana.histogram).toEqual([0, 1, 1, 0, 0, 0]);
  });

  it('counts double and triple texting', () => {
    expect(stats.bursts[1]).toEqual({ double: 1, triple: 1, longest: 3 });
  });

  it('counts replies, media, reactions and calls', () => {
    expect(stats.replies.sent).toEqual([0, 1]);
    expect(stats.replies.received).toEqual([1, 0]);
    expect(stats.media[1].kinds.voice).toBe(1);
    expect(stats.media[1].voiceSec).toBe(30);
    expect(stats.reactions.given).toEqual([0, 1]);
    expect(stats.reactions.top).toEqual([{ key: '😂', count: 1 }]);
    expect(stats.calls[0]).toMatchObject({ count: 1, durationSec: 60, missed: 0 });
    expect(stats.calls[1]).toMatchObject({ count: 1, missed: 1 });
  });

  it('ranks stickers overall, per person and as replies', () => {
    expect(stats.stickers.overall).toEqual([{ key: '😎', count: 2 }]);
    expect(stats.stickers.asReplyTo[1]).toEqual({ key: '😎', count: 1 });
  });

  it('tracks words, laughs and questions', () => {
    expect(stats.words[0].questions).toBe(1);
    expect(stats.words[1].laughs).toBe(1);
    expect(stats.words[1].emojis).toEqual([{ key: '😂', count: 1 }]);
    expect(stats.words[0].words.map(({ key }) => key)).toContain('cine');
  });
});

describe('filters', () => {
  const columns = buildColumns(sample);

  it('uses binary search for the date range', () => {
    expect(lowerBound(columns.ts, T0 + 3 * MINUTE)).toBe(2);
    const ranged = computeStats(columns, { ...FILTER, from: T0, to: T0 + 3 * MINUTE });
    expect(ranged.overview.messages).toBe(2);
  });

  it('limits per-message stats to a person and keeps conversation context', () => {
    const only = computeStats(columns, { ...FILTER, person: 0 });
    expect(only.overview.messages).toBe(3);
    expect(only.conversations.total).toBe(2);
  });

  it('changes conversations with the gap', () => {
    expect(computeStats(columns, { ...FILTER, gapMs: 24 * HOUR }).conversations.total).toBe(1);
  });

  it('counts a custom phrase', () => {
    expect(computeStats(columns, { ...FILTER, phrase: 'CINE' }).words[0].phrase).toBe(1);
  });

  it('caches results by filter key', () => {
    const run = createStatsCache(columns);
    expect(run(FILTER)).toBe(run({ ...FILTER }));
    expect(run(FILTER)).not.toBe(run({ ...FILTER, gapMs: HOUR }));
  });

  it('merges aliased participants', () => {
    const merged = applyPeople(columns, { a: 'Ana M' }, { b: 'a' });
    expect(merged.people).toEqual([{ id: 'a', name: 'Ana M' }]);
    expect(computeStats(merged, FILTER).overview.perPerson[0].messages).toBe(8);
  });
});

describe('timezones', () => {
  it('moves activity into the selected timezone', () => {
    const local = computeStats(buildColumns(chat([msg(1, 0, 'a')])), {
      ...FILTER,
      timeZone: 'Asia/Tokyo',
    });
    expect(local.activity.perPerson[0].topHour).toBe(21);
  });

  it('supports a timezone per participant', () => {
    const local = computeStats(buildColumns(chat([msg(1, 0, 'a'), msg(2, 1, 'b')])), {
      ...FILTER,
      participantTimeZones: { 1: 'Asia/Tokyo' },
    });
    expect(local.activity.perPerson[0].topHour).toBe(12);
    expect(local.activity.perPerson[1].topHour).toBe(21);
  });

  it('handles the America/Santiago DST crossing', () => {
    const zone = 'America/Santiago';
    const before = Date.UTC(2026, 3, 5, 2, 30);
    const after = Date.UTC(2026, 3, 5, 3, 30);
    expect(utcOffsetMs(before, zone)).toBe(-3 * HOUR);
    expect(utcOffsetMs(after, zone)).toBe(-4 * HOUR);
    const cached = createOffsetCache(zone);
    expect(cached(before)).toBe(-3 * HOUR);
    expect(cached(after)).toBe(-4 * HOUR);
    expect(wallTimeToTs(Date.UTC(2026, 0, 15, 12), zone)).toBe(Date.UTC(2026, 0, 15, 15));
    expect(wallTimeToTs(Date.UTC(2026, 6, 15, 12), zone)).toBe(Date.UTC(2026, 6, 15, 16));
  });

  it('calls Intl once per hour block', () => {
    const spy = vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts');
    const cached = createOffsetCache('Europe/Madrid');
    for (let minute = 0; minute < 60; minute++) cached(T0 - (T0 % HOUR) + minute * MINUTE);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe('helpers', () => {
  it('quickselect matches a sorted array', () => {
    const values = Float64Array.from({ length: 1001 }, (_, index) => (index * 7919) % 1009);
    const sorted = [...values].sort((a, b) => a - b);
    expect(quickselect(values.slice(), 500)).toBe(sorted[500]);
    expect(percentile(values.slice(), 0.9)).toBe(sorted[900]);
    expect(percentile(new Float64Array(), 0.5)).toBeNull();
  });

  it('tokenizes words and emojis into shared ids', () => {
    const table = tokenizeTexts(['Hola hola 😂', '']);
    expect(table.dictionary).toEqual(['hola', '😂']);
    expect([...table.tokens]).toEqual([0, 0, 1]);
    expect([...table.offsets]).toEqual([0, 3, 3]);
  });
});

describe('scale', () => {
  it('runs 500k messages', () => {
    const generated = generateChat(500_000);
    const buildStart = performance.now();
    const columns = buildColumns(generated);
    const passStart = performance.now();
    const result = computeStats(columns, FILTER);
    const end = performance.now();
    console.info(
      `500k: columns ${Math.round(passStart - buildStart)} ms, pass ${Math.round(end - passStart)} ms`,
    );
    expect(result.overview.messages).toBe(500_000);
  }, 60_000);
});
