import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyBoard } from "../../src/engine/board";
import { createEmptyEntityState } from "../../src/engine/entity";
import type { ResourceCategory } from "../../src/engine/entity";
import {
  createScenarioPackage,
  serializeScenarioPackage,
} from "../../src/engine/serialization";
import type {
  ScenarioAsset,
  ScenarioAssetPlacement,
  ScenarioPackage,
} from "../../src/engine/serialization";
import {
  applyScenarioPackageToBoardStore,
  exportBoardStoreScenario,
  importBoardStoreScenario,
} from "../../src/state/scenarioStore";
import { useBoardStore } from "../../src/state/boardStore";

const LOTR_PACK_DIR = path.resolve("local-fixtures/lotr/LotR-FotF");
const LOTR_MANIFEST_PATH = path.join(LOTR_PACK_DIR, "manifest.json");
const LOTR_RULE_PATH = path.join(LOTR_PACK_DIR, "LOTRRule.pdf");

describe("F-03 scenario store import/export", () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: createEmptyBoard(),
      entityState: createEmptyEntityState(),
      assets: [],
      assetPlacements: [],
      pawnSheets: {},
      selectedAssetId: null,
      selectedLocationId: null,
      selectedPlacementId: null,
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

  it("round-trips the LOTRRule setup snapshot through the generic scenario boundary", () => {
    if (!existsSync(LOTR_MANIFEST_PATH) || !existsSync(LOTR_RULE_PATH)) {
      return;
    }

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
    expect(entityLocation(imported.entityState.entities, "entity-threat-rate-marker")).toBe(
      "loc-threat-track-dot",
    );
    expect(entityLocation(imported.entityState.entities, "entity-hope-marker")).toBe(
      "loc-hope-track-dot",
    );
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
    expect(reexported.board).toEqual(scenario.board);
    expect(reexported.entityState).toEqual(scenario.entityState);
    expect(reexported.assetPlacements).toEqual(scenario.assetPlacements);
  });
});

interface ManifestEntry {
  id: string;
  category: ResourceCategory;
  displayName?: string;
  path: string;
  sourceUrl?: string;
  sourceHash?: string;
  kind?: string;
  referenceCount?: number;
  deckCount?: number;
  cardFaceCount?: number;
  faces?: string[];
}

interface Manifest {
  packageName: string;
  entries: ManifestEntry[];
}

interface StackInput {
  id: string;
  assetId: string;
  role: string;
  locationId: string;
  count: number;
  army?: string;
}

function readManifest(): Manifest {
  return JSON.parse(readFileSync(LOTR_MANIFEST_PATH, "utf8")) as Manifest;
}

