import { strFromU8, unzipSync } from 'fflate';

export type Attachment = {
  name: string;
  size: number;
};

export type WhatsAppArchive = {
  name?: string;
  text: string;
  attachments: Attachment[];
};

const CHAT_NAME = /(?:WhatsApp Chat with|WhatsApp Chat -|Chat de WhatsApp con)\s+(.+)\.txt$/i;

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);
const isChatFile = (path: string) => path.toLowerCase().endsWith('.txt');

export function extractFiles(bytes: Uint8Array, names: Set<string>): Map<string, Uint8Array> {
  const files = unzipSync(bytes, { filter: (file) => names.has(baseName(file.name)) });
  return new Map(Object.entries(files).map(([path, data]) => [baseName(path), data]));
}

export function readWhatsAppArchive(bytes: Uint8Array): WhatsAppArchive {
  const attachments: Attachment[] = [];
  const files = unzipSync(bytes, {
    filter: (file) => {
      if (isChatFile(file.name)) return true;
      attachments.push({ name: baseName(file.name), size: file.originalSize });
      return false;
    },
  });

  const paths = Object.keys(files);
  const chatPath = paths.find((path) => baseName(path) === '_chat.txt') ?? paths[0];
  if (!chatPath) throw new Error('no-chat-file');

  return {
    name: CHAT_NAME.exec(baseName(chatPath))?.[1],
    text: strFromU8(files[chatPath]),
    attachments,
  };
}
