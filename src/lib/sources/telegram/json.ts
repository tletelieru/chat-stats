import type { Chat, ChatSummary, Message, MessageKind, Participant, Reaction } from '~/lib/model';

type RawEntity = string | { type?: string; text?: string };

type RawReaction = {
  emoji?: string;
  document_id?: string;
  count?: number;
  recent?: { from?: string | null; from_id?: string }[];
};

export type RawTelegramMessage = {
  id: number | string;
  type?: string;
  date?: string;
  date_unixtime?: string;
  from?: string | null;
  from_id?: string;
  actor?: string | null;
  actor_id?: string;
  action?: string;
  text?: string | RawEntity[];
  text_entities?: RawEntity[];
  reply_to_message_id?: number | string;
  edited?: string;
  edited_unixtime?: string;
  forwarded_from?: string | null;
  reactions?: RawReaction[];
  photo?: string;
  media_type?: string;
  file?: string;
  location_information?: unknown;
  poll?: unknown;
  contact_information?: unknown;
  duration_seconds?: number;
  discard_reason?: string;
  sticker_emoji?: string;
};

export type RawTelegramChat = {
  name?: string | null;
  type?: string;
  id?: number | string;
  messages?: RawTelegramMessage[];
};

type RawTelegramAccount = {
  chats?: { list?: RawTelegramChat[] };
};

const MEDIA_KINDS: Record<string, MessageKind> = {
  voice_message: 'voice',
  video_message: 'video_note',
  audio_file: 'audio',
  video_file: 'video',
  animation: 'gif',
  sticker: 'sticker',
};

const UNKNOWN_AUTHOR = 'unknown';

function flattenText(text: RawTelegramMessage['text']): string {
  if (typeof text === 'string') return text;
  if (!Array.isArray(text)) return '';
  return text.map((part) => (typeof part === 'string' ? part : (part.text ?? ''))).join('');
}

function countLinks(message: RawTelegramMessage): number {
  const entities = message.text_entities ?? (Array.isArray(message.text) ? message.text : []);
  return entities.filter(
    (entity) =>
      typeof entity === 'object' && (entity.type === 'link' || entity.type === 'text_link'),
  ).length;
}

function resolveKind(message: RawTelegramMessage): MessageKind {
  if (message.photo) return 'photo';
  if (message.media_type && MEDIA_KINDS[message.media_type]) return MEDIA_KINDS[message.media_type];
  if (message.location_information) return 'location';
  if (message.poll) return 'poll';
  if (message.contact_information) return 'contact';
  if (message.file) return 'file';
  return 'text';
}

function resolveTs(message: RawTelegramMessage): number {
  if (message.date_unixtime) return Number(message.date_unixtime) * 1000;
  return message.date ? Date.parse(message.date) : 0;
}

function participantId(id: string | undefined, name: string | null | undefined): string {
  return id || (name ? `name:${name}` : UNKNOWN_AUTHOR);
}

function mapReactions(
  raw: RawReaction[] | undefined,
  register: (id: string | undefined, name: string | null | undefined) => string,
): Reaction[] | undefined {
  if (!raw?.length) return undefined;
  const reactions: Reaction[] = [];
  for (const reaction of raw) {
    const emoji = reaction.emoji ?? reaction.document_id ?? '?';
    const recent = reaction.recent ?? [];
    for (const entry of recent) reactions.push({ emoji, by: register(entry.from_id, entry.from) });
    const remaining = (reaction.count ?? recent.length) - recent.length;
    for (let index = 0; index < remaining; index++) reactions.push({ emoji });
  }
  return reactions;
}

export function isTelegramAccount(root: unknown): root is RawTelegramAccount {
  const chats = (root as RawTelegramAccount | null)?.chats;
  return Array.isArray(chats?.list);
}

export function rawChats(root: unknown): RawTelegramChat[] {
  if (isTelegramAccount(root)) return root.chats?.list ?? [];
  return Array.isArray((root as RawTelegramChat | null)?.messages) ? [root as RawTelegramChat] : [];
}

export function chatName(chat: RawTelegramChat): string {
  return chat.name || 'Deleted chat';
}

export function listTelegramChats(root: unknown): ChatSummary[] {
  return rawChats(root).map((chat, index) => ({
    index,
    name: chatName(chat),
    type: chat.type,
    messageCount: chat.messages?.length ?? 0,
  }));
}

export function normalizeTelegramChat(raw: RawTelegramChat): Chat {
  const names = new Map<string, string>();
  const register = (id: string | undefined, name: string | null | undefined) => {
    const key = participantId(id, name);
    if (name) names.set(key, name);
    else if (!names.has(key)) names.set(key, key);
    return key;
  };

  const messages: Message[] = (raw.messages ?? []).map((message) => {
    const isService = message.type === 'service';
    const isCall = isService && message.action === 'phone_call';
    const author = isService
      ? register(message.actor_id ?? message.from_id, message.actor ?? message.from)
      : register(message.from_id, message.from);
    const kind = isCall ? 'call' : isService ? 'service' : resolveKind(message);
    const text = isService ? '' : flattenText(message.text);
    const linkCount = countLinks(message);
    const reactions = mapReactions(message.reactions, register);

    return {
      id: String(message.id),
      ts: resolveTs(message),
      author,
      kind,
      ...(text && { text }),
      ...(message.reply_to_message_id !== undefined && {
        replyTo: String(message.reply_to_message_id),
      }),
      ...((message.edited || message.edited_unixtime) && { edited: true }),
      ...('forwarded_from' in message && { forwarded: true }),
      ...(reactions && { reactions }),
      ...(message.duration_seconds !== undefined && { durationSec: message.duration_seconds }),
      ...(linkCount > 0 && { linkCount }),
      ...(message.file && !message.file.startsWith('(') && { mediaFile: message.file }),
      ...(message.sticker_emoji && { stickerEmoji: message.sticker_emoji }),
      ...(isCall && message.discard_reason && { callOutcome: message.discard_reason }),
    };
  });

  messages.sort((a, b) => a.ts - b.ts);

  const participants: Participant[] = [...names].map(([id, name]) => ({ id, name }));
  return {
    source: 'telegram',
    name: chatName(raw),
    type: raw.type,
    participants,
    messages,
  };
}
