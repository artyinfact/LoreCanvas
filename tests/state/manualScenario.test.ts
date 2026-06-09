import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyEntityState } from "../../src/engine/entity";
import {
  applyScenarioPackageToBoardStore,
  exportBoardStoreScenario,
} from "../../src/state/scenarioStore";
import { useBoardStore } from "../../src/state/boardStore";

describe("F-04 manual scenario runtime flow", () => {
  beforeEach(() => {
    useBoardStore.setState({
      mode: "edit",
      board: createEmptyBoard(),
      entityState: createEmptyEntityState(),
      assets: [],
      assetPlacements: [],
      pawnSheets: {},
      boardState: {},
      locationStates: {},
      edgeStates: {},
      frozenSetup: null,
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

  it("round-trips edit setup, run-time semantic changes, and setup restoration", () => {
    seedManualScenario();
    useBoardStore.getState().updateBoardState({
      hope: 4,
      threatRate: 2,
    });
    useBoardStore.getState().updateLocationState("loc-haven", {
      region: "eriador",
      canRecruit: true,
      tile: "haven",
    });
    useBoardStore.getState().updateEdgeState("edge-haven-road", {
      directed: true,
      cost: 1,
    });
    useBoardStore.getState().updateEntityObjectState("entity-hero", {
      count: 1,
      actionPoints: 2,
    });

    useBoardStore.getState().enterRunMode();
    useBoardStore.getState().moveEntityToLocation("entity-hero", "loc-road");
    useBoardStore.getState().adjustEntityCounter("entity-hero", "actionPoints", -1);
    useBoardStore.getState().moveCardToZone("entity-event-card", "discard-zone");

    const savedRuntime = exportBoardStoreScenario(useBoardStore.getState(), {
      title: "Manual run save",
    });

    useBoardStore.setState({
      mode: "edit",
      board: createEmptyBoard(),
      entityState: createEmptyEntityState(),
      assets: [],
      assetPlacements: [],
      pawnSheets: {},
      boardState: {},
      locationStates: {},
      edgeStates: {},
      frozenSetup: null,
      selectedAssetId: null,
      selectedLocationId: null,
      selectedPlacementId: null,
      edgeDraftFromId: null,
      activeTool: "select",
      boardZoom: 1,
      boardPan: { x: 0, y: 0 },
      lastError: null,
    });
    applyScenarioPackageToBoardStore(savedRuntime);

    const restoredRuntime = useBoardStore.getState();
    const restoredHero = restoredRuntime.entityState.entities.find(
      (entity) => entity.id === "entity-hero",
    );

    expect(restoredRuntime.mode).toBe("run");
    expect(restoredRuntime.boardState).toMatchObject({
      hope: 4,
      threatRate: 2,
    });
    expect(restoredRuntime.locationStates["loc-haven"]).toMatchObject({
      canRecruit: true,
      tile: "haven",
    });
    expect(restoredRuntime.edgeStates["edge-haven-road"]).toMatchObject({
      directed: true,
      cost: 1,
    });
    expect(restoredHero?.locationId).toBe("loc-road");
    expect(restoredHero?.state.actionPoints).toBe(1);
    expect(
      restoredRuntime.entityState.entities.find(
        (entity) => entity.id === "entity-event-card",
      )?.state.zoneId,
    ).toBe("discard-zone");
    expect(
      restoredRuntime.frozenSetup?.entityState.entities.find(
        (entity) => entity.id === "entity-hero",
      )?.locationId,
    ).toBe("loc-haven");

    useBoardStore.getState().returnToEditMode();

    const restoredEdit = useBoardStore.getState();

    expect(restoredEdit.mode).toBe("edit");
    expect(
      restoredEdit.entityState.entities.find((entity) => entity.id === "entity-hero")
        ?.locationId,
    ).toBe("loc-haven");
    expect(
      restoredEdit.entityState.entities.find((entity) => entity.id === "entity-hero")
        ?.state.actionPoints,
    ).toBe(2);
  });
});

function seedManualScenario() {
  useBoardStore.setState({
    assets: [
      {
        id: "asset-board",
        category: "BOARD",
        name: "Board.png",
        url: "asset://board.png",
        mimeType: "image/png",
        size: 100,
        maxCopies: 1,
        placementWidth: 64,
        placementHeight: 64,
      },
      {
        id: "asset-hero",
        category: "PAWN",
        name: "Hero.png",
        url: "asset://hero.png",
        mimeType: "image/png",
        size: 100,
        maxCopies: 1,
        placementWidth: 64,
        placementHeight: 64,
      },
      {
        id: "asset-event-card",
        category: "CARD",
        name: "Event.png",
        url: "asset://event.png",
        mimeType: "image/png",
        size: 100,
        maxCopies: 1,
        placementWidth: 64,
        placementHeight: 90,
      },
    ],
    board: {
      background: {
        assetId: "asset-board",
        name: "Board.png",
        url: "asset://board.png",
        mimeType: "image/png",
      },
      locations: [
        {
          id: "loc-haven",
          name: "Haven",
          x: 0.25,
          y: 0.4,
        },
        {
          id: "loc-road",
          name: "Road",
          x: 0.62,
          y: 0.48,
        },
      ],
      edges: [
        {
          id: "edge-haven-road",
          fromId: "loc-haven",
          toId: "loc-road",
        },
      ],
    },
    assetPlacements: [
      {
        id: "hero-copy-1",
        assetId: "asset-hero",
        category: "PAWN",
        entityId: "entity-hero",
        locationId: "loc-haven",
        x: 0.25,
        y: 0.4,
        width: 64,
        height: 64,
      },
      {
        id: "event-copy-1",
        assetId: "asset-event-card",
        category: "CARD",
        entityId: "entity-event-card",
        x: 0.1,
        y: 0.1,
        width: 64,
        height: 90,
      },
    ],
    entityState: {
      entities: [
        {
          id: "entity-hero",
          type: "PAWN",
          locationId: "loc-haven",
          state: {
            assetId: "asset-hero",
            placementId: "hero-copy-1",
          },
        },
        {
          id: "entity-event-card",
          type: "CARD",
          state: {
            assetId: "asset-event-card",
            placementId: "event-copy-1",
            zoneId: "event-zone",
          },
        },
      ],
    },
    pawnSheets: {
      "hero-copy-1": {
        heldCardAssetIds: [],
        counters: [],
      },
    },
  });
}
