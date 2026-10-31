import { describe, expect, it } from 'vitest';
import account from '~/fixtures/telegram/account.json';
import single from '~/fixtures/telegram/single.json';
import { listTelegramChats, normalizeTelegramChat, rawChats } from './json';
import type { RawTelegramChat } from './json';

const chat = normalizeTelegramChat(single as RawTelegramChat);
const byId = (id: string) => chat.messages.find((message) => message.id === id);

describe('listTelegramChats', () => {
  it('lists a single chat export', () => {
    expect(listTelegramChats(single)).toEqual([
      { index: 0, name: 'Ana Prueba', type: 'personal_chat', messageCount: 9 },
    ]);
  });

  it('lists a full account export and names deleted chats', () => {
    expect(listTelegramChats(account)).toEqual([
      { index: 0, name: 'Grupo Demo', type: 'private_group', messageCount: 1 },
      { index: 1, name: 'Deleted chat', type: 'personal_chat', messageCount: 0 },
    ]);
  });

  it('returns nothing for unrelated JSON', () => {
    expect(rawChats({ hello: 'world' })).toEqual([]);
  });
});

describe('normalizeTelegramChat', () => {
  it('sorts messages by timestamp', () => {
    expect(chat.messages.map((message) => message.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ]);
  });

  it('uses date_unixtime in milliseconds', () => {
    expect(byId('1')?.ts).toBe(1768039200000);
  });

  it('falls back to from_id when from is null and keeps the known name', () => {
    expect(byId('3')?.author).toBe('user200');
    expect(chat.participants).toContainEqual({ id: 'user200', name: 'Beto Demo' });
  });

  it('flattens entity arrays and counts links', () => {
    expect(byId('3')).toMatchObject({
      text: 'mira https://example.com esto',
      linkCount: 1,
      replyTo: '1',
      edited: true,
    });
  });

  it('maps media kinds and durations', () => {
    expect(byId('2')).toMatchObject({
      kind: 'voice',
      durationSec: 42,
      mediaFile: 'voice_messages/audio_1.ogg',
    });
    expect(byId('4')).toMatchObject({ kind: 'photo', forwarded: true });
    expect(byId('8')?.kind).toBe('file');
    expect(byId('9')?.kind).toBe('location');
  });

  it('keeps the sticker emoji and skips the not-included placeholder', () => {
    const sticker = byId('5');
    expect(sticker).toMatchObject({ kind: 'sticker', stickerEmoji: '😎' });
    expect(sticker?.mediaFile).toBeUndefined();
  });

  it('maps calls and other service messages', () => {
    expect(byId('6')).toMatchObject({
      kind: 'call',
      author: 'user200',
      durationSec: 120,
      callOutcome: 'hangup',
    });
    expect(byId('7')?.kind).toBe('service');
  });

  it('expands reactions, keeping anonymous ones', () => {
    expect(byId('1')?.reactions).toEqual([{ emoji: '😂', by: 'user200' }, { emoji: '😂' }]);
  });
});
