import { describe, expect, it } from 'vitest';
import { detectFormat } from './detect';

const bytes = (text: string) => new TextEncoder().encode(text);

describe('detectFormat', () => {
  it('detects zip by magic bytes', () => {
    expect(detectFormat('export', new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0]))).toBe('zip');
  });

  it('detects Telegram JSON, single chat and account', () => {
    expect(detectFormat('result.json', bytes('{\n "name": "A",\n "messages": ['))).toBe(
      'telegram-json',
    );
    expect(detectFormat('result.json', bytes('{ "about": "x", "chats": {'))).toBe('telegram-json');
  });

  it('detects WhatsApp Android and iOS text', () => {
    expect(detectFormat('a.txt', bytes('30/10/26, 20:03 - Ana: hola'))).toBe('whatsapp-txt');
    expect(detectFormat('a.txt', bytes('‎[30/10/26, 20:03:15] Ana: hola'))).toBe('whatsapp-txt');
  });

  it('rejects unknown content', () => {
    expect(detectFormat('a.txt', bytes('just some notes'))).toBeNull();
  });
});
