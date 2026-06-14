import { create } from "zustand";
import {
  addEdge,
  addLocation,
  createEmptyBoard,
  createSequentialId,
  removeEdge,
  removeLocation,
  setBoardBackground,
  updateEdge,
  updateLocation,
} from "../engine/board";
import type { BoardEdge, BoardLocation, BoardState } from "../engine/board";
import {
  canPlaceAssetForCategory,
  clearLocationBindings,
  createEmptyEntityState,
  createEntity,
  removeEntity,
} from "../engine/entity";
import type { EntityState, JsonRecord, ResourceCategory } from "../engine/entity";

const DEFAULT_TOKEN_MAX_COPIES = 999;
const RUN_MODE_LOCK_MESSAGE =
  "Run mode freezes the Board Template and Setup Preset. Switch to Edit to change setup.";

export interface UploadedImageAsset {
  id: string;
  category: ResourceCategory;
  name: string;
  url: string;
  /**
   * Small downscaled preview generated off the import path. List UI must
   * render this instead of `url` so large imports never decode full-size
   * images.
   */
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  maxCopies: number;
  placementWidth: number;
  placementHeight: number;
}

export interface AssetMediaPatch {
  assetId: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface AssetPlacement {
  id: string;
  assetId: string;
  category: ResourceCategory;
  entityId: string;
  locationId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PawnTokenCounter {
  assetId: string;
  count: number;
}

export interface PawnSheet {
  characterCardAssetId?: string;
  heldCardAssetIds: string[];
  counters: PawnTokenCounter[];
}

export interface BoardPan {
  x: number;
  y: number;
}

export type ScenarioMode = "edit" | "run";
export type BoardTool = "select" | "location" | "edge";

export type AssetPlacementConfigPatch = Partial<
  Pick<UploadedImageAsset, "placementWidth" | "placementHeight" | "maxCopies">
>;

export type AccessoryPlacementPatch = Partial<
  Pick<AssetPlacement, "x" | "y" | "width" | "height">
>;

export interface BoardStore {
  mode: ScenarioMode;
  board: BoardState;
  entityState: EntityState;
  assets: UploadedImageAsset[];
  assetPlacements: AssetPlacement[];
  pawnSheets: Record<string, PawnSheet>;
  boardState: JsonRecord;
  locationStates: Record<string, JsonRecord>;
  edgeStates: Record<string, JsonRecord>;
  frozenSetup: FrozenSetupSnapshot | null;
  selectedAssetId: string | null;
  selectedLocationId: string | null;
  selectedPlacementId: string | null;
  selectedEdgeId: string | null;
  edgeDraftFromId: string | null;
  activeTool: BoardTool;
  boardZoom: number;
  boardPan: BoardPan;
  isCreationPanelCollapsed: boolean;
  isInspectorCollapsed: boolean;
  isWorkbenchCollapsed: boolean;
  lastError: string | null;
  addAsset: (asset: UploadedImageAsset) => void;
  addAssets: (assets: UploadedImageAsset[]) => void;
  applyAssetMediaPatches: (patches: AssetMediaPatch[]) => void;
  removeAsset: (assetId: string) => void;
  updateAssetCategory: (assetId: string, category: ResourceCategory) => void;
  updateAssetPlacementConfig: (
    assetId: string,
    patch: AssetPlacementConfigPatch,
  ) => void;
  setBackgroundAsset: (assetId: string) => void;
  selectAsset: (assetId: string | null) => void;
  setActiveTool: (tool: BoardTool) => void;
  selectLocation: (locationId: string | null) => void;
  selectPlacement: (placementId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  createLocationAt: (x: number, y: number) => string | null;
  moveLocation: (locationId: string, x: number, y: number) => void;
  updateLocationDetails: (
    locationId: string,
    patch: Partial<Omit<BoardLocation, "id">>,
  ) => void;
  deleteLocation: (locationId: string) => void;
  updateSelectedLocationName: (name: string) => void;
  deleteSelectedLocation: () => void;
  startOrCompleteEdge: (locationId: string) => void;
  updateEdgeDetails: (
    edgeId: string,
    patch: Partial<Omit<BoardEdge, "id">>,
  ) => void;
  deleteEdgeById: (edgeId: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  deleteEdge: (edgeId: string) => void;
  createAssetPlacement: (
    assetId: string,
    x: number,
    y: number,
    locationId?: string,
  ) => string | null;
  updateAssetPlacement: (
    placementId: string,
    patch: AccessoryPlacementPatch,
  ) => void;
  adjustTokenPlacementCount: (placementId: string, delta: number) => void;
  deleteSelectedPlacement: () => void;
  setPawnCharacterCard: (placementId: string, assetId: string) => void;
  addPawnHeldCard: (placementId: string, assetId: string) => void;
  removePawnHeldCard: (placementId: string, index: number) => void;
  adjustPawnCounter: (
    placementId: string,
    assetId: string,
    delta: number,
  ) => void;
  setBoardZoom: (zoom: number) => void;
  setBoardPan: (pan: BoardPan) => void;
  resetBoardView: () => void;
  setCreationPanelCollapsed: (isCollapsed: boolean) => void;
  setInspectorCollapsed: (isCollapsed: boolean) => void;
  setWorkbenchCollapsed: (isCollapsed: boolean) => void;
  setLastError: (message: string) => void;
  clearError: () => void;
  updateBoardState: (patch: JsonRecord) => void;
  updateEntityObjectState: (entityId: string, patch: JsonRecord) => void;
  updateLocationState: (locationId: string, patch: JsonRecord) => void;
  updateEdgeState: (edgeId: string, patch: JsonRecord) => void;
  enterRunMode: () => void;
  returnToEditMode: () => void;
  moveEntityToLocation: (entityId: string, locationId: string) => void;
  adjustEntityCounter: (
    entityId: string,
    key: string,
    delta: number,
  ) => void;
  moveCardToZone: (entityId: string, zoneId: string) => void;
}

export interface FrozenSetupSnapshot {
  board: BoardState;
  entityState: EntityState;
  assets: UploadedImageAsset[];
  assetPlacements: AssetPlacement[];
  pawnSheets: Record<string, PawnSheet>;
  boardState: JsonRecord;
  locationStates: Record<string, JsonRecord>;
  edgeStates: Record<string, JsonRecord>;
  boardZoom: number;
  boardPan: BoardPan;
}

export const useBoardStore = create<BoardStore>((set) => ({
  mode: "edit",
  board: createEmptyBoard(),
  entityState: createEmptyEntityState(),
  assets: [],
  assetPlacements: [],
  pawnSheets: {},
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
  addAsset: (asset) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      if (state.assets.some((candidate) => candidate.id === asset.id)) {
        return state;
      }

      return {
        assets: [...state.assets, normalizeAsset(asset)],
        selectedAssetId: asset.id,
        lastError: null,
      };
    }),
  addAssets: (assets) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const existingIds = new Set(state.assets.map((asset) => asset.id));
      const nextAssets = assets.reduce<UploadedImageAsset[]>((result, asset) => {
        if (existingIds.has(asset.id)) {
          return result;
        }

        existingIds.add(asset.id);
        result.push(normalizeAsset(asset));
        return result;
      }, []);

      if (nextAssets.length === 0) {
        return state;
      }

      return {
        assets: [...state.assets, ...nextAssets],
        selectedAssetId: nextAssets[nextAssets.length - 1]?.id ?? state.selectedAssetId,
        lastError: null,
      };
    }),
  applyAssetMediaPatches: (patches) =>
    set((state) => {
      if (patches.length === 0) {
        return state;
      }

      const patchByAssetId = new Map<string, AssetMediaPatch>();

      for (const patch of patches) {
        const previousPatch = patchByAssetId.get(patch.assetId);

        if (
          previousPatch?.thumbnailUrl &&
          patch.thumbnailUrl &&
          previousPatch.thumbnailUrl !== patch.thumbnailUrl
        ) {
          URL.revokeObjectURL(previousPatch.thumbnailUrl);
        }

        patchByAssetId.set(patch.assetId, patch);
      }

      const knownAssetIds = new Set(state.assets.map((asset) => asset.id));

      // Assets removed while their media was still decoding must not leak
      // freshly created thumbnail object URLs.
      for (const patch of patches) {
        if (patch.thumbnailUrl && !knownAssetIds.has(patch.assetId)) {
          URL.revokeObjectURL(patch.thumbnailUrl);
        }
      }

      let didChange = false;
      const nextAssets = state.assets.map((asset) => {
        const patch = patchByAssetId.get(asset.id);

        if (!patch) {
          return asset;
        }

        didChange = true;

        if (
          patch.thumbnailUrl &&
          asset.thumbnailUrl &&
          patch.thumbnailUrl !== asset.thumbnailUrl
        ) {
          URL.revokeObjectURL(asset.thumbnailUrl);
        }

        return normalizeAsset({
          ...asset,
          width: patch.width ?? asset.width,
          height: patch.height ?? asset.height,
          thumbnailUrl: patch.thumbnailUrl ?? asset.thumbnailUrl,
        });
      });

      if (!didChange) {
        return state;
      }

      const background = state.board.background;
      const backgroundPatch = background
        ? patchByAssetId.get(background.assetId)
        : undefined;

      return {
        assets: nextAssets,
        board: backgroundPatch
          ? setBoardBackground(state.board, {
              ...background!,
              width: backgroundPatch.width ?? background!.width,
              height: backgroundPatch.height ?? background!.height,
            })
          : state.board,
      };
    }),
  removeAsset: (assetId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const asset = state.assets.find((candidate) => candidate.id === assetId);
      const removedPlacementIds = new Set(
        state.assetPlacements
          .filter((placement) => placement.assetId === assetId)
          .map((placement) => placement.id),
      );
      const removedEntityIds = new Set(
        state.assetPlacements
          .filter((placement) => placement.assetId === assetId)
          .map((placement) => placement.entityId),
      );

      if (asset) {
        revokeAssetObjectUrls(asset);
      }

      return {
        board:
          state.board.background?.assetId === assetId
            ? setBoardBackground(state.board, null)
            : state.board,
        assets: state.assets.filter((candidate) => candidate.id !== assetId),
        entityState: {
          entities: state.entityState.entities.filter(
            (entity) => !removedEntityIds.has(entity.id),
          ),
        },
        assetPlacements: state.assetPlacements.filter(
          (placement) => placement.assetId !== assetId,
        ),
        pawnSheets: removeAssetFromPawnSheets(
          removePawnSheetsByPlacementId(state.pawnSheets, removedPlacementIds),
          assetId,
        ),
        selectedAssetId:
          state.selectedAssetId === assetId ? null : state.selectedAssetId,
        selectedPlacementId:
          state.selectedPlacementId &&
          state.assetPlacements.some(
            (placement) =>
              placement.id === state.selectedPlacementId &&
              placement.assetId === assetId,
          )
            ? null
            : state.selectedPlacementId,
        lastError: null,
      };
    }),
  updateAssetCategory: (assetId, category) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      if (!state.assets.some((asset) => asset.id === assetId)) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

      const nextAssets = state.assets.map((asset) => {
        if (asset.id !== assetId) {
          return asset;
        }

        return normalizeAsset({
          ...asset,
          category,
          maxCopies:
            category === "TOKEN" && asset.maxCopies === 1
              ? DEFAULT_TOKEN_MAX_COPIES
              : asset.maxCopies,
        });
      });
      const removedPlacements = canPlaceAssetForCategory(category)
        ? []
        : state.assetPlacements.filter(
            (placement) => placement.assetId === assetId,
          );
      const removedEntityIds = new Set(
        removedPlacements.map((placement) => placement.entityId),
      );

      return {
        assets: nextAssets,
        board:
          category === "BOARD"
            ? state.board
            : state.board.background?.assetId === assetId
              ? setBoardBackground(state.board, null)
              : state.board,
        assetPlacements: canPlaceAssetForCategory(category)
          ? state.assetPlacements.map((placement) =>
              placement.assetId === assetId
                ? {
                    ...placement,
                    category,
                  }
                : placement,
            )
          : state.assetPlacements.filter(
              (placement) => placement.assetId !== assetId,
            ),
        pawnSheets: reconcilePawnSheets(
          state.pawnSheets,
          canPlaceAssetForCategory(category)
            ? state.assetPlacements.map((placement) =>
                placement.assetId === assetId
                  ? {
                      ...placement,
                      category,
                    }
                  : placement,
              )
            : state.assetPlacements.filter(
                (placement) => placement.assetId !== assetId,
              ),
        ),
        entityState: {
          entities: state.entityState.entities
            .filter((entity) => !removedEntityIds.has(entity.id))
            .map((entity) =>
              entity.state.assetId === assetId
                ? {
                    ...entity,
                    type: category,
                    state: {
                      ...entity.state,
                      category,
                    },
                  }
                : entity,
            ),
        },
        selectedPlacementId:
          state.selectedPlacementId &&
          removedPlacements.some(
            (placement) => placement.id === state.selectedPlacementId,
          )
            ? null
            : state.selectedPlacementId,
        lastError: null,
      };
    }),
  updateAssetPlacementConfig: (assetId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const asset = state.assets.find((candidate) => candidate.id === assetId);

      if (!asset) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

      const nextAsset = normalizeAsset({
        ...asset,
        placementWidth: clampInteger(
          patch.placementWidth ?? asset.placementWidth,
          12,
          640,
        ),
        placementHeight: clampInteger(
          patch.placementHeight ?? asset.placementHeight,
          12,
          640,
        ),
        maxCopies: clampInteger(patch.maxCopies ?? asset.maxCopies, 1, 999),
      });

      return {
        assets: state.assets.map((candidate) =>
          candidate.id === assetId ? nextAsset : candidate,
        ),
        lastError: null,
      };
    }),
  setBackgroundAsset: (assetId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const asset = state.assets.find((candidate) => candidate.id === assetId);

      if (!asset) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

      const removedPlacements = state.assetPlacements.filter(
        (placement) => placement.assetId === assetId,
      );
      const removedPlacementIds = new Set(
        removedPlacements.map((placement) => placement.id),
      );
      const removedEntityIds = new Set(
        removedPlacements.map((placement) => placement.entityId),
      );

      return {
        board: setBoardBackground(state.board, {
          assetId: asset.id,
          name: asset.name,
          url: asset.url,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
        }),
        assets: state.assets.map((candidate) =>
          candidate.id === asset.id ? { ...candidate, category: "BOARD" } : candidate,
        ),
        entityState: {
          entities: state.entityState.entities.filter(
            (entity) => !removedEntityIds.has(entity.id),
          ),
        },
        assetPlacements: state.assetPlacements.filter(
          (placement) => placement.assetId !== assetId,
        ),
        pawnSheets: removePawnSheetsByPlacementId(
          state.pawnSheets,
          removedPlacementIds,
        ),
        selectedAssetId: asset.id,
        selectedPlacementId:
          state.selectedPlacementId &&
          removedPlacementIds.has(state.selectedPlacementId)
            ? null
            : state.selectedPlacementId,
        lastError: null,
      };
    }),
  setActiveTool: (tool) =>
    set({
      activeTool: tool,
      edgeDraftFromId: null,
      lastError: null,
    }),
  selectAsset: (assetId) =>
    set((state) => {
      if (assetId && !state.assets.some((asset) => asset.id === assetId)) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

      return {
        selectedAssetId: assetId,
        lastError: null,
      };
    }),
  selectLocation: (locationId) =>
    set({
      selectedLocationId: locationId,
      selectedPlacementId: null,
      selectedEdgeId: null,
      lastError: null,
    }),
  selectPlacement: (placementId) =>
    set({
      selectedLocationId: null,
      selectedPlacementId: placementId,
      selectedEdgeId: null,
      lastError: null,
    }),
  selectEdge: (edgeId) =>
    set({
      selectedLocationId: null,
      selectedPlacementId: null,
      selectedEdgeId: edgeId,
      lastError: null,
    }),
  createLocationAt: (x, y) => {
    let createdId: string | null = null;

    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        const id = createSequentialId(
          "loc",
          state.board.locations.map((location) => location.id),
        );
        const name = getDefaultLocationName(id);
        const nextBoard = addLocation(state.board, { id, name, x, y });
        createdId = id;

        return {
          board: nextBoard,
          selectedLocationId: id,
          selectedPlacementId: null,
          selectedEdgeId: null,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    });

    return createdId;
  },
  moveLocation: (locationId, x, y) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          board: updateLocation(state.board, locationId, { x, y }),
          selectedLocationId: locationId,
          selectedPlacementId: null,
          selectedEdgeId: null,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  updateLocationDetails: (locationId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          board: updateLocation(state.board, locationId, patch),
          selectedLocationId: locationId,
          selectedPlacementId: null,
          selectedEdgeId: null,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteLocation: (locationId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        const removedEdgeIds = getConnectedEdgeIds(state.board.edges, locationId);
        const selectedLocationId =
          state.selectedLocationId === locationId ? null : state.selectedLocationId;

        return {
          board: removeLocation(state.board, locationId),
          locationStates: omitRecordKey(state.locationStates, locationId),
          edgeStates: omitRecordKeys(state.edgeStates, removedEdgeIds),
          entityState: clearLocationBindings(state.entityState, locationId),
          assetPlacements: state.assetPlacements.map((placement) => {
            if (placement.locationId !== locationId) {
              return placement;
            }

            const { locationId: _locationId, ...unboundPlacement } = placement;
            return unboundPlacement;
          }),
          selectedLocationId,
          selectedPlacementId:
            state.selectedPlacementId &&
            state.assetPlacements.some(
              (placement) =>
                placement.id === state.selectedPlacementId &&
                placement.locationId === locationId,
            )
              ? null
              : state.selectedPlacementId,
          selectedEdgeId:
            state.selectedEdgeId && removedEdgeIds.has(state.selectedEdgeId)
              ? null
              : state.selectedEdgeId,
          edgeDraftFromId: state.edgeDraftFromId === locationId ? null : state.edgeDraftFromId,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  updateSelectedLocationName: (name) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      if (!state.selectedLocationId) {
        return state;
      }

      try {
        return {
          board: updateLocation(state.board, state.selectedLocationId, { name }),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteSelectedLocation: () =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      if (!state.selectedLocationId) {
        return state;
      }

      try {
        const removedEdgeIds = getConnectedEdgeIds(
          state.board.edges,
          state.selectedLocationId,
        );

        return {
          board: removeLocation(state.board, state.selectedLocationId),
          locationStates: omitRecordKey(
            state.locationStates,
            state.selectedLocationId,
          ),
          edgeStates: omitRecordKeys(state.edgeStates, removedEdgeIds),
          entityState: clearLocationBindings(
            state.entityState,
            state.selectedLocationId,
          ),
          assetPlacements: state.assetPlacements.map((placement) => {
            if (placement.locationId !== state.selectedLocationId) {
              return placement;
            }

            const { locationId: _locationId, ...unboundPlacement } = placement;
            return unboundPlacement;
          }),
          selectedLocationId: null,
          selectedPlacementId: null,
          selectedEdgeId: null,
          edgeDraftFromId:
            state.edgeDraftFromId === state.selectedLocationId
              ? null
              : state.edgeDraftFromId,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  startOrCompleteEdge: (locationId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      if (!state.edgeDraftFromId) {
        return {
          edgeDraftFromId: locationId,
          selectedLocationId: locationId,
          selectedPlacementId: null,
          selectedEdgeId: null,
          lastError: null,
        };
      }

      if (state.edgeDraftFromId === locationId) {
        return {
          edgeDraftFromId: null,
          selectedLocationId: locationId,
          selectedPlacementId: null,
          selectedEdgeId: null,
          lastError: null,
        };
      }

      try {
        const id = createSequentialId(
          "edge",
          state.board.edges.map((edge) => edge.id),
        );
        const nextBoard = addEdge(state.board, {
          id,
          fromId: state.edgeDraftFromId,
          toId: locationId,
        });

        return {
          board: nextBoard,
          edgeDraftFromId: null,
          selectedLocationId: null,
          selectedPlacementId: null,
          selectedEdgeId: id,
          lastError: null,
        };
    } catch (error) {
      return {
        edgeDraftFromId: null,
        selectedLocationId: locationId,
        selectedPlacementId: null,
        selectedEdgeId: null,
        lastError: getErrorMessage(error),
      };
    }
  }),
  updateEdgeDetails: (edgeId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          board: updateEdge(state.board, edgeId, patch),
          edgeDraftFromId: null,
          selectedLocationId: null,
          selectedPlacementId: null,
          selectedEdgeId: edgeId,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteEdgeById: (edgeId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          board: removeEdge(state.board, edgeId),
          edgeStates: omitRecordKey(state.edgeStates, edgeId),
          selectedEdgeId:
            state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
          edgeDraftFromId: null,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  updateEdgeLabel: (edgeId, label) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          board: updateEdge(state.board, edgeId, { label }),
          selectedLocationId: null,
          selectedPlacementId: null,
          selectedEdgeId: edgeId,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteEdge: (edgeId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          board: removeEdge(state.board, edgeId),
          edgeStates: omitRecordKey(state.edgeStates, edgeId),
          selectedEdgeId:
            state.selectedEdgeId === edgeId ? null : state.selectedEdgeId,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  createAssetPlacement: (assetId, x, y, locationId) => {
    let createdId: string | null = null;

    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const asset = state.assets.find((candidate) => candidate.id === assetId);

      if (!asset) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

      if (!canPlaceAssetForCategory(asset.category)) {
        return {
          lastError: `${asset.category} assets cannot be placed on the graph board.`,
        };
      }

      const usedCopies = state.assetPlacements.filter(
        (placement) => placement.assetId === assetId,
      ).length;

      if (usedCopies >= asset.maxCopies) {
        return {
          lastError: `${asset.name} has reached its ${asset.maxCopies} copy limit.`,
        };
      }

      const id = createSequentialId(
        `${asset.category.toLowerCase()}-copy`,
        state.assetPlacements.map((placement) => placement.id),
      );
      const entityId = createSequentialId(
        "entity",
        state.entityState.entities.map((entity) => entity.id),
      );

      createdId = id;

      try {
        const entityState = createEntity(
          state.entityState,
          {
            id: entityId,
            type: asset.category,
            state: {
              assetId,
              category: asset.category,
              placementId: id,
              ...(asset.category === "TOKEN" ? { count: 1 } : {}),
            },
            ...(locationId ? { locationId } : {}),
          },
          state.board,
        );

        return {
          entityState,
          assetPlacements: [
            ...state.assetPlacements,
            {
              id,
              assetId,
              category: asset.category,
              entityId,
              ...(locationId ? { locationId } : {}),
              x: clampNumber(x, 0, 1),
              y: clampNumber(y, 0, 1),
              width: asset.placementWidth,
              height: asset.placementHeight,
            },
          ],
          pawnSheets:
            asset.category === "PAWN"
              ? {
                  ...state.pawnSheets,
                  [id]: createEmptyPawnSheet(),
                }
              : state.pawnSheets,
          selectedLocationId: null,
          selectedPlacementId: id,
          selectedEdgeId: null,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    });

    return createdId;
  },
  updateAssetPlacement: (placementId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError:
            "Run mode moves objects by Location. Use Move to Location instead.",
        };
      }

      const placement = state.assetPlacements.find(
        (candidate) => candidate.id === placementId,
      );

      if (!placement) {
        return {
          lastError: `Placed piece '${placementId}' was not found.`,
        };
      }

      const nextPlacement: AssetPlacement = {
        ...placement,
        ...patch,
        x: clampNumber(patch.x ?? placement.x, 0, 1),
        y: clampNumber(patch.y ?? placement.y, 0, 1),
        width: clampInteger(patch.width ?? placement.width, 12, 640),
        height: clampInteger(patch.height ?? placement.height, 12, 640),
      };

      return {
        assetPlacements: state.assetPlacements.map((candidate) =>
          candidate.id === placementId ? nextPlacement : candidate,
        ),
        selectedLocationId: null,
        selectedPlacementId: placementId,
        selectedEdgeId: null,
        lastError: null,
      };
    }),
  adjustTokenPlacementCount: (placementId, delta) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const placement = state.assetPlacements.find(
        (candidate) => candidate.id === placementId,
      );

      if (!placement || placement.category !== "TOKEN") {
        return {
          lastError: `Token placement '${placementId}' was not found.`,
        };
      }

      const entity = state.entityState.entities.find(
        (candidate) => candidate.id === placement.entityId,
      );

      if (!entity) {
        return {
          lastError: `Entity '${placement.entityId}' was not found.`,
        };
      }

      const nextCount = Math.max(
        0,
        getNumericCount(entity.state.count, 1) + Math.trunc(delta),
      );

      if (nextCount === 0) {
        return {
          entityState: removeEntity(state.entityState, entity.id),
          assetPlacements: state.assetPlacements.filter(
            (candidate) => candidate.id !== placementId,
          ),
          selectedPlacementId:
            state.selectedPlacementId === placementId
              ? null
              : state.selectedPlacementId,
          lastError: null,
        };
      }

      return {
        entityState: {
          entities: state.entityState.entities.map((candidate) =>
            candidate.id === entity.id
              ? {
                  ...candidate,
                  state: {
                    ...candidate.state,
                    count: nextCount,
                  },
                }
              : candidate,
          ),
        },
        selectedLocationId: null,
        selectedPlacementId: placementId,
        selectedEdgeId: null,
        lastError: null,
      };
    }),
  deleteSelectedPlacement: () =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      if (!state.selectedPlacementId) {
        return state;
      }

      const placement = state.assetPlacements.find(
        (candidate) => candidate.id === state.selectedPlacementId,
      );
      const nextEntityState = placement
        ? removeEntity(state.entityState, placement.entityId)
        : state.entityState;

      return {
        entityState: nextEntityState,
        assetPlacements: state.assetPlacements.filter(
          (placement) => placement.id !== state.selectedPlacementId,
        ),
        pawnSheets: removePawnSheetsByPlacementId(
          state.pawnSheets,
          new Set([state.selectedPlacementId]),
        ),
        selectedPlacementId: null,
        lastError: null,
      };
    }),
  setPawnCharacterCard: (placementId, assetId) =>
    set((state) => {
      const validation = validatePawnSheetAsset(state, placementId, assetId, "CARD");

      if (validation) {
        return validation;
      }

      const currentSheet =
        state.pawnSheets[placementId] ?? createEmptyPawnSheet();

      if (
        currentSheet.characterCardAssetId !== assetId &&
        countAssetUsage(state, assetId) >= getAssetCopyLimit(state, assetId)
      ) {
        return {
          lastError: getAssetLimitMessage(state, assetId),
        };
      }

      return {
        pawnSheets: {
          ...state.pawnSheets,
          [placementId]: {
            ...currentSheet,
            characterCardAssetId: assetId,
          },
        },
        lastError: null,
      };
    }),
  addPawnHeldCard: (placementId, assetId) =>
    set((state) => {
      const validation = validatePawnSheetAsset(state, placementId, assetId, "CARD");

      if (validation) {
        return validation;
      }

      if (countAssetUsage(state, assetId) >= getAssetCopyLimit(state, assetId)) {
        return {
          lastError: getAssetLimitMessage(state, assetId),
        };
      }

      const currentSheet =
        state.pawnSheets[placementId] ?? createEmptyPawnSheet();

      return {
        pawnSheets: {
          ...state.pawnSheets,
          [placementId]: {
            ...currentSheet,
            heldCardAssetIds: [...currentSheet.heldCardAssetIds, assetId],
          },
        },
        lastError: null,
      };
    }),
  removePawnHeldCard: (placementId, index) =>
    set((state) => {
      const currentSheet = state.pawnSheets[placementId];

      if (!currentSheet) {
        return state;
      }

      return {
        pawnSheets: {
          ...state.pawnSheets,
          [placementId]: {
            ...currentSheet,
            heldCardAssetIds: currentSheet.heldCardAssetIds.filter(
              (_assetId, candidateIndex) => candidateIndex !== index,
            ),
          },
        },
        lastError: null,
      };
    }),
  adjustPawnCounter: (placementId, assetId, delta) =>
    set((state) => {
      const validation = validatePawnSheetAsset(state, placementId, assetId, "TOKEN");

      if (validation) {
        return validation;
      }

      const currentSheet =
        state.pawnSheets[placementId] ?? createEmptyPawnSheet();
      const existingCounter = currentSheet.counters.find(
        (counter) => counter.assetId === assetId,
      );
      const currentCount = existingCounter?.count ?? 0;
      const nextCount = Math.max(0, currentCount + Math.trunc(delta));

      if (
        nextCount > currentCount &&
        countAssetUsage(state, assetId) >= getAssetCopyLimit(state, assetId)
      ) {
        return {
          lastError: getAssetLimitMessage(state, assetId),
        };
      }

      const nextCounters = existingCounter
        ? currentSheet.counters.map((counter) =>
            counter.assetId === assetId
              ? {
                  ...counter,
                  count: nextCount,
                }
              : counter,
          )
        : [
            ...currentSheet.counters,
            {
              assetId,
              count: nextCount,
            },
          ];

      return {
        pawnSheets: {
          ...state.pawnSheets,
          [placementId]: {
            ...currentSheet,
            counters: nextCounters,
          },
        },
        lastError: null,
      };
    }),
  setBoardZoom: (zoom) =>
    set({
      boardZoom: clampNumber(zoom, 0.5, 4),
    }),
  setBoardPan: (pan) =>
    set({
      boardPan: {
        x: Number.isFinite(pan.x) ? pan.x : 0,
        y: Number.isFinite(pan.y) ? pan.y : 0,
      },
    }),
  resetBoardView: () =>
    set({
      boardZoom: 1,
      boardPan: { x: 0, y: 0 },
    }),
  setCreationPanelCollapsed: (isCollapsed) =>
    set({
      isCreationPanelCollapsed: isCollapsed,
    }),
  setInspectorCollapsed: (isCollapsed) =>
    set({
      isInspectorCollapsed: isCollapsed,
    }),
  setWorkbenchCollapsed: (isCollapsed) =>
    set({
      isWorkbenchCollapsed: isCollapsed,
    }),
  setLastError: (message) =>
    set({
      lastError: message,
    }),
  clearError: () =>
    set({
      lastError: null,
    }),
  updateBoardState: (patch) =>
    set((state) => ({
      boardState: {
        ...state.boardState,
        ...patch,
      },
      lastError: null,
    })),
  updateEntityObjectState: (entityId, patch) =>
    set((state) => {
      if (!state.entityState.entities.some((entity) => entity.id === entityId)) {
        return {
          lastError: `Entity '${entityId}' was not found.`,
        };
      }

      return {
        entityState: {
          entities: state.entityState.entities.map((entity) =>
            entity.id === entityId
              ? {
                  ...entity,
                  state: {
                    ...entity.state,
                    ...patch,
                  },
                }
              : entity,
          ),
        },
        lastError: null,
      };
    }),
  updateLocationState: (locationId, patch) =>
    set((state) => {
      if (!state.board.locations.some((location) => location.id === locationId)) {
        return {
          lastError: `Location '${locationId}' was not found.`,
        };
      }

      return {
        locationStates: {
          ...state.locationStates,
          [locationId]: {
            ...(state.locationStates[locationId] ?? {}),
            ...patch,
          },
        },
        lastError: null,
      };
    }),
  updateEdgeState: (edgeId, patch) =>
    set((state) => {
      if (!state.board.edges.some((edge) => edge.id === edgeId)) {
        return {
          lastError: `Edge '${edgeId}' was not found.`,
        };
      }

      return {
        edgeStates: {
          ...state.edgeStates,
          [edgeId]: {
            ...(state.edgeStates[edgeId] ?? {}),
            ...patch,
          },
        },
        lastError: null,
      };
    }),
  enterRunMode: () =>
    set((state) => {
      if (state.mode === "run") {
        return state;
      }

      return {
        mode: "run",
        frozenSetup: createFrozenSetupSnapshot(state),
        selectedAssetId: null,
        selectedLocationId: null,
        selectedPlacementId: null,
        selectedEdgeId: null,
        edgeDraftFromId: null,
        activeTool: "select",
        lastError: null,
      };
    }),
  returnToEditMode: () =>
    set((state) => {
      if (!state.frozenSetup) {
        return {
          mode: "edit",
          lastError: null,
        };
      }

      return {
        ...cloneJson(state.frozenSetup),
        mode: "edit",
        frozenSetup: null,
        selectedAssetId: null,
        selectedLocationId: null,
        selectedPlacementId: null,
        selectedEdgeId: null,
        edgeDraftFromId: null,
        activeTool: "select",
        lastError: null,
      };
    }),
  moveEntityToLocation: (entityId, locationId) =>
    set((state) => {
      const location = state.board.locations.find(
        (candidate) => candidate.id === locationId,
      );

      if (!location) {
        return {
          lastError: `Location '${locationId}' was not found.`,
        };
      }

      if (!state.entityState.entities.some((entity) => entity.id === entityId)) {
        return {
          lastError: `Entity '${entityId}' was not found.`,
        };
      }

      return {
        entityState: {
          entities: state.entityState.entities.map((entity) =>
            entity.id === entityId ? { ...entity, locationId } : entity,
          ),
        },
        assetPlacements: state.assetPlacements.map((placement) =>
          placement.entityId === entityId
            ? {
                ...placement,
                locationId,
                x: location.x,
                y: location.y,
              }
            : placement,
        ),
        lastError: null,
      };
    }),
  adjustEntityCounter: (entityId, key, delta) =>
    set((state) => {
      const entity = state.entityState.entities.find(
        (candidate) => candidate.id === entityId,
      );

      if (!entity) {
        return {
          lastError: `Entity '${entityId}' was not found.`,
        };
      }

      const currentValue = entity.state[key];
      const currentCount =
        typeof currentValue === "number" && Number.isFinite(currentValue)
          ? currentValue
          : 0;

      return {
        entityState: {
          entities: state.entityState.entities.map((candidate) =>
            candidate.id === entityId
              ? {
                  ...candidate,
                  state: {
                    ...candidate.state,
                    [key]: Math.max(0, currentCount + Math.trunc(delta)),
                  },
                }
              : candidate,
          ),
        },
        lastError: null,
      };
    }),
  moveCardToZone: (entityId, zoneId) =>
    set((state) => {
      if (!state.entityState.entities.some((entity) => entity.id === entityId)) {
        return {
          lastError: `Entity '${entityId}' was not found.`,
        };
      }

      return {
        entityState: {
          entities: state.entityState.entities.map((entity) =>
            entity.id === entityId
              ? {
                  ...entity,
                  state: {
                    ...entity.state,
                    zoneId,
                  },
                }
              : entity,
          ),
        },
        lastError: null,
      };
    }),
}));

