import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyCardDeckState } from "../../src/engine/cardDeck";
import { createEmptyDiceState } from "../../src/engine/dice";
import { createEmptyEntityState } from "../../src/engine/entity";
import type { ResourceCategory } from "../../src/engine/entity";
import { createEmptySlotState } from "../../src/engine/slot";
import { createEmptyStackState } from "../../src/engine/stack";
import { useBoardStore } from "../../src/state/boardStore";

describe("F-08 pawn and token stack store integration", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates location stacks with a counted visual and removes them at zero", () => {
    seedAsset("asset-pawn", "PAWN", "Gondor Troop.png", 64, 64);
    const locationId = useBoardStore.getState().createLocationAt(0.33, 0.44);

    expect(locationId).toBe("loc-1");

    const stackId = useBoardStore
      .getState()
      .createPawnStack("asset-pawn", { type: "location", id: "loc-1" }, 5);

    expect(stackId).toBe("stack-1");

    let state = useBoardStore.getState();
    const stack = state.stackState.stacks[0];
    const placement = state.assetPlacements[0];
    const entity = state.entityState.entities[0];

    expect(stack).toMatchObject({
      id: "stack-1",
      assetId: "asset-pawn",
      category: "PAWN",
      count: 5,
      placementId: "pawn-copy-1",
      entityId: "entity-1",
      container: {
        type: "location",
        id: "loc-1",
      },
    });
    expect(placement).toMatchObject({
      id: "pawn-copy-1",
      locationId: "loc-1",
      x: 0.33,
      y: 0.44,
    });
    expect(entity).toMatchObject({
      id: "entity-1",
      locationId: "loc-1",
      state: {
        stackId: "stack-1",
        count: 5,
      },
    });
    expect(state.pawnSheets["pawn-copy-1"]).toEqual({
      heldCardAssetIds: [],
      counters: [],
    });

    useBoardStore.getState().adjustPawnStackCount("stack-1", 2);
    state = useBoardStore.getState();

    expect(state.stackState.stacks[0]?.count).toBe(7);
    expect(state.entityState.entities[0]?.state.count).toBe(7);

    useBoardStore.getState().adjustPawnStackCount("stack-1", -7);
    state = useBoardStore.getState();

    expect(state.stackState.stacks).toHaveLength(0);
    expect(state.assetPlacements).toHaveLength(0);
    expect(state.entityState.entities).toHaveLength(0);
    expect(state.pawnSheets).toEqual({});
  });

  it("moves part of a location stack into another location", () => {
    seedAsset("asset-token", "TOKEN", "Threat Token.png", 42, 42);
    useBoardStore.getState().createLocationAt(0.2, 0.2);
    useBoardStore.getState().createLocationAt(0.75, 0.65);
    useBoardStore
      .getState()
      .createPawnStack("asset-token", { type: "location", id: "loc-1" }, 6);

    const newStackId = useBoardStore
      .getState()
      .movePawnStack("stack-1", { type: "location", id: "loc-2" }, 2);

    const state = useBoardStore.getState();
    const source = state.stackState.stacks.find((stack) => stack.id === "stack-1");
    const moved = state.stackState.stacks.find((stack) => stack.id === newStackId);

    expect(newStackId).toBe("stack-2");
    expect(source).toMatchObject({
      count: 4,
      container: {
        type: "location",
        id: "loc-1",
      },
    });
    expect(moved).toMatchObject({
      count: 2,
      container: {
        type: "location",
        id: "loc-2",
      },
      placementId: "token-copy-2",
      entityId: "entity-2",
    });
    expect(state.assetPlacements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "token-copy-1",
          locationId: "loc-1",
          x: 0.2,
          y: 0.2,
        }),
        expect.objectContaining({
          id: "token-copy-2",
          locationId: "loc-2",
          x: 0.75,
          y: 0.65,
        }),
      ]),
    );
    expect(
      state.entityState.entities.find((entity) => entity.id === "entity-1")?.state
        .count,
    ).toBe(4);
    expect(
      state.entityState.entities.find((entity) => entity.id === "entity-2")?.state
        .count,
    ).toBe(2);
  });

  it("moves stacks between supply and map locations while recreating visuals", () => {
    seedAsset("asset-token", "TOKEN", "Hope Marker.png", 36, 36);
    useBoardStore.getState().createLocationAt(0.6, 0.3);
    const supplyId = useBoardStore.getState().createSupplyZone("Global Hope");

    expect(supplyId).toBe("supply-1");

    useBoardStore
      .getState()
      .createPawnStack("asset-token", { type: "supply", id: "supply-1" }, 8);

    expect(useBoardStore.getState().assetPlacements).toHaveLength(0);

    useBoardStore
      .getState()
      .movePawnStack("stack-1", { type: "location", id: "loc-1" }, 8);

    let state = useBoardStore.getState();

    expect(state.stackState.stacks[0]).toMatchObject({
      container: {
        type: "location",
        id: "loc-1",
      },
      placementId: "token-copy-1",
      entityId: "entity-1",
    });
    expect(state.assetPlacements[0]).toMatchObject({
      id: "token-copy-1",
      locationId: "loc-1",
      x: 0.6,
      y: 0.3,
    });

    useBoardStore
      .getState()
      .movePawnStack("stack-1", { type: "supply", id: "supply-1" }, 8);
    state = useBoardStore.getState();

    expect(state.stackState.stacks[0]?.placementId).toBeUndefined();
    expect(state.stackState.stacks[0]?.entityId).toBeUndefined();
    expect(state.assetPlacements).toHaveLength(0);
    expect(state.entityState.entities).toHaveLength(0);
  });

  it("merges matching stacks when moving into an occupied container", () => {
    seedAsset("asset-shadow", "TOKEN", "Shadow Troop.png", 40, 40);
    useBoardStore.getState().createLocationAt(0.1, 0.1);
    useBoardStore.getState().createLocationAt(0.9, 0.9);
    useBoardStore
      .getState()
      .createPawnStack("asset-shadow", { type: "location", id: "loc-1" }, 2);
    useBoardStore
      .getState()
      .createPawnStack("asset-shadow", { type: "location", id: "loc-2" }, 3);

    const mergedId = useBoardStore
      .getState()
      .movePawnStack("stack-1", { type: "location", id: "loc-2" }, 2);
    const state = useBoardStore.getState();

    expect(mergedId).toBe("stack-2");
    expect(state.stackState.stacks).toEqual([
      expect.objectContaining({
        id: "stack-2",
        count: 5,
        placementId: "token-copy-2",
      }),
    ]);
    expect(state.assetPlacements.map((placement) => placement.id)).toEqual([
      "token-copy-2",
    ]);
    expect(state.entityState.entities).toEqual([
      expect.objectContaining({
        id: "entity-2",
        state: expect.objectContaining({
          count: 5,
        }),
      }),
    ]);
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
    cardDeckState: createEmptyCardDeckState(),
    diceState: createEmptyDiceState(),
    slotState: createEmptySlotState(),
    stackState: createEmptyStackState(),
    boardState: {},
    locationStates: {},
    edgeStates: {},
    frozenSetup: null,
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
    isWorkbenchCollapsed: false,
    lastError: null,
  });
}

function seedAsset(
  id: string,
  category: Extract<ResourceCategory, "PAWN" | "TOKEN">,
  name: string,
  placementWidth: number,
  placementHeight: number,
) {
  useBoardStore.getState().addAsset({
    id,
    category,
    name,
    url: `asset://${id}.png`,
    mimeType: "image/png",
    size: 100,
    maxCopies: 99,
    placementWidth,
    placementHeight,
  });
}
