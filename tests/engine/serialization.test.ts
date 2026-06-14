import { describe, expect, it } from "vitest";
import {
  createScenarioPackage,
  parseScenarioPackage,
  ScenarioValidationError,
  serializeScenarioPackage,
  validateScenarioPackage,
} from "../../src/engine/serialization";
import type { ScenarioPackageInput } from "../../src/engine/serialization";

describe("F-03 scenario serialization", () => {
  it("round-trips a complete manual scenario snapshot", () => {
    const scenario = createScenarioPackage(createSampleScenario());
    const serialized = serializeScenarioPackage(scenario);
    const restored = parseScenarioPackage(serialized);

    expect(restored).toEqual(scenario);
    expect(restored.board.locations).toHaveLength(2);
    expect(restored.board.edges[0]).toMatchObject({
      fromId: "loc-shire",
      toId: "loc-bree",
    });
    expect(restored.entityState.entities[0]?.state).toMatchObject({
      hp: 4,
      customFlags: ["hidden", "ready"],
    });
    expect(restored.pawnSheets["pawn-copy-1"]).toEqual({
      characterCardAssetId: "asset-card",
      heldCardAssetIds: ["asset-card"],
      counters: [
        {
          assetId: "asset-token",
          count: 2,
        },
      ],
    });
    expect(restored.cardDeckState.zones[0]).toMatchObject({
      id: "zone-player-deck",
      kind: "deck",
      cards: [
        {
          id: "card-ref-1",
          assetId: "asset-card",
          faceId: "face-1",
          faceUp: false,
        },
      ],
    });
    expect(restored.viewport).toEqual({
      boardZoom: 1.4,
      boardPan: {
        x: 12,
        y: -8,
      },
    });
  });

  it("reports invalid cross references before import", () => {
    const invalidScenario = createSampleScenario();

    invalidScenario.assetPlacements[0] = {
      ...invalidScenario.assetPlacements[0]!,
      assetId: "missing-asset",
      entityId: "missing-entity",
      locationId: "missing-location",
    };

    const issues = validateScenarioPackage({
      format: "lorecanvas.scenario",
      version: 1,
      ...invalidScenario,
      metadata: {},
      viewport: {
        boardZoom: 1,
        boardPan: {
          x: 0,
          y: 0,
        },
      },
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "placement_asset_not_found" }),
        expect.objectContaining({ code: "placement_entity_not_found" }),
        expect.objectContaining({ code: "placement_location_not_found" }),
      ]),
    );
  });

  it("reports invalid card deck face references", () => {
    const invalidScenario = createSampleScenario();

    invalidScenario.cardDeckState!.zones[0]!.cards[0] = {
      ...invalidScenario.cardDeckState!.zones[0]!.cards[0]!,
      faceId: "missing-face",
    };

    const issues = validateScenarioPackage({
      format: "lorecanvas.scenario",
      version: 1,
      ...invalidScenario,
      metadata: {},
      viewport: {
        boardZoom: 1,
        boardPan: {
          x: 0,
          y: 0,
        },
      },
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "card_ref_face_not_found" }),
      ]),
    );
  });

  it("throws a scenario validation error for malformed packages", () => {
    expect(() =>
      parseScenarioPackage(
        JSON.stringify({
          format: "wrong",
          version: 1,
        }),
      ),
    ).toThrow(ScenarioValidationError);
  });
});

function createSampleScenario(): ScenarioPackageInput {
  return {
    metadata: {
      title: "Manual Test Scenario",
      packageName: "manual-test",
    },
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
        name: "Hero.png",
        url: "asset://hero.png",
        mimeType: "image/png",
        size: 100,
        maxCopies: 1,
        placementWidth: 80,
        placementHeight: 80,
      },
      {
        id: "asset-card",
        category: "CARD",
        name: "Card.png",
        url: "asset://card.png",
        mimeType: "image/png",
        size: 100,
        maxCopies: 3,
        placementWidth: 64,
        placementHeight: 90,
        faces: ["face-1", "face-2"],
      },
      {
        id: "asset-token",
        category: "TOKEN",
        name: "Token.png",
        url: "asset://token.png",
        mimeType: "image/png",
        size: 100,
        maxCopies: 99,
        placementWidth: 32,
        placementHeight: 32,
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
          id: "loc-shire",
          name: "Shire",
          x: 0.1,
          y: 0.2,
        },
        {
          id: "loc-bree",
          name: "Bree",
          x: 0.2,
          y: 0.25,
        },
      ],
      edges: [
        {
          id: "edge-shire-bree",
          fromId: "loc-shire",
          toId: "loc-bree",
          label: "road",
        },
      ],
    },
    assetPlacements: [
      {
        id: "pawn-copy-1",
        assetId: "asset-pawn",
        category: "PAWN",
        entityId: "entity-hero",
        locationId: "loc-shire",
        x: 0.1,
        y: 0.2,
        width: 80,
        height: 80,
      },
    ],
    entityState: {
      entities: [
        {
          id: "entity-hero",
          type: "PAWN",
          locationId: "loc-shire",
          state: {
            assetId: "asset-pawn",
            category: "PAWN",
            placementId: "pawn-copy-1",
            hp: 4,
            customFlags: ["hidden", "ready"],
          },
        },
      ],
    },
    pawnSheets: {
      "pawn-copy-1": {
        characterCardAssetId: "asset-card",
        heldCardAssetIds: ["asset-card"],
        counters: [
          {
            assetId: "asset-token",
            count: 2,
          },
        ],
      },
    },
    cardDeckState: {
      zones: [
        {
          id: "zone-player-deck",
          name: "Player Deck",
          kind: "deck",
          state: {},
          cards: [
            {
              id: "card-ref-1",
              assetId: "asset-card",
              faceId: "face-1",
              label: "Opening Move",
              faceUp: false,
              state: {},
            },
          ],
        },
      ],
    },
    viewport: {
      boardZoom: 1.4,
      boardPan: {
        x: 12,
        y: -8,
      },
    },
  };
}
