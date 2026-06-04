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

export interface UploadedImageAsset {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface AccessoryTemplate {
  id: string;
  assetId: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  maxCopies: number;
}

export interface AccessoryTemplatePlacement {
  id: string;
  templateId: string;
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

export type AccessoryTemplatePatch = Partial<
  Pick<AccessoryTemplate, "name" | "width" | "height" | "maxCopies">
>;

export type AccessoryPlacementPatch = Partial<
  Pick<AccessoryTemplatePlacement, "x" | "y" | "width" | "height">
>;

export interface BoardStore {
  board: BoardState;
  assets: UploadedImageAsset[];
  accessoryTemplates: AccessoryTemplate[];
  templatePlacements: AccessoryTemplatePlacement[];
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
  createAccessoryTemplate: (assetId: string) => void;
  updateAccessoryTemplate: (
    templateId: string,
    patch: AccessoryTemplatePatch,
  ) => void;
  deleteAccessoryTemplate: (templateId: string) => void;
  createTemplatePlacement: (
    templateId: string,
    x: number,
    y: number,
  ) => string | null;
  updateTemplatePlacement: (
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
  assets: [],
  accessoryTemplates: [],
  templatePlacements: [],
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
    set((state) => ({
      assets: state.assets.some((candidate) => candidate.id === asset.id)
        ? state.assets
        : [...state.assets, asset],
      selectedAssetId: asset.id,
      lastError: null,
    })),
  removeAsset: (assetId) =>
    set((state) => {
      const asset = state.assets.find((candidate) => candidate.id === assetId);
      const removedTemplateIds = new Set(
        state.accessoryTemplates
          .filter((template) => template.assetId === assetId)
          .map((template) => template.id),
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
        accessoryTemplates: state.accessoryTemplates.filter(
          (template) => template.assetId !== assetId,
        ),
        templatePlacements: state.templatePlacements.filter(
          (placement) => !removedTemplateIds.has(placement.templateId),
        ),
        selectedAssetId:
          state.selectedAssetId === assetId ? null : state.selectedAssetId,
        selectedPlacementId:
          state.selectedPlacementId &&
          state.templatePlacements.some(
            (placement) =>
              placement.id === state.selectedPlacementId &&
              removedTemplateIds.has(placement.templateId),
          )
            ? null
            : state.selectedPlacementId,
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
  createAccessoryTemplate: (assetId) =>
    set((state) => {
      const asset = state.assets.find((candidate) => candidate.id === assetId);

      if (!asset) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

      const id = createSequentialId(
        "piece",
        state.accessoryTemplates.map((template) => template.id),
      );
      const defaultSize = getDefaultTemplateSize(asset);

      return {
        accessoryTemplates: [
          ...state.accessoryTemplates,
          {
            id,
            assetId: asset.id,
            name: asset.name.replace(/\.[^.]+$/, ""),
            imageUrl: asset.url,
            width: defaultSize.width,
            height: defaultSize.height,
            maxCopies: 1,
          },
        ],
        selectedAssetId: asset.id,
        lastError: null,
      };
    }),
  updateAccessoryTemplate: (templateId, patch) =>
    set((state) => {
      const template = state.accessoryTemplates.find(
        (candidate) => candidate.id === templateId,
      );

      if (!template) {
        return {
          lastError: `Piece template '${templateId}' was not found.`,
        };
      }

      const nextTemplate = {
        ...template,
        ...patch,
        name: normalizeTemplateName(patch.name ?? template.name, template.id),
        width: clampInteger(patch.width ?? template.width, 12, 640),
        height: clampInteger(patch.height ?? template.height, 12, 640),
        maxCopies: clampInteger(
          patch.maxCopies ?? template.maxCopies,
          1,
          999,
        ),
      };

      return {
        accessoryTemplates: state.accessoryTemplates.map((candidate) =>
          candidate.id === templateId ? nextTemplate : candidate,
        ),
        lastError: null,
      };
    }),
  deleteAccessoryTemplate: (templateId) =>
    set((state) => ({
      accessoryTemplates: state.accessoryTemplates.filter(
        (template) => template.id !== templateId,
      ),
      templatePlacements: state.templatePlacements.filter(
        (placement) => placement.templateId !== templateId,
      ),
      selectedPlacementId:
        state.selectedPlacementId &&
        state.templatePlacements.some(
          (placement) =>
            placement.id === state.selectedPlacementId &&
            placement.templateId === templateId,
        )
          ? null
          : state.selectedPlacementId,
      lastError: null,
    })),
  createTemplatePlacement: (templateId, x, y) => {
    let createdId: string | null = null;

    set((state) => {
      const template = state.accessoryTemplates.find(
        (candidate) => candidate.id === templateId,
      );

      if (!template) {
        return {
          lastError: `Piece template '${templateId}' was not found.`,
        };
      }

      const usedCopies = state.templatePlacements.filter(
        (placement) => placement.templateId === templateId,
      ).length;

      if (usedCopies >= template.maxCopies) {
        return {
          lastError: `${template.name} has reached its ${template.maxCopies} copy limit.`,
        };
      }

      const id = createSequentialId(
        `${template.id}-copy`,
        state.templatePlacements.map((placement) => placement.id),
      );
      createdId = id;

      return {
        templatePlacements: [
          ...state.templatePlacements,
          {
            id,
            templateId,
            x: clampNumber(x, 0, 1),
            y: clampNumber(y, 0, 1),
            width: template.width,
            height: template.height,
          },
        ],
        selectedLocationId: null,
        selectedPlacementId: id,
        lastError: null,
      };
    });

    return createdId;
  },
  updateTemplatePlacement: (placementId, patch) =>
    set((state) => {
      const placement = state.templatePlacements.find(
        (candidate) => candidate.id === placementId,
      );

      if (!placement) {
        return {
          lastError: `Placed piece '${placementId}' was not found.`,
        };
      }

      const nextPlacement: AccessoryTemplatePlacement = {
        ...placement,
        ...patch,
        x: clampNumber(patch.x ?? placement.x, 0, 1),
        y: clampNumber(patch.y ?? placement.y, 0, 1),
        width: clampInteger(patch.width ?? placement.width, 12, 640),
        height: clampInteger(patch.height ?? placement.height, 12, 640),
      };

      return {
        templatePlacements: state.templatePlacements.map((candidate) =>
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

      return {
        templatePlacements: state.templatePlacements.filter(
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

function getDefaultTemplateSize(asset: UploadedImageAsset) {
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

function normalizeTemplateName(name: string | undefined, fallback: string) {
  const trimmed = name?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : fallback;
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