function buildLotrSetupScenario(manifest: Manifest): ScenarioPackage {
  const assets = manifest.entries.map(manifestEntryToAsset);
  const placements: ScenarioAssetPlacement[] = [];
  const entities = [];

  const placeStack = (input: StackInput) => {
    const placementId = `placement-${input.id}`;

    placements.push({
      id: placementId,
      assetId: input.assetId,
      category: assetCategory(assets, input.assetId),
      entityId: `entity-${input.id}`,
      locationId: input.locationId,
      x: locationPoint(input.locationId).x,
      y: locationPoint(input.locationId).y,
      width: 56,
      height: 56,
    });
    entities.push({
      id: `entity-${input.id}`,
      type: assetCategory(assets, input.assetId),
      locationId: input.locationId,
      state: {
        assetId: input.assetId,
        placementId,
        role: input.role,
        count: input.count,
        ...(input.army ? { army: input.army } : {}),
        setupSource: "LOTRRule.pdf",
      },
    });
  };

  for (const troop of FRIENDLY_TROOPS) {
    placeStack({
      id: `${troop.army}-${troop.locationId.replace("loc-", "")}`,
      assetId: `pawn.${troop.army}-troop`,
      role: "friendlyTroop",
      locationId: troop.locationId,
      count: troop.count,
      army: troop.army,
    });
  }

  for (const troop of SHADOW_TROOPS) {
    placeStack({
      id: `shadow-${troop.locationId.replace("loc-", "")}`,
      assetId: "pawn.shadow-troop",
      role: "shadowTroop",
      locationId: troop.locationId,
      count: troop.count,
    });
  }

  for (const nazgul of NAZGUL_STACKS) {
    placeStack({
      id: `nazgul-${nazgul.locationId.replace("loc-", "")}`,
      assetId: "pawn.nazgul-miniature",
      role: "nazgul",
      locationId: nazgul.locationId,
      count: nazgul.count,
    });
  }

  for (const marker of MARKERS) {
    placeStack(marker);
  }

  entities.push(
    {
      id: "entity-friendly-supply",
      type: "supply",
      locationId: "loc-supply",
      state: {
        role: "friendlySupply",
        remainingByArmy: {
          dwarven: 5,
          elven: 5,
          rohirrim: 5,
          gondor: 5,
        },
        setupSource: "LOTRRule.pdf",
      },
    },
    {
      id: "entity-shadow-supply",
      type: "supply",
      locationId: "loc-supply",
      state: {
        role: "shadowSupply",
        count: 21,
        setupSource: "LOTRRule.pdf",
      },
    },
    {
      id: "entity-shadow-discard-specials",
      type: "deckZone",
      locationId: "loc-shadow-discard",
      state: {
        role: "shadowDiscard",
        cards: ["The Drums of War", "The Wheels of Saruman"],
        setupSource: "LOTRRule.pdf",
      },
    },
    {
      id: "entity-shadow-deck",
      type: "deckZone",
      locationId: "loc-shadow-deck",
      state: {
        role: "shadowDeck",
        assetId: "card.collection.lotr-sliced",
        shadowBackCount: 2,
        setupSource: "LOTRRule.pdf",
      },
    },
    {
      id: "entity-random-shadow-deployments",
      type: "setupInstruction",
      locationId: "loc-shadow-deck",
      state: {
        role: "randomShadowDeployment",
        drawCount: 9,
        placeOneShadowTroopOnRedLocationPerCard: true,
        resolved: false,
        setupSource: "LOTRRule.pdf",
      },
    },
    {
      id: "entity-objective-display",
      type: "deckZone",
      locationId: "loc-objective-display",
      state: {
        role: "objectiveDisplay",
        fixedObjective: "Destroy the One Ring",
        randomObjectiveCount: 3,
        setupSource: "LOTRRule.pdf",
      },
    },
    {
      id: "entity-player-deck-setup",
      type: "deckZone",
      locationId: "loc-player-deck",
      state: {
        role: "playerDeck",
        eventCardsByPlayerCount: {
          one: 5,
          two: 6,
          three: 6,
          four: 7,
          five: 9,
        },
        startingHandByPlayerCount: {
          one: 4,
          two: 4,
          three: 3,
          four: 2,
          five: 2,
        },
        introductoryStackCount: 4,
        standardStackCount: 5,
        skiesDarkenPerStack: 1,
        setupSource: "LOTRRule.pdf",
      },
    },
  );

  return createScenarioPackage({
    metadata: {
      title: "LotR-FotF LOTRRule Setup",
      packageName: manifest.packageName,
      setupSource: "local-fixtures/lotr/LotR-FotF/LOTRRule.pdf",
      rulesPages: 2,
    },
    assets,
    board: {
      background: {
        assetId: "board.game-board",
        name: "Game Board",
        url: "asset-pack://LotR-FotF/board/game-board.png",
        mimeType: "image/png",
      },
      locations: SETUP_LOCATIONS,
      edges: SETUP_EDGES,
    },
    assetPlacements: placements,
    entityState: {
      entities,
    },
    pawnSheets: {},
    viewport: {
      boardZoom: 1,
      boardPan: {
        x: 0,
        y: 0,
      },
    },
  });
}

function manifestEntryToAsset(entry: ManifestEntry): ScenarioAsset {
  const filePath = path.join(LOTR_PACK_DIR, entry.path);
  const exists = existsSync(filePath);

  return {
    id: entry.id,
    category: entry.category,
    name: entry.displayName ?? entry.id,
    url: `asset-pack://LotR-FotF/${entry.path}`,
    mimeType: entry.path.endsWith(".jpg") ? "image/jpeg" : "image/png",
    size: exists ? statSync(filePath).size : 0,
    maxCopies:
      entry.category === "TOKEN"
        ? 999
        : entry.referenceCount ?? entry.cardFaceCount ?? entry.deckCount ?? 1,
    placementWidth: defaultPlacementSize(entry.category),
    placementHeight: defaultPlacementSize(entry.category),
    sourcePath: entry.path,
    manifestPath: "manifest.json",
    ...(entry.sourceUrl ? { sourceUrl: entry.sourceUrl } : {}),
    ...(entry.sourceHash ? { sourceHash: entry.sourceHash } : {}),
    ...(entry.kind ? { kind: entry.kind } : {}),
    ...(entry.faces ? { faces: entry.faces } : {}),
  };
}

function defaultPlacementSize(category: ResourceCategory) {
  if (category === "CARD") {
    return 90;
  }

  if (category === "TILE") {
    return 72;
  }

  return 56;
}

function assetCategory(assets: ScenarioAsset[], assetId: string): ResourceCategory {
  const asset = assets.find((candidate) => candidate.id === assetId);

  if (!asset) {
    throw new Error(`Missing LOTR test asset: ${assetId}`);
  }

  return asset.category;
}

