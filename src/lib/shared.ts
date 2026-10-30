export const SHARE_CACHE = 'chat-stats-share';
export const SHARE_KEY = '/shared-file';
export const SHARE_NAME_HEADER = 'x-file-name';

export async function takeSharedFile(): Promise<File | null> {
  const cache = await caches.open(SHARE_CACHE);
  const response = await cache.match(SHARE_KEY);
  await caches.delete(SHARE_CACHE);
  if (!response) return null;

  const name = decodeURIComponent(response.headers.get(SHARE_NAME_HEADER) ?? 'shared.txt');
  return new File([await response.blob()], name);
}
