export const THUMBNAIL_LIMIT = 20;

export type MediaSource = {
  name: string;
  size: number;
  read: () => Promise<Uint8Array>;
};

export type Digest = (bytes: Uint8Array) => Promise<string>;

export const sha256: Digest = async (bytes) => {
  const hash = await crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export async function canonicalMedia(
  sources: MediaSource[],
  digest: Digest,
  onProgress?: (ratio: number) => void,
): Promise<Map<string, string>> {
  const bySize = new Map<number, MediaSource[]>();
  for (const source of sources) {
    const group = bySize.get(source.size);
    if (group) group.push(source);
    else bySize.set(source.size, [source]);
  }

  const collisions = [...bySize.values()].filter((group) => group.length > 1);
  const total = collisions.reduce((sum, group) => sum + group.length, 0);
  const canonical = new Map<string, string>();
  let done = 0;

  for (const group of collisions) {
    const firstByHash = new Map<string, string>();
    for (const source of group) {
      const hash = await digest(await source.read());
      const first = firstByHash.get(hash);
      if (first) canonical.set(source.name, first);
      else firstByHash.set(hash, source.name);
      onProgress?.(++done / total);
    }
  }

  return canonical;
}

export function applyCanonicalMedia(keys: string[], canonical: Map<string, string>): string[] {
  return keys.map((key) => canonical.get(key) ?? key);
}

export function topMediaKeys(
  mediaKey: Int32Array,
  keys: string[],
  limit = THUMBNAIL_LIMIT,
): string[] {
  const counts = new Map<string, number>();
  for (const id of mediaKey) {
    if (id >= 0) counts.set(keys[id], (counts.get(keys[id]) ?? 0) + 1);
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

export function matchMediaPath(relativePath: string, wanted: Set<string>): string | null {
  const parts = relativePath.split('/');
  for (let start = 0; start < parts.length; start++) {
    const candidate = parts.slice(start).join('/');
    if (wanted.has(candidate)) return candidate;
  }
  return null;
}
