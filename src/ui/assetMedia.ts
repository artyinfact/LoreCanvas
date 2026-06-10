export interface AssetMediaTask {
  assetId: string;
  /** Original file blob used for decoding. */
  file: Blob;
  /** Existing object URL for the asset, used by the <img> fallback decoder. */
  url: string;
}

export interface AssetMediaPatch {
  assetId: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface AssetMediaDecodeResult {
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export type AssetMediaDecoder = (
  task: AssetMediaTask,
  maxThumbnailEdge: number,
) => Promise<AssetMediaDecodeResult>;

export interface AssetMediaPipelineOptions {
  /** How many images may be decoded at the same time. */
  concurrency?: number;
  /** How many finished patches are applied to the store per flush. */
  flushSize?: number;
  /** Longest edge of generated thumbnails, in CSS pixels. */
  maxThumbnailEdge?: number;
  /** Injectable decoder, mainly for tests. */
  decode?: AssetMediaDecoder;
  isCancelled?: () => boolean;
  onProgress?: (done: number, total: number) => void;
}

export const DEFAULT_MEDIA_CONCURRENCY = 3;
export const DEFAULT_MEDIA_FLUSH_SIZE = 8;
export const DEFAULT_THUMBNAIL_EDGE = 128;

/**
 * Decodes imported image assets off the import critical path.
 *
 * Full-resolution images are decoded at most `concurrency` at a time, are
 * downscaled into small thumbnails, and finished patches are delivered in
 * bounded batches so the store re-renders a bounded number of times even for
 * imports with hundreds of files.
 */
export async function processAssetMedia(
  tasks: AssetMediaTask[],
  applyPatches: (patches: AssetMediaPatch[]) => void,
  options: AssetMediaPipelineOptions = {},
): Promise<void> {
  const concurrency = Math.max(1, options.concurrency ?? DEFAULT_MEDIA_CONCURRENCY);
  const flushSize = Math.max(1, options.flushSize ?? DEFAULT_MEDIA_FLUSH_SIZE);
  const maxThumbnailEdge = options.maxThumbnailEdge ?? DEFAULT_THUMBNAIL_EDGE;
  const decode = options.decode ?? decodeAssetMedia;
  const isCancelled = options.isCancelled ?? (() => false);
  const queue = [...tasks];
  const pendingPatches: AssetMediaPatch[] = [];
  let done = 0;

  const flush = () => {
    if (pendingPatches.length === 0) {
      return;
    }

    applyPatches(pendingPatches.splice(0, pendingPatches.length));
  };

  const worker = async () => {
    for (;;) {
      const task = queue.shift();

      if (!task || isCancelled()) {
        return;
      }

      try {
        const result = await decode(task, maxThumbnailEdge);

        pendingPatches.push({
          assetId: task.assetId,
          ...result,
        });
      } catch {
        // A single undecodable file must not abort the rest of the import.
      }

      done += 1;
      options.onProgress?.(done, tasks.length);

      if (pendingPatches.length >= flushSize) {
        flush();
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );

  flush();
}

export function getThumbnailDimensions(
  width: number,
  height: number,
  maxEdge: number,
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return { width: maxEdge, height: maxEdge };
  }

  const scale = Math.min(maxEdge / width, maxEdge / height, 1);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function decodeAssetMedia(
  task: AssetMediaTask,
  maxThumbnailEdge: number,
): Promise<AssetMediaDecodeResult> {
  const source = await decodeImageSource(task);

  try {
    const thumbnail = getThumbnailDimensions(
      source.width,
      source.height,
      maxThumbnailEdge,
    );
    const thumbnailUrl = await renderThumbnail(source.image, thumbnail);

    return {
      width: source.width,
      height: source.height,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    };
  } finally {
    source.close();
  }
}

interface DecodedImageSource {
  image: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

async function decodeImageSource(task: AssetMediaTask): Promise<DecodedImageSource> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(task.file);

      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Some sources (notably SVG blobs in Chromium) are not supported by
      // createImageBitmap; fall through to the <img> decoder.
    }
  }

  const image = new Image();

  image.decoding = "async";
  image.src = task.url;
  await image.decode();

  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => {
      image.src = "";
    },
  };
}

async function renderThumbnail(
  image: CanvasImageSource,
  size: { width: number; height: number },
): Promise<string | undefined> {
  const canvas = document.createElement("canvas");

  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d");

  if (!context) {
    return undefined;
  }

  context.drawImage(image, 0, 0, size.width, size.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.82);
  });

  return blob ? URL.createObjectURL(blob) : undefined;
}
