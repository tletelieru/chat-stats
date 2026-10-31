const THUMBNAIL_SIZE = 96;
const THUMBNAIL_QUALITY = 0.6;
const LOAD_TIMEOUT_MS = 4000;

type Source = HTMLImageElement | HTMLVideoElement;

export function fitSize(width: number, height: number, limit: number) {
  const scale = Math.min(1, limit / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(url: string): Promise<Source> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image failed to load'));
    image.src = url;
  });
}

function loadVideoFrame(url: string): Promise<Source> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.1, video.duration / 2 || 0);
    };
    video.onseeked = () => resolve(video);
    video.onerror = () => reject(new Error('Video failed to load'));
    video.src = url;
  });
}

function withTimeout<T>(task: Promise<T>): Promise<T> {
  return Promise.race([
    task,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Timed out')), LOAD_TIMEOUT_MS);
    }),
  ]);
}

function draw(source: Source): string {
  const isVideo = source instanceof HTMLVideoElement;
  const size = fitSize(
    isVideo ? source.videoWidth : source.naturalWidth,
    isVideo ? source.videoHeight : source.naturalHeight,
    THUMBNAIL_SIZE,
  );
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  canvas.getContext('2d')?.drawImage(source, 0, 0, size.width, size.height);
  return canvas.toDataURL('image/webp', THUMBNAIL_QUALITY);
}

export async function compressThumbnails(
  thumbs: Record<string, string>,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(thumbs).map(async ([key, url]) => {
      try {
        const load = /\.(mp4|webm)$/i.test(key) ? loadVideoFrame : loadImage;
        return [[key, draw(await withTimeout(load(url)))]];
      } catch {
        return [];
      }
    }),
  );
  return Object.fromEntries(entries.flat());
}
