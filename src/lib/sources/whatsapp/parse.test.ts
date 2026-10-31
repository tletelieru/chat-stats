import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { androidEnUs, androidEs12h, androidEs24h, iosEs } from '~/fixtures/whatsapp/samples';
import { buildColumns } from '~/lib/stats/columns';
import { computeStats } from '~/lib/stats/engine';
import { classifyFileName } from './media';
import { parseWhatsAppText } from './parse';
import { readWhatsAppArchive } from './zip';

const UTC = { timeZone: 'UTC' };

describe('parseWhatsAppText', () => {
  it('parses Android es 24h, multiline, and drops system messages', () => {
    const chat = parseWhatsAppText(androidEs24h, UTC);
    expect(chat.participants.map(({ id }) => id)).toEqual(['Ana Prueba', 'Beto Demo']);
    expect(chat.messages).toHaveLength(5);
    expect(chat.messages[0]).toMatchObject({
      author: 'Ana Prueba',
      kind: 'text',
      text: 'hola\nsegunda línea',
      ts: Date.UTC(2026, 9, 30, 20, 3),
    });
  });

  it('classifies Android media, deleted and edited messages', () => {
    const [, omitted, voice, deleted, edited] = parseWhatsAppText(androidEs24h, UTC).messages;
    expect(omitted.kind).toBe('unknown_media');
    expect(voice).toMatchObject({ kind: 'voice', mediaFile: 'PTT-20261030-WA0001.opus' });
    expect(deleted).toMatchObject({ deleted: true });
    expect(deleted.text).toBeUndefined();
    expect(edited).toMatchObject({
      text: 'mira https://example.com',
      edited: true,
      linkCount: 1,
    });
  });

  it('parses 12h times with narrow no-break spaces and CRLF', () => {
    const [first, second] = parseWhatsAppText(androidEs12h, UTC).messages;
    expect(first.ts).toBe(Date.UTC(2026, 9, 29 + 1, 0, 15));
    expect(first.kind).toBe('photo');
    expect(second.ts).toBe(Date.UTC(2026, 9, 30, 20, 3));
  });

  it('detects month-first dates and English attachments', () => {
    const { messages } = parseWhatsAppText(androidEnUs, UTC);
    expect(messages[0].ts).toBe(Date.UTC(2026, 9, 30, 20, 3));
    expect(messages[1].kind).toBe('sticker');
  });

  it('parses iOS with LRM marks and omitted media labels', () => {
    const { messages, participants } = parseWhatsAppText(iosEs, UTC);
    expect(participants.map(({ id }) => id)).toEqual(['Ana Prueba', 'Beto Demo']);
    expect(messages.map(({ kind }) => kind)).toEqual([
      'text',
      'photo',
      'voice',
      'sticker',
      'file',
      'gif',
    ]);
    expect(messages[0].ts).toBe(Date.UTC(2026, 9, 30, 20, 3, 20));
  });

  it('interprets wall time in the given timezone', () => {
    const { messages } = parseWhatsAppText('15/01/26, 12:00 - Ana: hola', {
      timeZone: 'America/Santiago',
    });
    expect(messages[0].ts).toBe(Date.UTC(2026, 0, 15, 15, 0));
  });
});

describe('WhatsApp Desktop calls', () => {
  const desktop = [
    '[10/30/26, 8:00:00 PM] - [Call]',
    '[10/30/26, 8:01:00 PM] Ana: hola',
    '[10/30/26, 8:02:00 PM] - [Call]',
    '[10/30/26, 8:03:00 PM] Beto: <image omitted>',
  ].join('\n');

  it('keeps calls without inventing a participant', () => {
    const { messages, participants } = parseWhatsAppText(desktop, UTC);
    expect(participants.map(({ id }) => id)).toEqual(['Ana', 'Beto']);
    expect(messages.filter(({ kind }) => kind === 'call')).toHaveLength(2);
    expect(messages[0]).toMatchObject({ kind: 'call', callOutcome: 'unattributed' });
  });

  it('counts them as a total instead of per person', () => {
    const stats = computeStats(buildColumns(parseWhatsAppText(desktop, UTC)), {
      gapMs: 3_600_000,
      timeZone: 'UTC',
    });
    expect(stats.unattributedCalls).toBe(2);
    expect(stats.calls.map(({ count }) => count)).toEqual([0, 0]);
    expect(stats.overview.messages).toBe(2);
  });
});

describe('classifyFileName', () => {
  it.each([
    ['IMG-1.jpg', 'photo'],
    ['PTT-1.opus', 'voice'],
    ['AUD-1.mp3', 'audio'],
    ['VID-1.mp4', 'video'],
    ['STK-1.webp', 'sticker'],
    ['DOC-1.pdf', 'file'],
    ['x.gif', 'gif'],
    ['contacto.vcf', 'contact'],
  ])('%s is %s', (name, kind) => {
    expect(classifyFileName(name)).toBe(kind);
  });
});

describe('readWhatsAppArchive', () => {
  it('reads the chat text and lists attachments without extracting them', () => {
    const archive = zipSync({
      'WhatsApp Chat with Ana Prueba.txt': strToU8('30/10/26, 20:03 - Ana: hola'),
      'IMG-1.jpg': new Uint8Array(10),
    });
    expect(readWhatsAppArchive(archive)).toEqual({
      name: 'Ana Prueba',
      text: '30/10/26, 20:03 - Ana: hola',
      attachments: [{ name: 'IMG-1.jpg', size: 10 }],
    });
  });

  it('fails when there is no chat file', () => {
    expect(() => readWhatsAppArchive(zipSync({ 'a.jpg': new Uint8Array(1) }))).toThrow();
  });
});
