import { existsSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyCardDeckState } from "../../src/engine/cardDeck";
import { createEmptyDiceState } from "../../src/engine/dice";
import { createEmptyEntityState } from "../../src/engine/entity";
import type { ResourceCategory } from "../../src/engine/entity";
import { createEmptySlotState } from "../../src/engine/slot";
import { createEmptyStackState } from "../../src/engine/stack";
import {
  createScenarioPackage,
  serializeScenarioPackage,
} from "../../src/engine/serialization";
import {
  applyScenarioPackageToBoardStore,
  exportBoardStorePortableScenario,
  exportBoardStoreScenario,
  importBoardStoreScenario,
} from "../../src/state/scenarioStore";
import { useBoardStore } from "../../src/state/boardStore";
import {
  buildLotrSetupScenario,
  entityLocation,
  findEntityState,
  LOTR_MANIFEST_PATH,
  LOTR_RULE_PATH,
  readManifest,
  totalEntities,
  totalStacks,
  zoneCardLabels,
} from "../fixtures/lotrScenario";

const hasLotrFixture =
  existsSync(LOTR_MANIFEST_PATH) && existsSync(LOTR_RULE_PATH);

describe("F-03 scenario store import/export", () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: createEmptyBoard(),
      entityState: createEmptyEntityState(),
      assets: [],
      assetPlacements: [],
      pawnSheets: {},
      cardDeckState: createEmptyCardDeckState(),
      diceState: createEmptyDiceState(),
      slotState: createEmptySlotState(),
      stackState: createEmptyStackState(),
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
      lastError: null,
    });
  });

  it("applies a saved scenario package to the board store and re-exports it", () => {
    const scenario = createScenarioPackage({
      metadata: {
        title: "Store Round Trip",
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
          name: "Pawn.png",
          url: "asset://pawn.png",
          mimeType: "image/png",
          size: 100,
          maxCopies: 1,
          placementWidth: 64,
          placementHeight: 64,
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
            id: "loc-1",
            name: "Start",
            x: 0.5,
            y: 0.5,
          },
        ],
        edges: [],
      },
      assetPlacements: [
        {
          id: "pawn-copy-1",
          assetId: "asset-pawn",
          category: "PAWN",
          entityId: "entity-1",
          locationId: "loc-1",
          x: 0.5,
          y: 0.5,
          width: 64,
          height: 64,
        },
      ],
      entityState: {
        entities: [
          {
            id: "entity-1",
            type: "PAWN",
            locationId: "loc-1",
            state: {
              assetId: "asset-pawn",
              placementId: "pawn-copy-1",
              customState: {
                ready: true,
              },
            },
          },
        ],
      },
      pawnSheets: {
        "pawn-copy-1": {
          heldCardAssetIds: [],
          counters: [],
        },
      },
      viewport: {
        boardZoom: 1.25,
        boardPan: {
          x: 20,
          y: -10,
        },
      },
    });

    applyScenarioPackageToBoardStore(serializeScenarioPackage(scenario));

    const store = useBoardStore.getState();
    const exported = exportBoardStoreScenario(store, scenario.metadata);

    expect(store.selectedAssetId).toBeNull();
    expect(store.activeTool).toBe("select");
    expect(importBoardStoreScenario(exported)).toMatchObject({
      board: scenario.board,
      entityState: scenario.entityState,
      assetPlacements: scenario.assetPlacements,
      pawnSheets: scenario.pawnSheets,
      boardZoom: 1.25,
      boardPan: {
        x: 20,
        y: -10,
      },
    });
  });

  it("exports a portable scenario package with embedded asset data", async () => {
    const board = {
      background: {
        assetId: "asset-board",
        name: "Board.png",
        url: "blob:board",
        mimeType: "image/png",
      },
      locations: [],
      edges: [],
    };
    const asset = {
      id: "asset-board",
      category: "BOARD" as const,
      name: "Board.png",
      url: "blob:board",
      thumbnailUrl: "blob:board-thumb",
      mimeType: "image/png",
      size: 100,
      maxCopies: 1,
      placementWidth: 64,
      placementHeight: 64,
    };
    const loadAssetData = vi.fn(async () => ({
      thumbnailUrl: "data:image/png;base64,thumbnail",
      url: "data:image/png;base64,board",
    }));

    const portable = await exportBoardStorePortableScenario(
      {
        mode: "run",
        assets: [asset],
        board,
        assetPlacements: [],
        entityState: createEmptyEntityState(),
        pawnSheets: {},
        cardDeckState: createEmptyCardDeckState(),
        diceState: createEmptyDiceState(),
        slotState: createEmptySlotState(),
        stackState: createEmptyStackState(),
        boardState: {},
        locationStates: {},
        edgeStates: {},
        frozenSetup: {
          assets: [asset],
          board,
          assetPlacements: [],
          entityState: createEmptyEntityState(),
          pawnSheets: {},
          cardDeckState: createEmptyCardDeckState(),
          diceState: createEmptyDiceState(),
          slotState: createEmptySlotState(),
          stackState: createEmptyStackState(),
          boardState: {},
          locationStates: {},
          edgeStates: {},
          boardZoom: 1,
          boardPan: { x: 0, y: 0 },
        },
        boardZoom: 1,
        boardPan: { x: 0, y: 0 },
      },
      {
        title: "Portable Scenario",
      },
      loadAssetData,
    );

    expect(loadAssetData).toHaveBeenCalledTimes(1);
    expect(portable.assets[0]).toMatchObject({
      thumbnailUrl: "data:image/png;base64,thumbnail",
      url: "data:image/png;base64,board",
    });
    expect(portable.board.background?.url).toBe("data:image/png;base64,board");
    expect(portable.frozenSetup?.assets[0]).toMatchObject({
      thumbnailUrl: "data:image/png;base64,thumbnail",
      url: "data:image/png;base64,board",
    });
    expect(portable.frozenSetup?.board.background?.url).toBe(
      "data:image/png;base64,board",
    );
    expect(importBoardStoreScenario(serializeScenarioPackage(portable))).toMatchObject({
      mode: "run",
      assets: [
        expect.objectContaining({
          url: "data:image/png;base64,board",
        }),
      ],
      board: {
        background: expect.objectContaining({
          url: "data:image/png;base64,board",
        }),
      },
    });
  });

  it("releases object URLs that are not reused by the loaded scenario", () => {
    const revokeSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    useBoardStore.setState({
      assets: [
        {
          id: "asset-old",
          category: "TOKEN",
          name: "Old Token.png",
          url: "blob:old-token",
          thumbnailUrl: "blob:old-token-thumb",
          mimeType: "image/png",
          size: 100,
          maxCopies: 999,
          placementWidth: 64,
          placementHeight: 64,
        },
        {
          id: "asset-shared",
          category: "CARD",
          name: "Shared Card.png",
          url: "blob:shared-card",
          thumbnailUrl: "blob:shared-card-thumb",
          mimeType: "image/png",
          size: 100,
          maxCopies: 1,
          placementWidth: 64,
          placementHeight: 90,
        },
      ],
      frozenSetup: {
        board: createEmptyBoard(),
        entityState: createEmptyEntityState(),
        assets: [
          {
            id: "asset-frozen-only",
            category: "OTHER",
            name: "Frozen.png",
            url: "blob:frozen-only",
            mimeType: "image/png",
            size: 100,
            maxCopies: 1,
            placementWidth: 64,
            placementHeight: 64,
          },
        ],
        assetPlacements: [],
        pawnSheets: {},
        cardDeckState: createEmptyCardDeckState(),
        diceState: createEmptyDiceState(),
        slotState: createEmptySlotState(),
        stackState: createEmptyStackState(),
        boardState: {},
        locationStates: {},
        edgeStates: {},
        boardZoom: 1,
        boardPan: { x: 0, y: 0 },
      },
    });

    const scenario = createScenarioPackage({
      assets: [
        {
          id: "asset-shared",
          category: "CARD",
          name: "Shared Card.png",
          url: "blob:shared-card",
          thumbnailUrl: "blob:shared-card-thumb",
          mimeType: "image/png",
          size: 100,
          maxCopies: 1,
          placementWidth: 64,
          placementHeight: 90,
        },
        {
          id: "asset-new",
          category: "OTHER",
          name: "New.png",
          url: "blob:new-asset",
          mimeType: "image/png",
          size: 100,
          maxCopies: 1,
          placementWidth: 64,
          placementHeight: 64,
        },
      ],
      board: createEmptyBoard(),
      assetPlacements: [],
      entityState: createEmptyEntityState(),
      pawnSheets: {},
    });

    applyScenarioPackageToBoardStore(serializeScenarioPackage(scenario));

    expect(revokeSpy).toHaveBeenCalledWith("blob:old-token");
    expect(revokeSpy).toHaveBeenCalledWith("blob:old-token-thumb");
    expect(revokeSpy).toHaveBeenCalledWith("blob:frozen-only");
    expect(revokeSpy).not.toHaveBeenCalledWith("blob:shared-card");
    expect(revokeSpy).not.toHaveBeenCalledWith("blob:shared-card-thumb");
    expect(revokeSpy).not.toHaveBeenCalledWith("blob:new-asset");

    revokeSpy.mockRestore();
  });

  it.skipIf(!hasLotrFixture)(
    "round-trips the LOTRRule setup snapshot through the generic scenario boundary",
    () => {
    const manifest = readManifest();
    const scenario = buildLotrSetupScenario(manifest);
    const serialized = serializeScenarioPackage(scenario);
    const imported = importBoardStoreScenario(serialized);

    applyScenarioPackageToBoardStore(serialized);
    const reexported = exportBoardStoreScenario(
      useBoardStore.getState(),
      scenario.metadata,
    );

    expect(imported.assets).toHaveLength(manifest.entries.length);
    expect(new Set(imported.assets.map((asset) => asset.category))).toEqual(
      new Set<ResourceCategory>(["BOARD", "PAWN", "TOKEN", "TILE", "CARD", "OTHER"]),
    );
    expect(imported.board.background?.assetId).toBe("board.game-board");
    expect(imported.board.locations.map((location) => location.id)).toEqual(
      expect.arrayContaining([
        "loc-ered-luin",
        "loc-minas-tirith",
        "loc-moria",
        "loc-eriador",
        "loc-threat-track-dot",
        "loc-hope-track-dot",
        "loc-shadow-discard",
      ]),
    );
    expect(imported.board.edges.length).toBeGreaterThan(20);
    expect(totalEntities(imported.entityState.entities, "friendlyTroop", "dwarven")).toBe(3);
    expect(totalEntities(imported.entityState.entities, "friendlyTroop", "elven")).toBe(4);
    expect(totalEntities(imported.entityState.entities, "friendlyTroop", "rohirrim")).toBe(3);
    expect(totalEntities(imported.entityState.entities, "friendlyTroop", "gondor")).toBe(5);
    expect(totalEntities(imported.entityState.entities, "shadowTroop")).toBe(18);
    expect(totalEntities(imported.entityState.entities, "nazgul")).toBe(9);
    expect(entityLocation(imported.entityState.entities, "entity-eye-of-sauron")).toBe(
      "loc-eriador",
    );
    expect(
      entityLocation(imported.entityState.entities, "entity-threat-rate-marker"),
    ).toBeUndefined();
    expect(
      entityLocation(imported.entityState.entities, "entity-hope-marker"),
    ).toBeUndefined();
    expect(
      imported.assetPlacements.find(
        (placement) => placement.id === "placement-threat-rate-marker",
      ),
    ).not.toHaveProperty("locationId");
    expect(
      imported.assetPlacements.find(
        (placement) => placement.id === "placement-hope-marker",
      ),
    ).not.toHaveProperty("locationId");
    expect(imported.slotState.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "slot-eye-of-sauron",
          ownerType: "location",
          ownerId: "loc-eriador",
          assetId: "token.eye-of-sauron-token",
          placementId: "placement-eye-of-sauron",
        }),
        expect.objectContaining({
          id: "slot-threat-rate-marker",
          ownerType: "track",
          ownerId: "threat",
          assetId: "token.threat-rate-marker",
          placementId: "placement-threat-rate-marker",
        }),
        expect.objectContaining({
          id: "slot-hope-marker",
          ownerType: "track",
          ownerId: "hope",
          assetId: "token.hope-marker",
          placementId: "placement-hope-marker",
        }),
        expect.objectContaining({
          id: "slot-haven-stronghold-reserve",
          ownerType: "display",
          ownerId: "tile-reserve",
        }),
      ]),
    );
    expect(totalStacks(imported.stackState.stacks, "friendlyTroop", "dwarven")).toBe(3);
    expect(totalStacks(imported.stackState.stacks, "friendlyTroop", "elven")).toBe(4);
    expect(totalStacks(imported.stackState.stacks, "friendlyTroop", "rohirrim")).toBe(3);
    expect(totalStacks(imported.stackState.stacks, "friendlyTroop", "gondor")).toBe(5);
    expect(totalStacks(imported.stackState.stacks, "shadowTroop")).toBe(18);
    expect(totalStacks(imported.stackState.stacks, "nazgul")).toBe(9);
    expect(imported.stackState.supplyZones.map((zone) => zone.id)).toEqual([
      "supply-friendly",
      "supply-shadow",
    ]);
    expect(totalStacks(imported.stackState.stacks, "friendlySupply", "dwarven")).toBe(5);
    expect(totalStacks(imported.stackState.stacks, "friendlySupply", "elven")).toBe(5);
    expect(totalStacks(imported.stackState.stacks, "friendlySupply", "rohirrim")).toBe(5);
    expect(totalStacks(imported.stackState.stacks, "friendlySupply", "gondor")).toBe(5);
    expect(totalStacks(imported.stackState.stacks, "shadowSupply")).toBe(21);
    expect(findEntityState(imported.entityState.entities, "entity-shadow-supply")).toMatchObject({
      count: 21,
    });
    expect(findEntityState(imported.entityState.entities, "entity-friendly-supply")).toMatchObject({
      remainingByArmy: {
        dwarven: 5,
        elven: 5,
        rohirrim: 5,
        gondor: 5,
      },
    });
    expect(
      findEntityState(imported.entityState.entities, "entity-random-shadow-deployments"),
    ).toMatchObject({
      drawCount: 9,
      resolved: false,
    });
    expect(findEntityState(imported.entityState.entities, "entity-shadow-discard-specials")).toMatchObject({
      cards: ["The Drums of War", "The Wheels of Saruman"],
    });
    expect(findEntityState(imported.entityState.entities, "entity-player-deck-setup")).toMatchObject({
      introductoryStackCount: 4,
      standardStackCount: 5,
      skiesDarkenPerStack: 1,
    });
    expect(zoneCardLabels(imported.cardDeckState, "zone-shadow-discard")).toEqual([
      "The Drums of War",
      "The Wheels of Saruman",
    ]);
    expect(zoneCardLabels(imported.cardDeckState, "zone-objective-display")).toContain(
      "Destroy the One Ring",
    );
    expect(zoneCardLabels(imported.cardDeckState, "zone-player-hand-1")).toHaveLength(4);
    expect(zoneCardLabels(imported.cardDeckState, "zone-skies-darken-set-aside")).toHaveLength(5);
    expect(zoneCardLabels(imported.cardDeckState, "zone-unused-cards")).toContain(
      "Unused event cards",
    );
    expect(imported.diceState.definitions).toHaveLength(2);
    expect(
      imported.diceState.definitions.every((definition) => definition.faces.length === 6),
    ).toBe(true);
    expect(
      imported.diceState.pools.find((pool) => pool.id === "pool-search-dice"),
    ).toMatchObject({
      name: "Search Dice",
      dice: [
        {
          dieId: "die-search-die",
          count: 1,
        },
      ],
    });
    expect(
      imported.diceState.pools.find((pool) => pool.id === "pool-combat-dice"),
    ).toMatchObject({
      name: "Combat Dice",
      dice: [
        {
          dieId: "die-combat-die",
          count: 2,
        },
      ],
    });
    expect(imported.diceState.rollHistory.map((roll) => roll.poolId)).toEqual([
      "pool-search-dice",
      "pool-combat-dice",
    ]);
    expect(imported.diceState.rollHistory[0]?.results).toHaveLength(1);
    expect(imported.diceState.rollHistory[1]?.results).toHaveLength(2);
    expect(reexported.board).toEqual(scenario.board);
    expect(reexported.entityState).toEqual(scenario.entityState);
    expect(reexported.assetPlacements).toEqual(scenario.assetPlacements);
    expect(reexported.cardDeckState).toEqual(scenario.cardDeckState);
    expect(reexported.diceState).toEqual(scenario.diceState);
    expect(reexported.slotState).toEqual(scenario.slotState);
    expect(reexported.stackState).toEqual(scenario.stackState);
    },
  );
});
