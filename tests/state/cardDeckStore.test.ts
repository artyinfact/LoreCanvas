import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyCardDeckState } from "../../src/engine/cardDeck";
import { createEmptyEntityState } from "../../src/engine/entity";
import {
  exportBoardStoreScenario,
  importBoardStoreScenario,
} from "../../src/state/scenarioStore";
import { useBoardStore } from "../../src/state/boardStore";

describe("F-05 card deck store and scenario boundary", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates card zones, orders cards, draws, flips, and serializes state", () => {
    seedCardAssets();

    const deckZoneId = useBoardStore
      .getState()
      .createCardZone("Shadow Deck", "deck");
    const handZoneId = useBoardStore
      .getState()
      .createCardZone("Player Hand", "hand");
    const discardZoneId = useBoardStore
      .getState()
      .createCardZone("Shadow Discard", "discard");

    expect(deckZoneId).toBe("zone-1");
    expect(handZoneId).toBe("zone-2");
    expect(discardZoneId).toBe("zone-3");

    useBoardStore.getState().addCardAssetToZone("zone-1", "asset-card-a");
    useBoardStore.getState().addCardAssetToZone("zone-1", "asset-card-b");
    useBoardStore.getState().addCardAssetToZone("zone-1", "asset-card-c");
    useBoardStore
      .getState()
      .shuffleCardZone("zone-1", ["card-3", "card-2", "card-1"]);
    useBoardStore.getState().drawCardsToZone("zone-1", "zone-2", 2);
    useBoardStore.getState().flipCardsInZone("zone-2", ["card-3"], true);
    useBoardStore.getState().moveCardsBetweenCardZones(
      "zone-2",
      "zone-3",
      ["card-2"],
    );

    const exported = importBoardStoreScenario(
      exportBoardStoreScenario(useBoardStore.getState(), {
        title: "Card deck setup",
      }),
    );

    expect(zoneCardIds(exported.cardDeckState, "zone-1")).toEqual(["card-1"]);
    expect(zoneCardIds(exported.cardDeckState, "zone-2")).toEqual(["card-3"]);
    expect(zoneCardIds(exported.cardDeckState, "zone-3")).toEqual(["card-2"]);
    expect(
      exported.cardDeckState.zones
        .find((zone) => zone.id === "zone-2")
        ?.cards.find((card) => card.id === "card-3")?.faceUp,
    ).toBe(true);
  });

  it("allows runtime card moves without mutating frozen setup", () => {
    seedCardAssets();
    useBoardStore.getState().createCardZone("Deck", "deck");
    useBoardStore.getState().createCardZone("Hand", "hand");
    useBoardStore.getState().createCardZone("Discard", "discard");
    useBoardStore.getState().addCardAssetToZone("zone-1", "asset-card-a");
    useBoardStore.getState().addCardAssetToZone("zone-1", "asset-card-b");
    useBoardStore.getState().enterRunMode();

    expect(useBoardStore.getState().createCardZone("Run Zone", "setup")).toBeNull();
    useBoardStore.getState().drawCardsToZone("zone-1", "zone-2", 1);
    useBoardStore.getState().flipCardsInZone("zone-2", ["card-1"], true);

    const runStore = useBoardStore.getState();
    const restored = importBoardStoreScenario(
      exportBoardStoreScenario(runStore, {
        title: "Runtime cards",
      }),
    );

    expect(zoneCardIds(runStore.cardDeckState, "zone-1")).toEqual(["card-2"]);
    expect(zoneCardIds(runStore.cardDeckState, "zone-2")).toEqual(["card-1"]);
    expect(zoneCardIds(runStore.frozenSetup?.cardDeckState, "zone-1")).toEqual([
      "card-1",
      "card-2",
    ]);
    expect(zoneCardIds(runStore.frozenSetup?.cardDeckState, "zone-2")).toEqual([]);
    expect(restored.mode).toBe("run");
    expect(zoneCardIds(restored.cardDeckState, "zone-2")).toEqual(["card-1"]);
    expect(zoneCardIds(restored.frozenSetup?.cardDeckState, "zone-1")).toEqual([
      "card-1",
      "card-2",
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

function seedCardAssets() {
  for (const [id, name] of [
    ["asset-card-a", "A.png"],
    ["asset-card-b", "B.png"],
    ["asset-card-c", "C.png"],
  ] as const) {
    useBoardStore.getState().addAsset({
      id,
      category: "CARD",
      name,
      url: `asset://${name}`,
      mimeType: "image/png",
      size: 100,
      maxCopies: 1,
      placementWidth: 64,
      placementHeight: 90,
    });
  }
}

function zoneCardIds(
  cardDeckState: ReturnType<typeof createEmptyCardDeckState> | undefined,
  zoneId: string,
) {
  return (
    cardDeckState?.zones
      .find((zone) => zone.id === zoneId)
      ?.cards.map((card) => card.id) ?? []
  );
}
