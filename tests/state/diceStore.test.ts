import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyCardDeckState } from "../../src/engine/cardDeck";
import { createEmptyDiceState } from "../../src/engine/dice";
import { createEmptyEntityState } from "../../src/engine/entity";
import {
  exportBoardStoreScenario,
  importBoardStoreScenario,
} from "../../src/state/scenarioStore";
import { useBoardStore } from "../../src/state/boardStore";

describe("F-06 dice store and scenario boundary", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates dice from TOKEN face metadata, rolls a pool, overrides a face, and serializes state", () => {
    seedDieAsset();

    const dieId = useBoardStore
      .getState()
      .createDieDefinitionFromAsset("asset-search-die");
    const poolId = useBoardStore.getState().createDicePool("Search Pool");

    expect(dieId).toBe("die-1");
    expect(poolId).toBe("pool-1");

    const poolDieId = useBoardStore
      .getState()
      .addDieToDicePool("pool-1", "die-1", 2);

    expect(poolDieId).toBe("pool-die-1");

    const rollId = useBoardStore
      .getState()
      .rollDicePool("pool-1", ["face-01", "face-02"]);

    expect(rollId).toBe("roll-1");

    const resultId = useBoardStore.getState().diceState.rollHistory[0]?.results[0]?.id;

    expect(resultId).toBe("roll-1-result-1");

    useBoardStore
      .getState()
      .overrideDiceRollResult("roll-1", resultId!, "face-06");

    const exported = importBoardStoreScenario(
      exportBoardStoreScenario(useBoardStore.getState(), {
        title: "Dice setup",
      }),
    );

    expect(exported.diceState.definitions[0]).toMatchObject({
      id: "die-1",
      name: "Search Die.png",
    });
    expect(exported.diceState.definitions[0]?.faces).toHaveLength(6);
    expect(exported.diceState.definitions[0]?.faces[0]).toMatchObject({
      id: "face-01",
      assetId: "asset-search-die",
      faceId: "token/dice/search-die/face-01.png",
    });
    expect(exported.diceState.pools[0]).toMatchObject({
      id: "pool-1",
      dice: [
        {
          id: "pool-die-1",
          count: 2,
          dieId: "die-1",
        },
      ],
    });
    expect(exported.diceState.rollHistory[0]).toMatchObject({
      id: "roll-1",
      mode: "manual",
      results: [
        {
          faceRefId: "face-06",
          isOverride: true,
        },
        {
          faceRefId: "face-02",
          isOverride: true,
        },
      ],
    });
  });

  it("creates dice from six folder face TOKEN assets", () => {
    seedFolderFaceAssets();

    const dieId = useBoardStore.getState().createDieDefinitionFromAssets(
      "Combat Die",
      Array.from({ length: 6 }, (_value, index) => `asset-combat-face-${index + 1}`),
    );

    expect(dieId).toBe("die-1");
    expect(useBoardStore.getState().diceState.definitions[0]).toMatchObject({
      id: "die-1",
      name: "Combat Die",
    });
    expect(useBoardStore.getState().diceState.definitions[0]?.faces).toHaveLength(6);
    expect(useBoardStore.getState().diceState.definitions[0]?.faces[0]).toMatchObject({
      id: "face-01",
      assetId: "asset-combat-face-1",
      label: "face-01.png",
    });
  });

  it("allows runtime rolls and face overrides without mutating frozen setup", () => {
    seedDieAsset();
    useBoardStore.getState().createDieDefinitionFromAsset("asset-search-die");
    useBoardStore.getState().createDicePool("Search Pool");
    useBoardStore.getState().addDieToDicePool("pool-1", "die-1", 1);
    useBoardStore.getState().enterRunMode();

    expect(
      useBoardStore.getState().createDieDefinitionFromAsset("asset-search-die"),
    ).toBeNull();

    useBoardStore.getState().rollDicePool("pool-1", ["face-03"]);
    const resultId = useBoardStore.getState().diceState.rollHistory[0]?.results[0]?.id;
    useBoardStore
      .getState()
      .overrideDiceRollResult("roll-1", resultId!, "face-04");

    const runStore = useBoardStore.getState();
    const restored = importBoardStoreScenario(
      exportBoardStoreScenario(runStore, {
        title: "Runtime dice",
      }),
    );

    expect(runStore.diceState.rollHistory).toHaveLength(1);
    expect(runStore.frozenSetup?.diceState.rollHistory).toEqual([]);
    expect(restored.mode).toBe("run");
    expect(restored.diceState.rollHistory[0]?.results[0]).toMatchObject({
      faceRefId: "face-04",
      isOverride: true,
    });
    expect(restored.frozenSetup?.diceState.rollHistory).toEqual([]);
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
    isWorkbenchCollapsed: true,
    lastError: null,
  });
}

function seedDieAsset() {
  useBoardStore.getState().addAsset({
    id: "asset-search-die",
    category: "TOKEN",
    kind: "die",
    name: "Search Die.png",
    url: "asset://search-die/source-uv.jpg",
    mimeType: "image/png",
    size: 100,
    maxCopies: 999,
    placementWidth: 64,
    placementHeight: 64,
    faces: Array.from(
      { length: 6 },
      (_value, index) => `token/dice/search-die/face-0${index + 1}.png`,
    ),
  });
}

function seedFolderFaceAssets() {
  for (let index = 1; index <= 6; index += 1) {
    const name = `face-0${index}.png`;

    useBoardStore.getState().addAsset({
      id: `asset-combat-face-${index}`,
      category: "TOKEN",
      name,
      url: `asset://combat-die/${name}`,
      mimeType: "image/png",
      size: 100,
      maxCopies: 999,
      placementWidth: 64,
      placementHeight: 64,
      sourcePath: `token/dice/combat-die/${name}`,
    });
  }
}
