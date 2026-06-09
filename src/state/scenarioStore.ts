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
  FrozenSetupSnapshot,
  PawnSheet,
  ScenarioMode,
  UploadedImageAsset,
} from "./boardStore";
import { useBoardStore } from "./boardStore";
import type { BoardState } from "../engine/board";
import type { EntityState } from "../engine/entity";

export interface BoardStoreScenarioState {
  mode: ScenarioMode;
  board: BoardState;
  entityState: EntityState;
  assets: UploadedImageAsset[];
  assetPlacements: AssetPlacement[];
  pawnSheets: Record<string, PawnSheet>;
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
  | "mode"
  | "boardState"
  | "locationStates"
  | "edgeStates"
  | "frozenSetup"
  | "boardZoom"
  | "boardPan"
>;

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
