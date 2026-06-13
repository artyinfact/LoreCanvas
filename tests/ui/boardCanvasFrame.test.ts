import { describe, expect, it } from "vitest";
import {
  computeBoardFrame,
  resolveFrameBackground,
} from "../../src/ui/boardCanvasFrame";
import type { BoardImageRef } from "../../src/engine/board";

describe("board canvas frame sizing", () => {
  const background: BoardImageRef = {
    assetId: "asset-board",
    name: "board.png",
    url: "blob:board",
  };

  it("keeps the source image aspect ratio in square fullscreen space", () => {
    const frame = computeBoardFrame(
      { width: 1000, height: 1000 },
      { ...background, width: 1600, height: 900 },
      1,
      { x: 0, y: 0 },
    );

    expect(frame.width / frame.height).toBeCloseTo(16 / 9, 5);
    expect(frame.width).toBeGreaterThan(frame.height);
  });

  it("uses asset dimensions when legacy background refs have no size", () => {
    const resolvedBackground = resolveFrameBackground(
      background,
      { width: 2400, height: 1200 },
      null,
    );

    const frame = computeBoardFrame(
      { width: 1200, height: 900 },
      resolvedBackground,
      1,
      { x: 0, y: 0 },
    );

    expect(resolvedBackground).toMatchObject({ width: 2400, height: 1200 });
    expect(frame.width / frame.height).toBeCloseTo(2, 5);
  });
});
