import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyEntityState } from "../../src/engine/entity";
import {
  exportBoardStoreScenario,
  importBoardStoreScenario,
} from "../../src/state/scenarioStore";
import { useBoardStore } from "../../src/state/boardStore";

describe("F-04 Edit/Run mode state boundary", () => {
  beforeEach(() => {
    resetStore();
    seedEditableScenario();
  });

  it("edits Board/Object/Location/Edge state surfaces and serializes them", () => {
    const store = useBoardStore.getState();

    store.updateBoardState({
      hope: 7,
      danger: 2,
      eventDeck: {
        zoneId: "loc-event-deck",
        count: 42,
      },
    });
    store.updateLocationState("loc-a", {
      region: "north",
      canRecruit: true,
      tile: "haven",
    });
    store.updateEdgeState("edge-a-b", {
      directed: false,
      cost: 2,
    });
    store.updateEntityObjectState("entity-pawn", {
      count: 3,
      sheet: {
        role: "chara",
      },
    });

    const restored = importBoardStoreScenario(
      exportBoardStoreScenario(useBoardStore.getState(), {
        title: "Edit state surfaces",
      }),
    );

    expect(restored.mode).toBe("edit");
    expect(restored.boardState).toMatchObject({
      hope: 7,
      danger: 2,
      eventDeck: {
        zoneId: "loc-event-deck",
        count: 42,
      },
    });
    expect(restored.locationStates["loc-a"]).toMatchObject({
      region: "north",
      canRecruit: true,
      tile: "haven",
    });
    expect(restored.edgeStates["edge-a-b"]).toMatchObject({
      directed: false,
      cost: 2,
    });
    expect(
      restored.entityState.entities.find((entity) => entity.id === "entity-pawn")
        ?.state,
    ).toMatchObject({
      count: 3,
      sheet: {
        role: "chara",
      },
    });
  });

  it("freezes setup when entering Run mode and blocks structural setup edits", () => {
    useBoardStore.getState().enterRunMode();

    const runStore = useBoardStore.getState();

    expect(runStore.mode).toBe("run");
    expect(runStore.frozenSetup?.board.locations).toHaveLength(2);
    expect(runStore.createLocationAt(0.8, 0.8)).toBeNull();

    useBoardStore.getState().selectLocation("loc-a");
    useBoardStore.getState().updateSelectedLocationName("Edited In Run");
    useBoardStore.getState().deleteEdge("edge-a-b");
    useBoardStore.getState().createAssetPlacement("asset-pawn", 0.4, 0.4, "loc-a");

    const nextStore = useBoardStore.getState();

    expect(nextStore.board.locations).toHaveLength(2);
    expect(nextStore.board.locations.find((location) => location.id === "loc-a")?.name)
      .toBe("Location A");
    expect(nextStore.board.edges).toHaveLength(1);
    expect(nextStore.assetPlacements).toHaveLength(2);
    expect(nextStore.lastError).toContain("Run mode freezes");
    expect(nextStore.frozenSetup?.board.locations[0]?.name).toBe("Location A");
  });

  it("allows semantic runtime changes without mutating frozen setup", () => {
    useBoardStore.getState().updateEntityObjectState("entity-pawn", {
      count: 2,
    });
    useBoardStore.getState().enterRunMode();

    useBoardStore.getState().moveEntityToLocation("entity-pawn", "loc-b");
    useBoardStore.getState().adjustEntityCounter("entity-pawn", "count", 2);
    useBoardStore.getState().moveCardToZone("entity-card", "loc-discard");

    const runStore = useBoardStore.getState();
    const runtimePawn = runStore.entityState.entities.find(
      (entity) => entity.id === "entity-pawn",
    );
    const setupPawn = runStore.frozenSetup?.entityState.entities.find(
      (entity) => entity.id === "entity-pawn",
    );

    expect(runtimePawn?.locationId).toBe("loc-b");
    expect(runtimePawn?.state.count).toBe(4);
    expect(
      runStore.assetPlacements.find((placement) => placement.entityId === "entity-pawn"),
    ).toMatchObject({
      locationId: "loc-b",
      x: 0.72,
      y: 0.62,
    });
    expect(
      runStore.entityState.entities.find((entity) => entity.id === "entity-card")
        ?.state.zoneId,
    ).toBe("loc-discard");
    expect(setupPawn?.locationId).toBe("loc-a");
    expect(setupPawn?.state.count).toBe(2);
  });
});

function resetStore() {
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
}

function seedEditableScenario() {
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
        id: "asset-pawn",
        category: "PAWN",
        name: "Pawn.png",
        url: "asset://pawn.png",
        mimeType: "image/png",
        size: 100,
        maxCopies: 2,
        placementWidth: 64,
        placementHeight: 64,
      },
      {
        id: "asset-card",
        category: "CARD",
        name: "Card.png",
        url: "asset://card.png",
        mimeType: "image/png",
        size: 100,
        maxCopies: 20,
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
          id: "loc-a",
          name: "Location A",
          x: 0.28,
          y: 0.34,
        },
        {
          id: "loc-b",
          name: "Location B",
          x: 0.72,
          y: 0.62,
        },
      ],
      edges: [
        {
          id: "edge-a-b",
          fromId: "loc-a",
          toId: "loc-b",
          label: "road",
        },
      ],
    },
    assetPlacements: [
      {
        id: "pawn-copy-1",
        assetId: "asset-pawn",
        category: "PAWN",
        entityId: "entity-pawn",
        locationId: "loc-a",
        x: 0.28,
        y: 0.34,
        width: 64,
        height: 64,
      },
      {
        id: "card-copy-1",
        assetId: "asset-card",
        category: "CARD",
        entityId: "entity-card",
        x: 0.1,
        y: 0.1,
        width: 64,
        height: 90,
      },
    ],
    entityState: {
      entities: [
        {
          id: "entity-pawn",
          type: "PAWN",
          locationId: "loc-a",
          state: {
            assetId: "asset-pawn",
            placementId: "pawn-copy-1",
            role: "troopStack",
            count: 1,
          },
        },
        {
          id: "entity-card",
          type: "CARD",
          state: {
            assetId: "asset-card",
            placementId: "card-copy-1",
            zoneId: "loc-deck",
          },
        },
      ],
    },
    pawnSheets: {
      "pawn-copy-1": {
        heldCardAssetIds: [],
        counters: [],
      },
    },
  });
}
