export const MESSAGE_KINDS = [
  'text',
  'photo',
  'video',
  'voice',
  'video_note',
  'audio',
  'sticker',
  'gif',
  'file',
  'location',
  'poll',
  'contact',
  'call',
  'service',
  'unknown_media',
] as const;

export type MessageKind = (typeof MESSAGE_KINDS)[number];

export type Reaction = {
  emoji: string;
  by?: string;
};

export type Message = {
  id: string;
  ts: number;
  author: string;
  kind: MessageKind;
  text?: string;
  replyTo?: string;
  edited?: boolean;
  deleted?: boolean;
  forwarded?: boolean;
  reactions?: Reaction[];
  durationSec?: number;
  linkCount?: number;
  mediaFile?: string;
  stickerEmoji?: string;
  callOutcome?: string;
};

export type Participant = {
  id: string;
  name: string;
};

export const UNATTRIBUTED_CALL = 'unattributed';
export const ESTIMATED_CALL = 'estimated';

export type ChatSource = 'telegram' | 'whatsapp';

export type Chat = {
  source: ChatSource;
  name: string;
  type?: string;
  participants: Participant[];
  messages: Message[];
};

export type ChatSummary = {
  index: number;
  name: string;
  type?: string;
  messageCount: number;
};
