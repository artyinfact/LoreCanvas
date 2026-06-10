import { describe, expect, it } from "vitest";
import {
  createImportedImageAsset,
  inferResourceCategoryFromPath,
} from "../../src/ui/assetImport";

describe("asset import helpers", () => {
  it("infers LoreCanvas categories from assets folder paths", () => {
    expect(inferResourceCategoryFromPath("assets/board/main-board.png")).toBe(
      "BOARD",
    );
    expect(inferResourceCategoryFromPath("assets/token/hope-marker.png")).toBe(
      "TOKEN",
    );
    expect(inferResourceCategoryFromPath("assets/tile/haven-token.png")).toBe(
      "TILE",
    );
    expect(inferResourceCategoryFromPath("assets/card/region-001.png")).toBe(
      "CARD",
    );
    expect(inferResourceCategoryFromPath("assets/pawn/aragorn.png")).toBe(
      "PAWN",
    );
    expect(inferResourceCategoryFromPath("assets/other/dice-tower.png")).toBe(
      "OTHER",
    );
  });

  it("infers a selected category subfolder without requiring an assets root", () => {
    expect(inferResourceCategoryFromPath("token/friendship.png")).toBe("TOKEN");
    expect(inferResourceCategoryFromPath("card/reference/actions.png")).toBe(
      "CARD",
    );
  });

  it("creates category-aware image assets with placement defaults", () => {
    const token = createImportedImageAsset({
      batchId: "batch",
      category: "TOKEN",
      dimensions: { width: 320, height: 160 },
      file: {
        name: "Hope Marker.png",
        type: "image/png",
        size: 2048,
      },
      index: 0,
      url: "blob:hope",
    });
    const board = createImportedImageAsset({
      batchId: "batch",
      category: "BOARD",
      dimensions: { width: 2048, height: 1024 },
      file: {
        name: "Main Board.png",
        type: "image/png",
        size: 4096,
      },
      index: 1,
      url: "blob:board",
    });

    expect(token).toMatchObject({
      id: "asset-1-hope-marker-png-batch",
      category: "TOKEN",
      maxCopies: 999,
      placementWidth: 96,
      placementHeight: 48,
    });
    expect(board).toMatchObject({
      id: "asset-2-main-board-png-batch",
      category: "BOARD",
      maxCopies: 1,
      placementWidth: 96,
      placementHeight: 48,
    });
  });
});
