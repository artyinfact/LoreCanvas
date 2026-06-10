import { describe, expect, it } from "vitest";
import {
  getThumbnailDimensions,
  processAssetMedia,
} from "../../src/ui/assetMedia";
import type { AssetMediaPatch, AssetMediaTask } from "../../src/ui/assetMedia";

function createTasks(count: number): AssetMediaTask[] {
  return Array.from({ length: count }, (_value, index) => ({
    assetId: `asset-${index + 1}`,
    file: new Blob([`image-${index + 1}`]),
    url: `blob:asset-${index + 1}`,
  }));
}

describe("asset media thumbnails", () => {
  it("fits thumbnail dimensions inside the max edge without upscaling", () => {
    expect(getThumbnailDimensions(2048, 1024, 128)).toEqual({
      width: 128,
      height: 64,
    });
    expect(getThumbnailDimensions(500, 2000, 128)).toEqual({
      width: 32,
      height: 128,
    });
    expect(getThumbnailDimensions(48, 64, 128)).toEqual({
      width: 48,
      height: 64,
    });
    expect(getThumbnailDimensions(0, 0, 128)).toEqual({
      width: 128,
      height: 128,
    });
  });
});

describe("asset media pipeline", () => {
  it("produces one patch per task and flushes them in bounded batches", async () => {
    const tasks = createTasks(20);
    const flushes: AssetMediaPatch[][] = [];

    await processAssetMedia(
      tasks,
      (patches) => {
        flushes.push(patches);
      },
      {
        concurrency: 4,
        flushSize: 8,
        decode: async (task) => ({
          width: 100,
          height: 50,
          thumbnailUrl: `thumb:${task.assetId}`,
        }),
      },
    );

    const allPatches = flushes.flat();

    expect(allPatches).toHaveLength(20);
    expect(flushes.every((batch) => batch.length <= 8)).toBe(true);
    expect(new Set(allPatches.map((patch) => patch.assetId)).size).toBe(20);
    expect(allPatches[0]).toMatchObject({
      width: 100,
      height: 50,
    });
  });

  it("never decodes more images than the concurrency limit at once", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await processAssetMedia(
      createTasks(12),
      () => {},
      {
        concurrency: 3,
        decode: async () => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise((resolve) => setTimeout(resolve, 1));
          inFlight -= 1;
          return {};
        },
      },
    );

    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(maxInFlight).toBeGreaterThan(1);
  });

  it("keeps processing and reporting progress when single files fail to decode", async () => {
    const progress: number[] = [];
    const flushes: AssetMediaPatch[][] = [];

    await processAssetMedia(
      createTasks(5),
      (patches) => {
        flushes.push(patches);
      },
      {
        concurrency: 1,
        decode: async (task) => {
          if (task.assetId === "asset-3") {
            throw new Error("undecodable image");
          }

          return { width: 10, height: 10 };
        },
        onProgress: (done) => {
          progress.push(done);
        },
      },
    );

    expect(progress).toEqual([1, 2, 3, 4, 5]);
    expect(flushes.flat().map((patch) => patch.assetId)).toEqual([
      "asset-1",
      "asset-2",
      "asset-4",
      "asset-5",
    ]);
  });

  it("stops decoding when cancelled", async () => {
    let decoded = 0;

    await processAssetMedia(
      createTasks(10),
      () => {},
      {
        concurrency: 1,
        decode: async () => {
          decoded += 1;
          return {};
        },
        isCancelled: () => decoded >= 2,
      },
    );

    expect(decoded).toBeLessThan(10);
  });
});
