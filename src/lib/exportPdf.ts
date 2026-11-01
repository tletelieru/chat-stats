export const PIXEL_RATIOS = [3, 2, 1.5];
const JPEG_QUALITY = 0.92;
const TILE_HEIGHT = 3000;
const MAX_PAGE_HEIGHT = 18_000;

export const EXPORT_FILE_NAME = 'chat-stats.pdf';

export type Slice = { top: number; height: number; pageTop: number; page: number };

export function sliceLayout(total: number): Slice[] {
  const slices: Slice[] = [];
  for (let top = 0; top < total; top += TILE_HEIGHT) {
    const page = Math.floor(top / MAX_PAGE_HEIGHT);
    slices.push({
      top,
      height: Math.min(TILE_HEIGHT, total - top),
      pageTop: page * MAX_PAGE_HEIGHT,
      page,
    });
  }
  return slices;
}

export async function renderPdf(
  node: HTMLElement,
  backgroundColor: string,
  onProgress: (ratio: number) => void,
  pixelRatio: number,
): Promise<Blob> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
  const width = node.offsetWidth;
  const total = node.scrollHeight;
  const slices = sliceLayout(total);
  const pageHeight = (page: number) => Math.min(MAX_PAGE_HEIGHT, total - page * MAX_PAGE_HEIGHT);

  const pdf = new jsPDF({
    unit: 'px',
    hotfixes: ['px_scaling'],
    format: [width, pageHeight(0)],
    orientation: 'portrait',
    compress: true,
  });

  let done = 0;
  for (const slice of slices) {
    if (slice.page > 0 && slice.top === slice.pageTop) {
      pdf.addPage([width, pageHeight(slice.page)], 'portrait');
    }
    const canvas = await toCanvas(node, {
      width,
      height: slice.height,
      pixelRatio,
      backgroundColor,
      skipFonts: true,
      onImageErrorHandler: () => undefined,
      style: { transform: `translateY(-${slice.top}px)`, transformOrigin: 'top left' },
    });
    const image = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    canvas.width = 0;
    canvas.height = 0;
    if (!image.startsWith('data:image/jpeg')) throw new Error('Canvas too large for this device');
    pdf.addImage(
      image,
      'JPEG',
      0,
      slice.top - slice.pageTop,
      width,
      slice.height,
      undefined,
      'FAST',
    );
    onProgress(++done / slices.length);
  }

  return pdf.output('blob');
}

export async function withFallback<T>(
  ratios: number[],
  attempt: (ratio: number) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (const ratio of ratios) {
    try {
      return await attempt(ratio);
    } catch (error) {
      console.error(`PDF export failed at ${ratio}x`, error);
      lastError = error;
    }
  }
  throw lastError;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function shareableFile(blob: Blob): File | null {
  const file = new File([blob], EXPORT_FILE_NAME, { type: 'application/pdf' });
  return navigator.canShare?.({ files: [file] }) ? file : null;
}
