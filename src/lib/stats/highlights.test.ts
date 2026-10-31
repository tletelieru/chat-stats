import { describe, expect, it } from 'vitest';
import type { Chat, Message } from '~/lib/model';
import { buildColumns } from './columns';
import { computeStats } from './engine';
import { buildHighlights } from './highlights';

const MINUTE = 60_000;
const T0 = Date.UTC(2026, 0, 5, 12);
const FILTER = { gapMs: 6 * 60 * MINUTE, timeZone: 'UTC' };

const msg = (id: number, minutes: number, author: string, text = 'hola'): Message => ({
  id: String(id),
  ts: T0 + minutes * MINUTE,
  author,
  kind: 'text',
  text,
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

function pingPong(rounds: number): Message[] {
  return Array.from({ length: rounds }, (_, round) => [
    msg(round * 2, round * 500, 'a'),
    msg(round * 2 + 1, round * 500 + 1, 'b', 'hola otra vez'),
  ]).flat();
}

describe('buildHighlights', () => {
  const stats = computeStats(buildColumns(chat(pingPong(8))), FILTER);
  const all = buildHighlights(stats, 20);
  const find = (id: string) => all.find((highlight) => highlight.id === id);

  it('names who always writes first', () => {
    expect(find('starts')).toMatchObject({
      winner: 0,
      runnerUp: 1,
      winnerValue: 8,
      runnerUpValue: 0,
      lead: 1,
    });
  });

  it('names who gets the last word', () => {
    expect(find('lastWord')).toMatchObject({ winner: 1, winnerValue: 8 });
  });

  it('ranks by the widest lead and honors the limit', () => {
    const leads = all.map(({ lead }) => lead);
    expect(leads).toEqual([...leads].sort((a, b) => b - a));
    expect(buildHighlights(stats, 2)).toHaveLength(2);
  });

  it('skips ties', () => {
    expect(find('talker')).toBeUndefined();
  });

  it('lets the lower median win the fastest reply', () => {
    const messages = [
      ...Array.from({ length: 6 }, (_, round) => [
        msg(round * 3, round * 20, 'a'),
        msg(round * 3 + 1, round * 20 + 1, 'b'),
        msg(round * 3 + 2, round * 20 + 11, 'a'),
      ]).flat(),
    ];
    const result = buildHighlights(computeStats(buildColumns(chat(messages)), FILTER), 20);
    expect(result.find(({ id }) => id === 'fastest')?.winner).toBe(1);
  });

  it('stays empty with a single active person', () => {
    const filtered = computeStats(buildColumns(chat(pingPong(8))), { ...FILTER, person: 0 });
    expect(buildHighlights(filtered)).toEqual([]);
  });
});
