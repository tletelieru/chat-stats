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
  const [stats, setStats] = useState<StatsResult | null>(null);

  const send = useCallback((request: WorkerRequest) => {
    worker.current?.postMessage(request);
  }, []);

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
      } else if (data.runId === runId.current) {
        setStats(data.stats);
      }
    };
    return () => instance.terminate();
  }, []);

  const openFile = useCallback(
    (file: File) => {
      setStats(null);
      setState({ phase: 'parsing', ratio: 0, label: 'Opening file' });
      send({ type: 'open', file });
    },
    [send],
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
      runId.current += 1;
      send({ type: 'compute', runId: runId.current, filter });
    },
    [send],
  );

  const reset = useCallback(() => {
    setStats(null);
    setState({ phase: 'empty' });
  }, []);

  return { state, stats, openFile, pickChat, confirmPeople, compute, reset };
}
