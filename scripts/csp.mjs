import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;

export function buildCsp(html) {
  const hashes = [...html.matchAll(INLINE_SCRIPT)].map(
    ([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
  );
  return [
    "default-src 'none'",
    ["script-src 'self'", ...hashes].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "media-src 'self' blob:",
    "font-src 'self'",
    "connect-src 'none'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

export function cspIntegration() {
  return {
    name: 'chat-stats-csp',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const path = fileURLToPath(new URL('index.html', dir));
        const html = await readFile(path, 'utf8');
        const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(html)}">`;
        await writeFile(path, html.replace('<head>', `<head>${meta}`));
      },
    },
  };
}
