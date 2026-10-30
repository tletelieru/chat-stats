import type { Chat, ChatSummary, Participant } from './model';
import { detectFormat } from './sources/detect';
import { normalizeTelegramChat } from './sources/telegram/json';
import { readTelegramChat, scanTelegram } from './sources/telegram/stream';
import { parseWhatsAppText } from './sources/whatsapp/parse';
import { readWhatsAppArchive } from './sources/whatsapp/zip';
import { applyPeople, buildColumns } from './stats/columns';
import type { Columns } from './stats/columns';
import { computeStats, filterKey } from './stats/engine';
import type { Filter, StatsResult } from './stats/types';

const HEAD_BYTES = 4096;
const PREVIEW_MESSAGES = 5;

export type PreviewMessage = {
  ts: number;
  author: string;
  kind: string;
  text: string;
};

export type WorkerRequest =
  | { type: 'open'; file: File }
  | { type: 'pick'; index: number }
  | { type: 'people'; names: Record<string, string>; aliases: Record<string, string> }
  | { type: 'compute'; runId: number; filter: Filter };

export type WorkerResponse =
  | { type: 'progress'; ratio: number; label: string }
  | { type: 'chats'; chats: ChatSummary[] }
  | {
      type: 'ready';
      name: string;
      source: Chat['source'];
      messageCount: number;
      unknownMedia: number;
      people: Participant[];
      preview: PreviewMessage[];
    }
  | { type: 'stats'; runId: number; stats: StatsResult }
  | { type: 'error'; message: string };

export function createSession(post: (response: WorkerResponse) => void) {
  let file: File | null = null;
  let original: Columns | null = null;
  let columns: Columns | null = null;
  let cache = new Map<string, StatsResult>();
  let latestRun = 0;

  const progress = (label: string) => (bytes: number) =>
    post({ type: 'progress', label, ratio: file?.size ? bytes / file.size : 0 });

  const load = (chat: Chat) => {
    post({ type: 'progress', ratio: 1, label: 'Indexing messages' });
    original = buildColumns(chat);
    columns = original;
    cache = new Map();
    const names = new Map(chat.participants.map(({ id, name }) => [id, name]));
    post({
      type: 'ready',
      name: chat.name,
      source: chat.source,
      messageCount: chat.messages.length,
      unknownMedia: chat.messages.filter(({ kind }) => kind === 'unknown_media').length,
      people: original.people,
      preview: chat.messages.slice(0, PREVIEW_MESSAGES).map((message) => ({
        ts: message.ts,
        author: names.get(message.author) ?? message.author,
        kind: message.kind,
        text: message.text ?? '',
      })),
    });
  };

  const pick = async (index: number) => {
    if (!file) throw new Error('No file opened');
    const raw = await readTelegramChat(file.stream(), index, progress('Parsing messages'));
    load(normalizeTelegramChat(raw));
  };

  const open = async (next: File) => {
    file = next;
    original = null;
    columns = null;
    const head = new Uint8Array(await next.slice(0, HEAD_BYTES).arrayBuffer());
    const format = detectFormat(next.name, head);

    if (format === 'telegram-json') {
      const chats = await scanTelegram(next.stream(), progress('Reading chat list'));
      if (chats.length === 0) throw new Error('No chats found in this file');
      if (chats.length === 1) await pick(chats[0].index);
      else post({ type: 'chats', chats });
    } else if (format === 'whatsapp-txt') {
      load(parseWhatsAppText(await next.text(), { name: next.name.replace(/\.txt$/i, '') }));
    } else if (format === 'zip') {
      const archive = readWhatsAppArchive(new Uint8Array(await next.arrayBuffer()));
      load(parseWhatsAppText(archive.text, { name: archive.name }));
    } else {
      throw new Error('Unsupported file. Use a Telegram result.json or a WhatsApp .txt or .zip');
    }
  };

  const compute = (runId: number, filter: Filter) => {
    if (runId !== latestRun || !columns) return;
    const key = filterKey(filter);
    let stats = cache.get(key);
    if (!stats) {
      stats = computeStats(columns, filter);
      cache.set(key, stats);
    }
    post({ type: 'stats', runId, stats });
  };

  return {
    async handle(request: WorkerRequest) {
      try {
        if (request.type === 'open') await open(request.file);
        else if (request.type === 'pick') await pick(request.index);
        else if (request.type === 'people' && original) {
          columns = applyPeople(original, request.names, request.aliases);
          cache = new Map();
        } else if (request.type === 'compute') {
          latestRun = request.runId;
          setTimeout(() => compute(request.runId, request.filter), 0);
        }
      } catch (error) {
        post({
          type: 'error',
          message: error instanceof Error ? error.message : 'Could not read this file',
        });
      }
    },
  };
}
