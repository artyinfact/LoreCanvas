import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyEntityState } from "../../src/engine/entity";
import { useBoardStore } from "../../src/state/boardStore";

describe("Maker asset templates and entity placement", () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: createEmptyBoard(),
      entityState: createEmptyEntityState(),
      assets: [],
      accessoryTemplates: [],
      templatePlacements: [],
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

  it("creates a categorized pawn template and a bound entity when placed on a location", () => {
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
    });
    useBoardStore.getState().createAccessoryTemplate("asset-pawn");
    const locationId = useBoardStore.getState().createLocationAt(0.4, 0.6);
    const templateId = useBoardStore.getState().accessoryTemplates[0]?.id;

    expect(templateId).toBe("pawn-1");
    expect(locationId).toBe("loc-1");

    const placementId = useBoardStore
      .getState()
      .createTemplatePlacement(templateId ?? "", 0.4, 0.6, locationId ?? "");
    const nextState = useBoardStore.getState();

    expect(placementId).toBe("pawn-1-copy-1");
    expect(nextState.templatePlacements[0]).toMatchObject({
      id: "pawn-1-copy-1",
      category: "PAWN",
      locationId: "loc-1",
      entityId: "entity-1",
    });
    expect(nextState.entityState.entities[0]).toMatchObject({
      id: "entity-1",
      type: "PAWN",
      locationId: "loc-1",
      state: {
        assetId: "asset-pawn",
        category: "PAWN",
        templateId: "pawn-1",
        placementId: "pawn-1-copy-1",
      },
    });
  });

  it("does not create graph templates for board or other assets", () => {
    const store = useBoardStore.getState();

    store.addAsset({
      id: "asset-board",
      category: "BOARD",
      name: "Map.png",
      url: "blob:map",
      mimeType: "image/png",
      size: 1000,
    });
    useBoardStore.getState().createAccessoryTemplate("asset-board");

    expect(useBoardStore.getState().accessoryTemplates).toHaveLength(0);
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
    });
    useBoardStore.getState().createAccessoryTemplate("asset-token");
    useBoardStore.getState().createTemplatePlacement("token-1", 0.3, 0.3);

    expect(useBoardStore.getState().entityState.entities).toHaveLength(1);

    useBoardStore.getState().deleteSelectedPlacement();

    expect(useBoardStore.getState().templatePlacements).toHaveLength(0);
    expect(useBoardStore.getState().entityState.entities).toHaveLength(0);
  });
});
