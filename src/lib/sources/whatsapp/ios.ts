import type { HeaderMatch } from './parse';

const HEADER =
  /^\[(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4}),? (\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?(?: ?([ap])\.? ?m\.?)?\] (.*)$/i;

export function matchIosHeader(line: string): HeaderMatch | null {
  const match = HEADER.exec(line);
  if (!match) return null;
  const [, a, b, c, hour, minute, second, meridiem, body] = match;
  return { date: [a, b, c], hour, minute, second, meridiem, body };
}
