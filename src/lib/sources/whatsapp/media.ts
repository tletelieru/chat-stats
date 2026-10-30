import type { MessageKind } from '~/lib/model';

export type ClassifiedBody = {
  kind: MessageKind;
  text?: string;
  mediaFile?: string;
  deleted?: boolean;
  edited?: boolean;
  linkCount?: number;
};

const INVISIBLE = new RegExp('[\\u200e\\u200f\\u202a-\\u202e]', 'g');

const OMITTED: [RegExp, MessageKind][] = [
  [/(imagen omitida|image omitted)$/i, 'photo'],
  [/(video omitido|video omitted)$/i, 'video'],
  [/(audio omitido|audio omitted)$/i, 'voice'],
  [/(sticker omitido|sticker omitted)$/i, 'sticker'],
  [/(gif omitido|gif omitted)$/i, 'gif'],
  [/(documento omitido|document omitted)$/i, 'file'],
  [/(tarjeta de contacto omitida|contact card omitted)$/i, 'contact'],
];

const UNKNOWN_MEDIA = /^<?(multimedia omitido|media omitted)>?$/i;
const DELETED =
  /^(se eliminó este mensaje|eliminaste este mensaje|this message was deleted|you deleted this message)\.?$/i;
const EDITED_SUFFIX = /\s*<(se editó este mensaje|this message was edited)\.?>$/i;
const ANDROID_ATTACHMENT = /^(.+?)\s+\((archivo adjunto|file attached)\)/i;
const IOS_ATTACHMENT = /^<(adjunto|attached):\s*(.+?)>/i;
const LOCATION =
  /^((ubicación|location): https?:|ubicación en tiempo real compartida|live location shared)/i;
const POLL = /^(encuesta|poll):/i;
const LINK = /https?:\/\/\S+/g;

export function classifyFileName(name: string): MessageKind {
  const upper = name.toUpperCase();
  if (upper.endsWith('.VCF')) return 'contact';
  if (upper.endsWith('.GIF') || upper.includes('-GIF-')) return 'gif';
  if (upper.startsWith('STK-') || upper.includes('-STICKER-')) return 'sticker';
  if (upper.startsWith('PTT-') || upper.includes('-AUDIO-')) return 'voice';
  if (upper.startsWith('AUD-')) return 'audio';
  if (upper.startsWith('IMG-') || upper.includes('-PHOTO-')) return 'photo';
  if (upper.startsWith('VID-') || upper.includes('-VIDEO-')) return 'video';
  if (upper.startsWith('DOC-')) return 'file';
  if (/\.(JPE?G|PNG|HEIC)$/.test(upper)) return 'photo';
  if (/\.(MP4|MOV|3GP)$/.test(upper)) return 'video';
  if (/\.(OPUS|OGG)$/.test(upper)) return 'voice';
  if (/\.(MP3|M4A|WAV)$/.test(upper)) return 'audio';
  if (upper.endsWith('.WEBP')) return 'sticker';
  return 'file';
}

export function classifyBody(body: string): ClassifiedBody {
  const clean = body.replace(INVISIBLE, '').trim();

  if (DELETED.test(clean)) return { kind: 'text', deleted: true };
  if (UNKNOWN_MEDIA.test(clean)) return { kind: 'unknown_media' };

  const attachment = ANDROID_ATTACHMENT.exec(clean)?.[1] ?? IOS_ATTACHMENT.exec(clean)?.[2];
  if (attachment) {
    return { kind: classifyFileName(attachment), mediaFile: attachment };
  }

  for (const [pattern, kind] of OMITTED) {
    if (pattern.test(clean)) return { kind };
  }

  if (LOCATION.test(clean)) return { kind: 'location' };
  if (POLL.test(clean)) return { kind: 'poll' };

  const edited = EDITED_SUFFIX.test(clean);
  const text = clean.replace(EDITED_SUFFIX, '');
  const linkCount = text.match(LINK)?.length ?? 0;
  return {
    kind: 'text',
    ...(text && { text }),
    ...(edited && { edited }),
    ...(linkCount > 0 && { linkCount }),
  };
}
