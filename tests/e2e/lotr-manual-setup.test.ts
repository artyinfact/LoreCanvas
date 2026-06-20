import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { serializeScenarioPackage } from "../../src/engine/serialization";
import {
  applyScenarioPackageToBoardStore,
  exportBoardStoreScenario,
  importBoardStoreScenario,
} from "../../src/state/scenarioStore";
import { useBoardStore } from "../../src/state/boardStore";
import {
  buildLotrSetupScenario,
  LOTR_MANIFEST_PATH,
  LOTR_RULE_PATH,
  readManifest,
} from "../fixtures/lotrScenario";

const hasLotrFixture =
  existsSync(LOTR_MANIFEST_PATH) && existsSync(LOTR_RULE_PATH);

describe("F-09 LOTR manual setup validation", () => {
  it.skipIf(!hasLotrFixture)(
    "freezes and round-trips the generic manual LOTR setup without product branches",
    () => {
    const manifest = readManifest();
    const scenario = buildLotrSetupScenario(manifest);

    applyScenarioPackageToBoardStore(serializeScenarioPackage(scenario));
    const setupState = useBoardStore.getState();
    const setupSnapshot = cloneSetupSlices(setupState);

    expect(setupState.mode).toBe("edit");
    expect(setupState.assets).toHaveLength(manifest.entries.length);
    expect(setupState.board.background?.assetId).toBe("board.game-board");
    expect(setupState.board.locations.length).toBeGreaterThan(30);
    expect(setupState.board.edges.length).toBeGreaterThan(20);
    expect(setupState.cardDeckState.zones.map((zone) => zone.id)).toEqual(
      expect.arrayContaining([
        "zone-shadow-discard",
        "zone-shadow-deck",
        "zone-objective-display",
        "zone-player-hand-1",
        "zone-skies-darken-set-aside",
        "zone-unused-cards",
      ]),
    );
    expect(setupState.diceState.definitions).toHaveLength(2);
    expect(setupState.diceState.pools.map((pool) => pool.id)).toEqual(
      expect.arrayContaining(["pool-search-dice", "pool-combat-dice"]),
    );
    expect(setupState.slotState.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "slot-threat-rate-marker",
          ownerType: "track",
          ownerId: "threat",
        }),
        expect.objectContaining({
          id: "slot-hope-marker",
          ownerType: "track",
          ownerId: "hope",
        }),
        expect.objectContaining({
          id: "slot-objective-display-1",
          ownerType: "display",
        }),
      ]),
    );
    expect(
      setupState.assetPlacements.find(
        (placement) => placement.id === "placement-threat-rate-marker",
      ),
    ).not.toHaveProperty("locationId");
    expect(
      setupState.assetPlacements.find(
        (placement) => placement.id === "placement-hope-marker",
      ),
    ).not.toHaveProperty("locationId");
    expect(totalStackCount(setupState.stackState.stacks, "friendlyTroop")).toBe(
      15,
    );
    expect(totalStackCount(setupState.stackState.stacks, "shadowTroop")).toBe(
      18,
    );
    expect(totalStackCount(setupState.stackState.stacks, "nazgul")).toBe(9);
    expect(
      setupState.entityState.entities.find(
        (entity) => entity.id === "entity-random-shadow-deployments",
      )?.state,
    ).toMatchObject({
      drawCount: 9,
      resolved: false,
    });

    useBoardStore.getState().enterRunMode();
    const frozenSetup = useBoardStore.getState().frozenSetup;

    expect(useBoardStore.getState().mode).toBe("run");
    expect(frozenSetup).not.toBeNull();
    expect(cloneSetupSlices(frozenSetup!)).toEqual(setupSnapshot);

    const stackId = "stack-dwarven-ered-luin";
    const originalStackCount =
      useBoardStore.getState().stackState.stacks.find((stack) => stack.id === stackId)
        ?.count ?? 0;
    const originalHandCount =
      useBoardStore
        .getState()
        .cardDeckState.zones.find((zone) => zone.id === "zone-player-hand-1")
        ?.cards.length ?? 0;

    useBoardStore.getState().adjustPawnStackCount(stackId, 1);
    useBoardStore
      .getState()
      .drawCardsToZone("zone-player-deck", "zone-player-hand-1", 1);

    const runtimeState = useBoardStore.getState();
    expect(
      runtimeState.stackState.stacks.find((stack) => stack.id === stackId)?.count,
    ).toBe(originalStackCount + 1);
    expect(
      runtimeState.cardDeckState.zones.find(
        (zone) => zone.id === "zone-player-hand-1",
      )?.cards.length,
    ).toBe(originalHandCount + 1);
    expect(
      runtimeState.frozenSetup?.stackState.stacks.find(
        (stack) => stack.id === stackId,
      )?.count,
    ).toBe(originalStackCount);
    expect(
      runtimeState.frozenSetup?.cardDeckState.zones.find(
        (zone) => zone.id === "zone-player-hand-1",
      )?.cards.length,
    ).toBe(originalHandCount);

    const runtimePackage = exportBoardStoreScenario(runtimeState, {
      ...scenario.metadata,
      savedAt: "2026-06-14T00:00:00.000Z",
    });
    const runtimeSerialized = serializeScenarioPackage(runtimePackage);
    const importedRuntime = importBoardStoreScenario(runtimeSerialized);

    expect(importedRuntime.mode).toBe("run");
    expect(importedRuntime.frozenSetup).not.toBeNull();
    expect(importedRuntime.stackState.stacks).toEqual(
      runtimeState.stackState.stacks,
    );
    expect(importedRuntime.cardDeckState).toEqual(runtimeState.cardDeckState);
    expect(cloneSetupSlices(importedRuntime.frozenSetup!)).toEqual(
      setupSnapshot,
    );

    applyScenarioPackageToBoardStore(runtimeSerialized);
    const restoredRuntime = useBoardStore.getState();

    expect(restoredRuntime.mode).toBe("run");
    expect(restoredRuntime.frozenSetup).not.toBeNull();
    expect(
      restoredRuntime.stackState.stacks.find((stack) => stack.id === stackId)
        ?.count,
    ).toBe(originalStackCount + 1);
    expect(cloneSetupSlices(restoredRuntime.frozenSetup!)).toEqual(
      setupSnapshot,
    );

    expect(scanProductCodeForLotrBranches()).toEqual([]);
    },
  );
});

