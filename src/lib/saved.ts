import type { ResponsePair, StatsResult } from './stats/types';

const DATABASE = 'chat-stats';
const STORE = 'saved';

export type SavedStats = {
  id?: number;
  name: string;
  savedAt: number;
  timeZone: string;
  stats: StatsResult;
};

function stripPair(pair: ResponsePair | null): ResponsePair | null {
  return (
    pair && {
      ...pair,
      question: { ...pair.question, preview: '' },
      answer: { ...pair.answer, preview: '' },
    }
  );
}

export function stripMessageText(stats: StatsResult): StatsResult {
  return {
    ...stats,
    responses: stats.responses.map((response) => ({
      ...response,
      shortest: stripPair(response.shortest),
      longest: stripPair(response.longest),
    })),
    replies: {
      ...stats.replies,
      top: stats.replies.top.map((message) => ({ ...message, preview: '' })),
    },
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(database.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export const listSaved = () => withStore<SavedStats[]>('readonly', (store) => store.getAll());

export const saveStats = (entry: SavedStats) =>
  withStore('readwrite', (store) => store.add({ ...entry, stats: stripMessageText(entry.stats) }));

export const removeSaved = (id: number) => withStore('readwrite', (store) => store.delete(id));
