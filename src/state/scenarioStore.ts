import {
  assertValidScenarioPackage,
  createScenarioPackage,
  parseScenarioPackage,
} from "../engine/serialization";
import type {
  ScenarioMetadata,
  ScenarioPackage,
  ScenarioPackageInput,
} from "../engine/serialization";
import type {
  AssetPlacement,
  BoardPan,
  BoardStore,
  PawnSheet,
  UploadedImageAsset,
} from "./boardStore";
import { useBoardStore } from "./boardStore";
import type { BoardState } from "../engine/board";
import type { EntityState } from "../engine/entity";

export interface BoardStoreScenarioState {
  board: BoardState;
  entityState: EntityState;
  assets: UploadedImageAsset[];
  assetPlacements: AssetPlacement[];
  pawnSheets: Record<string, PawnSheet>;
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
  | "boardZoom"
  | "boardPan"
>;

export function exportBoardStoreScenario(
  state: BoardStoreScenarioInput,
  metadata: ScenarioMetadata = {},
): ScenarioPackage {
  const input: ScenarioPackageInput = {
    metadata,
    assets: state.assets,
    board: state.board,
    assetPlacements: state.assetPlacements,
    entityState: state.entityState,
    pawnSheets: state.pawnSheets,
    viewport: {
      boardZoom: state.boardZoom,
      boardPan: state.boardPan,
    },
  };

  return createScenarioPackage(input);
}

export function importBoardStoreScenario(
  source: ScenarioPackage | string,
): BoardStoreScenarioState {
  const scenario =
    typeof source === "string"
      ? parseScenarioPackage(source)
      : assertValidScenarioPackage(source);

  return {
    board: scenario.board,
    entityState: scenario.entityState,
    assets: scenario.assets,
    assetPlacements: scenario.assetPlacements,
    pawnSheets: scenario.pawnSheets,
    boardZoom: scenario.viewport.boardZoom,
    boardPan: scenario.viewport.boardPan,
  };
}

export function applyScenarioPackageToBoardStore(
  source: ScenarioPackage | string,
) {
  const restoredState = importBoardStoreScenario(source);

  useBoardStore.setState({
    ...restoredState,
    selectedAssetId: null,
    selectedLocationId: null,
    selectedPlacementId: null,
    edgeDraftFromId: null,
    activeTool: "select",
    lastError: null,
  });
}
