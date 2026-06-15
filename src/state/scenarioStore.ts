import {
  assertValidScenarioPackage,
  createScenarioPackage,
  parseScenarioPackage,
} from "../engine/serialization";
import type {
  ScenarioAsset,
  ScenarioMetadata,
  ScenarioPackage,
  ScenarioPackageInput,
} from "../engine/serialization";
import type {
  AssetPlacement,
  BoardPan,
  BoardStore,
  FrozenSetupSnapshot,
  PawnSheet,
  ScenarioMode,
  UploadedImageAsset,
} from "./boardStore";
import { revokeUnusedAssetObjectUrls, useBoardStore } from "./boardStore";
import type { BoardState } from "../engine/board";
import type { CardDeckState } from "../engine/cardDeck";
import type { DiceState } from "../engine/dice";
import type { EntityState } from "../engine/entity";
import type { SlotState } from "../engine/slot";
import type { StackState } from "../engine/stack";

export interface BoardStoreScenarioState {
  mode: ScenarioMode;
  board: BoardState;
  entityState: EntityState;
  assets: UploadedImageAsset[];
  assetPlacements: AssetPlacement[];
  pawnSheets: Record<string, PawnSheet>;
  cardDeckState: CardDeckState;
  diceState: DiceState;
  slotState: SlotState;
  stackState: StackState;
  boardState: Record<string, unknown>;
  locationStates: Record<string, Record<string, unknown>>;
  edgeStates: Record<string, Record<string, unknown>>;
  frozenSetup: FrozenSetupSnapshot | null;
  boardZoom: number;
  boardPan: BoardPan;
}

export type BoardStoreScenarioInput = Pick<
  BoardStore,
  | "board"
  | "entityState"
  | "assets"
  | "assetPlacements"
  | "pawnSheets"
  | "cardDeckState"
  | "diceState"
  | "slotState"
  | "stackState"
  | "mode"
  | "boardState"
  | "locationStates"
  | "edgeStates"
  | "frozenSetup"
  | "boardZoom"
  | "boardPan"
>;

export interface PortableAssetData {
  thumbnailUrl?: string;
  url?: string;
}

export const SCENARIO_ASSET_REFERENCE_URL_PREFIX = "lorecanvas-asset-ref://";

export type PortableAssetDataLoader = (
  asset: UploadedImageAsset,
) => Promise<PortableAssetData | null | undefined>;

export function exportBoardStoreScenario(
  state: BoardStoreScenarioInput,
  metadata: ScenarioMetadata = {},
): ScenarioPackage {
  const input: ScenarioPackageInput = {
    mode: state.mode,
    metadata,
    assets: state.assets,
    board: state.board,
    assetPlacements: state.assetPlacements,
    entityState: state.entityState,
    pawnSheets: state.pawnSheets,
    cardDeckState: state.cardDeckState,
    diceState: state.diceState,
    slotState: state.slotState,
    stackState: state.stackState,
    boardState: state.boardState,
    locationStates: state.locationStates,
    edgeStates: state.edgeStates,
    frozenSetup: state.frozenSetup
      ? {
          assets: state.frozenSetup.assets,
          board: state.frozenSetup.board,
          assetPlacements: state.frozenSetup.assetPlacements,
          entityState: state.frozenSetup.entityState,
          pawnSheets: state.frozenSetup.pawnSheets,
          cardDeckState: state.frozenSetup.cardDeckState,
          diceState: state.frozenSetup.diceState,
          slotState: state.frozenSetup.slotState,
          stackState: state.frozenSetup.stackState,
          boardState: state.frozenSetup.boardState,
          locationStates: state.frozenSetup.locationStates,
          edgeStates: state.frozenSetup.edgeStates,
          viewport: {
            boardZoom: state.frozenSetup.boardZoom,
            boardPan: state.frozenSetup.boardPan,
          },
        }
      : null,
    viewport: {
      boardZoom: state.boardZoom,
      boardPan: state.boardPan,
    },
  };

  return createScenarioPackage(input);
}

export function exportBoardStoreScenarioJson(
  state: BoardStoreScenarioInput,
  metadata: ScenarioMetadata = {},
): ScenarioPackage {
  const scenario = exportBoardStoreScenario(state, {
    ...metadata,
    assetPersistence: "external-assets-folder",
  });
  const current = createExternalAssetReferenceMap(scenario.assets);
  const frozenSetup = scenario.frozenSetup
    ? {
        ...scenario.frozenSetup,
        assets: scenario.frozenSetup.assets.map(stripAssetImageUrls),
      }
    : null;
  const frozen = scenario.frozenSetup
    ? createExternalAssetReferenceMap(scenario.frozenSetup.assets)
    : new Map<string, string>();

  return {
    ...scenario,
    assets: scenario.assets.map(stripAssetImageUrls),
    board: replaceBoardBackgroundExternalUrl(scenario.board, current),
    frozenSetup: frozenSetup
      ? {
          ...frozenSetup,
          board: replaceBoardBackgroundExternalUrl(frozenSetup.board, frozen),
        }
      : null,
  };
}

