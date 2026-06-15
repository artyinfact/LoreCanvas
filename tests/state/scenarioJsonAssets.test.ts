import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyCardDeckState } from "../../src/engine/cardDeck";
import { createEmptyDiceState } from "../../src/engine/dice";
import { createEmptyEntityState } from "../../src/engine/entity";
import { serializeScenarioPackage } from "../../src/engine/serialization";
import { createEmptySlotState } from "../../src/engine/slot";
import { createEmptyStackState } from "../../src/engine/stack";
import { useBoardStore } from "../../src/state/boardStore";
import type { UploadedImageAsset } from "../../src/state/boardStore";
import {
  exportBoardStoreScenarioJson,
  isScenarioAssetReferenceUrl,
  resolveScenarioJsonAssetReferences,
} from "../../src/state/scenarioStore";

describe("scenario.json external asset references", () => {
  const boardAsset: UploadedImageAsset = {
    id: "asset-board-scenario",
    category: "BOARD",
    name: "board.png",
    url: "blob:board-image",
    thumbnailUrl: "data:image/png;base64,preview",
    mimeType: "image/png",
    size: 1024,
    width: 800,
    height: 600,
    maxCopies: 1,
    placementWidth: 96,
    placementHeight: 72,
    sourcePath: "assets/board.png",
  };

  beforeEach(() => {
    useBoardStore.setState({
      board: createEmptyBoard(),
      entityState: createEmptyEntityState(),
      assets: [],
      assetPlacements: [],
      pawnSheets: {},
      selectedAssetId: null,
      selectedLocationId: null,
      selectedPlacementId: null,
      selectedEdgeId: null,
      edgeDraftFromId: null,
      activeTool: "select",
      boardZoom: 1,
      boardPan: { x: 0, y: 0 },
      isCreationPanelCollapsed: false,
      isInspectorCollapsed: false,
      lastError: null,
    });
  });

  it("writes setup data without image bytes and restores URLs from imported assets", () => {
    const scenario = exportBoardStoreScenarioJson(
      {
        mode: "edit",
        assets: [boardAsset],
        board: {
          background: {
            assetId: boardAsset.id,
            name: boardAsset.name,
            url: boardAsset.url,
            mimeType: boardAsset.mimeType,
            width: boardAsset.width,
            height: boardAsset.height,
          },
          locations: [{ id: "loc-a", name: "Location A", x: 0.25, y: 0.75 }],
          edges: [],
        },
        assetPlacements: [],
        entityState: createEmptyEntityState(),
        pawnSheets: {},
        cardDeckState: createEmptyCardDeckState(),
        diceState: createEmptyDiceState(),
        slotState: createEmptySlotState(),
        stackState: createEmptyStackState(),
        boardState: {},
        locationStates: {},
        edgeStates: {},
        frozenSetup: null,
        boardZoom: 1,
        boardPan: { x: 0, y: 0 },
      },
      { title: "Reference Setup" },
    );

    expect(scenario.board.locations[0]).toMatchObject({ x: 0.25, y: 0.75 });
    expect(isScenarioAssetReferenceUrl(scenario.assets[0]!.url)).toBe(true);
    expect(scenario.assets[0]!.thumbnailUrl).toBeUndefined();
    expect(isScenarioAssetReferenceUrl(scenario.board.background!.url)).toBe(true);
    expect(serializeScenarioPackage(scenario)).not.toContain("blob:board-image");
    expect(serializeScenarioPackage(scenario)).not.toContain("data:image/png");

    const resolved = resolveScenarioJsonAssetReferences(scenario, [
      {
        ...boardAsset,
        id: "asset-1-board-import-batch",
        url: "blob:imported-board",
        thumbnailUrl: "blob:imported-thumb",
      },
    ]);

    expect(resolved.assets[0]).toMatchObject({
      id: boardAsset.id,
      url: "blob:imported-board",
      thumbnailUrl: "blob:imported-thumb",
    });
    expect(resolved.board.background?.url).toBe("blob:imported-board");
  });

  it("reuses scenario asset ids when the matching assets folder is imported later", () => {
    useBoardStore.setState({
      assets: [
        {
          ...boardAsset,
          url: "lorecanvas-asset-ref://assets%2Fboard.png",
          thumbnailUrl: undefined,
        },
      ],
    });

    useBoardStore.getState().addAssets([
      {
        ...boardAsset,
        id: "asset-1-board-random-import",
        url: "blob:imported-board",
        thumbnailUrl: "blob:imported-thumb",
      },
    ]);

    expect(useBoardStore.getState().assets).toHaveLength(1);
    expect(useBoardStore.getState().assets[0]).toMatchObject({
      id: boardAsset.id,
      sourcePath: boardAsset.sourcePath,
      url: "blob:imported-board",
      thumbnailUrl: "blob:imported-thumb",
    });
  });
});