export function getSelectedLocation(
  board: BoardState,
  selectedLocationId: string | null,
): BoardLocation | null {
  if (!selectedLocationId) {
    return null;
  }

  return (
    board.locations.find((location) => location.id === selectedLocationId) ?? null
  );
}

export function revokeUnusedAssetObjectUrls(
  currentAssets: readonly UploadedImageAsset[],
  nextAssets: readonly UploadedImageAsset[],
) {
  const preservedUrls = collectAssetObjectUrls(nextAssets);
  const revokedUrls = new Set<string>();

  for (const asset of currentAssets) {
    revokeAssetObjectUrls(asset, preservedUrls, revokedUrls);
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Board update failed.";
}

function collectAssetObjectUrls(assets: readonly UploadedImageAsset[]) {
  const urls = new Set<string>();

  for (const asset of assets) {
    if (isObjectUrl(asset.url)) {
      urls.add(asset.url);
    }

    if (asset.thumbnailUrl && isObjectUrl(asset.thumbnailUrl)) {
      urls.add(asset.thumbnailUrl);
    }
  }

  return urls;
}

function revokeAssetObjectUrls(
  asset: UploadedImageAsset,
  preservedUrls = new Set<string>(),
  revokedUrls = new Set<string>(),
) {
  for (const url of [asset.url, asset.thumbnailUrl]) {
    if (!url || !isObjectUrl(url) || preservedUrls.has(url) || revokedUrls.has(url)) {
      continue;
    }

    URL.revokeObjectURL(url);
    revokedUrls.add(url);
  }
}

function isObjectUrl(url: string) {
  return url.startsWith("blob:");
}

function createEmptyPawnSheet(): PawnSheet {
  return {
    heldCardAssetIds: [],
    counters: [],
  };
}

function validatePawnSheetAsset(
  state: BoardStore,
  placementId: string,
  assetId: string,
  expectedCategory: "CARD" | "TOKEN",
) {
  const placement = state.assetPlacements.find(
    (candidate) => candidate.id === placementId,
  );

  if (!placement || placement.category !== "PAWN") {
    return {
      lastError: `Pawn '${placementId}' was not found.`,
    };
  }

  if (!placement.locationId) {
    return {
      lastError: `Pawn '${placementId}' must be bound to a location first.`,
    };
  }

  const asset = state.assets.find((candidate) => candidate.id === assetId);

  if (!asset) {
    return {
      lastError: `Image asset '${assetId}' was not found.`,
    };
  }

  if (asset.category !== expectedCategory) {
    return {
      lastError:
        expectedCategory === "CARD"
          ? `${asset.category} assets cannot be used as cards.`
          : `${asset.category} assets cannot be used as tokens or dice.`,
    };
  }

  return null;
}

function countAssetUsage(
  state: Pick<BoardStore, "assetPlacements" | "pawnSheets">,
  assetId: string,
) {
  let count = state.assetPlacements.filter(
    (placement) => placement.assetId === assetId,
  ).length;

  for (const sheet of Object.values(state.pawnSheets)) {
    if (sheet.characterCardAssetId === assetId) {
      count += 1;
    }

    count += sheet.heldCardAssetIds.filter(
      (heldAssetId) => heldAssetId === assetId,
    ).length;
    count +=
      sheet.counters.find((counter) => counter.assetId === assetId)?.count ?? 0;
  }

  return count;
}

function getAssetCopyLimit(
  state: Pick<BoardStore, "assets">,
  assetId: string,
) {
  return (
    state.assets.find((candidate) => candidate.id === assetId)?.maxCopies ?? 0
  );
}

function getAssetLimitMessage(
  state: Pick<BoardStore, "assets">,
  assetId: string,
) {
  const asset = state.assets.find((candidate) => candidate.id === assetId);

  return asset
    ? `${asset.name} has reached its ${asset.maxCopies} copy limit.`
    : `Image asset '${assetId}' was not found.`;
}

function reconcilePawnSheets(
  pawnSheets: Record<string, PawnSheet>,
  placements: AssetPlacement[],
) {
  return placements.reduce<Record<string, PawnSheet>>((nextSheets, placement) => {
    if (placement.category !== "PAWN") {
      return nextSheets;
    }

    return {
      ...nextSheets,
      [placement.id]: pawnSheets[placement.id] ?? createEmptyPawnSheet(),
    };
  }, {});
}

function removePawnSheetsByPlacementId(
  pawnSheets: Record<string, PawnSheet>,
  placementIds: Set<string>,
) {
  return Object.fromEntries(
    Object.entries(pawnSheets).filter(
      ([placementId]) => !placementIds.has(placementId),
    ),
  );
}

function removeAssetFromPawnSheets(
  pawnSheets: Record<string, PawnSheet>,
  assetId: string,
) {
  return Object.fromEntries(
    Object.entries(pawnSheets).map(([placementId, sheet]) => [
      placementId,
      removeAssetFromPawnSheet(sheet, assetId),
    ]),
  );
}

function removeAssetFromPawnSheet(sheet: PawnSheet, assetId: string): PawnSheet {
  const { characterCardAssetId, ...sheetWithoutCharacterCard } = sheet;

  return {
    ...sheetWithoutCharacterCard,
    ...(characterCardAssetId && characterCardAssetId !== assetId
      ? { characterCardAssetId }
      : {}),
    heldCardAssetIds: sheet.heldCardAssetIds.filter(
      (heldAssetId) => heldAssetId !== assetId,
    ),
    counters: sheet.counters.filter((counter) => counter.assetId !== assetId),
  };
}

function createFrozenSetupSnapshot(
  state: Pick<
    BoardStore,
    | "board"
    | "entityState"
    | "assets"
    | "assetPlacements"
    | "pawnSheets"
    | "boardState"
    | "locationStates"
    | "edgeStates"
    | "boardZoom"
    | "boardPan"
  >,
): FrozenSetupSnapshot {
  return cloneJson({
    board: state.board,
    entityState: state.entityState,
    assets: state.assets,
    assetPlacements: state.assetPlacements,
    pawnSheets: state.pawnSheets,
    boardState: state.boardState,
    locationStates: state.locationStates,
    edgeStates: state.edgeStates,
    boardZoom: state.boardZoom,
    boardPan: state.boardPan,
  });
}

function omitRecordKey<T>(
  record: Record<string, T>,
  removedKey: string,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== removedKey),
  );
}

