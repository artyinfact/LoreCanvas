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

  it("keeps the map center stable while zoom changes", () => {
    const viewport = { width: 1200, height: 800 };
    const pan = { x: 48, y: -32 };
    const normalFrame = computeBoardFrame(
      viewport,
      { ...background, width: 1600, height: 900 },
      1,
      pan,
    );
    const zoomedFrame = computeBoardFrame(
      viewport,
      { ...background, width: 1600, height: 900 },
      2.5,
      pan,
    );

    expect(normalFrame.x + normalFrame.width / 2).toBeCloseTo(
      zoomedFrame.x + zoomedFrame.width / 2,
    );
    expect(normalFrame.y + normalFrame.height / 2).toBeCloseTo(
      zoomedFrame.y + zoomedFrame.height / 2,
    );
    expect(zoomedFrame.x + zoomedFrame.width / 2).toBeCloseTo(
      viewport.width / 2 + pan.x,
    );
    expect(zoomedFrame.y + zoomedFrame.height / 2).toBeCloseTo(
      viewport.height / 2 + pan.y,
    );
  });
});
