import { beforeEach, describe, expect, it, vi } from "vitest";
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
    expect(nextState.pawnSheets["pawn-copy-1"]).toEqual({
      heldCardAssetIds: [],
      counters: [],
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

  it("adds imported image assets in one batch and ignores duplicate ids", () => {
    const store = useBoardStore.getState();

    store.addAssets([
      {
        id: "asset-board",
        category: "BOARD",
        name: "Board.png",
        url: "blob:board",
        mimeType: "image/png",
        size: 1000,
        maxCopies: 1,
        placementWidth: 64,
        placementHeight: 64,
      },
      {
        id: "asset-token",
        category: "TOKEN",
        name: "Token.png",
        url: "blob:token",
        mimeType: "image/png",
        size: 1000,
        maxCopies: 999,
        placementWidth: 64,
        placementHeight: 64,
      },
      {
        id: "asset-token",
        category: "TOKEN",
        name: "Duplicate Token.png",
        url: "blob:duplicate",
        mimeType: "image/png",
        size: 1000,
        maxCopies: 999,
        placementWidth: 64,
        placementHeight: 64,
      },
    ]);

    const nextState = useBoardStore.getState();

    expect(nextState.assets.map((asset) => asset.id)).toEqual([
      "asset-board",
      "asset-token",
    ]);
    expect(nextState.selectedAssetId).toBe("asset-token");
  });

  it("applies background media patches in one batch and syncs the board background", () => {
    const store = useBoardStore.getState();

    store.addAssets([
      {
        id: "asset-board",
        category: "BOARD",
        name: "Board.png",
        url: "blob:board",
        mimeType: "image/png",
        size: 1000,
        maxCopies: 1,
        placementWidth: 64,
        placementHeight: 64,
      },
      {
        id: "asset-card",
        category: "CARD",
        name: "Card.png",
        url: "blob:card",
        mimeType: "image/png",
        size: 1000,
        maxCopies: 1,
        placementWidth: 64,
        placementHeight: 64,
      },
    ]);
    useBoardStore.getState().setBackgroundAsset("asset-board");

    expect(useBoardStore.getState().board.background?.width).toBeUndefined();

    useBoardStore.getState().applyAssetMediaPatches([
      {
        assetId: "asset-board",
        width: 4000,
        height: 3000,
        thumbnailUrl: "blob:board-thumb",
      },
      {
        assetId: "asset-card",
        width: 600,
        height: 800,
        thumbnailUrl: "blob:card-thumb",
      },
    ]);

    const nextState = useBoardStore.getState();
    const boardAsset = nextState.assets.find((asset) => asset.id === "asset-board");
    const cardAsset = nextState.assets.find((asset) => asset.id === "asset-card");

    expect(boardAsset).toMatchObject({
      width: 4000,
      height: 3000,
      thumbnailUrl: "blob:board-thumb",
    });
    expect(cardAsset).toMatchObject({
      width: 600,
      height: 800,
      thumbnailUrl: "blob:card-thumb",
    });
    expect(nextState.board.background).toMatchObject({
      assetId: "asset-board",
      width: 4000,
      height: 3000,
    });
  });

  it("revokes thumbnails for media patches whose asset was already deleted", () => {
    const revokeSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-kept",
      category: "TOKEN",
      name: "Kept.png",
      url: "blob:kept",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 999,
      placementWidth: 64,
      placementHeight: 64,
    });

    useBoardStore.getState().applyAssetMediaPatches([
      { assetId: "asset-kept", thumbnailUrl: "blob:kept-thumb" },
      { assetId: "asset-deleted", thumbnailUrl: "blob:orphan-thumb" },
    ]);

    expect(revokeSpy).toHaveBeenCalledWith("blob:orphan-thumb");
    expect(
      useBoardStore.getState().assets.find((asset) => asset.id === "asset-kept")
        ?.thumbnailUrl,
    ).toBe("blob:kept-thumb");

    useBoardStore.getState().removeAsset("asset-kept");

    expect(revokeSpy).toHaveBeenCalledWith("blob:kept");
    expect(revokeSpy).toHaveBeenCalledWith("blob:kept-thumb");

    revokeSpy.mockRestore();
  });

  it("revokes the previous thumbnail when a media patch replaces it", () => {
    const revokeSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-token",
      category: "TOKEN",
      name: "Marker.png",
      url: "blob:marker",
      mimeType: "image/png",
      size: 1000,
      thumbnailUrl: "blob:old-thumb",
      maxCopies: 999,
      placementWidth: 64,
      placementHeight: 64,
    });

    useBoardStore.getState().applyAssetMediaPatches([
      { assetId: "asset-token", thumbnailUrl: "blob:new-thumb" },
    ]);

    expect(revokeSpy).toHaveBeenCalledWith("blob:old-thumb");
    expect(useBoardStore.getState().assets[0]?.thumbnailUrl).toBe(
      "blob:new-thumb",
    );

    revokeSpy.mockRestore();
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

  it("clears existing placements and entities when a placed asset becomes the board background", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-tile",
      category: "TILE",
      name: "Map overlay.png",
      url: "blob:map-overlay",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 1,
      placementWidth: 128,
      placementHeight: 96,
    });
    useBoardStore.getState().createAssetPlacement("asset-tile", 0.2, 0.2);

    expect(useBoardStore.getState().assetPlacements).toHaveLength(1);
    expect(useBoardStore.getState().entityState.entities).toHaveLength(1);

    useBoardStore.getState().setBackgroundAsset("asset-tile");

    const nextState = useBoardStore.getState();

    expect(nextState.board.background?.assetId).toBe("asset-tile");
    expect(nextState.assets.find((asset) => asset.id === "asset-tile")).toMatchObject({
      category: "BOARD",
    });
    expect(nextState.assetPlacements).toHaveLength(0);
    expect(nextState.entityState.entities).toHaveLength(0);
    expect(nextState.selectedPlacementId).toBeNull();
  });

  it("updates and deletes locations by id for the workbench table", () => {
    const store = useBoardStore.getState();

    const firstLocationId = store.createLocationAt(0.2, 0.3);
    const secondLocationId = useBoardStore.getState().createLocationAt(0.6, 0.7);

    expect(firstLocationId).toBe("loc-1");
    expect(secondLocationId).toBe("loc-2");

    useBoardStore.getState().updateLocationDetails("loc-1", {
      name: "Haven",
      x: 0.25,
      y: 0.35,
      notes: "Recruitment point",
    });
    useBoardStore.getState().updateLocationState("loc-1", {
      region: "north",
    });
    useBoardStore.getState().startOrCompleteEdge("loc-1");
    useBoardStore.getState().startOrCompleteEdge("loc-2");

    let nextState = useBoardStore.getState();

    expect(nextState.board.locations[0]).toMatchObject({
      id: "loc-1",
      name: "Haven",
      x: 0.25,
      y: 0.35,
      notes: "Recruitment point",
    });
    expect(nextState.locationStates["loc-1"]).toMatchObject({
      region: "north",
    });
    expect(nextState.board.edges).toHaveLength(1);

    useBoardStore.getState().deleteLocation("loc-1");
    nextState = useBoardStore.getState();

    expect(nextState.board.locations.map((location) => location.id)).toEqual([
      "loc-2",
    ]);
    expect(nextState.board.edges).toHaveLength(0);
    expect(nextState.locationStates["loc-1"]).toBeUndefined();
    expect(nextState.selectedLocationId).toBeNull();
    expect(nextState.selectedEdgeId).toBeNull();
  });

  it("updates and deletes edges by id for the workbench table", () => {
    const store = useBoardStore.getState();

    store.createLocationAt(0.2, 0.3);
    useBoardStore.getState().createLocationAt(0.6, 0.7);
    useBoardStore.getState().startOrCompleteEdge("loc-1");
    useBoardStore.getState().startOrCompleteEdge("loc-2");
    useBoardStore.getState().updateEdgeDetails("edge-1", {
      label: "Hidden road",
      fromId: "loc-2",
      toId: "loc-1",
    });
    useBoardStore.getState().updateEdgeState("edge-1", {
      cost: 2,
      locked: true,
    });

    let nextState = useBoardStore.getState();

    expect(nextState.board.edges[0]).toMatchObject({
      id: "edge-1",
      fromId: "loc-2",
      toId: "loc-1",
      label: "Hidden road",
    });
    expect(nextState.edgeStates["edge-1"]).toMatchObject({
      cost: 2,
      locked: true,
    });

    useBoardStore.getState().deleteEdgeById("edge-1");
    nextState = useBoardStore.getState();

    expect(nextState.board.edges).toHaveLength(0);
    expect(nextState.edgeStates["edge-1"]).toBeUndefined();
  });

  it("selects and deletes an edge directly from the map selection state", () => {
    const store = useBoardStore.getState();

    store.createLocationAt(0.2, 0.3);
    useBoardStore.getState().createLocationAt(0.6, 0.7);
    useBoardStore.getState().startOrCompleteEdge("loc-1");
    useBoardStore.getState().startOrCompleteEdge("loc-2");

    let nextState = useBoardStore.getState();

    expect(nextState.selectedEdgeId).toBe("edge-1");
    expect(nextState.selectedLocationId).toBeNull();

    useBoardStore.getState().selectEdge("edge-1");
    useBoardStore.getState().deleteEdgeById("edge-1");
    nextState = useBoardStore.getState();

    expect(nextState.board.edges).toHaveLength(0);
    expect(nextState.selectedEdgeId).toBeNull();
  });

  it("clears selected connected edge state when deleting a location", () => {
    const store = useBoardStore.getState();

    store.createLocationAt(0.2, 0.3);
    useBoardStore.getState().createLocationAt(0.6, 0.7);
    useBoardStore.getState().startOrCompleteEdge("loc-1");
    useBoardStore.getState().startOrCompleteEdge("loc-2");
    useBoardStore.getState().updateEdgeState("edge-1", { cost: 3 });
    useBoardStore.getState().selectEdge("edge-1");
    useBoardStore.getState().deleteLocation("loc-1");

    const nextState = useBoardStore.getState();

    expect(nextState.board.edges).toHaveLength(0);
    expect(nextState.selectedEdgeId).toBeNull();
    expect(nextState.edgeStates["edge-1"]).toBeUndefined();
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

  it("configures a bound pawn with one character card and held cards", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-pawn",
      category: "PAWN",
      name: "Hero.png",
      url: "blob:hero",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 1,
      placementWidth: 64,
      placementHeight: 64,
    });
    store.addAsset({
      id: "asset-card",
      category: "CARD",
      name: "Ally.png",
      url: "blob:ally",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 2,
      placementWidth: 64,
      placementHeight: 90,
    });
    const locationId = useBoardStore.getState().createLocationAt(0.2, 0.2);
    const pawnId = useBoardStore
      .getState()
      .createAssetPlacement("asset-pawn", 0.2, 0.2, locationId ?? "");

    expect(pawnId).toBe("pawn-copy-1");

    useBoardStore.getState().setPawnCharacterCard("pawn-copy-1", "asset-card");
    useBoardStore.getState().addPawnHeldCard("pawn-copy-1", "asset-card");
    useBoardStore.getState().addPawnHeldCard("pawn-copy-1", "asset-card");

    const nextState = useBoardStore.getState();

    expect(nextState.pawnSheets["pawn-copy-1"]).toMatchObject({
      characterCardAssetId: "asset-card",
      heldCardAssetIds: ["asset-card"],
    });
    expect(nextState.lastError).toContain("2 copy limit");
  });

  it("counts pawn token assets and allows default token assets to behave as unlimited", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-pawn",
      category: "PAWN",
      name: "Hero.png",
      url: "blob:hero",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 1,
      placementWidth: 64,
      placementHeight: 64,
    });
    store.addAsset({
      id: "asset-token",
      category: "OTHER",
      name: "Damage.png",
      url: "blob:damage",
      mimeType: "image/png",
      size: 1000,
      maxCopies: 1,
      placementWidth: 32,
      placementHeight: 32,
    });
    useBoardStore.getState().updateAssetCategory("asset-token", "TOKEN");
    const locationId = useBoardStore.getState().createLocationAt(0.2, 0.2);
    useBoardStore
      .getState()
      .createAssetPlacement("asset-pawn", 0.2, 0.2, locationId ?? "");

    useBoardStore.getState().adjustPawnCounter("pawn-copy-1", "asset-token", 1);
    useBoardStore.getState().adjustPawnCounter("pawn-copy-1", "asset-token", 1);
    useBoardStore.getState().adjustPawnCounter("pawn-copy-1", "asset-token", -3);

    const nextState = useBoardStore.getState();

    expect(
      nextState.assets.find((asset) => asset.id === "asset-token")?.maxCopies,
    ).toBe(999);
    expect(nextState.pawnSheets["pawn-copy-1"]?.counters).toEqual([
      {
        assetId: "asset-token",
        count: 0,
      },
    ]);
  });
});