function omitRecordKeys<T>(
  record: Record<string, T>,
  removedKeys: ReadonlySet<string>,
): Record<string, T> {
  if (removedKeys.size === 0) {
    return record;
  }

  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !removedKeys.has(key)),
  );
}

function getConnectedEdgeIds(
  edges: readonly BoardEdge[],
  locationId: string,
): Set<string> {
  return new Set(
    edges
      .filter((edge) => edge.fromId === locationId || edge.toId === locationId)
      .map((edge) => edge.id),
  );
}

function getDefaultLocationName(locationId: string) {
  const locationNumber = locationId.match(/^loc-(\d+)$/)?.[1];

  return locationNumber ? `Location ${locationNumber}` : locationId;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeAsset(asset: UploadedImageAsset): UploadedImageAsset {
  const defaultSize = getDefaultPlacementSize(asset);

  return {
    ...asset,
    maxCopies: clampInteger(asset.maxCopies ?? 1, 1, 999),
    placementWidth: clampInteger(
      asset.placementWidth ?? defaultSize.width,
      12,
      640,
    ),
    placementHeight: clampInteger(
      asset.placementHeight ?? defaultSize.height,
      12,
      640,
    ),
  };
}

function getDefaultPlacementSize(asset: UploadedImageAsset) {
  if (!asset.width || !asset.height) {
    return {
      width: 64,
      height: 64,
    };
  }

  const scale = Math.min(96 / asset.width, 96 / asset.height, 1);

  return {
    width: Math.max(24, Math.round(asset.width * scale)),
    height: Math.max(24, Math.round(asset.height * scale)),
  };
}

function clampInteger(value: number, min: number, max: number) {
  return Math.round(clampNumber(value, min, max));
}

function getNumericCount(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : fallback;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}
