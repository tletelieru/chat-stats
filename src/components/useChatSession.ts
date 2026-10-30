import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatSummary, Participant } from '~/lib/model';
import type { PreviewMessage, WorkerRequest, WorkerResponse } from '~/lib/session';
import type { Filter, StatsResult } from '~/lib/stats/types';

export type LoadedChat = {
  name: string;
  source: 'telegram' | 'whatsapp';
  messageCount: number;
  unknownMedia: number;
  people: Participant[];
  preview: PreviewMessage[];
};

export type MediaState = {
  ratio: number;
  thumbs: Record<string, string>;
};

export type SessionState =
  | { phase: 'empty'; error?: string }
  | { phase: 'parsing'; ratio: number; label: string }
  | { phase: 'pick'; chats: ChatSummary[] }
  | { phase: 'review'; chat: LoadedChat }
  | { phase: 'stats'; chat: LoadedChat };

export function useChatSession() {
  const worker = useRef<Worker | null>(null);
  const runId = useRef(0);
  const [state, setState] = useState<SessionState>({ phase: 'empty' });
  const lastFilter = useRef<Filter | null>(null);
  const hashRequested = useRef(false);
  const urls = useRef<string[]>([]);
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [media, setMedia] = useState<MediaState>({ ratio: 0, thumbs: {} });

  const send = useCallback((request: WorkerRequest) => {
    worker.current?.postMessage(request);
  }, []);

  const clearMedia = useCallback(() => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current = [];
    hashRequested.current = false;
    setMedia({ ratio: 0, thumbs: {} });
  }, []);

  useEffect(() => clearMedia, [clearMedia]);

  useEffect(() => {
    const instance = new Worker(new URL('../lib/worker.ts', import.meta.url), { type: 'module' });
    worker.current = instance;
    instance.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (data.type === 'progress') {
        setState({ phase: 'parsing', ratio: data.ratio, label: data.label });
      } else if (data.type === 'chats') {
        setState({ phase: 'pick', chats: data.chats });
      } else if (data.type === 'ready') {
        setState({ phase: 'review', chat: data });
      } else if (data.type === 'error') {
        setState({ phase: 'empty', error: data.message });
      } else if (data.type === 'mediaProgress') {
        setMedia((current) => ({ ...current, ratio: data.ratio }));
      } else if (data.type === 'media') {
        const thumbs = Object.fromEntries(
          Object.entries(data.thumbs).map(([key, blob]) => [key, URL.createObjectURL(blob)]),
        );
        urls.current = Object.values(thumbs);
        setMedia({ ratio: 1, thumbs });
        if (data.merged && lastFilter.current) {
          runId.current += 1;
          instance.postMessage({
            type: 'compute',
            runId: runId.current,
            filter: lastFilter.current,
          } satisfies WorkerRequest);
        }
      } else if (data.runId === runId.current) {
        setStats(data.stats);
        if (!hashRequested.current) {
          hashRequested.current = true;
          instance.postMessage({ type: 'hashMedia' } satisfies WorkerRequest);
        }
      }
    };
    return () => instance.terminate();
  }, []);

  const openFiles = useCallback(
    (files: File[]) => {
      setStats(null);
      clearMedia();
      setState({ phase: 'parsing', ratio: 0, label: 'Opening file' });
      send({ type: 'open', files });
    },
    [send, clearMedia],
  );

  const pickChat = useCallback(
    (index: number) => {
      setState({ phase: 'parsing', ratio: 0, label: 'Parsing messages' });
      send({ type: 'pick', index });
    },
    [send],
  );

  const confirmPeople = useCallback(
    (chat: LoadedChat, names: Record<string, string>, aliases: Record<string, string>) => {
      send({ type: 'people', names, aliases });
      setState({ phase: 'stats', chat });
    },
    [send],
  );

  const compute = useCallback(
    (filter: Filter) => {
      lastFilter.current = filter;
      runId.current += 1;
      send({ type: 'compute', runId: runId.current, filter });
    },
    [send],
  );

  const reset = useCallback(() => {
    setStats(null);
    clearMedia();
    setState({ phase: 'empty' });
  }, [clearMedia]);

  return { state, stats, media, openFiles, pickChat, confirmPeople, compute, reset };
}