function cloneSetupSlices(state: {
  assets: unknown;
  assetPlacements: unknown;
  board: unknown;
  boardPan: unknown;
  boardState: unknown;
  boardZoom: unknown;
  cardDeckState: unknown;
  diceState: unknown;
  edgeStates: unknown;
  entityState: unknown;
  locationStates: unknown;
  pawnSheets: unknown;
  slotState: unknown;
  stackState: unknown;
}) {
  return JSON.parse(
    JSON.stringify({
      assets: state.assets,
      assetPlacements: state.assetPlacements,
      board: state.board,
      boardPan: state.boardPan,
      boardState: state.boardState,
      boardZoom: state.boardZoom,
      cardDeckState: state.cardDeckState,
      diceState: state.diceState,
      edgeStates: state.edgeStates,
      entityState: state.entityState,
      locationStates: state.locationStates,
      pawnSheets: state.pawnSheets,
      slotState: state.slotState,
      stackState: state.stackState,
    }),
  ) as unknown;
}

function totalStackCount(
  stacks: Array<{ count: number; state: Record<string, unknown> }>,
  role: string,
) {
  return stacks
    .filter((stack) => stack.state.role === role)
    .reduce((total, stack) => total + stack.count, 0);
}

function scanProductCodeForLotrBranches() {
  const forbiddenPatterns = [
    /lotr/i,
    /sauron/i,
    /mordor/i,
    /gondor/i,
    /nazgul/i,
    /frodo/i,
    /saruman/i,
  ];
  const hits: string[] = [];

  for (const filePath of listSourceFiles(path.resolve("src"))) {
    const source = readFileSync(filePath, "utf8");
    const matchedPattern = forbiddenPatterns.find((pattern) =>
      pattern.test(source),
    );

    if (matchedPattern) {
      hits.push(
        `${path.relative(process.cwd(), filePath)} matched ${matchedPattern.source}`,
      );
    }
  }

  return hits;
}

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return listSourceFiles(fullPath);
    }

    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : [];
  });
}
