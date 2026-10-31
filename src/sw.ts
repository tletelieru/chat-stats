import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { SHARE_CACHE, SHARE_KEY, SHARE_NAME_HEADER } from '~/lib/shared';

type ShareEvent = Event & {
  request: Request;
  respondWith: (response: Promise<Response>) => void;
};

type WorkerScope = {
  __WB_MANIFEST: { url: string; revision: string | null }[];
  location: Location;
  skipWaiting: () => Promise<void>;
  addEventListener: (type: 'fetch', listener: (event: ShareEvent) => void) => void;
};

const scope = self as unknown as WorkerScope;
const SHARE_PATH = new URL('share-target', scope.location.href).pathname;
const APP_PATH = new URL('./', scope.location.href).pathname;

async function receiveShare(request: Request): Promise<Response> {
  const form = await request.formData();
  const files = form.getAll('file').filter((entry): entry is File => entry instanceof File);
  const file = files.find(({ name }) => /\.(zip|txt)$/i.test(name)) ?? files[0];

  if (file) {
    const cache = await caches.open(SHARE_CACHE);
    await cache.put(
      SHARE_KEY,
      new Response(file, { headers: { [SHARE_NAME_HEADER]: encodeURIComponent(file.name) } }),
    );
  }
  return Response.redirect(`${APP_PATH}?shared=1`, 303);
}

scope.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method === 'POST' && new URL(request.url).pathname === SHARE_PATH) {
    event.respondWith(receiveShare(request));
  }
});

void scope.skipWaiting();
clientsClaim();
precacheAndRoute((self as unknown as WorkerScope).__WB_MANIFEST, {
  ignoreURLParametersMatching: [/.*/],
});
