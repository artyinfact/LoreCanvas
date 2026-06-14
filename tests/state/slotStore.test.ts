import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyCardDeckState } from "../../src/engine/cardDeck";
import { createEmptyDiceState } from "../../src/engine/dice";
import { createEmptyEntityState } from "../../src/engine/entity";
import { createEmptySlotState } from "../../src/engine/slot";
import { createEmptyStackState } from "../../src/engine/stack";
import { useBoardStore } from "../../src/state/boardStore";

describe("F-07 slot store integration", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates location-owned tile slots and syncs their visual placement", () => {
    seedAsset("asset-tile", "TILE", "Haven Stronghold.png", 88, 88);
    const locationId = useBoardStore.getState().createLocationAt(0.25, 0.35);

    expect(locationId).toBe("loc-1");

    const slotId = useBoardStore
      .getState()
      .createSlot("Haven slot", "location", "loc-1", 0.9, 0.9);

    expect(slotId).toBe("slot-1");

    useBoardStore.getState().assignAssetToSlot("slot-1", "asset-tile");

    let state = useBoardStore.getState();
    const slot = state.slotState.slots[0];
    const placement = state.assetPlacements[0];
    const entity = state.entityState.entities[0];

    expect(slot).toMatchObject({
      id: "slot-1",
      ownerType: "location",
      ownerId: "loc-1",
      assetId: "asset-tile",
      placementId: "tile-copy-1",
      x: 0.25,
      y: 0.35,
    });
    expect(placement).toMatchObject({
      id: "tile-copy-1",
      assetId: "asset-tile",
      category: "TILE",
      locationId: "loc-1",
      x: 0.25,
      y: 0.35,
      width: 88,
      height: 88,
    });
    expect(entity).toMatchObject({
      id: "entity-1",
      type: "TILE",
      locationId: "loc-1",
      state: {
        slotId: "slot-1",
        slotOwnerType: "location",
        slotOwnerId: "loc-1",
      },
    });

    useBoardStore.getState().moveLocation("loc-1", 0.7, 0.8);
    state = useBoardStore.getState();

    expect(state.slotState.slots[0]).toMatchObject({
      x: 0.7,
      y: 0.8,
    });
    expect(state.assetPlacements[0]).toMatchObject({
      locationId: "loc-1",
      x: 0.7,
      y: 0.8,
    });
  });

  it("moves slot assets, clears replaced visuals, and deletes location-owned slots", () => {
    seedAsset("asset-token", "TOKEN", "Hope.png", 40, 40);
    const locA = useBoardStore.getState().createLocationAt(0.2, 0.2);
    const locB = useBoardStore.getState().createLocationAt(0.8, 0.8);

    expect(locA).toBe("loc-1");
    expect(locB).toBe("loc-2");

    useBoardStore.getState().createSlot("A", "location", "loc-1");
    useBoardStore.getState().createSlot("B", "location", "loc-2");
    useBoardStore.getState().assignAssetToSlot("slot-1", "asset-token");
    useBoardStore.getState().moveSlotAsset("slot-1", "slot-2");

    let state = useBoardStore.getState();

    expect(state.slotState.slots[0]?.assetId).toBeUndefined();
    expect(state.slotState.slots[1]).toMatchObject({
      assetId: "asset-token",
      placementId: "token-copy-1",
    });
    expect(state.assetPlacements[0]).toMatchObject({
      id: "token-copy-1",
      locationId: "loc-2",
      x: 0.8,
      y: 0.8,
    });

    useBoardStore.getState().deleteLocation("loc-2");
    state = useBoardStore.getState();

    expect(state.slotState.slots.map((slot) => slot.id)).toEqual(["slot-1"]);
    expect(state.assetPlacements).toHaveLength(0);
    expect(state.entityState.entities).toHaveLength(0);
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
  category: "TILE" | "TOKEN",
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
