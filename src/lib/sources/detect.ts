export type DetectedFormat = 'telegram-json' | 'whatsapp-txt' | 'zip';

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
const WHATSAPP_LINE = new RegExp(
  '^[\\u200e\\u200f\\ufeff]*\\[?\\d{1,4}[/.-]\\d{1,2}[/.-]\\d{1,4},?[\\s\\u202f\\u00a0]+\\d{1,2}[:.]\\d{2}',
  'm',
);

export function detectFormat(fileName: string, head: Uint8Array): DetectedFormat | null {
  if (ZIP_MAGIC.every((byte, index) => head[index] === byte)) return 'zip';

  const text = new TextDecoder().decode(head);
  const trimmed = text.trimStart();
  if (trimmed.startsWith('{') && /"(messages|chats|personal_information|about)"/.test(text)) {
    return 'telegram-json';
  }
  if (WHATSAPP_LINE.test(text)) return 'whatsapp-txt';
  if (fileName.toLowerCase().endsWith('.zip')) return 'zip';
  return null;
}
