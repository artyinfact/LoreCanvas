import { describe, expect, it } from "vitest";
import {
  addDicePool,
  addDieDefinition,
  addDieToPool,
  createEmptyDiceState,
  overrideDiceRollResult,
  removeDiceReferencesByAssetId,
  rollDicePool,
} from "../../src/engine/dice";

describe("F-06 dice pools and roll state", () => {
  it("defines dice, rolls deterministic results, and overrides a selected face", () => {
    let state = seedDiceState();

    state = rollDicePool(state, {
      id: "roll-1",
      mode: "deterministic",
      poolId: "pool-search",
      random: () => 0.99,
      rolledAt: "2026-06-14T00:00:00.000Z",
    });

    expect(state.lastRollId).toBe("roll-1");
    expect(state.rollHistory[0]).toMatchObject({
      id: "roll-1",
      mode: "deterministic",
      poolId: "pool-search",
      results: [
        {
          dieId: "die-search",
          faceRefId: "face-6",
          faceId: "token/dice/search-die/face-06.png",
          isOverride: false,
        },
      ],
    });

    state = overrideDiceRollResult(
      state,
      "roll-1",
      "roll-1-result-1",
      "face-2",
    );

    expect(state.rollHistory[0]).toMatchObject({
      mode: "manual",
      results: [
        {
          faceRefId: "face-2",
          faceId: "token/dice/search-die/face-02.png",
          isOverride: true,
        },
      ],
    });
  });

  it("records explicit manual face choices for every die in an expanded pool", () => {
    let state = seedDiceState();

    state = addDieToPool(state, {
      id: "pool-die-combat",
      count: 2,
      dieId: "die-combat",
      poolId: "pool-search",
    });
    state = rollDicePool(state, {
      id: "roll-2",
      faceRefIds: ["face-1", "hit", "shield"],
      poolId: "pool-search",
      rolledAt: "2026-06-14T00:00:00.000Z",
    });

    expect(state.rollHistory[0]?.mode).toBe("manual");
    expect(state.rollHistory[0]?.results.map((result) => result.faceRefId)).toEqual([
      "face-1",
      "hit",
      "shield",
    ]);
    expect(
      state.rollHistory[0]?.results.every((result) => result.isOverride),
    ).toBe(true);
  });

  it("removes die definitions, pools, and roll results when a face asset is deleted", () => {
    let state = seedDiceState();

    state = rollDicePool(state, {
      id: "roll-1",
      poolId: "pool-search",
      random: () => 0,
      rolledAt: "2026-06-14T00:00:00.000Z",
    });
    state = removeDiceReferencesByAssetId(state, "asset-search-die");

    expect(state.definitions.map((definition) => definition.id)).toEqual([
      "die-combat",
    ]);
    expect(state.pools[0]?.dice).toEqual([]);
    expect(state.rollHistory).toEqual([]);
    expect(state.lastRollId).toBeUndefined();
  });
});

function seedDiceState() {
  let state = createEmptyDiceState();

  state = addDieDefinition(state, {
    id: "die-search",
    name: "Search Die",
    faces: Array.from({ length: 6 }, (_value, index) => ({
      id: `face-${index + 1}`,
      assetId: "asset-search-die",
      faceId: `token/dice/search-die/face-0${index + 1}.png`,
      label: `Search ${index + 1}`,
    })),
  });
  state = addDieDefinition(state, {
    id: "die-combat",
    name: "Combat Die",
    faces: [
      {
        id: "hit",
        assetId: "asset-combat-face-hit",
        label: "Hit",
      },
      {
        id: "shield",
        assetId: "asset-combat-face-shield",
        label: "Shield",
      },
    ],
  });
  state = addDicePool(state, {
    id: "pool-search",
    name: "Search Pool",
  });
  state = addDieToPool(state, {
    id: "pool-die-search",
    dieId: "die-search",
    poolId: "pool-search",
  });

  return state;
}
