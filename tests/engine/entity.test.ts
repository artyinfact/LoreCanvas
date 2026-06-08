import { describe, expect, it } from "vitest";
import {
  addLocation,
  createEmptyBoard,
  removeLocation,
} from "../../src/engine/board";
import {
  bindEntityToLocation,
  canBindCategoryToLocation,
  canPlaceAssetForCategory,
  clearLocationBindings,
  createEmptyEntityState,
  createEntity,
  EntityValidationError,
  getEntitiesAtLocation,
  RESOURCE_CATEGORY_DEFINITIONS,
  updateEntityState,
  unbindEntityFromLocation,
} from "../../src/engine/entity";

describe("F-02 generic entity system", () => {
  it("creates generic entities with arbitrary JSON state", () => {
    const entityState = createEntity(createEmptyEntityState(), {
      id: "entity-hero",
      type: "hero",
      state: {
        faction: "free-peoples",
        hp: 7,
        stealth: true,
      },
    });

    expect(entityState.entities[0]).toEqual({
      id: "entity-hero",
      type: "hero",
      state: {
        faction: "free-peoples",
        hp: 7,
        stealth: true,
      },
    });
  });

  it("merges arbitrary state patches without a fixed property whitelist", () => {
    const initial = createEntity(createEmptyEntityState(), {
      id: "entity-threat",
      type: "threat",
      state: {
        doom: 2,
      },
    });
    const updated = updateEntityState(initial, "entity-threat", {
      doom: 3,
      revealed: false,
      customPhase: "shadow",
    });

    expect(updated.entities[0]?.state).toEqual({
      doom: 3,
      revealed: false,
      customPhase: "shadow",
    });
  });

  it("binds and unbinds entities to graph locations by id", () => {
    const board = addLocation(createEmptyBoard(), {
      id: "loc-1",
      name: "Harbor",
      x: 0.25,
      y: 0.4,
    });
    const initial = createEntity(createEmptyEntityState(), {
      id: "pawn-1",
      type: "PAWN",
      state: {
        assetId: "asset-pawn",
      },
    });
    const bound = bindEntityToLocation(initial, board, "pawn-1", "loc-1");
    const unbound = unbindEntityFromLocation(bound, "pawn-1");

    expect(bound.entities[0]?.locationId).toBe("loc-1");
    expect(getEntitiesAtLocation(bound, "loc-1")).toHaveLength(1);
    expect(unbound.entities[0]).not.toHaveProperty("locationId");
  });

  it("rejects entity bindings to missing locations", () => {
    const entityState = createEntity(createEmptyEntityState(), {
      id: "pawn-1",
      type: "PAWN",
    });

    expect(() =>
      bindEntityToLocation(entityState, createEmptyBoard(), "pawn-1", "missing"),
    ).toThrow(EntityValidationError);
  });

  it("clears entity bindings when a location is removed from the board", () => {
    const board = addLocation(createEmptyBoard(), {
      id: "loc-1",
      x: 0.5,
      y: 0.5,
    });
    const bound = createEntity(createEmptyEntityState(), {
      id: "pawn-1",
      type: "PAWN",
      locationId: "loc-1",
    }, board);
    const nextBoard = removeLocation(board, "loc-1");
    const nextEntities = clearLocationBindings(bound, "loc-1");

    expect(nextBoard.locations).toHaveLength(0);
    expect(nextEntities.entities[0]).not.toHaveProperty("locationId");
  });

  it("defines the six LoreCanvas asset categories without pathing all assets", () => {
    expect(Object.keys(RESOURCE_CATEGORY_DEFINITIONS)).toEqual([
      "BOARD",
      "TILE",
      "PAWN",
      "TOKEN",
      "CARD",
      "OTHER",
    ]);
    expect(RESOURCE_CATEGORY_DEFINITIONS.BOARD.layer).toBe(0);
    expect(RESOURCE_CATEGORY_DEFINITIONS.TILE.layer).toBeLessThan(
      RESOURCE_CATEGORY_DEFINITIONS.PAWN.layer,
    );
    expect(RESOURCE_CATEGORY_DEFINITIONS.PAWN.canPath).toBe(true);
    expect(RESOURCE_CATEGORY_DEFINITIONS.TOKEN.canPath).toBe(false);
    expect(canPlaceAssetForCategory("BOARD")).toBe(false);
    expect(canPlaceAssetForCategory("PAWN")).toBe(true);
    expect(canBindCategoryToLocation("PAWN")).toBe(true);
    expect(canBindCategoryToLocation("CARD")).toBe(false);
  });
});
