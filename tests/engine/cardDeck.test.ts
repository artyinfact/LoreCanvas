import { describe, expect, it } from "vitest";
import {
  addCardsToZone,
  addCardZone,
  createEmptyCardDeckState,
  dealCards,
  drawCards,
  flipCards,
  moveCardsBetweenZones,
  reorderCardInZone,
  searchCards,
  shuffleCardZone,
} from "../../src/engine/cardDeck";

describe("F-05 card deck engine", () => {
  it("manages ordered card zones with draw, move, reorder, flip, and search", () => {
    let state = seedDeckState();

    state = drawCards(state, {
      count: 2,
      fromZoneId: "zone-deck",
      toZoneId: "zone-hand",
    });

    expect(cardIds(state, "zone-deck")).toEqual(["card-3", "card-4"]);
    expect(cardIds(state, "zone-hand")).toEqual(["card-1", "card-2"]);

    state = moveCardsBetweenZones(state, {
      cardIds: ["card-2"],
      fromZoneId: "zone-hand",
      toIndex: 0,
      toZoneId: "zone-discard",
    });
    state = reorderCardInZone(state, "zone-hand", "card-1", 0);
    state = flipCards(state, "zone-discard", ["card-2"], true);

    expect(cardIds(state, "zone-hand")).toEqual(["card-1"]);
    expect(cardIds(state, "zone-discard")).toEqual(["card-2"]);
    expect(
      state.zones.find((zone) => zone.id === "zone-discard")?.cards[0]?.faceUp,
    ).toBe(true);
    expect(searchCards(state, "zone-discard", "drums").map((card) => card.id))
      .toEqual(["card-2"]);
  });

  it("supports explicit shuffle order and deterministic random injection", () => {
    let state = seedDeckState();

    state = shuffleCardZone(state, "zone-deck", {
      order: ["card-4", "card-3", "card-2", "card-1"],
    });

    expect(cardIds(state, "zone-deck")).toEqual([
      "card-4",
      "card-3",
      "card-2",
      "card-1",
    ]);

    state = shuffleCardZone(state, "zone-deck", {
      random: () => 0,
    });

    expect(cardIds(state, "zone-deck")).toEqual([
      "card-3",
      "card-2",
      "card-1",
      "card-4",
    ]);
  });

  it("deals cards round-robin to multiple target zones", () => {
    const state = dealCards(seedDeckState(), {
      countPerZone: 2,
      fromZoneId: "zone-deck",
      toZoneIds: ["zone-hand", "zone-discard"],
    });

    expect(cardIds(state, "zone-hand")).toEqual(["card-1", "card-3"]);
    expect(cardIds(state, "zone-discard")).toEqual(["card-2", "card-4"]);
    expect(cardIds(state, "zone-deck")).toEqual([]);
  });
});

function seedDeckState() {
  let state = createEmptyCardDeckState();

  state = addCardZone(state, {
    id: "zone-deck",
    kind: "deck",
    name: "Player Deck",
  });
  state = addCardZone(state, {
    id: "zone-hand",
    kind: "hand",
    name: "Player Hand",
  });
  state = addCardZone(state, {
    id: "zone-discard",
    kind: "discard",
    name: "Discard",
  });

  return addCardsToZone(state, "zone-deck", [
    {
      id: "card-1",
      assetId: "asset-1",
      label: "Ring Goes South",
    },
    {
      id: "card-2",
      assetId: "asset-2",
      label: "Drums in the Deep",
    },
    {
      id: "card-3",
      assetId: "asset-3",
      label: "Hope Rekindled",
    },
    {
      id: "card-4",
      assetId: "asset-4",
      label: "Hidden Path",
    },
  ]);
}

function cardIds(state: ReturnType<typeof seedDeckState>, zoneId: string) {
  return (
    state.zones.find((zone) => zone.id === zoneId)?.cards.map((card) => card.id) ??
    []
  );
}