function locationPoint(locationId: string) {
  const location = SETUP_LOCATIONS.find((candidate) => candidate.id === locationId);

  if (!location) {
    throw new Error(`Missing LOTR test location: ${locationId}`);
  }

  return location;
}

function totalEntities(
  entities: ScenarioPackage["entityState"]["entities"],
  role: string,
  army?: string,
) {
  return entities
    .filter(
      (entity) =>
        entity.state.role === role && (!army || entity.state.army === army),
    )
    .reduce((total, entity) => total + Number(entity.state.count ?? 0), 0);
}

function entityLocation(
  entities: ScenarioPackage["entityState"]["entities"],
  entityId: string,
) {
  return entities.find((entity) => entity.id === entityId)?.locationId;
}

function findEntityState(
  entities: ScenarioPackage["entityState"]["entities"],
  entityId: string,
) {
  return entities.find((entity) => entity.id === entityId)?.state;
}

const SETUP_LOCATIONS = [
  { id: "loc-ered-luin", name: "Ered Luin", x: 0.17, y: 0.18 },
  { id: "loc-grey-havens", name: "Grey Havens", x: 0.12, y: 0.27 },
  { id: "loc-eriador", name: "Eriador", x: 0.28, y: 0.26 },
  { id: "loc-rhudaur", name: "Rhudaur", x: 0.36, y: 0.2 },
  { id: "loc-rivendell", name: "Rivendell", x: 0.42, y: 0.24 },
  { id: "loc-misty-mountains", name: "Misty Mountains", x: 0.47, y: 0.33 },
  { id: "loc-moria", name: "Moria", x: 0.43, y: 0.4 },
  { id: "loc-lorien", name: "Lorien", x: 0.52, y: 0.4 },
  { id: "loc-woodland-realm", name: "Woodland Realm", x: 0.58, y: 0.22 },
  { id: "loc-iron-hills", name: "Iron Hills", x: 0.68, y: 0.18 },
  { id: "loc-erebor", name: "Erebor", x: 0.62, y: 0.16 },
  { id: "loc-dol-guldur", name: "Dol Guldur", x: 0.59, y: 0.38 },
  { id: "loc-rhun", name: "Rhun", x: 0.78, y: 0.36 },
  { id: "loc-dunland", name: "Dunland", x: 0.32, y: 0.48 },
  { id: "loc-isengard", name: "Isengard", x: 0.39, y: 0.51 },
  { id: "loc-helms-deep", name: "Helms Deep", x: 0.43, y: 0.56 },
  { id: "loc-edoras", name: "Edoras", x: 0.51, y: 0.55 },
  { id: "loc-eastemnet", name: "Eastemnet", x: 0.58, y: 0.56 },
  { id: "loc-gondor", name: "Gondor", x: 0.54, y: 0.68 },
  { id: "loc-minas-tirith", name: "Minas Tirith", x: 0.62, y: 0.68 },
  { id: "loc-dol-amroth", name: "Dol Amroth", x: 0.47, y: 0.77 },
  { id: "loc-pelargir", name: "Pelargir", x: 0.58, y: 0.78 },
  { id: "loc-minas-morgul", name: "Minas Morgul", x: 0.68, y: 0.67 },
  { id: "loc-mordor", name: "Mordor", x: 0.75, y: 0.7 },
  { id: "loc-barad-dur", name: "Barad-dur", x: 0.81, y: 0.69 },
  { id: "loc-nurn", name: "Nurn", x: 0.79, y: 0.82 },
  { id: "loc-umbar", name: "Umbar", x: 0.46, y: 0.91 },
  { id: "loc-near-harad", name: "Near Harad", x: 0.7, y: 0.92 },
  { id: "loc-threat-track-dot", name: "Threat Track Dot", x: 0.08, y: 0.92 },
  { id: "loc-hope-track-dot", name: "Hope Track Dot", x: 0.21, y: 0.92 },
  { id: "loc-shadow-deck", name: "Shadow Deck", x: 0.9, y: 0.25 },
  { id: "loc-shadow-discard", name: "Shadow Discard", x: 0.9, y: 0.35 },
  { id: "loc-player-deck", name: "Player Deck", x: 0.9, y: 0.82 },
  { id: "loc-objective-display", name: "Objective Display", x: 0.5, y: 0.08 },
  { id: "loc-supply", name: "Supply", x: 0.08, y: 0.75 },
];

