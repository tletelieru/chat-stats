import type { Chat, Message, MessageKind } from '~/lib/model';

const WORDS = ['hola', 'jajaja', 'plan', 'cine', 'mañana', 'café', 'viaje', 'perro', '😂', 'ok?'];
const KINDS: MessageKind[] = ['text', 'text', 'text', 'text', 'photo', 'voice', 'sticker'];

export function generateChat(size: number, seed = 1): Chat {
  let state = seed;
  const random = (limit: number) => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state % limit;
  };

  let ts = Date.UTC(2020, 0, 1);
  const messages: Message[] = Array.from({ length: size }, (_, index) => {
    ts += random(100) === 0 ? 8 * 3_600_000 : random(600_000);
    const kind = KINDS[random(KINDS.length)];
    return {
      id: String(index),
      ts,
      author: random(2) ? 'ana' : 'beto',
      kind,
      ...(kind === 'text' && { text: `${WORDS[random(10)]} ${WORDS[random(10)]}` }),
      ...(kind === 'voice' && { durationSec: random(120) }),
      ...(kind === 'sticker' && { stickerEmoji: WORDS[random(10)] }),
    };
  });

  return {
    source: 'telegram',
    name: 'Generated',
    participants: [
      { id: 'ana', name: 'Ana Prueba' },
      { id: 'beto', name: 'Beto Demo' },
    ],
    messages,
  };
}
