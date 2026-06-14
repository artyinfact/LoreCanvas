import { describe, expect, it } from "vitest";
import {
  addPawnStack,
  addSupplyZone,
  adjustPawnStackCount,
  createEmptyStackState,
  findMatchingStack,
  mergePawnStacks,
  movePawnStack,
  splitPawnStack,
  StackError,
} from "../../src/engine/stack";

describe("F-08 stack engine", () => {
  it("creates location and supply stacks for pawns and tokens", () => {
    let state = createEmptyStackState();

    state = addSupplyZone(state, {
      id: "supply-global",
      name: "Global Supply",
    });
    state = addPawnStack(state, {
      id: "stack-rohan",
      name: "Rohan troops",
      assetId: "asset-rohan",
      category: "PAWN",
      container: {
        type: "location",
        id: "loc-rohan",
      },
      count: 4,
      placementId: "pawn-copy-1",
      entityId: "entity-1",
    });
    state = addPawnStack(state, {
      id: "stack-threat",
      name: "Threat",
      assetId: "asset-threat",
      category: "TOKEN",
      container: {
        type: "supply",
        id: "supply-global",
      },
      count: 7,
    });

    expect(state.supplyZones).toHaveLength(1);
    expect(state.stacks).toEqual([
      expect.objectContaining({
        id: "stack-rohan",
        category: "PAWN",
        count: 4,
      }),
      expect.objectContaining({
        id: "stack-threat",
        category: "TOKEN",
        count: 7,
      }),
    ]);
  });

  it("splits part of a stack into a new container", () => {
    let state = createEmptyStackState();

    state = addSupplyZone(state, {
      id: "supply-muster",
      name: "Muster",
    });
    state = addPawnStack(state, {
      id: "stack-gondor",
      assetId: "asset-gondor",
      category: "PAWN",
      container: {
        type: "location",
        id: "loc-gondor",
      },
      count: 5,
    });
    state = splitPawnStack(state, {
      sourceStackId: "stack-gondor",
      newStackId: "stack-gondor-reserve",
      count: 2,
      target: {
        type: "supply",
        id: "supply-muster",
      },
    });

    expect(state.stacks).toEqual([
      expect.objectContaining({
        id: "stack-gondor",
        count: 3,
        container: {
          type: "location",
          id: "loc-gondor",
        },
      }),
      expect.objectContaining({
        id: "stack-gondor-reserve",
        count: 2,
        container: {
          type: "supply",
          id: "supply-muster",
        },
      }),
    ]);
  });

  it("merges matching stacks and removes a stack at count zero", () => {
    let state = createEmptyStackState();

    state = addPawnStack(state, {
      id: "stack-a",
      assetId: "asset-shadow",
      category: "TOKEN",
      container: {
        type: "location",
        id: "loc-a",
      },
      count: 2,
    });
    state = addPawnStack(state, {
      id: "stack-b",
      assetId: "asset-shadow",
      category: "TOKEN",
      container: {
        type: "location",
        id: "loc-b",
      },
      count: 4,
    });

    expect(
      findMatchingStack(state, "asset-shadow", "TOKEN", {
        type: "location",
        id: "loc-b",
      })?.id,
    ).toBe("stack-b");

    state = mergePawnStacks(state, {
      sourceStackId: "stack-a",
      targetStackId: "stack-b",
      count: 2,
    });

    expect(state.stacks.map((stack) => stack.id)).toEqual(["stack-b"]);
    expect(state.stacks[0]?.count).toBe(6);

    state = adjustPawnStackCount(state, "stack-b", -6);

    expect(state.stacks).toHaveLength(0);
  });

  it("validates positive counts and supply containers", () => {
    expect(() =>
      addPawnStack(createEmptyStackState(), {
        id: "stack-bad",
        assetId: "asset",
        category: "TOKEN",
        container: {
          type: "supply",
          id: "missing",
        },
        count: 1,
      }),
    ).toThrow(StackError);

    expect(() =>
      movePawnStack(
        {
          supplyZones: [],
          stacks: [
            {
              id: "stack-a",
              name: "A",
              assetId: "asset",
              category: "PAWN",
              container: {
                type: "location",
                id: "loc-a",
              },
              count: 1,
              state: {},
            },
          ],
        },
        "stack-a",
        {
          type: "supply",
          id: "missing",
        },
      ),
    ).toThrow(StackError);
  });
});
