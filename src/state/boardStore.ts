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
import type { BoardLocation, BoardState } from "../engine/board";
import {
  canPlaceAssetForCategory,
  clearLocationBindings,
  createEmptyEntityState,
  createEntity,
  removeEntity,
} from "../engine/entity";
import type { EntityState, ResourceCategory } from "../engine/entity";

export interface UploadedImageAsset {
  id: string;
  category: ResourceCategory;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  maxCopies: number;
  placementWidth: number;
  placementHeight: number;
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

export interface BoardPan {
  x: number;
  y: number;
}

export type BoardTool = "select" | "location" | "edge";

export type AssetPlacementConfigPatch = Partial<
  Pick<UploadedImageAsset, "placementWidth" | "placementHeight" | "maxCopies">
>;

export type AccessoryPlacementPatch = Partial<
  Pick<AssetPlacement, "x" | "y" | "width" | "height">
>;

export interface BoardStore {
  board: BoardState;
  entityState: EntityState;
  assets: UploadedImageAsset[];
  assetPlacements: AssetPlacement[];
  selectedAssetId: string | null;
  selectedLocationId: string | null;
  selectedPlacementId: string | null;
  edgeDraftFromId: string | null;
  activeTool: BoardTool;
  boardZoom: number;
  boardPan: BoardPan;
  isCreationPanelCollapsed: boolean;
  isInspectorCollapsed: boolean;
  lastError: string | null;
  addAsset: (asset: UploadedImageAsset) => void;
  removeAsset: (assetId: string) => void;
  updateAssetCategory: (assetId: string, category: ResourceCategory) => void;
  updateAssetPlacementConfig: (
    assetId: string,
    patch: AssetPlacementConfigPatch,
  ) => void;
  setBackgroundAsset: (assetId: string) => void;
  setActiveTool: (tool: BoardTool) => void;
  selectLocation: (locationId: string | null) => void;
  selectPlacement: (placementId: string | null) => void;
  createLocationAt: (x: number, y: number) => string | null;
  moveLocation: (locationId: string, x: number, y: number) => void;
  updateSelectedLocationName: (name: string) => void;
  deleteSelectedLocation: () => void;
  startOrCompleteEdge: (locationId: string) => void;
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
  deleteSelectedPlacement: () => void;
  setBoardZoom: (zoom: number) => void;
  setBoardPan: (pan: BoardPan) => void;
  resetBoardView: () => void;
  setCreationPanelCollapsed: (isCollapsed: boolean) => void;
  setInspectorCollapsed: (isCollapsed: boolean) => void;
  setLastError: (message: string) => void;
  clearError: () => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  board: createEmptyBoard(),
  entityState: createEmptyEntityState(),
  assets: [],
  assetPlacements: [],
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
  addAsset: (asset) =>
    set((state) => {
      if (state.assets.some((candidate) => candidate.id === asset.id)) {
        return state;
      }

      return {
        assets: [...state.assets, normalizeAsset(asset)],
        selectedAssetId: asset.id,
        lastError: null,
      };
    }),
  removeAsset: (assetId) =>
    set((state) => {
      const asset = state.assets.find((candidate) => candidate.id === assetId);
      const removedEntityIds = new Set(
        state.assetPlacements
          .filter((placement) => placement.assetId === assetId)
          .map((placement) => placement.entityId),
      );

      if (asset) {
        URL.revokeObjectURL(asset.url);
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
      if (!state.assets.some((asset) => asset.id === assetId)) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

      const nextAssets = state.assets.map((asset) =>
        asset.id === assetId
          ? normalizeAsset({ ...asset, category })
          : asset,
      );
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
      const asset = state.assets.find((candidate) => candidate.id === assetId);

      if (!asset) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

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
        selectedAssetId: asset.id,
        lastError: null,
      };
    }),
  setActiveTool: (tool) =>
    set({
      activeTool: tool,
      edgeDraftFromId: null,
      lastError: null,
    }),
  selectLocation: (locationId) =>
    set({
      selectedLocationId: locationId,
      selectedPlacementId: null,
      lastError: null,
    }),
  selectPlacement: (placementId) =>
    set({
      selectedLocationId: null,
      selectedPlacementId: placementId,
      lastError: null,
    }),
  createLocationAt: (x, y) => {
    let createdId: string | null = null;

    set((state) => {
      try {
        const id = createSequentialId(
          "loc",
          state.board.locations.map((location) => location.id),
        );
        const name = `Location ${state.board.locations.length + 1}`;
        const nextBoard = addLocation(state.board, { id, name, x, y });
        createdId = id;

        return {
          board: nextBoard,
          selectedLocationId: id,
          selectedPlacementId: null,
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
      try {
        return {
          board: updateLocation(state.board, locationId, { x, y }),
          selectedLocationId: locationId,
          selectedPlacementId: null,
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
      if (!state.selectedLocationId) {
        return state;
      }

      try {
        return {
          board: removeLocation(state.board, state.selectedLocationId),
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
      if (!state.edgeDraftFromId) {
        return {
          edgeDraftFromId: locationId,
          selectedLocationId: locationId,
          selectedPlacementId: null,
          lastError: null,
        };
      }

      if (state.edgeDraftFromId === locationId) {
        return {
          edgeDraftFromId: null,
          selectedLocationId: locationId,
          selectedPlacementId: null,
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
          selectedLocationId: locationId,
          selectedPlacementId: null,
          lastError: null,
        };
      } catch (error) {
        return {
          edgeDraftFromId: null,
          selectedLocationId: locationId,
          selectedPlacementId: null,
          lastError: getErrorMessage(error),
        };
      }
    }),
  updateEdgeLabel: (edgeId, label) =>
    set((state) => {
      try {
        return {
          board: updateEdge(state.board, edgeId, { label }),
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
      try {
        return {
          board: removeEdge(state.board, edgeId),
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
          selectedLocationId: null,
          selectedPlacementId: id,
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
        lastError: null,
      };
    }),
  deleteSelectedPlacement: () =>
    set((state) => {
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
        selectedPlacementId: null,
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
  setLastError: (message) =>
    set({
      lastError: message,
    }),
  clearError: () =>
    set({
      lastError: null,
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Board update failed.";
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

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}