const SETUP_EDGES = [
  edge("ered-luin-grey-havens", "loc-ered-luin", "loc-grey-havens"),
  edge("grey-havens-eriador", "loc-grey-havens", "loc-eriador"),
  edge("eriador-rhudaur", "loc-eriador", "loc-rhudaur"),
  edge("rhudaur-rivendell", "loc-rhudaur", "loc-rivendell"),
  edge("rivendell-misty-mountains", "loc-rivendell", "loc-misty-mountains"),
  edge("misty-mountains-moria", "loc-misty-mountains", "loc-moria"),
  edge("moria-lorien", "loc-moria", "loc-lorien"),
  edge("lorien-woodland-realm", "loc-lorien", "loc-woodland-realm"),
  edge("woodland-realm-erebor", "loc-woodland-realm", "loc-erebor"),
  edge("erebor-iron-hills", "loc-erebor", "loc-iron-hills"),
  edge("woodland-realm-dol-guldur", "loc-woodland-realm", "loc-dol-guldur"),
  edge("dol-guldur-rhun", "loc-dol-guldur", "loc-rhun"),
  edge("moria-dunland", "loc-moria", "loc-dunland"),
  edge("dunland-isengard", "loc-dunland", "loc-isengard"),
  edge("isengard-helms-deep", "loc-isengard", "loc-helms-deep"),
  edge("helms-deep-edoras", "loc-helms-deep", "loc-edoras"),
  edge("edoras-eastemnet", "loc-edoras", "loc-eastemnet"),
  edge("eastemnet-minas-tirith", "loc-eastemnet", "loc-minas-tirith"),
  edge("minas-tirith-gondor", "loc-minas-tirith", "loc-gondor"),
  edge("gondor-dol-amroth", "loc-gondor", "loc-dol-amroth"),
  edge("dol-amroth-pelargir", "loc-dol-amroth", "loc-pelargir"),
  edge("pelargir-minas-tirith", "loc-pelargir", "loc-minas-tirith"),
  edge("minas-tirith-minas-morgul", "loc-minas-tirith", "loc-minas-morgul"),
  edge("minas-morgul-mordor", "loc-minas-morgul", "loc-mordor"),
  edge("mordor-barad-dur", "loc-mordor", "loc-barad-dur"),
  edge("barad-dur-nurn", "loc-barad-dur", "loc-nurn"),
  edge("nurn-near-harad", "loc-nurn", "loc-near-harad"),
  edge("near-harad-umbar", "loc-near-harad", "loc-umbar"),
  edge("umbar-dol-amroth", "loc-umbar", "loc-dol-amroth"),
];

const FRIENDLY_TROOPS = [
  { army: "dwarven", locationId: "loc-ered-luin", count: 1 },
  { army: "dwarven", locationId: "loc-erebor", count: 1 },
  { army: "dwarven", locationId: "loc-iron-hills", count: 1 },
  { army: "elven", locationId: "loc-grey-havens", count: 1 },
  { army: "elven", locationId: "loc-rivendell", count: 1 },
  { army: "elven", locationId: "loc-lorien", count: 1 },
  { army: "elven", locationId: "loc-woodland-realm", count: 1 },
  { army: "rohirrim", locationId: "loc-helms-deep", count: 1 },
  { army: "rohirrim", locationId: "loc-edoras", count: 1 },
  { army: "rohirrim", locationId: "loc-eastemnet", count: 1 },
  { army: "gondor", locationId: "loc-minas-tirith", count: 2 },
  { army: "gondor", locationId: "loc-dol-amroth", count: 2 },
  { army: "gondor", locationId: "loc-pelargir", count: 1 },
] as const;

const SHADOW_TROOPS = [
  { locationId: "loc-dunland", count: 1 },
  { locationId: "loc-isengard", count: 1 },
  { locationId: "loc-moria", count: 2 },
  { locationId: "loc-dol-guldur", count: 1 },
  { locationId: "loc-rhun", count: 3 },
  { locationId: "loc-minas-morgul", count: 2 },
  { locationId: "loc-barad-dur", count: 2 },
  { locationId: "loc-nurn", count: 3 },
  { locationId: "loc-umbar", count: 1 },
  { locationId: "loc-near-harad", count: 2 },
] as const;

const NAZGUL_STACKS = [
  { locationId: "loc-eriador", count: 2 },
  { locationId: "loc-rhudaur", count: 1 },
  { locationId: "loc-misty-mountains", count: 1 },
  { locationId: "loc-gondor", count: 1 },
  { locationId: "loc-mordor", count: 4 },
] as const;

const MARKERS: StackInput[] = [
  {
    id: "eye-of-sauron",
    assetId: "token.eye-of-sauron-token",
    role: "eyeOfSauron",
    locationId: "loc-eriador",
    count: 1,
  },
  {
    id: "threat-rate-marker",
    assetId: "token.threat-rate-marker",
    role: "threatRateMarker",
    locationId: "loc-threat-track-dot",
    count: 1,
  },
  {
    id: "hope-marker",
    assetId: "token.hope-marker",
    role: "hopeMarker",
    locationId: "loc-hope-track-dot",
    count: 1,
  },
];

function edge(id: string, fromId: string, toId: string) {
  return {
    id: `edge-${id}`,
    fromId,
    toId,
  };
}
