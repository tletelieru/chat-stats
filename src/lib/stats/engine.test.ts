import { describe, expect, it, vi } from 'vitest';
import { generateChat } from '~/fixtures/generate';
import type { Chat, Message } from '~/lib/model';
import { createOffsetCache, utcOffsetMs, wallTimeToTs } from '~/lib/time';
import { applyPeople, buildColumns, lowerBound } from './columns';
import { computeStats, createStatsCache } from './engine';
import { percentile, quickselect } from './quickselect';
import {
  TOKEN_LAUGH,
  TOKEN_STOPWORD,
  countUpperCase,
  isKeyboardSmash,
  keyboardFacesOf,
  tokenizeTexts,
} from './tokenize';

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

describe('explicit replies', () => {
  it('ignores replies to your own message', () => {
    const result = computeStats(
      buildColumns(
        chat([msg(1, 0, 'a'), msg(2, 1, 'a', { replyTo: '1' }), msg(3, 2, 'b', { replyTo: '1' })]),
      ),
      FILTER,
    );
    expect(result.replies.sent).toEqual([0, 1]);
    expect(result.replies.received).toEqual([1, 0]);
    expect(result.replies.top[0].count).toBe(1);
  });
});

describe('same-second replies', () => {
  it('does not report 0 seconds as the shortest response', () => {
    const result = computeStats(
      buildColumns(chat([msg(1, 0, 'a'), msg(2, 0, 'b'), msg(3, 1, 'a'), msg(4, 3, 'b')])),
      FILTER,
    );
    expect(result.responses[1].shortest?.ms).toBe(2 * MINUTE);
    expect(result.responses[1].count).toBe(2);
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

describe('repeated phrases', () => {
  const phrases = (texts: string[]) => {
    const messages = texts.map((text, index) => msg(index, index, 'a', { text }));
    return computeStats(buildColumns(chat(messages)), FILTER).words[0];
  };

  it('finds the top two and three word phrases', () => {
    const result = phrases(['vamos al cine hoy', 'vamos al cine mañana', 'vamos al cine']);
    expect(result.pairs[0]).toEqual({ key: 'vamos al', count: 3 });
    expect(result.triples[0]).toEqual({ key: 'vamos al cine', count: 3 });
  });

  it('needs at least two repeats', () => {
    const result = phrases(['una sola frase distinta']);
    expect(result.pairs).toEqual([]);
    expect(result.triples).toEqual([]);
  });

  it('does not cross messages', () => {
    expect(phrases(['hola', 'amigo', 'hola', 'amigo']).pairs).toEqual([]);
  });

  it('skips phrases made only of stopwords', () => {
    expect(phrases(['in the', 'in the', 'of the way', 'of the way']).pairs).toEqual([
      { key: 'the way', count: 2 },
    ]);
  });

  it('breaks phrases at emojis and laughs', () => {
    expect(phrases(['hola 😂 amigo', 'hola 😂 amigo']).pairs).toEqual([]);
    expect(phrases(['hola jajaja amigo', 'hola jajaja amigo']).pairs).toEqual([]);
  });
});

describe('keyboard faces', () => {
  it.each([
    '>:(',
    ':(',
    '):',
    ':)',
    '(:',
    ':D',
    'D:',
    'xd',
    'XD',
    'xD',
    ':c',
    'c:',
    ':o',
    ':O',
    'owo',
    'Owo',
    'OwO',
    'uwu',
    'UwU',
    ':3',
    ':p',
    ':P',
    ';)',
    ":'(",
    ':/',
    '=)',
    '^^',
    '^_^',
    'T_T',
    '-_-',
    '._.',
    '>.<',
    'o.o',
    'O_O',
    '<3',
  ])('%s is a face', (face) => {
    expect(keyboardFacesOf(`hola ${face} chao`)).toEqual([face]);
  });

  it.each([
    '10:30',
    'C:\\Users',
    'c:/temp',
    'https://example.com/a:)b',
    '(hola): nota',
    'abc: nota',
    'a:b',
    '1:1',
    'nota: esto',
    'mixed',
    'word',
    'foo.on',
    '(1)',
  ])('%s has no face', (text) => {
    expect(keyboardFacesOf(text)).toEqual([]);
  });

  it('keeps symbol faces out of words but not xd or owo', () => {
    expect(tokenizeTexts(['yeah :c hola D: :) c:']).dictionary).toEqual(['yeah', 'hola']);
    const table = tokenizeTexts(['xd owo']);
    expect(table.dictionary).toEqual(['xd', 'owo']);
    expect(table.flags[0] & TOKEN_LAUGH).toBeTruthy();
  });

  it('groups mixed case laughs by their first letters', () => {
    expect(keyboardFacesOf('xDd xDDD XDd')).toEqual(['xD', 'xD', 'XD']);
  });

  it('groups repeated mouths and counts per person', () => {
    expect(keyboardFacesOf('no :((( xddd :)) ')).toEqual([':(', 'xd', ':)']);
    const result = computeStats(
      buildColumns(chat([msg(1, 0, 'a', { text: ':( :(( xd' }), msg(2, 1, 'b', { text: 'hola' })])),
      FILTER,
    );
    expect(result.words[0].faceCount).toBe(3);
    expect(result.words[0].faces[0]).toEqual({ key: ':(', count: 2 });
    expect(result.words[1].faces).toEqual([]);
  });
});

describe('keyboard smash laughs', () => {
  it.each([
    'hjhjsdf',
    'jkjkdfjkds',
    'jksdfjks',
    'jkdfk',
    'asjkdhaskjd',
    'kkkk',
    'lol',
    'lmao',
    'lmfao',
  ])('%s is a laugh', (word) => {
    const table = tokenizeTexts([word]);
    expect(table.flags[0] & TOKEN_LAUGH).toBeTruthy();
  });

  it.each(['flask', 'shall', 'glass', 'flash', 'salad', 'jack', 'kafka', 'falda', 'hola', 'jk'])(
    '%s is not a laugh',
    (word) => {
      expect(isKeyboardSmash(word)).toBe(false);
      expect(tokenizeTexts([word]).flags[0] & TOKEN_LAUGH).toBeFalsy();
    },
  );
});

describe('phone keyboard smash', () => {
  it.each(['dndjd', 'fjfnfn', 'bdndnd', 'kfnfkfjrks'])('%s is a laugh', (word) => {
    expect(isKeyboardSmash(word)).toBe(true);
  });

  it.each(['csmmm', 'wtfff', 'whyyyy', 'shhhh', 'grrrr'])('%s is not a laugh', (word) => {
    expect(isKeyboardSmash(word)).toBe(false);
  });
});

describe('uppercase', () => {
  it('counts uppercase words and whole uppercase messages', () => {
    expect(countUpperCase('QUE ES ESTO')).toEqual({ words: 3, isMessage: true });
    expect(countUpperCase('dijo NO y LOL')).toEqual({ words: 2, isMessage: false });
  });

  it('ignores single capitals, normal sentences and links', () => {
    expect(countUpperCase('I am A person')).toEqual({ words: 0, isMessage: false });
    expect(countUpperCase('Hola Ana')).toEqual({ words: 0, isMessage: false });
    expect(countUpperCase('MIRA https://EXAMPLE.com/ABC')).toEqual({ words: 1, isMessage: true });
    expect(countUpperCase('123 !!')).toEqual({ words: 0, isMessage: false });
  });

  it('ranks the most shouted word and skips stopwords', () => {
    const result = computeStats(
      buildColumns(
        chat([
          msg(1, 0, 'a', { text: 'THE CINE' }),
          msg(2, 1, 'a', { text: 'mira CINE y NUNCA' }),
          msg(3, 2, 'b', { text: 'nada en mayúsculas' }),
        ]),
      ),
      FILTER,
    );
    expect(result.words[0].shouted[0]).toEqual({ key: 'CINE', count: 2 });
    expect(result.words[0].shouted.map(({ key }) => key)).not.toContain('THE');
    expect(result.words[1].shouted).toEqual([]);
  });

  it('adds them per person', () => {
    const result = computeStats(
      buildColumns(
        chat([msg(1, 0, 'a', { text: 'NO QUIERO' }), msg(2, 1, 'b', { text: 'ok NO' })]),
      ),
      FILTER,
    );
    expect(result.words[0]).toMatchObject({ upperMessages: 1, upperWords: 2 });
    expect(result.words[1]).toMatchObject({ upperMessages: 0, upperWords: 1 });
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

  it('ignores links when tokenizing', () => {
    const table = tokenizeTexts(['mira https://www.tiktok.com/@a/video/1 esto www.example.com']);
    expect(table.dictionary).toEqual(['mira', 'esto']);
  });

  it('treats contractions as stopwords with either apostrophe', () => {
    const table = tokenizeTexts(["don't don’t dont cine"]);
    const stopwords = table.dictionary.filter((_, id) => table.flags[id] & TOKEN_STOPWORD);
    expect(stopwords).toEqual(["don't", 'don’t', 'dont']);
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
