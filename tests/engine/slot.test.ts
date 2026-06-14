import { describe, expect, it } from "vitest";
import {
  addSlot,
  assignSlotAsset,
  clearSlotAsset,
  createEmptySlotState,
  moveSlotAsset,
  removeSlotAssetsByAssetId,
  removeSlotsByOwner,
  SlotError,
} from "../../src/engine/slot";

describe("F-07 slot engine", () => {
  it("assigns, moves, and clears tile or token assets across board slots", () => {
    let state = createEmptySlotState();

    state = addSlot(state, {
      id: "slot-haven",
      name: "Haven marker",
      ownerType: "location",
      ownerId: "loc-haven",
      x: 0.25,
      y: 0.4,
    });
    state = addSlot(state, {
      id: "slot-track",
      name: "Threat track",
      ownerType: "track",
      ownerId: "threat",
      x: 0.5,
      y: 0.05,
    });
    state = assignSlotAsset(
      state,
      "slot-haven",
      "asset-haven-tile",
      "tile-copy-1",
    );
    state = moveSlotAsset(state, "slot-haven", "slot-track");

    expect(state.slots[0]?.id).toBe("slot-haven");
    expect(state.slots[0]?.assetId).toBeUndefined();
    expect(state.slots[0]?.placementId).toBeUndefined();
    expect(state.slots[1]).toEqual(
      expect.objectContaining({
        id: "slot-track",
        assetId: "asset-haven-tile",
        placementId: "tile-copy-1",
      }),
    );

    state = clearSlotAsset(state, "slot-track");

    expect(state.slots[1]).toMatchObject({
      id: "slot-track",
      ownerType: "track",
      ownerId: "threat",
    });
    expect(state.slots[1]?.assetId).toBeUndefined();
    expect(state.slots[1]?.placementId).toBeUndefined();
  });

  it("removes slot-owned asset refs without deleting the slot definition", () => {
    let state = createEmptySlotState();

    state = addSlot(state, {
      id: "slot-hope",
      name: "Hope marker",
      ownerType: "display",
      ownerId: "global",
      x: 0.1,
      y: 0.1,
    });
    state = assignSlotAsset(state, "slot-hope", "asset-hope", "token-copy-1");
    state = removeSlotAssetsByAssetId(state, "asset-hope");

    expect(state.slots[0]?.id).toBe("slot-hope");
    expect(state.slots[0]?.assetId).toBeUndefined();
    expect(state.slots[0]?.placementId).toBeUndefined();
  });

  it("removes location-owned slots as a group", () => {
    const state = removeSlotsByOwner(
      {
        slots: [
          {
            id: "slot-a",
            name: "A",
            ownerType: "location",
            ownerId: "loc-a",
            x: 0.1,
            y: 0.2,
            state: {},
          },
          {
            id: "slot-b",
            name: "B",
            ownerType: "location",
            ownerId: "loc-b",
            x: 0.3,
            y: 0.4,
            state: {},
          },
        ],
      },
      "location",
      "loc-a",
    );

    expect(state.slots.map((slot) => slot.id)).toEqual(["slot-b"]);
  });

  it("rejects malformed slot definitions", () => {
    expect(() =>
      addSlot(createEmptySlotState(), {
        id: "slot-bad",
        name: "Bad",
        ownerType: "display",
        ownerId: "global",
        x: -0.1,
        y: 0.5,
      }),
    ).toThrow(SlotError);
  });
});
