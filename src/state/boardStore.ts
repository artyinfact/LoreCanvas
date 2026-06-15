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
  addCardsToZone,
  addCardZone as addCardZoneToState,
  countCardsByAssetId,
  createEmptyCardDeckState,
  dealCards,
  drawCards,
  flipCards,
  moveCardsBetweenZones,
  removeCardsByAssetId,
  removeCardsFromZone,
  removeCardZone,
  reorderCardInZone,
  shuffleCardZone as shuffleCardZoneState,
  updateCardZone as updateCardZoneState,
} from "../engine/cardDeck";
import type { CardDeckState, CardZoneKind } from "../engine/cardDeck";
import {
  addDicePool as addDicePoolToState,
  addDieDefinition,
  addDieToPool,
  clearDiceRollHistory as clearDiceRollHistoryState,
  createEmptyDiceState,
  overrideDiceRollResult as overrideDiceRollResultState,
  removeDicePool,
  removeDiceReferencesByAssetId,
  removeDieDefinition,
  removeDieFromPool,
  rollDicePool as rollDicePoolState,
  updateDicePool as updateDicePoolState,
  updateDieDefinition as updateDieDefinitionState,
  updatePoolDieCount,
} from "../engine/dice";
import type { DiceState } from "../engine/dice";
import {
  addSlot,
  assignSlotAsset,
  clearSlotAsset,
  createEmptySlotState,
  findSlot,
  isSlotAssetCategory,
  moveSlotAsset as moveSlotAssetState,
  removeSlot,
  removeSlotAssetsByAssetId,
  removeSlotsByOwner,
  updateSlot as updateSlotState,
} from "../engine/slot";
import type { BoardSlot, SlotOwnerType, SlotState } from "../engine/slot";
import {
  addPawnStack,
  addSupplyZone,
  adjustPawnStackCount as adjustPawnStackCountState,
  createEmptyStackState,
  findMatchingStack,
  findPawnStack,
  isStackAssetCategory,
  mergePawnStacks,
  movePawnStack as movePawnStackState,
  removePawnStack as removePawnStackState,
  removeStacksByAssetId,
  removeStacksByContainer,
  removeSupplyZone,
  splitPawnStack,
  updatePawnStack as updatePawnStackState,
  updateSupplyZone as updateSupplyZoneState,
} from "../engine/stack";
import type {
  PawnStack,
  StackContainerRef,
  StackState,
} from "../engine/stack";
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
  sourcePath?: string;
  manifestPath?: string;
  sourceUrl?: string;
  sourceHash?: string;
  kind?: string;
  faces?: string[];
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
  cardDeckState: CardDeckState;
  diceState: DiceState;
  slotState: SlotState;
  stackState: StackState;
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
  createCardZone: (name: string, kind: CardZoneKind) => string | null;
  updateCardZone: (
    zoneId: string,
    patch: Partial<{
      kind: CardZoneKind;
      name: string;
      state: JsonRecord;
    }>,
  ) => void;
  deleteCardZone: (zoneId: string) => void;
  addCardAssetToZone: (zoneId: string, assetId: string) => string | null;
  removeCardsFromCardZone: (zoneId: string, cardIds: string[]) => void;
  moveCardsBetweenCardZones: (
    fromZoneId: string,
    toZoneId: string,
    cardIds: string[],
    toIndex?: number,
  ) => void;
  drawCardsToZone: (fromZoneId: string, toZoneId: string, count: number) => void;
  dealCardsToZones: (
    fromZoneId: string,
    toZoneIds: string[],
    countPerZone: number,
  ) => void;
  shuffleCardZone: (zoneId: string, order?: string[]) => void;
  flipCardsInZone: (
    zoneId: string,
    cardIds: string[],
    faceUp?: boolean,
  ) => void;
  reorderCardInZone: (zoneId: string, cardId: string, toIndex: number) => void;
  createDieDefinitionFromAsset: (
    assetId: string,
    name?: string,
  ) => string | null;
  createDieDefinitionFromAssets: (
    name: string,
    assetIds: string[],
  ) => string | null;
  updateDieDefinition: (
    dieId: string,
    patch: Partial<{
      name: string;
      state: JsonRecord;
    }>,
  ) => void;
  deleteDieDefinition: (dieId: string) => void;
  createDicePool: (name: string) => string | null;
  updateDicePool: (
    poolId: string,
    patch: Partial<{
      name: string;
      state: JsonRecord;
    }>,
  ) => void;
  deleteDicePool: (poolId: string) => void;
  addDieToDicePool: (
    poolId: string,
    dieId: string,
    count?: number,
  ) => string | null;
  updateDicePoolDieCount: (
    poolId: string,
    poolDieId: string,
    count: number,
  ) => void;
  removeDieFromDicePool: (poolId: string, poolDieId: string) => void;
  rollDicePool: (poolId: string, faceRefIds?: string[]) => string | null;
  overrideDiceRollResult: (
    rollId: string,
    resultId: string,
    faceRefId: string,
  ) => void;
  clearDiceRollHistory: () => void;
  createSlot: (
    name: string,
    ownerType: SlotOwnerType,
    ownerId: string,
    x?: number,
    y?: number,
  ) => string | null;
  updateSlot: (
    slotId: string,
    patch: Partial<{
      name: string;
      ownerType: SlotOwnerType;
      ownerId: string;
      x: number;
      y: number;
      state: JsonRecord;
    }>,
  ) => void;
  deleteSlot: (slotId: string) => void;
  assignAssetToSlot: (slotId: string, assetId: string) => void;
  clearSlot: (slotId: string) => void;
  moveSlotAsset: (fromSlotId: string, toSlotId: string) => void;
  createSupplyZone: (name: string) => string | null;
  updateSupplyZone: (
    zoneId: string,
    patch: Partial<{
      name: string;
      state: JsonRecord;
    }>,
  ) => void;
  deleteSupplyZone: (zoneId: string) => void;
  createPawnStack: (
    assetId: string,
    container: StackContainerRef,
    count: number,
    capacity?: number,
    name?: string,
  ) => string | null;
  updatePawnStack: (
    stackId: string,
    patch: Partial<{
      name: string;
      count: number;
      capacity: number;
      state: JsonRecord;
    }>,
  ) => void;
  adjustPawnStackCount: (stackId: string, delta: number) => void;
  movePawnStack: (
    stackId: string,
    target: StackContainerRef,
    count?: number,
  ) => string | null;
  deletePawnStack: (stackId: string) => void;
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
  cardDeckState: CardDeckState;
  diceState: DiceState;
  slotState: SlotState;
  stackState: StackState;
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
  cardDeckState: createEmptyCardDeckState(),
  diceState: createEmptyDiceState(),
  slotState: createEmptySlotState(),
  stackState: createEmptyStackState(),
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

      let didChange = false;
      let selectedAssetId = state.selectedAssetId;
      const nextAssets = [...state.assets];

      for (const asset of assets) {
        const normalizedAsset = normalizeAsset(asset);
        const existingIndex = findAssetImportTargetIndex(
          nextAssets,
          normalizedAsset,
        );

        if (existingIndex >= 0) {
          const existingAsset = nextAssets[existingIndex]!;
          const mergedAsset = normalizeAsset({
            ...existingAsset,
            url: normalizedAsset.url,
            thumbnailUrl: normalizedAsset.thumbnailUrl ?? existingAsset.thumbnailUrl,
            mimeType: normalizedAsset.mimeType,
            size: normalizedAsset.size,
            width: normalizedAsset.width ?? existingAsset.width,
            height: normalizedAsset.height ?? existingAsset.height,
            sourcePath: existingAsset.sourcePath ?? normalizedAsset.sourcePath,
            manifestPath: existingAsset.manifestPath ?? normalizedAsset.manifestPath,
            sourceUrl: existingAsset.sourceUrl ?? normalizedAsset.sourceUrl,
            sourceHash: existingAsset.sourceHash ?? normalizedAsset.sourceHash,
            kind: existingAsset.kind ?? normalizedAsset.kind,
            faces: existingAsset.faces ?? normalizedAsset.faces,
          });

          if (existingAsset.url !== mergedAsset.url && isObjectUrl(existingAsset.url)) {
            URL.revokeObjectURL(existingAsset.url);
          }

          if (
            existingAsset.thumbnailUrl &&
            existingAsset.thumbnailUrl !== mergedAsset.thumbnailUrl &&
            isObjectUrl(existingAsset.thumbnailUrl)
          ) {
            URL.revokeObjectURL(existingAsset.thumbnailUrl);
          }

          nextAssets[existingIndex] = mergedAsset;
          selectedAssetId = mergedAsset.id;
          didChange = true;
          continue;
        }

        nextAssets.push(normalizedAsset);
        selectedAssetId = normalizedAsset.id;
        didChange = true;
      }

      if (!didChange) {
        return state;
      }

      return {
        assets: nextAssets,
        selectedAssetId,
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
        cardDeckState: removeCardsByAssetId(state.cardDeckState, assetId),
        diceState: removeDiceReferencesByAssetId(state.diceState, assetId),
        slotState: removeSlotAssetsByAssetId(state.slotState, assetId),
        stackState: removeStacksByAssetId(state.stackState, assetId),
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
      const nextSlotState = isSlotAssetCategory(category)
        ? state.slotState
        : removeSlotAssetsByAssetId(state.slotState, assetId);
      const nextStackState = isStackAssetCategory(category)
        ? {
            ...state.stackState,
            stacks: state.stackState.stacks.map((stack) =>
              stack.assetId === assetId ? { ...stack, category } : stack,
            ),
          }
        : removeStacksByAssetId(state.stackState, assetId);

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
        cardDeckState:
          category === "CARD"
            ? state.cardDeckState
            : removeCardsByAssetId(state.cardDeckState, assetId),
        diceState:
          category === "TOKEN"
            ? state.diceState
            : removeDiceReferencesByAssetId(state.diceState, assetId),
        slotState: nextSlotState,
        stackState: nextStackState,
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
        cardDeckState: removeCardsByAssetId(state.cardDeckState, assetId),
        diceState: removeDiceReferencesByAssetId(state.diceState, assetId),
        slotState: removeSlotAssetsByAssetId(state.slotState, assetId),
        stackState: removeStacksByAssetId(state.stackState, assetId),
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
        const nextBoard = updateLocation(state.board, locationId, { x, y });
        const nextLocation = nextBoard.locations.find(
          (location) => location.id === locationId,
        )!;
        const synced = syncLocationOwnedSurfaces(state, locationId, nextLocation);

        return {
          board: nextBoard,
          ...synced,
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
        const nextBoard = updateLocation(state.board, locationId, patch);
        const nextLocation = nextBoard.locations.find(
          (location) => location.id === locationId,
        )!;
        const synced =
          patch.x !== undefined || patch.y !== undefined
            ? syncLocationOwnedSurfaces(state, locationId, nextLocation)
            : {};

        return {
          board: nextBoard,
          ...synced,
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
        const removedSlotPlacementIds = getSlotPlacementIdsByOwner(
          state.slotState,
          "location",
          locationId,
        );
        const removedStackPlacementIds = getStackPlacementIdsByContainer(
          state.stackState,
          {
            type: "location",
            id: locationId,
          },
        );
        const removedManagedPlacementIds = new Set([
          ...removedSlotPlacementIds,
          ...removedStackPlacementIds,
        ]);
        const removedManagedEntityIds = new Set(
          state.assetPlacements
            .filter((placement) => removedManagedPlacementIds.has(placement.id))
            .map((placement) => placement.entityId),
        );
        const unboundEntityState = clearLocationBindings(
          state.entityState,
          locationId,
        );

        return {
          board: removeLocation(state.board, locationId),
          locationStates: omitRecordKey(state.locationStates, locationId),
          edgeStates: omitRecordKeys(state.edgeStates, removedEdgeIds),
          slotState: removeSlotsByOwner(state.slotState, "location", locationId),
          stackState: removeStacksByContainer(state.stackState, {
            type: "location",
            id: locationId,
          }),
          entityState: {
            entities: unboundEntityState.entities.filter(
              (entity) => !removedManagedEntityIds.has(entity.id),
            ),
          },
          assetPlacements: state.assetPlacements
            .filter((placement) => !removedManagedPlacementIds.has(placement.id))
            .map((placement) => {
              if (placement.locationId !== locationId) {
                return placement;
              }

              const { locationId: _locationId, ...unboundPlacement } = placement;
              return unboundPlacement;
            }),
          pawnSheets: removePawnSheetsByPlacementId(
            state.pawnSheets,
            removedManagedPlacementIds,
          ),
          selectedLocationId,
          selectedPlacementId:
            state.selectedPlacementId &&
            (removedManagedPlacementIds.has(state.selectedPlacementId) ||
              state.assetPlacements.some(
                (placement) =>
                  placement.id === state.selectedPlacementId &&
                  placement.locationId === locationId,
              ))
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
      const slotState = {
        slots: state.slotState.slots.map((slot) =>
          slot.placementId === placementId
            ? {
                ...slot,
                x: nextPlacement.x,
                y: nextPlacement.y,
              }
            : slot,
        ),
      };

      return {
        slotState,
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
      const nextSlotState = {
        slots: state.slotState.slots.map((slot) => {
          if (slot.placementId !== state.selectedPlacementId) {
            return slot;
          }

          const { assetId: _assetId, placementId: _placementId, ...clearedSlot } =
            slot;
          return clearedSlot;
        }),
      };
      const nextStackState = {
        ...state.stackState,
        stacks: state.stackState.stacks.filter(
          (stack) => stack.placementId !== state.selectedPlacementId,
        ),
      };

      return {
        entityState: nextEntityState,
        assetPlacements: state.assetPlacements.filter(
          (placement) => placement.id !== state.selectedPlacementId,
        ),
        slotState: nextSlotState,
        stackState: nextStackState,
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
  createCardZone: (name, kind) => {
    let createdId: string | null = null;

    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const id = createSequentialId(
        "zone",
        state.cardDeckState.zones.map((zone) => zone.id),
      );

      try {
        const cardDeckState = addCardZoneToState(state.cardDeckState, {
          id,
          name,
          kind,
        });

        createdId = id;

        return {
          cardDeckState,
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
  updateCardZone: (zoneId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          cardDeckState: updateCardZoneState(state.cardDeckState, zoneId, patch),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteCardZone: (zoneId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          cardDeckState: removeCardZone(state.cardDeckState, zoneId),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  addCardAssetToZone: (zoneId, assetId) => {
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

      if (asset.category !== "CARD") {
        return {
          lastError: `${asset.category} assets cannot be added to card zones.`,
        };
      }

      if (countAssetUsage(state, assetId) >= getAssetCopyLimit(state, assetId)) {
        return {
          lastError: getAssetLimitMessage(state, assetId),
        };
      }

      const cardId = createSequentialId(
        "card",
        getCardDeckCardIds(state.cardDeckState),
      );

      try {
        const cardDeckState = addCardsToZone(state.cardDeckState, zoneId, [
          {
            id: cardId,
            assetId,
            label: asset.name,
            faceUp: false,
          },
        ]);

        createdId = cardId;

        return {
          cardDeckState,
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
  removeCardsFromCardZone: (zoneId, cardIds) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          cardDeckState: removeCardsFromZone(state.cardDeckState, zoneId, cardIds),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  moveCardsBetweenCardZones: (fromZoneId, toZoneId, cardIds, toIndex) =>
    set((state) => {
      try {
        return {
          cardDeckState: moveCardsBetweenZones(state.cardDeckState, {
            cardIds,
            fromZoneId,
            toIndex,
            toZoneId,
          }),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  drawCardsToZone: (fromZoneId, toZoneId, count) =>
    set((state) => {
      try {
        return {
          cardDeckState: drawCards(state.cardDeckState, {
            count,
            fromZoneId,
            toZoneId,
          }),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  dealCardsToZones: (fromZoneId, toZoneIds, countPerZone) =>
    set((state) => {
      try {
        return {
          cardDeckState: dealCards(state.cardDeckState, {
            countPerZone,
            fromZoneId,
            toZoneIds,
          }),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  shuffleCardZone: (zoneId, order) =>
    set((state) => {
      try {
        return {
          cardDeckState: shuffleCardZoneState(state.cardDeckState, zoneId, {
            order,
          }),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  flipCardsInZone: (zoneId, cardIds, faceUp) =>
    set((state) => {
      try {
        return {
          cardDeckState: flipCards(state.cardDeckState, zoneId, cardIds, faceUp),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  reorderCardInZone: (zoneId, cardId, toIndex) =>
    set((state) => {
      try {
        return {
          cardDeckState: reorderCardInZone(
            state.cardDeckState,
            zoneId,
            cardId,
            toIndex,
          ),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  createDieDefinitionFromAsset: (assetId, name) => {
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

      if (asset.category !== "TOKEN") {
        return {
          lastError: `${asset.category} assets cannot define dice.`,
        };
      }

      if (!asset.faces || asset.faces.length === 0) {
        return {
          lastError: `${asset.name} does not have ordered die face metadata.`,
        };
      }

      const id = createSequentialId(
        "die",
        getDiceDefinitionIds(state.diceState),
      );

      try {
        const diceState = addDieDefinition(state.diceState, {
          id,
          name: name?.trim() || asset.name,
          faces: asset.faces.map((faceId, faceIndex) => ({
            id: createDieFaceId(faceId, faceIndex),
            assetId,
            faceId,
            label: createDieFaceLabel(faceId, faceIndex),
          })),
          state: {
            assetId,
            kind: asset.kind ?? "die",
          },
        });

        createdId = id;

        return {
          diceState,
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
  createDieDefinitionFromAssets: (name, assetIds) => {
    let createdId: string | null = null;

    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const selectedAssets = assetIds.map((assetId) =>
        state.assets.find((candidate) => candidate.id === assetId),
      );
      const missingAssetId = assetIds.find((_assetId, index) => !selectedAssets[index]);

      if (missingAssetId) {
        return {
          lastError: `Image asset '${missingAssetId}' was not found.`,
        };
      }

      if (selectedAssets.some((asset) => asset?.category !== "TOKEN")) {
        return {
          lastError: "Only TOKEN assets can be used as die faces.",
        };
      }

      if (!name.trim() || selectedAssets.length === 0) {
        return {
          lastError: "Die definition requires a name and at least one face asset.",
        };
      }

      const id = createSequentialId(
        "die",
        getDiceDefinitionIds(state.diceState),
      );

      try {
        const diceState = addDieDefinition(state.diceState, {
          id,
          name,
          faces: selectedAssets.map((asset, faceIndex) => ({
            id: createDieFaceId(asset!.name, faceIndex),
            assetId: asset!.id,
            label: asset!.name,
          })),
          state: {
            source: "face-assets",
          },
        });

        createdId = id;

        return {
          diceState,
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
  updateDieDefinition: (dieId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          diceState: updateDieDefinitionState(state.diceState, dieId, patch),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteDieDefinition: (dieId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          diceState: removeDieDefinition(state.diceState, dieId),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  createDicePool: (name) => {
    let createdId: string | null = null;

    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const id = createSequentialId("pool", getDicePoolIds(state.diceState));

      try {
        const diceState = addDicePoolToState(state.diceState, {
          id,
          name,
        });

        createdId = id;

        return {
          diceState,
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
  updateDicePool: (poolId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          diceState: updateDicePoolState(state.diceState, poolId, patch),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteDicePool: (poolId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          diceState: removeDicePool(state.diceState, poolId),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  addDieToDicePool: (poolId, dieId, count = 1) => {
    let createdId: string | null = null;

    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const id = createSequentialId("pool-die", getDicePoolDieIds(state.diceState));

      try {
        const diceState = addDieToPool(state.diceState, {
          id,
          count,
          dieId,
          poolId,
        });

        createdId = id;

        return {
          diceState,
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
  updateDicePoolDieCount: (poolId, poolDieId, count) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          diceState: updatePoolDieCount(state.diceState, poolId, poolDieId, count),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  removeDieFromDicePool: (poolId, poolDieId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          diceState: removeDieFromPool(state.diceState, poolId, poolDieId),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  rollDicePool: (poolId, faceRefIds) => {
    let createdId: string | null = null;

    set((state) => {
      const id = createSequentialId(
        "roll",
        state.diceState.rollHistory.map((roll) => roll.id),
      );

      try {
        const diceState = rollDicePoolState(state.diceState, {
          id,
          faceRefIds,
          mode: faceRefIds?.length ? "manual" : "random",
          poolId,
          resultIdPrefix: `${id}-result`,
          rolledAt: new Date().toISOString(),
        });

        createdId = id;

        return {
          diceState,
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
  overrideDiceRollResult: (rollId, resultId, faceRefId) =>
    set((state) => {
      try {
        return {
          diceState: overrideDiceRollResultState(
            state.diceState,
            rollId,
            resultId,
            faceRefId,
          ),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  clearDiceRollHistory: () =>
    set((state) => ({
      diceState: clearDiceRollHistoryState(state.diceState),
      lastError: null,
    })),
  createSlot: (name, ownerType, ownerId, x, y) => {
    let createdId: string | null = null;

    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const position = resolveSlotPosition(state, {
        ownerType,
        ownerId,
        x,
        y,
      });

      if (!position) {
        return {
          lastError:
            ownerType === "location"
              ? `Location '${ownerId}' was not found.`
              : "Slot coordinates must be inside the board.",
        };
      }

      const id = createSequentialId(
        "slot",
        state.slotState.slots.map((slot) => slot.id),
      );

      try {
        const slotState = addSlot(state.slotState, {
          id,
          name,
          ownerType,
          ownerId,
          x: position.x,
          y: position.y,
        });

        createdId = id;

        return {
          slotState,
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
  updateSlot: (slotId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const slot = findSlot(state.slotState, slotId);

      if (!slot) {
        return {
          lastError: `Slot '${slotId}' was not found.`,
        };
      }

      const ownerType = patch.ownerType ?? slot.ownerType;
      const ownerId = patch.ownerId ?? slot.ownerId;
      const position = resolveSlotPosition(state, {
        ownerType,
        ownerId,
        x: patch.x ?? slot.x,
        y: patch.y ?? slot.y,
      });

      if (!position) {
        return {
          lastError:
            ownerType === "location"
              ? `Location '${ownerId}' was not found.`
              : "Slot coordinates must be inside the board.",
        };
      }

      try {
        const slotState = updateSlotState(state.slotState, slotId, {
          ...patch,
          ownerType,
          ownerId,
          x: position.x,
          y: position.y,
        });
        const synced = syncSlotVisual(state, {
          ...slot,
          ...patch,
          ownerType,
          ownerId,
          x: position.x,
          y: position.y,
        });

        return {
          slotState,
          ...synced,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteSlot: (slotId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const slot = findSlot(state.slotState, slotId);

      if (!slot) {
        return {
          lastError: `Slot '${slotId}' was not found.`,
        };
      }

      try {
        const removed = removeManagedPlacement(state, slot.placementId);

        return {
          slotState: removeSlot(state.slotState, slotId),
          ...removed,
          selectedPlacementId:
            state.selectedPlacementId && state.selectedPlacementId === slot.placementId
              ? null
              : state.selectedPlacementId,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  assignAssetToSlot: (slotId, assetId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const slot = findSlot(state.slotState, slotId);
      const asset = state.assets.find((candidate) => candidate.id === assetId);

      if (!slot) {
        return {
          lastError: `Slot '${slotId}' was not found.`,
        };
      }

      if (!asset) {
        return {
          lastError: `Image asset '${assetId}' was not found.`,
        };
      }

      if (!isSlotAssetCategory(asset.category)) {
        return {
          lastError: `${asset.category} assets cannot be assigned to slots.`,
        };
      }

      if (isAssetCopyLimitReached(state, asset, slot.placementId)) {
        return {
          lastError: getAssetLimitMessage(state, assetId),
        };
      }

      try {
        const baseState = {
          ...state,
          ...removeManagedPlacement(state, slot.placementId),
        };
        const position = getSlotVisualPoint(baseState, slot);
        const placement = createManagedPlacement(baseState, asset, position.x, position.y, {
          locationId: slot.ownerType === "location" ? slot.ownerId : undefined,
          entityState: {
            slotId: slot.id,
            slotOwnerType: slot.ownerType,
            slotOwnerId: slot.ownerId,
          },
        });
        const slotState = assignSlotAsset(
          baseState.slotState,
          slot.id,
          asset.id,
          placement.placement.id,
        );

        return {
          slotState,
          entityState: {
            entities: [...baseState.entityState.entities, placement.entity],
          },
          assetPlacements: [
            ...baseState.assetPlacements,
            placement.placement,
          ],
          pawnSheets: placement.pawnSheet
            ? {
                ...baseState.pawnSheets,
                [placement.placement.id]: placement.pawnSheet,
              }
            : baseState.pawnSheets,
          selectedLocationId: null,
          selectedPlacementId: placement.placement.id,
          selectedEdgeId: null,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  clearSlot: (slotId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const slot = findSlot(state.slotState, slotId);

      if (!slot) {
        return {
          lastError: `Slot '${slotId}' was not found.`,
        };
      }

      try {
        const removed = removeManagedPlacement(state, slot.placementId);

        return {
          slotState: clearSlotAsset(state.slotState, slotId),
          ...removed,
          selectedPlacementId:
            state.selectedPlacementId && state.selectedPlacementId === slot.placementId
              ? null
              : state.selectedPlacementId,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  moveSlotAsset: (fromSlotId, toSlotId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const fromSlot = findSlot(state.slotState, fromSlotId);
      const toSlot = findSlot(state.slotState, toSlotId);

      if (!fromSlot || !toSlot) {
        return {
          lastError: "Both source and target slots must exist.",
        };
      }

      if (!fromSlot.assetId || !fromSlot.placementId) {
        return {
          lastError: `Slot '${fromSlotId}' has no placed asset to move.`,
        };
      }

      try {
        const baseState = {
          ...state,
          ...removeManagedPlacement(state, toSlot.placementId),
        };
        const targetPoint = getSlotVisualPoint(baseState, toSlot);
        const slotState = moveSlotAssetState(
          baseState.slotState,
          fromSlotId,
          toSlotId,
        );

        return {
          slotState,
          assetPlacements: baseState.assetPlacements.map((placement) => {
            if (placement.id !== fromSlot.placementId) {
              return placement;
            }

            const movedPlacement = {
              ...placement,
              x: targetPoint.x,
              y: targetPoint.y,
            };

            return toSlot.ownerType === "location"
              ? { ...movedPlacement, locationId: toSlot.ownerId }
              : removePlacementLocation(movedPlacement);
          }),
          entityState: {
            entities: baseState.entityState.entities.map((entity) => {
              if (entity.state.placementId !== fromSlot.placementId) {
                return entity;
              }

              const movedEntity = {
                ...entity,
                state: {
                  ...entity.state,
                  slotId: toSlot.id,
                  slotOwnerType: toSlot.ownerType,
                  slotOwnerId: toSlot.ownerId,
                },
              };

              return toSlot.ownerType === "location"
                ? { ...movedEntity, locationId: toSlot.ownerId }
                : removeEntityLocation(movedEntity);
            }),
          },
          selectedPlacementId: fromSlot.placementId,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  createSupplyZone: (name) => {
    let createdId: string | null = null;

    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const id = createSequentialId(
        "supply",
        state.stackState.supplyZones.map((zone) => zone.id),
      );

      try {
        createdId = id;

        return {
          stackState: addSupplyZone(state.stackState, {
            id,
            name,
          }),
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
  updateSupplyZone: (zoneId, patch) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      try {
        return {
          stackState: updateSupplyZoneState(state.stackState, zoneId, patch),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  deleteSupplyZone: (zoneId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const removedPlacementIds = getStackPlacementIdsByContainer(
        state.stackState,
        {
          type: "supply",
          id: zoneId,
        },
      );

      try {
        const removed = removeManagedPlacements(state, removedPlacementIds);

        return {
          stackState: removeSupplyZone(state.stackState, zoneId),
          ...removed,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  createPawnStack: (assetId, container, count, capacity, name) => {
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

      if (!isStackAssetCategory(asset.category)) {
        return {
          lastError: `${asset.category} assets cannot be used as pawn stacks.`,
        };
      }

      const containerError = validateStackContainer(state, container);

      if (containerError) {
        return {
          lastError: containerError,
        };
      }

      if (container.type === "location" && isAssetCopyLimitReached(state, asset)) {
        return {
          lastError: getAssetLimitMessage(state, asset.id),
        };
      }

      try {
        const id = createSequentialId(
          "stack",
          state.stackState.stacks.map((stack) => stack.id),
        );
        const visual =
          container.type === "location"
            ? createStackVisual(state, asset, id, container.id, count)
            : null;
        const stackState = addPawnStack(state.stackState, {
          id,
          name: name?.trim() || asset.name,
          assetId: asset.id,
          category: asset.category,
          container,
          count,
          ...(capacity !== undefined ? { capacity } : {}),
          ...(visual ? { placementId: visual.placement.id } : {}),
          ...(visual ? { entityId: visual.entity.id } : {}),
        });

        createdId = id;

        return {
          stackState,
          entityState: visual
            ? {
                entities: [...state.entityState.entities, visual.entity],
              }
            : state.entityState,
          assetPlacements: visual
            ? [...state.assetPlacements, visual.placement]
            : state.assetPlacements,
          pawnSheets:
            visual?.pawnSheet && visual.placement.category === "PAWN"
              ? {
                  ...state.pawnSheets,
                  [visual.placement.id]: visual.pawnSheet,
                }
              : state.pawnSheets,
          selectedLocationId: null,
          selectedPlacementId: visual?.placement.id ?? state.selectedPlacementId,
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
  updatePawnStack: (stackId, patch) =>
    set((state) => {
      if (
        state.mode === "run" &&
        (patch.name !== undefined ||
          patch.capacity !== undefined ||
          patch.state !== undefined)
      ) {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const stack = findPawnStack(state.stackState, stackId);

      if (!stack) {
        return {
          lastError: `Stack '${stackId}' was not found.`,
        };
      }

      try {
        const stackState = updatePawnStackState(state.stackState, stackId, patch);
        const nextCount = patch.count ?? stack.count;

        return {
          stackState,
          entityState: updateStackEntityCount(
            state.entityState,
            stack.entityId,
            nextCount,
          ),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  adjustPawnStackCount: (stackId, delta) =>
    set((state) => {
      const stack = findPawnStack(state.stackState, stackId);

      if (!stack) {
        return {
          lastError: `Stack '${stackId}' was not found.`,
        };
      }

      try {
        const nextCount = stack.count + Math.trunc(delta);

        if (nextCount <= 0) {
          const removed = removeManagedPlacement(state, stack.placementId);

          return {
            stackState: removePawnStackState(state.stackState, stackId),
            ...removed,
            lastError: null,
          };
        }

        return {
          stackState: adjustPawnStackCountState(
            state.stackState,
            stackId,
            Math.trunc(delta),
          ),
          entityState: updateStackEntityCount(
            state.entityState,
            stack.entityId,
            nextCount,
          ),
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    }),
  movePawnStack: (stackId, target, count) => {
    let resultId: string | null = null;

    set((state) => {
      const stack = findPawnStack(state.stackState, stackId);

      if (!stack) {
        return {
          lastError: `Stack '${stackId}' was not found.`,
        };
      }

      const containerError = validateStackContainer(state, target);

      if (containerError) {
        return {
          lastError: containerError,
        };
      }

      try {
        const result = moveStackWithVisuals(state, stack, target, count);
        resultId = result.stackId;

        return {
          ...result.patch,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
    });

    return resultId;
  },
  deletePawnStack: (stackId) =>
    set((state) => {
      if (state.mode === "run") {
        return {
          lastError: RUN_MODE_LOCK_MESSAGE,
        };
      }

      const stack = findPawnStack(state.stackState, stackId);

      if (!stack) {
        return {
          lastError: `Stack '${stackId}' was not found.`,
        };
      }

      try {
        const removed = removeManagedPlacement(state, stack.placementId);

        return {
          stackState: removePawnStackState(state.stackState, stackId),
          ...removed,
          lastError: null,
        };
      } catch (error) {
        return {
          lastError: getErrorMessage(error),
        };
      }
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
  state: Pick<BoardStore, "assetPlacements" | "pawnSheets" | "cardDeckState">,
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

  count += countCardsByAssetId(state.cardDeckState, assetId);

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

function getCardDeckCardIds(cardDeckState: CardDeckState) {
  return cardDeckState.zones.flatMap((zone) =>
    zone.cards.map((card) => card.id),
  );
}

function getDiceDefinitionIds(diceState: DiceState) {
  return diceState.definitions.map((definition) => definition.id);
}

function getDicePoolIds(diceState: DiceState) {
  return diceState.pools.map((pool) => pool.id);
}

function getDicePoolDieIds(diceState: DiceState) {
  return diceState.pools.flatMap((pool) => pool.dice.map((poolDie) => poolDie.id));
}

function createDieFaceId(source: string, index: number) {
  const baseName = source
    .split(/[\\/]+/)
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  return baseName || `face-${index + 1}`;
}

function createDieFaceLabel(source: string, index: number) {
  return (
    source
      .split(/[\\/]+/)
      .pop()
      ?.replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim() || `Face ${index + 1}`
  );
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

function resolveSlotPosition(
  state: Pick<BoardStore, "board">,
  input: {
    ownerType: SlotOwnerType;
    ownerId: string;
    x?: number;
    y?: number;
  },
) {
  if (input.ownerType === "location") {
    const location = state.board.locations.find(
      (candidate) => candidate.id === input.ownerId,
    );

    return location ? { x: location.x, y: location.y } : null;
  }

  const x = input.x ?? 0.5;
  const y = input.y ?? 0.5;

  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    return null;
  }

  return {
    x,
    y,
  };
}

function getSlotVisualPoint(
  state: Pick<BoardStore, "board">,
  slot: BoardSlot,
) {
  if (slot.ownerType !== "location") {
    return {
      x: slot.x,
      y: slot.y,
    };
  }

  const location = state.board.locations.find(
    (candidate) => candidate.id === slot.ownerId,
  );

  return location
    ? { x: location.x, y: location.y }
    : {
        x: slot.x,
        y: slot.y,
      };
}

function createManagedPlacement(
  state: Pick<BoardStore, "assetPlacements" | "entityState" | "pawnSheets">,
  asset: UploadedImageAsset,
  x: number,
  y: number,
  options: {
    entityState?: JsonRecord;
    locationId?: string;
  } = {},
) {
  const id = createSequentialId(
    `${asset.category.toLowerCase()}-copy`,
    state.assetPlacements.map((placement) => placement.id),
  );
  const entityId = createSequentialId(
    "entity",
    state.entityState.entities.map((entity) => entity.id),
  );
  const placement: AssetPlacement = {
    id,
    assetId: asset.id,
    category: asset.category,
    entityId,
    ...(options.locationId ? { locationId: options.locationId } : {}),
    x: clampNumber(x, 0, 1),
    y: clampNumber(y, 0, 1),
    width: asset.placementWidth,
    height: asset.placementHeight,
  };
  const entity = {
    id: entityId,
    type: asset.category,
    ...(options.locationId ? { locationId: options.locationId } : {}),
    state: {
      assetId: asset.id,
      category: asset.category,
      placementId: id,
      ...(options.entityState ?? {}),
    },
  };

  return {
    placement,
    entity,
    pawnSheet: asset.category === "PAWN" ? createEmptyPawnSheet() : null,
  };
}

function createStackVisual(
  state: Pick<BoardStore, "assetPlacements" | "board" | "entityState" | "pawnSheets">,
  asset: UploadedImageAsset,
  stackId: string,
  locationId: string,
  count: number,
) {
  const location = state.board.locations.find(
    (candidate) => candidate.id === locationId,
  );

  if (!location) {
    throw new Error(`Location '${locationId}' was not found.`);
  }

  return createManagedPlacement(state, asset, location.x, location.y, {
    locationId,
    entityState: {
      stackId,
      count,
    },
  });
}

function removeManagedPlacement(
  state: Pick<
    BoardStore,
    "assetPlacements" | "entityState" | "pawnSheets" | "selectedPlacementId"
  >,
  placementId?: string,
) {
  return removeManagedPlacements(state, placementId ? new Set([placementId]) : new Set());
}

function removeManagedPlacements(
  state: Pick<
    BoardStore,
    "assetPlacements" | "entityState" | "pawnSheets" | "selectedPlacementId"
  >,
  placementIds: ReadonlySet<string>,
) {
  if (placementIds.size === 0) {
    return {
      entityState: state.entityState,
      assetPlacements: state.assetPlacements,
      pawnSheets: state.pawnSheets,
      selectedPlacementId: state.selectedPlacementId,
    };
  }

  const entityIds = new Set(
    state.assetPlacements
      .filter((placement) => placementIds.has(placement.id))
      .map((placement) => placement.entityId),
  );

  return {
    entityState: {
      entities: state.entityState.entities.filter(
        (entity) => !entityIds.has(entity.id),
      ),
    },
    assetPlacements: state.assetPlacements.filter(
      (placement) => !placementIds.has(placement.id),
    ),
    pawnSheets: removePawnSheetsByPlacementId(state.pawnSheets, new Set(placementIds)),
    selectedPlacementId:
      state.selectedPlacementId && placementIds.has(state.selectedPlacementId)
        ? null
        : state.selectedPlacementId,
  };
}

function syncSlotVisual(
  state: Pick<BoardStore, "assetPlacements" | "board" | "entityState">,
  slot: BoardSlot,
) {
  if (!slot.placementId) {
    return {};
  }

  const point = getSlotVisualPoint(state, slot);

  return {
    assetPlacements: state.assetPlacements.map((placement) => {
      if (placement.id !== slot.placementId) {
        return placement;
      }

      const movedPlacement = {
        ...placement,
        x: point.x,
        y: point.y,
      };

      return slot.ownerType === "location"
        ? { ...movedPlacement, locationId: slot.ownerId }
        : removePlacementLocation(movedPlacement);
    }),
    entityState: {
      entities: state.entityState.entities.map((entity) => {
        if (entity.state.placementId !== slot.placementId) {
          return entity;
        }

        const movedEntity = {
          ...entity,
          state: {
            ...entity.state,
            slotId: slot.id,
            slotOwnerType: slot.ownerType,
            slotOwnerId: slot.ownerId,
          },
        };

        return slot.ownerType === "location"
          ? { ...movedEntity, locationId: slot.ownerId }
          : removeEntityLocation(movedEntity);
      }),
    },
  };
}

function syncLocationOwnedSurfaces(
  state: Pick<
    BoardStore,
    "assetPlacements" | "entityState" | "slotState" | "stackState"
  >,
  locationId: string,
  location: BoardLocation,
) {
  const slotPlacementIds = getSlotPlacementIdsByOwner(
    state.slotState,
    "location",
    locationId,
  );
  const stackPlacementIds = getStackPlacementIdsByContainer(state.stackState, {
    type: "location",
    id: locationId,
  });
  const managedPlacementIds = new Set([
    ...slotPlacementIds,
    ...stackPlacementIds,
  ]);
  const managedEntityIds = new Set(
    state.assetPlacements
      .filter((placement) => managedPlacementIds.has(placement.id))
      .map((placement) => placement.entityId),
  );

  return {
    slotState: {
      slots: state.slotState.slots.map((slot) =>
        slot.ownerType === "location" && slot.ownerId === locationId
          ? {
              ...slot,
              x: location.x,
              y: location.y,
            }
          : slot,
      ),
    },
    assetPlacements: state.assetPlacements.map((placement) =>
      managedPlacementIds.has(placement.id)
        ? {
            ...placement,
            locationId,
            x: location.x,
            y: location.y,
          }
        : placement,
    ),
    entityState: {
      entities: state.entityState.entities.map((entity) =>
        managedEntityIds.has(entity.id)
          ? {
              ...entity,
              locationId,
            }
          : entity,
      ),
    },
  };
}

function getSlotPlacementIdsByOwner(
  slotState: SlotState,
  ownerType: SlotOwnerType,
  ownerId: string,
) {
  return new Set(
    slotState.slots
      .filter((slot) => slot.ownerType === ownerType && slot.ownerId === ownerId)
      .map((slot) => slot.placementId)
      .filter(isNonNullableString),
  );
}

function getStackPlacementIdsByContainer(
  stackState: StackState,
  container: StackContainerRef,
) {
  return new Set(
    stackState.stacks
      .filter(
        (stack) =>
          stack.container.type === container.type &&
          stack.container.id === container.id,
      )
      .map((stack) => stack.placementId)
      .filter(isNonNullableString),
  );
}

function validateStackContainer(
  state: Pick<BoardStore, "board" | "stackState">,
  container: StackContainerRef,
) {
  if (container.type === "location") {
    return state.board.locations.some((location) => location.id === container.id)
      ? null
      : `Location '${container.id}' was not found.`;
  }

  return state.stackState.supplyZones.some((zone) => zone.id === container.id)
    ? null
    : `Supply zone '${container.id}' was not found.`;
}

function isAssetCopyLimitReached(
  state: Pick<BoardStore, "assetPlacements">,
  asset: UploadedImageAsset,
  exceptPlacementId?: string,
) {
  return (
    state.assetPlacements.filter(
      (placement) =>
        placement.assetId === asset.id && placement.id !== exceptPlacementId,
    ).length >= asset.maxCopies
  );
}

function updateStackEntityCount(
  entityState: EntityState,
  entityId: string | undefined,
  count: number,
): EntityState {
  if (!entityId) {
    return entityState;
  }

  return {
    entities: entityState.entities.map((entity) =>
      entity.id === entityId
        ? {
            ...entity,
            state: {
              ...entity.state,
              count,
            },
          }
        : entity,
    ),
  };
}

function moveStackWithVisuals(
  state: Pick<
    BoardStore,
    | "assetPlacements"
    | "assets"
    | "board"
    | "entityState"
    | "pawnSheets"
    | "selectedPlacementId"
    | "stackState"
  >,
  stack: PawnStack,
  target: StackContainerRef,
  count?: number,
) {
  const moveCount = count === undefined ? stack.count : Math.trunc(count);

  if (!Number.isInteger(moveCount) || moveCount <= 0 || moveCount > stack.count) {
    throw new Error("Move count must be between 1 and the source stack count.");
  }

  const asset = state.assets.find((candidate) => candidate.id === stack.assetId);

  if (!asset || !isStackAssetCategory(asset.category)) {
    throw new Error(`Stack asset '${stack.assetId}' was not found.`);
  }

  const matching = findMatchingStack(
    state.stackState,
    stack.assetId,
    stack.category,
    target,
    stack.id,
  );

  if (matching) {
    const stackState = mergePawnStacks(state.stackState, {
      sourceStackId: stack.id,
      targetStackId: matching.id,
      count: moveCount,
    });
    let entityState = updateStackEntityCount(
      state.entityState,
      matching.entityId,
      matching.count + moveCount,
    );
    let assetPlacements = state.assetPlacements;
    let pawnSheets = state.pawnSheets;
    let selectedPlacementId = state.selectedPlacementId;

    if (moveCount === stack.count) {
      const removed = removeManagedPlacement(
        {
          ...state,
          entityState,
        },
        stack.placementId,
      );
      entityState = removed.entityState;
      assetPlacements = removed.assetPlacements;
      pawnSheets = removed.pawnSheets;
      selectedPlacementId = removed.selectedPlacementId;
    } else {
      entityState = updateStackEntityCount(
        entityState,
        stack.entityId,
        stack.count - moveCount,
      );
    }

    return {
      stackId: matching.id,
      patch: {
        stackState,
        entityState,
        assetPlacements,
        pawnSheets,
        selectedPlacementId,
      },
    };
  }

  if (moveCount === stack.count) {
    let stackState = movePawnStackState(state.stackState, stack.id, target);
    let entityState = state.entityState;
    let assetPlacements = state.assetPlacements;
    let pawnSheets = state.pawnSheets;
    let selectedPlacementId = state.selectedPlacementId;

    if (target.type === "location") {
      const location = getLocationOrThrow(state.board, target.id);

      if (stack.placementId && stack.entityId) {
        assetPlacements = assetPlacements.map((placement) =>
          placement.id === stack.placementId
            ? {
                ...placement,
                locationId: target.id,
                x: location.x,
                y: location.y,
              }
            : placement,
        );
        entityState = {
          entities: entityState.entities.map((entity) =>
            entity.id === stack.entityId
              ? {
                  ...entity,
                  locationId: target.id,
                  state: {
                    ...entity.state,
                    count: stack.count,
                    stackId: stack.id,
                  },
                }
              : entity,
          ),
        };
        selectedPlacementId = stack.placementId;
      } else {
        const visual = createStackVisual(
          { ...state, assetPlacements, entityState, pawnSheets },
          asset,
          stack.id,
          target.id,
          stack.count,
        );
        assetPlacements = [...assetPlacements, visual.placement];
        entityState = {
          entities: [...entityState.entities, visual.entity],
        };
        pawnSheets =
          visual.pawnSheet && visual.placement.category === "PAWN"
            ? {
                ...pawnSheets,
                [visual.placement.id]: visual.pawnSheet,
              }
            : pawnSheets;
        selectedPlacementId = visual.placement.id;
        stackState = updatePawnStackState(stackState, stack.id, {
          placementId: visual.placement.id,
          entityId: visual.entity.id,
        });
      }
    } else if (stack.placementId) {
      const removed = removeManagedPlacement(state, stack.placementId);
      entityState = removed.entityState;
      assetPlacements = removed.assetPlacements;
      pawnSheets = removed.pawnSheets;
      selectedPlacementId = removed.selectedPlacementId;
      stackState = updatePawnStackState(stackState, stack.id, {
        placementId: "",
        entityId: "",
      });
    }

    return {
      stackId: stack.id,
      patch: {
        stackState,
        entityState,
        assetPlacements,
        pawnSheets,
        selectedPlacementId,
      },
    };
  }

  const newStackId = createSequentialId(
    "stack",
    state.stackState.stacks.map((candidate) => candidate.id),
  );
  let visual:
    | ReturnType<typeof createManagedPlacement>
    | ReturnType<typeof createStackVisual>
    | null = null;

  if (target.type === "location") {
    visual = createStackVisual(state, asset, newStackId, target.id, moveCount);
  }

  const stackState = splitPawnStack(state.stackState, {
    sourceStackId: stack.id,
    newStackId,
    count: moveCount,
    target,
    name: stack.name,
    ...(visual ? { placementId: visual.placement.id } : {}),
    ...(visual ? { entityId: visual.entity.id } : {}),
  });
  const entityState = visual
    ? {
        entities: [
          ...updateStackEntityCount(
            state.entityState,
            stack.entityId,
            stack.count - moveCount,
          ).entities,
          visual.entity,
        ],
      }
    : updateStackEntityCount(
        state.entityState,
        stack.entityId,
        stack.count - moveCount,
      );
  const assetPlacements = visual
    ? [...state.assetPlacements, visual.placement]
    : state.assetPlacements;
  const pawnSheets =
    visual?.pawnSheet && visual.placement.category === "PAWN"
      ? {
          ...state.pawnSheets,
          [visual.placement.id]: visual.pawnSheet,
        }
      : state.pawnSheets;

  return {
    stackId: newStackId,
    patch: {
      stackState,
      entityState,
      assetPlacements,
      pawnSheets,
      selectedPlacementId: visual?.placement.id ?? state.selectedPlacementId,
    },
  };
}

function getLocationOrThrow(board: BoardState, locationId: string) {
  const location = board.locations.find((candidate) => candidate.id === locationId);

  if (!location) {
    throw new Error(`Location '${locationId}' was not found.`);
  }

  return location;
}

function removePlacementLocation(placement: AssetPlacement): AssetPlacement {
  const { locationId: _locationId, ...nextPlacement } = placement;
  return nextPlacement;
}

function removeEntityLocation<T extends { locationId?: string }>(entity: T): T {
  const { locationId: _locationId, ...nextEntity } = entity;
  return nextEntity as T;
}

function isNonNullableString(value: string | undefined): value is string {
  return Boolean(value);
}

function createFrozenSetupSnapshot(
  state: Pick<
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
    cardDeckState: state.cardDeckState,
    diceState: state.diceState,
    slotState: state.slotState,
    stackState: state.stackState,
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

function findAssetImportTargetIndex(
  assets: readonly UploadedImageAsset[],
  importedAsset: UploadedImageAsset,
) {
  const exactId = assets.findIndex((asset) => asset.id === importedAsset.id);

  if (exactId >= 0) {
    return exactId;
  }

  const sourcePath = normalizeAssetPath(importedAsset.sourcePath);

  if (sourcePath) {
    const byPath = assets.findIndex(
      (asset) => normalizeAssetPath(asset.sourcePath) === sourcePath,
    );

    if (byPath >= 0) {
      return byPath;
    }
  }

  const fallbackMatches = assets
    .map((asset, index) => ({ asset, index }))
    .filter(
      ({ asset }) =>
        isScenarioAssetReferenceUrl(asset.url) &&
        asset.name === importedAsset.name &&
        asset.category === importedAsset.category &&
        asset.mimeType === importedAsset.mimeType &&
        asset.size === importedAsset.size,
    );

  return fallbackMatches.length === 1 ? fallbackMatches[0]!.index : -1;
}

function isScenarioAssetReferenceUrl(url: string) {
  return url.startsWith("lorecanvas-asset-ref://");
}

function normalizeAssetPath(path: string | undefined) {
  return path?.trim().replace(/\\/g, "/").toLowerCase() ?? "";
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