export function resolveScenarioJsonAssetReferences(
  source: ScenarioPackage | string,
  availableAssets: readonly UploadedImageAsset[],
): ScenarioPackage {
  const scenario =
    typeof source === "string"
      ? parseScenarioPackage(source)
      : assertValidScenarioPackage(source);
  const current = resolveScenarioAssets(scenario.assets, availableAssets);
  const frozenSetup = scenario.frozenSetup
    ? {
        ...scenario.frozenSetup,
        ...resolveScenarioAssets(scenario.frozenSetup.assets, availableAssets),
      }
    : null;

  return assertValidScenarioPackage({
    ...scenario,
    assets: current.assets,
    board: replaceBoardBackgroundUrl(scenario.board, current.replacementByAssetId),
    frozenSetup: frozenSetup
      ? {
          ...frozenSetup,
          board: replaceBoardBackgroundUrl(
            frozenSetup.board,
            frozenSetup.replacementByAssetId,
          ),
        }
      : null,
  });
}

export function applyScenarioJsonToBoardStore(source: ScenarioPackage | string) {
  const currentState = useBoardStore.getState();
  const scenario = resolveScenarioJsonAssetReferences(source, [
    ...currentState.assets,
    ...(currentState.frozenSetup?.assets ?? []),
  ]);

  applyScenarioPackageToBoardStore(scenario);
}

export async function exportBoardStorePortableScenario(
  state: BoardStoreScenarioInput,
  metadata: ScenarioMetadata = {},
  loadAssetData: PortableAssetDataLoader,
): Promise<ScenarioPackage> {
  const scenario = exportBoardStoreScenario(state, metadata);
  const replacementByAssetId = new Map<string, PortableAssetData>();
  const loadCache = new Map<string, Promise<PortableAssetData | null | undefined>>();
  const embedAsset = async (asset: UploadedImageAsset) => {
    const cacheKey = `${asset.id}|${asset.url}|${asset.thumbnailUrl ?? ""}`;
    let loaded = loadCache.get(cacheKey);

    if (!loaded) {
      loaded = loadAssetData(asset);
      loadCache.set(cacheKey, loaded);
    }

    const data = await loaded;

    if (!data?.url && !data?.thumbnailUrl) {
      return asset;
    }

    const replacement = {
      ...(replacementByAssetId.get(asset.id) ?? {}),
      ...data,
    };

    replacementByAssetId.set(asset.id, replacement);

    return {
      ...asset,
      ...(data.url ? { url: data.url } : {}),
      ...(data.thumbnailUrl ? { thumbnailUrl: data.thumbnailUrl } : {}),
    };
  };
  const assets = await Promise.all(scenario.assets.map(embedAsset));
  const frozenSetup = scenario.frozenSetup
    ? {
        ...scenario.frozenSetup,
        assets: await Promise.all(scenario.frozenSetup.assets.map(embedAsset)),
      }
    : null;

  return {
    ...scenario,
    assets,
    board: replaceBoardBackgroundUrl(scenario.board, replacementByAssetId),
    frozenSetup: frozenSetup
      ? {
          ...frozenSetup,
          board: replaceBoardBackgroundUrl(
            frozenSetup.board,
            replacementByAssetId,
          ),
        }
      : null,
  };
}

export function isScenarioAssetReferenceUrl(url: string) {
  return url.startsWith(SCENARIO_ASSET_REFERENCE_URL_PREFIX);
}

function createExternalAssetReferenceMap(assets: readonly ScenarioAsset[]) {
  return new Map(
    assets.map((asset) => [asset.id, createExternalAssetReferenceUrl(asset)]),
  );
}

function stripAssetImageUrls(asset: ScenarioAsset): ScenarioAsset {
  const { thumbnailUrl: _thumbnailUrl, ...assetWithoutThumbnail } = asset;

  return {
    ...assetWithoutThumbnail,
    url: createExternalAssetReferenceUrl(asset),
  };
}

function createExternalAssetReferenceUrl(asset: ScenarioAsset) {
  const reference = asset.sourcePath || asset.manifestPath || asset.sourceUrl || asset.id;

  return `${SCENARIO_ASSET_REFERENCE_URL_PREFIX}${encodeURIComponent(reference)}`;
}

function replaceBoardBackgroundExternalUrl(
  board: BoardState,
  referenceByAssetId: ReadonlyMap<string, string>,
): BoardState {
  if (!board.background) {
    return board;
  }

  const url = referenceByAssetId.get(board.background.assetId);

  if (!url) {
    return board;
  }

  return {
    ...board,
    background: {
      ...board.background,
      url,
    },
  };
}

