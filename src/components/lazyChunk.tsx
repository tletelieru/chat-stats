import { Alert } from '@mui/material';
import { lazy } from 'react';
import type { ComponentType } from 'react';
import { messages } from '~/i18n/messages';
import { useMessages } from '~/i18n/react';

function ChunkUnavailable() {
  const t = useMessages(messages);
  return <Alert severity="warning">{t.chunkUnavailable}</Alert>;
}

export function lazyChunk<Props>(load: () => Promise<{ default: ComponentType<Props> }>) {
  return lazy(() =>
    load().catch((): { default: ComponentType<Props> } => ({ default: ChunkUnavailable })),
  );
}
