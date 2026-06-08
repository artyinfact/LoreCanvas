import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyEntityState } from "../../src/engine/entity";
import { useBoardStore } from "../../src/state/boardStore";

describe("Maker image assets and entity placement", () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: createEmptyBoard(),
      entityState: createEmptyEntityState(),
      assets: [],
      assetPlacements: [],
      selectedAssetId: null,
      selectedLocationId: null,
      selectedPlacementId: null,
      edgeDraftFromId: null,
      activeTool: "select",
      boardZoom: 1,
      boardPan: { x: 0, y: 0 },
      isCreationPanelCollapsed: false,
      isInspectorCollapsed: false,
      lastError: null,
    });
  });

  it("creates a bound pawn entity directly from an image asset", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-pawn",
      category: "PAWN",
      name: "Hero.png",
      url: "blob:hero",
      mimeType: "image/png",
      size: 1000,
      width: 256,
      height: 256,
      maxCopies: 1,
      placementWidth: 96,
      placementHeight: 96,
    });
    const locationId = useBoardStore.getState().createLocationAt(0.4, 0.6);

    expect(locationId).toBe("loc-1");

    const placementId = useBoardStore
      .getState()
      .createAssetPlacement("asset-pawn", 0.4, 0.6, locationId ?? "");
    const nextState = useBoardStore.getState();

    expect(placementId).toBe("pawn-copy-1");
    expect(nextState.assetPlacements[0]).toMatchObject({
      id: "pawn-copy-1",
      assetId: "asset-pawn",
      category: "PAWN",
      locationId: "loc-1",
      entityId: "entity-1",
      width: 96,
      height: 96,
    });
    expect(nextState.entityState.entities[0]).toMatchObject({
      id: "entity-1",
      type: "PAWN",
      locationId: "loc-1",
      state: {
        assetId: "asset-pawn",
        category: "PAWN",
        placementId: "pawn-copy-1",
      },
    });
  });

  it("uses asset copy limits and configurable default placement size", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-card",
      category: "CARD",
      name: "Card.png",
      url: "blob:card",
      mimeType: "image/png",
      size: 1000,
      width: 300,
      height: 200,
      maxCopies: 1,
      placementWidth: 96,
      placementHeight: 64,
    });
    useBoardStore.getState().updateAssetPlacementConfig("asset-card", {
      maxCopies: 2,
      placementWidth: 120,
      placementHeight: 80,
    });

    expect(
      useBoardStore.getState().createAssetPlacement("asset-card", 0.2, 0.2),
    ).toBe("card-copy-1");
    expect(
      useBoardStore.getState().createAssetPlacement("asset-card", 0.3, 0.3),
    ).toBe("card-copy-2");
    expect(
      useBoardStore.getState().createAssetPlacement("asset-card", 0.4, 0.4),
    ).toBeNull();

    const nextState = useBoardStore.getState();

    expect(nextState.assetPlacements).toHaveLength(2);
    expect(nextState.assetPlacements[0]).toMatchObject({
      width: 120,
      height: 80,
    });
    expect(nextState.lastError).toContain("2 copy limit");
  });

  it("does not place board or other assets as entities", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-board",
      category: "BOARD",
      name: "Map.png",
      url: "blob:map",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 1,
      placementWidth: 64,
      placementHeight: 64,
    });
    useBoardStore.getState().createAssetPlacement("asset-board", 0.3, 0.3);

    expect(useBoardStore.getState().assetPlacements).toHaveLength(0);
    expect(useBoardStore.getState().lastError).toContain("BOARD assets");
  });

  it("removes the generated entity when its placed copy is deleted", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-token",
      category: "TOKEN",
      name: "Marker.png",
      url: "blob:marker",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 1,
      placementWidth: 64,
      placementHeight: 64,
    });
    useBoardStore.getState().createAssetPlacement("asset-token", 0.3, 0.3);

    expect(useBoardStore.getState().entityState.entities).toHaveLength(1);

    useBoardStore.getState().deleteSelectedPlacement();

    expect(useBoardStore.getState().assetPlacements).toHaveLength(0);
    expect(useBoardStore.getState().entityState.entities).toHaveLength(0);
  });

  it("removes placed copies and entities when the source image asset is deleted", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-tile",
      category: "TILE",
      name: "Overlay.png",
      url: "blob:overlay",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 2,
      placementWidth: 128,
      placementHeight: 96,
    });
    useBoardStore.getState().createAssetPlacement("asset-tile", 0.2, 0.2);
    useBoardStore.getState().createAssetPlacement("asset-tile", 0.8, 0.8);

    expect(useBoardStore.getState().assetPlacements).toHaveLength(2);
    expect(useBoardStore.getState().entityState.entities).toHaveLength(2);

    useBoardStore.getState().removeAsset("asset-tile");

    expect(useBoardStore.getState().assets).toHaveLength(0);
    expect(useBoardStore.getState().assetPlacements).toHaveLength(0);
    expect(useBoardStore.getState().entityState.entities).toHaveLength(0);
  });
});