function resolveScenarioAssets(
  assets: readonly ScenarioAsset[],
  availableAssets: readonly UploadedImageAsset[],
) {
  const replacementByAssetId = new Map<string, PortableAssetData>();
  const resolvedAssets = assets.map((asset) => {
    const matchingAsset = findMatchingAvailableAsset(asset, availableAssets);

    if (!matchingAsset) {
      return asset;
    }

    const replacement: PortableAssetData = {
      url: matchingAsset.url,
      ...(matchingAsset.thumbnailUrl
        ? { thumbnailUrl: matchingAsset.thumbnailUrl }
        : {}),
    };

    replacementByAssetId.set(asset.id, replacement);

    return {
      ...asset,
      url: matchingAsset.url,
      ...(matchingAsset.thumbnailUrl
        ? { thumbnailUrl: matchingAsset.thumbnailUrl }
        : {}),
      ...(matchingAsset.width ? { width: matchingAsset.width } : {}),
      ...(matchingAsset.height ? { height: matchingAsset.height } : {}),
      sourcePath: asset.sourcePath ?? matchingAsset.sourcePath,
      manifestPath: asset.manifestPath ?? matchingAsset.manifestPath,
      sourceUrl: asset.sourceUrl ?? matchingAsset.sourceUrl,
      sourceHash: asset.sourceHash ?? matchingAsset.sourceHash,
    };
  });

  return {
    assets: resolvedAssets,
    replacementByAssetId,
  };
}

function findMatchingAvailableAsset(
  asset: ScenarioAsset,
  availableAssets: readonly UploadedImageAsset[],
) {
  const candidates = availableAssets.filter(
    (candidate) => !isScenarioAssetReferenceUrl(candidate.url),
  );
  const exactId = candidates.find((candidate) => candidate.id === asset.id);

  if (exactId) {
    return exactId;
  }

  const sourcePath = normalizeAssetPath(asset.sourcePath);

  if (sourcePath) {
    const byPath = candidates.find(
      (candidate) => normalizeAssetPath(candidate.sourcePath) === sourcePath,
    );

    if (byPath) {
      return byPath;
    }
  }

  if (asset.sourceHash) {
    const byHash = candidates.find(
      (candidate) => candidate.sourceHash === asset.sourceHash,
    );

    if (byHash) {
      return byHash;
    }
  }

  const fallbackMatches = candidates.filter(
    (candidate) =>
      candidate.name === asset.name &&
      candidate.category === asset.category &&
      candidate.mimeType === asset.mimeType &&
      candidate.size === asset.size,
  );

  return fallbackMatches.length === 1 ? fallbackMatches[0] : null;
}

export function normalizeAssetPath(path: string | undefined) {
  return path?.trim().replace(/\\/g, "/").toLowerCase() ?? "";
}

export function importBoardStoreScenario(
  source: ScenarioPackage | string,
): BoardStoreScenarioState {
  const scenario =
    typeof source === "string"
      ? parseScenarioPackage(source)
      : assertValidScenarioPackage(source);

  return {
    mode: scenario.mode,
    board: scenario.board,
    entityState: scenario.entityState,
    assets: scenario.assets,
    assetPlacements: scenario.assetPlacements,
    pawnSheets: scenario.pawnSheets,
    cardDeckState: scenario.cardDeckState,
    diceState: scenario.diceState,
    slotState: scenario.slotState,
    stackState: scenario.stackState,
    boardState: scenario.boardState,
    locationStates: scenario.locationStates,
    edgeStates: scenario.edgeStates,
    frozenSetup: scenario.frozenSetup
      ? {
          assets: scenario.frozenSetup.assets,
          board: scenario.frozenSetup.board,
          assetPlacements: scenario.frozenSetup.assetPlacements,
          entityState: scenario.frozenSetup.entityState,
          pawnSheets: scenario.frozenSetup.pawnSheets,
          cardDeckState: scenario.frozenSetup.cardDeckState,
          diceState: scenario.frozenSetup.diceState,
          slotState: scenario.frozenSetup.slotState,
          stackState: scenario.frozenSetup.stackState,
          boardState: scenario.frozenSetup.boardState,
          locationStates: scenario.frozenSetup.locationStates,
          edgeStates: scenario.frozenSetup.edgeStates,
          boardZoom: scenario.frozenSetup.viewport.boardZoom,
          boardPan: scenario.frozenSetup.viewport.boardPan,
        }
      : null,
    boardZoom: scenario.viewport.boardZoom,
    boardPan: scenario.viewport.boardPan,
  };
}

export function applyScenarioPackageToBoardStore(
  source: ScenarioPackage | string,
) {
  const restoredState = importBoardStoreScenario(source);
  const currentState = useBoardStore.getState();
  const currentAssets = [
    ...currentState.assets,
    ...(currentState.frozenSetup?.assets ?? []),
  ];
  const restoredAssets = [
    ...restoredState.assets,
    ...(restoredState.frozenSetup?.assets ?? []),
  ];

  revokeUnusedAssetObjectUrls(currentAssets, restoredAssets);

  useBoardStore.setState({
    ...restoredState,
    selectedAssetId: null,
    selectedLocationId: null,
    selectedPlacementId: null,
    selectedEdgeId: null,
    edgeDraftFromId: null,
    activeTool: "select",
    lastError: null,
  });
}

function replaceBoardBackgroundUrl(
  board: BoardState,
  replacementByAssetId: ReadonlyMap<string, PortableAssetData>,
): BoardState {
  if (!board.background) {
    return board;
  }

  const replacement = replacementByAssetId.get(board.background.assetId);

  if (!replacement?.url) {
    return board;
  }

  return {
    ...board,
    background: {
      ...board.background,
      url: replacement.url,
    },
  };
}
