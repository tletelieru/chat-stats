import { JSONParser } from '@streamparser/json';
import type { ChatSummary } from '~/lib/model';
import type { RawTelegramChat, RawTelegramMessage } from './json';
import { chatName } from './json';

export type StreamProgress = (bytesRead: number) => void;

type StackEntry = { key?: string | number };

async function pump(
  stream: ReadableStream<Uint8Array>,
  parser: JSONParser,
  onProgress?: StreamProgress,
  shouldStop?: () => boolean,
) {
  const reader = stream.getReader();
  let bytesRead = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done || shouldStop?.()) break;
      parser.write(value);
      bytesRead += value.length;
      onProgress?.(bytesRead);
    }
  } finally {
    await reader.cancel();
  }
}

const listIndex = (stack: StackEntry[]) => Number(stack[3]?.key ?? 0);

export async function scanTelegram(
  stream: ReadableStream<Uint8Array>,
  onProgress?: StreamProgress,
): Promise<ChatSummary[]> {
  const chats = new Map<number, ChatSummary>();
  const entry = (index: number) => {
    let chat = chats.get(index);
    if (!chat) {
      chat = { index, name: chatName({}), messageCount: 0 };
      chats.set(index, chat);
    }
    return chat;
  };

  const parser = new JSONParser({
    paths: [
      '$.name',
      '$.type',
      '$.messages.*.id',
      '$.chats.list.*.name',
      '$.chats.list.*.type',
      '$.chats.list.*.messages.*.id',
    ],
    keepStack: false,
  });

  parser.onValue = ({ value, key, stack }) => {
    const isList = stack.length > 2;
    const chat = entry(isList ? listIndex(stack as StackEntry[]) : 0);
    if (key === 'id') chat.messageCount++;
    else if (key === 'name' && typeof value === 'string' && value) chat.name = value;
    else if (key === 'type' && typeof value === 'string') chat.type = value;
  };

  await pump(stream, parser, onProgress);
  return [...chats.values()].sort((a, b) => a.index - b.index);
}

export async function readTelegramChat(
  stream: ReadableStream<Uint8Array>,
  index: number,
  onProgress?: StreamProgress,
): Promise<RawTelegramChat> {
  const chat: RawTelegramChat = { messages: [] };
  const messages = chat.messages as RawTelegramMessage[];

  const parser = new JSONParser({
    paths: [
      '$.name',
      '$.type',
      '$.messages.*',
      '$.chats.list.*.name',
      '$.chats.list.*.type',
      '$.chats.list.*.messages.*',
    ],
    keepStack: false,
  });

  parser.onValue = ({ value, key, stack }) => {
    const isList = stack.length > 2 && stack[1]?.key === 'chats';
    if (isList && listIndex(stack as StackEntry[]) !== index) return;
    if (typeof key === 'number') messages.push(value as RawTelegramMessage);
    else if (key === 'name') chat.name = value as string | null;
    else if (key === 'type') chat.type = value as string;
  };

  await pump(stream, parser, onProgress);
  return chat;
}
