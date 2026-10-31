import { describe, expect, it, vi } from 'vitest';
import account from '~/fixtures/telegram/account.json';
import single from '~/fixtures/telegram/single.json';
import { androidEs24h } from '~/fixtures/whatsapp/samples';
import { createSession } from './session';
import type { WorkerResponse } from './session';
import { readTelegramChat, scanTelegram } from './sources/telegram/stream';

const encoder = new TextEncoder();

function streamOf(text: string, chunkSize = 37): ReadableStream<Uint8Array> {
  const bytes = encoder.encode(text);
  let position = 0;
  return new ReadableStream({
    pull(controller) {
      if (position >= bytes.length) return controller.close();
      controller.enqueue(bytes.subarray(position, position + chunkSize));
      position += chunkSize;
    },
  });
}

function fileOf(name: string, text: string): File {
  const bytes = encoder.encode(text);
  return {
    name,
    size: bytes.length,
    slice: (start: number, end: number) => ({
      arrayBuffer: async () => bytes.slice(start, end).buffer,
    }),
    stream: () => streamOf(text),
    text: async () => text,
    arrayBuffer: async () => bytes.buffer,
  } as unknown as File;
}

function collect() {
  const responses: WorkerResponse[] = [];
  const session = createSession((response) => responses.push(response));
  const find = <T extends WorkerResponse['type']>(type: T) =>
    responses.find((response) => response.type === type) as
      Extract<WorkerResponse, { type: T }> | undefined;
  return { responses, session, find };
}

describe('Telegram streaming', () => {
  it('scans a single chat', async () => {
    expect(await scanTelegram(streamOf(JSON.stringify(single)))).toEqual([
      { index: 0, name: 'Ana Prueba', type: 'personal_chat', messageCount: 9 },
    ]);
  });

  it('scans a full account export', async () => {
    expect(await scanTelegram(streamOf(JSON.stringify(account)))).toEqual([
      { index: 0, name: 'Grupo Demo', type: 'private_group', messageCount: 1 },
      { index: 1, name: 'Deleted chat', type: 'personal_chat', messageCount: 0 },
    ]);
  });

  it('reads only the picked chat', async () => {
    const chat = await readTelegramChat(streamOf(JSON.stringify(account)), 0);
    expect(chat.name).toBe('Grupo Demo');
    expect(chat.messages).toHaveLength(1);
    const empty = await readTelegramChat(streamOf(JSON.stringify(account)), 1);
    expect(empty.messages).toHaveLength(0);
  });

  it('reads a single chat with nested message fields', async () => {
    const chat = await readTelegramChat(streamOf(JSON.stringify(single)), 0);
    expect(chat.messages).toHaveLength(9);
    expect(chat.messages?.[0].text_entities).toHaveLength(3);
  });
});

describe('createSession', () => {
  it('opens a single Telegram chat directly', async () => {
    const { session, find } = collect();
    await session.handle({
      type: 'open',
      files: [fileOf('result.json', JSON.stringify(single, null, 1))],
    });
    expect(find('error')).toBeUndefined();
    expect(find('ready')).toMatchObject({ name: 'Ana Prueba', messageCount: 9 });
    expect(find('ready')?.preview).toHaveLength(5);
  });

  it('asks to pick from a full account export, then loads the chat', async () => {
    const { session, find } = collect();
    await session.handle({
      type: 'open',
      files: [fileOf('result.json', JSON.stringify(account, null, 1))],
    });
    expect(find('chats')?.chats).toHaveLength(2);
    await session.handle({ type: 'pick', index: 0 });
    expect(find('ready')).toMatchObject({ name: 'Grupo Demo', messageCount: 1 });
  });

  it('opens WhatsApp text and reports unknown media', async () => {
    const { session, find } = collect();
    await session.handle({ type: 'open', files: [fileOf('Chat con Ana.txt', androidEs24h)] });
    expect(find('ready')).toMatchObject({ name: 'Chat con Ana', unknownMedia: 1 });
  });

  it('explains a Telegram HTML export folder', async () => {
    const { session, find } = collect();
    const files = [fileOf('style.css', 'body {}'), fileOf('messages.html', '<html></html>')];
    await session.handle({ type: 'open', files });
    expect(find('error')?.code).toBe('html-export');
  });

  it('reports unsupported files', async () => {
    const { session, find } = collect();
    await session.handle({ type: 'open', files: [fileOf('notes.txt', 'nothing here')] });
    expect(find('error')?.code).toBe('unsupported');
  });

  it('drops stale runs and answers the latest', async () => {
    vi.useFakeTimers();
    const { session, responses } = collect();
    await session.handle({ type: 'open', files: [fileOf('a.txt', androidEs24h)] });
    const filter = { gapMs: 3_600_000, timeZone: 'UTC' };
    await session.handle({ type: 'compute', runId: 1, filter });
    await session.handle({ type: 'compute', runId: 2, filter: { ...filter, gapMs: 60_000 } });
    vi.runAllTimers();
    vi.useRealTimers();
    const stats = responses.filter((response) => response.type === 'stats');
    expect(stats.map((response) => response.runId)).toEqual([2]);
  });
});
