import type { BoardState } from "./board";
import { validateBoard } from "./board";
import { createEmptyCardDeckState, isCardZoneKind } from "./cardDeck";
import type { CardDeckState, CardRef, CardZone } from "./cardDeck";
import { createEmptyDiceState, isDiceRollMode } from "./dice";
import type {
  DicePool,
  DicePoolDie,
  DiceRoll,
  DiceRollResult,
  DiceState,
  DieDefinition,
  DieFaceRef,
} from "./dice";
import {
  createEmptySlotState,
  isSlotAssetCategory,
  isSlotOwnerType,
} from "./slot";
import type { BoardSlot, SlotState } from "./slot";
import {
  createEmptyStackState,
  isStackAssetCategory,
  isStackContainerType,
} from "./stack";
import type { PawnStack, StackState, SupplyZone } from "./stack";
import type { EntityState, JsonRecord, ResourceCategory } from "./entity";
import { isResourceCategory } from "./entity";

export const SCENARIO_PACKAGE_FORMAT = "lorecanvas.scenario";
export const SCENARIO_PACKAGE_VERSION = 1;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type ScenarioMetadata = Record<string, JsonValue | undefined>;

export interface ScenarioAsset {
  id: string;
  category: ResourceCategory;
  name: string;
  url: string;
  /** Transient downscaled preview reference; regenerated when files are re-imported. */
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

export interface ScenarioAssetPlacement {
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

export interface ScenarioPawnTokenCounter {
  assetId: string;
  count: number;
}

export interface ScenarioPawnSheet {
  characterCardAssetId?: string;
  heldCardAssetIds: string[];
  counters: ScenarioPawnTokenCounter[];
}

export interface ScenarioViewport {
  boardZoom: number;
  boardPan: {
    x: number;
    y: number;
  };
}

export type ScenarioMode = "edit" | "run";

export interface ScenarioFrozenSetup {
  assets: ScenarioAsset[];
  board: BoardState;
  assetPlacements: ScenarioAssetPlacement[];
  entityState: EntityState;
  pawnSheets: Record<string, ScenarioPawnSheet>;
  cardDeckState: CardDeckState;
  diceState: DiceState;
  slotState: SlotState;
  stackState: StackState;
  boardState: JsonRecord;
  locationStates: Record<string, JsonRecord>;
  edgeStates: Record<string, JsonRecord>;
  viewport: ScenarioViewport;
}

export interface ScenarioPackage {
  format: typeof SCENARIO_PACKAGE_FORMAT;
  version: typeof SCENARIO_PACKAGE_VERSION;
  mode: ScenarioMode;
  metadata: ScenarioMetadata;
  assets: ScenarioAsset[];
  board: BoardState;
  assetPlacements: ScenarioAssetPlacement[];
  entityState: EntityState;
  pawnSheets: Record<string, ScenarioPawnSheet>;
  cardDeckState: CardDeckState;
  diceState: DiceState;
  slotState: SlotState;
  stackState: StackState;
  boardState: JsonRecord;
  locationStates: Record<string, JsonRecord>;
  edgeStates: Record<string, JsonRecord>;
  frozenSetup: ScenarioFrozenSetup | null;
  viewport: ScenarioViewport;
}

export type ScenarioValidationCode =
  | "invalid_format"
  | "invalid_version"
  | "invalid_metadata"
  | "invalid_assets"
  | "invalid_asset"
  | "duplicate_asset_id"
  | "invalid_board"
  | "board_background_asset_not_found"
  | "board_background_asset_category"
  | "invalid_entity_state"
  | "invalid_entity"
  | "duplicate_entity_id"
  | "entity_location_not_found"
  | "invalid_asset_placements"
  | "invalid_asset_placement"
  | "duplicate_asset_placement_id"
  | "placement_asset_not_found"
  | "placement_entity_not_found"
  | "placement_location_not_found"
  | "placement_category_mismatch"
  | "placement_entity_location_mismatch"
  | "invalid_pawn_sheets"
  | "invalid_pawn_sheet"
  | "pawn_sheet_placement_not_found"
  | "pawn_sheet_placement_category"
  | "pawn_sheet_asset_not_found"
  | "pawn_sheet_asset_category"
  | "invalid_card_deck_state"
  | "invalid_card_zone"
  | "duplicate_card_zone_id"
  | "invalid_card_ref"
  | "duplicate_card_ref_id"
  | "card_ref_asset_not_found"
  | "card_ref_asset_category"
  | "card_ref_face_not_found"
  | "invalid_dice_state"
  | "invalid_die_definition"
  | "duplicate_die_id"
  | "invalid_die_face"
  | "duplicate_die_face_id"
  | "die_face_asset_not_found"
  | "die_face_asset_category"
  | "die_face_asset_face_not_found"
  | "invalid_dice_pool"
  | "duplicate_dice_pool_id"
  | "invalid_dice_pool_die"
  | "duplicate_dice_pool_die_id"
  | "dice_pool_die_not_found"
  | "invalid_dice_roll"
  | "duplicate_dice_roll_id"
  | "invalid_dice_roll_result"
  | "duplicate_dice_roll_result_id"
  | "dice_roll_pool_not_found"
  | "dice_roll_die_not_found"
  | "dice_roll_face_not_found"
  | "invalid_slot_state"
  | "invalid_slot"
  | "duplicate_slot_id"
  | "slot_owner_not_found"
  | "slot_asset_not_found"
  | "slot_asset_category"
  | "slot_placement_not_found"
  | "slot_placement_mismatch"
  | "invalid_stack_state"
  | "invalid_supply_zone"
  | "duplicate_supply_zone_id"
  | "invalid_pawn_stack"
  | "duplicate_pawn_stack_id"
  | "stack_asset_not_found"
  | "stack_asset_category"
  | "stack_container_not_found"
  | "stack_placement_not_found"
  | "stack_placement_mismatch"
  | "invalid_viewport"
  | "invalid_mode"
  | "invalid_board_state"
  | "invalid_location_states"
  | "invalid_edge_states"
  | "location_state_location_not_found"
  | "edge_state_edge_not_found"
  | "invalid_frozen_setup";

export interface ScenarioValidationIssue {
  code: ScenarioValidationCode;
  message: string;
  id?: string;
}

export class ScenarioValidationError extends Error {
  readonly code: ScenarioValidationCode;

  constructor(code: ScenarioValidationCode, message: string) {
    super(message);
    this.name = "ScenarioValidationError";
    this.code = code;
  }
}

export type ScenarioPackageInput = Omit<
  ScenarioPackage,
  | "format"
  | "version"
  | "metadata"
  | "viewport"
  | "mode"
  | "cardDeckState"
  | "diceState"
  | "slotState"
  | "stackState"
  | "boardState"
  | "locationStates"
  | "edgeStates"
  | "frozenSetup"
> & {
  metadata?: ScenarioMetadata;
  viewport?: Partial<ScenarioViewport>;
  mode?: ScenarioMode;
  cardDeckState?: CardDeckState;
  diceState?: DiceState;
  slotState?: SlotState;
  stackState?: StackState;
  boardState?: JsonRecord;
  locationStates?: Record<string, JsonRecord>;
  edgeStates?: Record<string, JsonRecord>;
  frozenSetup?: ScenarioFrozenSetup | null;
};

export function createScenarioPackage(input: ScenarioPackageInput): ScenarioPackage {
  const scenario: ScenarioPackage = {
    format: SCENARIO_PACKAGE_FORMAT,
    version: SCENARIO_PACKAGE_VERSION,
    mode: input.mode ?? "edit",
    metadata: cloneJson(input.metadata ?? {}),
    assets: cloneJson(input.assets),
    board: cloneJson(input.board),
    assetPlacements: cloneJson(input.assetPlacements),
    entityState: cloneJson(input.entityState),
    pawnSheets: cloneJson(input.pawnSheets),
    cardDeckState: cloneJson(input.cardDeckState ?? createEmptyCardDeckState()),
    diceState: cloneJson(input.diceState ?? createEmptyDiceState()),
    slotState: cloneJson(input.slotState ?? createEmptySlotState()),
    stackState: cloneJson(input.stackState ?? createEmptyStackState()),
    boardState: cloneJson(input.boardState ?? {}),
    locationStates: cloneJson(input.locationStates ?? {}),
    edgeStates: cloneJson(input.edgeStates ?? {}),
    frozenSetup: input.frozenSetup ? cloneJson(input.frozenSetup) : null,
    viewport: {
      boardZoom: input.viewport?.boardZoom ?? 1,
      boardPan: {
        x: input.viewport?.boardPan?.x ?? 0,
        y: input.viewport?.boardPan?.y ?? 0,
      },
    },
  };

  return assertValidScenarioPackage(scenario);
}

export function serializeScenarioPackage(scenario: ScenarioPackage) {
  return JSON.stringify(assertValidScenarioPackage(scenario), null, 2);
}

export function parseScenarioPackage(source: string): ScenarioPackage {
  const parsed: unknown = JSON.parse(source);

  return assertValidScenarioPackage(parsed);
}

export function assertValidScenarioPackage(value: unknown): ScenarioPackage {
  const normalized = normalizeScenarioPackage(value);
  const issues = validateScenarioPackage(normalized);

  if (issues[0]) {
    throw new ScenarioValidationError(issues[0].code, issues[0].message);
  }

  return cloneJson(normalized as ScenarioPackage);
}

export function validateScenarioPackage(value: unknown): ScenarioValidationIssue[] {
  const issues: ScenarioValidationIssue[] = [];
  value = normalizeScenarioPackage(value);

  if (!isRecord(value)) {
    return [
      {
        code: "invalid_format",
        message: "Scenario package must be a JSON object.",
      },
    ];
  }

  if (value.format !== SCENARIO_PACKAGE_FORMAT) {
    issues.push({
      code: "invalid_format",
      message: `Scenario package format must be '${SCENARIO_PACKAGE_FORMAT}'.`,
    });
  }

  if (value.version !== SCENARIO_PACKAGE_VERSION) {
    issues.push({
      code: "invalid_version",
      message: `Scenario package version must be ${SCENARIO_PACKAGE_VERSION}.`,
    });
  }

  if (value.mode !== "edit" && value.mode !== "run") {
    issues.push({
      code: "invalid_mode",
      message: "Scenario mode must be 'edit' or 'run'.",
    });
  }

  if (!isRecord(value.metadata)) {
    issues.push({
      code: "invalid_metadata",
      message: "Scenario metadata must be a JSON object.",
    });
  }

  const assets = getArray<ScenarioAsset>(value.assets);
  const board = isBoardState(value.board) ? value.board : null;
  const entityState = isEntityState(value.entityState) ? value.entityState : null;
  const assetPlacements = getArray<ScenarioAssetPlacement>(value.assetPlacements);
  const pawnSheets = isRecord(value.pawnSheets)
    ? (value.pawnSheets as Record<string, unknown>)
    : null;
  const cardDeckState = isCardDeckState(value.cardDeckState)
    ? value.cardDeckState
    : null;
  const diceState = isDiceState(value.diceState) ? value.diceState : null;
  const slotState = isSlotState(value.slotState) ? value.slotState : null;
  const stackState = isStackState(value.stackState) ? value.stackState : null;

  if (!assets) {
    issues.push({
      code: "invalid_assets",
      message: "Scenario assets must be an array.",
    });
  }

  if (!board) {
    issues.push({
      code: "invalid_board",
      message: "Scenario board must contain background, locations, and edges.",
    });
  }

  if (!entityState) {
    issues.push({
      code: "invalid_entity_state",
      message: "Scenario entityState must contain an entities array.",
    });
  }

  if (!assetPlacements) {
    issues.push({
      code: "invalid_asset_placements",
      message: "Scenario assetPlacements must be an array.",
    });
  }

  if (!pawnSheets) {
    issues.push({
      code: "invalid_pawn_sheets",
      message: "Scenario pawnSheets must be a JSON object.",
    });
  }

  if (!cardDeckState) {
    issues.push({
      code: "invalid_card_deck_state",
      message: "Scenario cardDeckState must contain a zones array.",
    });
  }

  if (!diceState) {
    issues.push({
      code: "invalid_dice_state",
      message: "Scenario diceState must contain definitions, pools, and rollHistory arrays.",
    });
  }

  if (!slotState) {
    issues.push({
      code: "invalid_slot_state",
      message: "Scenario slotState must contain a slots array.",
    });
  }

  if (!stackState) {
    issues.push({
      code: "invalid_stack_state",
      message: "Scenario stackState must contain supplyZones and stacks arrays.",
    });
  }

  if (!isViewport(value.viewport)) {
    issues.push({
      code: "invalid_viewport",
      message: "Scenario viewport must contain boardZoom and boardPan x/y numbers.",
    });
  }

  if (!isRecord(value.boardState)) {
    issues.push({
      code: "invalid_board_state",
      message: "Scenario boardState must be a JSON object.",
    });
  }

  if (!isRecord(value.locationStates)) {
    issues.push({
      code: "invalid_location_states",
      message: "Scenario locationStates must be a JSON object.",
    });
  }

  if (!isRecord(value.edgeStates)) {
    issues.push({
      code: "invalid_edge_states",
      message: "Scenario edgeStates must be a JSON object.",
    });
  }

  if (
    !assets ||
    !board ||
    !entityState ||
    !assetPlacements ||
    !pawnSheets ||
    !cardDeckState ||
    !diceState ||
    !slotState ||
    !stackState
  ) {
    return issues;
  }

  const assetIds = validateAssets(assets, issues);
  validateBoardState(board, assetIds, assets, issues);
  const locationIds = new Set(board.locations.map((location) => location.id));
  const entityIds = validateEntities(entityState, locationIds, issues);
  validatePlacements(assetPlacements, assets, assetIds, entityState, entityIds, locationIds, issues);
  validatePawnSheets(pawnSheets, assetPlacements, assets, assetIds, issues);
  validateCardDeckState(cardDeckState, assets, assetIds, issues);
  validateDiceState(diceState, assets, assetIds, issues);
  validateSlotState(slotState, assets, assetIds, assetPlacements, locationIds, issues);
  validateStackState(
    stackState,
    assets,
    assetIds,
    assetPlacements,
    entityIds,
    locationIds,
    issues,
  );
  validateStateSurfaces(
    value.locationStates as Record<string, unknown>,
    value.edgeStates as Record<string, unknown>,
    locationIds,
    new Set(board.edges.map((edge) => edge.id)),
    issues,
  );
  validateFrozenSetup(value.frozenSetup, issues);

  return issues;
}

function validateStateSurfaces(
  locationStates: Record<string, unknown>,
  edgeStates: Record<string, unknown>,
  locationIds: Set<string>,
  edgeIds: Set<string>,
  issues: ScenarioValidationIssue[],
) {
  for (const [locationId, state] of Object.entries(locationStates)) {
    if (!isRecord(state)) {
      issues.push({
        code: "invalid_location_states",
        message: `Location state '${locationId}' must be a JSON object.`,
        id: locationId,
      });
      continue;
    }

    if (!locationIds.has(locationId)) {
      issues.push({
        code: "location_state_location_not_found",
        message: `Location state '${locationId}' references a missing Location.`,
        id: locationId,
      });
    }
  }

  for (const [edgeId, state] of Object.entries(edgeStates)) {
    if (!isRecord(state)) {
      issues.push({
        code: "invalid_edge_states",
        message: `Edge state '${edgeId}' must be a JSON object.`,
        id: edgeId,
      });
      continue;
    }

    if (!edgeIds.has(edgeId)) {
      issues.push({
        code: "edge_state_edge_not_found",
        message: `Edge state '${edgeId}' references a missing Edge.`,
        id: edgeId,
      });
    }
  }
}

function validateFrozenSetup(
  value: unknown,
  issues: ScenarioValidationIssue[],
) {
  if (value === null || value === undefined) {
    return;
  }

  if (!isRecord(value)) {
    issues.push({
      code: "invalid_frozen_setup",
      message: "Scenario frozenSetup must be null or a setup snapshot object.",
    });
    return;
  }

  const assets = getArray<ScenarioAsset>(value.assets);
  const board = isBoardState(value.board) ? value.board : null;
  const entityState = isEntityState(value.entityState) ? value.entityState : null;
  const assetPlacements = getArray<ScenarioAssetPlacement>(value.assetPlacements);
  const pawnSheets = isRecord(value.pawnSheets)
    ? (value.pawnSheets as Record<string, unknown>)
    : null;
  const cardDeckState = isCardDeckState(value.cardDeckState)
    ? value.cardDeckState
    : null;
  const diceState = isDiceState(value.diceState) ? value.diceState : null;
  const slotState = isSlotState(value.slotState) ? value.slotState : null;
  const stackState = isStackState(value.stackState) ? value.stackState : null;

  if (
    !assets ||
    !board ||
    !entityState ||
    !assetPlacements ||
    !pawnSheets ||
    !cardDeckState ||
    !diceState ||
    !slotState ||
    !stackState ||
    !isRecord(value.boardState) ||
    !isRecord(value.locationStates) ||
    !isRecord(value.edgeStates) ||
    !isViewport(value.viewport)
  ) {
    issues.push({
      code: "invalid_frozen_setup",
      message: "Scenario frozenSetup is missing required setup snapshot fields.",
    });
    return;
  }

  const assetIds = validateAssets(assets, issues);
  validateBoardState(board, assetIds, assets, issues);
  const locationIds = new Set(board.locations.map((location) => location.id));
  const entityIds = validateEntities(entityState, locationIds, issues);
  validatePlacements(
    assetPlacements,
    assets,
    assetIds,
    entityState,
    entityIds,
    locationIds,
    issues,
  );
  validatePawnSheets(pawnSheets, assetPlacements, assets, assetIds, issues);
  validateCardDeckState(cardDeckState, assets, assetIds, issues);
  validateDiceState(diceState, assets, assetIds, issues);
  validateSlotState(slotState, assets, assetIds, assetPlacements, locationIds, issues);
  validateStackState(
    stackState,
    assets,
    assetIds,
    assetPlacements,
    entityIds,
    locationIds,
    issues,
  );
  validateStateSurfaces(
    value.locationStates as Record<string, unknown>,
    value.edgeStates as Record<string, unknown>,
    locationIds,
    new Set(board.edges.map((edge) => edge.id)),
    issues,
  );
}

function validateAssets(
  assets: ScenarioAsset[],
  issues: ScenarioValidationIssue[],
) {
  const assetIds = new Set<string>();

  for (const asset of assets) {
    if (!isRecord(asset) || !isNonEmptyString(asset.id)) {
      issues.push({
        code: "invalid_asset",
        message: "Every scenario asset must have a non-empty id.",
      });
      continue;
    }

    if (assetIds.has(asset.id)) {
      issues.push({
        code: "duplicate_asset_id",
        message: `Asset id '${asset.id}' is duplicated.`,
        id: asset.id,
      });
    }

    assetIds.add(asset.id);

    if (
      !isResourceCategory(String(asset.category)) ||
      !isNonEmptyString(asset.name) ||
      !isNonEmptyString(asset.url) ||
      !isNonEmptyString(asset.mimeType) ||
      !isFiniteNumber(asset.size) ||
      !isPositiveInteger(asset.maxCopies) ||
      !isPositiveNumber(asset.placementWidth) ||
      !isPositiveNumber(asset.placementHeight) ||
      (asset.faces !== undefined &&
        (!Array.isArray(asset.faces) || !asset.faces.every(isNonEmptyString)))
    ) {
      issues.push({
        code: "invalid_asset",
        message: `Asset '${asset.id}' has invalid required fields.`,
        id: asset.id,
      });
    }
  }

  return assetIds;
}

function validateBoardState(
  board: BoardState,
  assetIds: Set<string>,
  assets: ScenarioAsset[],
  issues: ScenarioValidationIssue[],
) {
  for (const boardIssue of validateBoard(board)) {
    issues.push({
      code: "invalid_board",
      message: boardIssue.message,
      id: boardIssue.locationId ?? boardIssue.edgeId,
    });
  }

  const background = board.background;

  if (!background) {
    return;
  }

  if (!assetIds.has(background.assetId)) {
    issues.push({
      code: "board_background_asset_not_found",
      message: `Board background asset '${background.assetId}' does not exist.`,
      id: background.assetId,
    });
    return;
  }

  const backgroundAsset = assets.find((asset) => asset.id === background.assetId);

  if (backgroundAsset?.category !== "BOARD") {
    issues.push({
      code: "board_background_asset_category",
      message: `Board background asset '${background.assetId}' must use BOARD category.`,
      id: background.assetId,
    });
  }
}

function validateEntities(
  entityState: EntityState,
  locationIds: Set<string>,
  issues: ScenarioValidationIssue[],
) {
  const entityIds = new Set<string>();

  for (const entity of entityState.entities) {
    if (
      !isRecord(entity) ||
      !isNonEmptyString(entity.id) ||
      !isNonEmptyString(entity.type) ||
      !isRecord(entity.state)
    ) {
      issues.push({
        code: "invalid_entity",
        message: "Every scenario entity must have id, type, and JSON object state.",
      });
      continue;
    }

    if (entityIds.has(entity.id)) {
      issues.push({
        code: "duplicate_entity_id",
        message: `Entity id '${entity.id}' is duplicated.`,
        id: entity.id,
      });
    }

    entityIds.add(entity.id);

    if (entity.locationId && !locationIds.has(entity.locationId)) {
      issues.push({
        code: "entity_location_not_found",
        message: `Entity '${entity.id}' references missing location '${entity.locationId}'.`,
        id: entity.id,
      });
    }
  }

  return entityIds;
}

function validatePlacements(
  placements: ScenarioAssetPlacement[],
  assets: ScenarioAsset[],
  assetIds: Set<string>,
  entityState: EntityState,
  entityIds: Set<string>,
  locationIds: Set<string>,
  issues: ScenarioValidationIssue[],
) {
  const placementIds = new Set<string>();

  for (const placement of placements) {
    if (
      !isRecord(placement) ||
      !isNonEmptyString(placement.id) ||
      !isNonEmptyString(placement.assetId) ||
      !isResourceCategory(String(placement.category)) ||
      !isNonEmptyString(placement.entityId) ||
      !isNormalizedNumber(placement.x) ||
      !isNormalizedNumber(placement.y) ||
      !isPositiveNumber(placement.width) ||
      !isPositiveNumber(placement.height)
    ) {
      issues.push({
        code: "invalid_asset_placement",
        message: "Every asset placement must have valid ids, category, position, and size.",
      });
      continue;
    }

    if (placementIds.has(placement.id)) {
      issues.push({
        code: "duplicate_asset_placement_id",
        message: `Asset placement id '${placement.id}' is duplicated.`,
        id: placement.id,
      });
    }

    placementIds.add(placement.id);

    const asset = assets.find((candidate) => candidate.id === placement.assetId);

    if (!assetIds.has(placement.assetId) || !asset) {
      issues.push({
        code: "placement_asset_not_found",
        message: `Placement '${placement.id}' references missing asset '${placement.assetId}'.`,
        id: placement.id,
      });
    } else if (asset.category !== placement.category) {
      issues.push({
        code: "placement_category_mismatch",
        message: `Placement '${placement.id}' category does not match asset '${asset.id}'.`,
        id: placement.id,
      });
    }

    if (!entityIds.has(placement.entityId)) {
      issues.push({
        code: "placement_entity_not_found",
        message: `Placement '${placement.id}' references missing entity '${placement.entityId}'.`,
        id: placement.id,
      });
    }

    if (placement.locationId && !locationIds.has(placement.locationId)) {
      issues.push({
        code: "placement_location_not_found",
        message: `Placement '${placement.id}' references missing location '${placement.locationId}'.`,
        id: placement.id,
      });
    }

    const entity = entityState.entities.find(
      (candidate) => candidate.id === placement.entityId,
    );

    if (
      entity?.locationId &&
      placement.locationId &&
      entity.locationId !== placement.locationId
    ) {
      issues.push({
        code: "placement_entity_location_mismatch",
        message: `Placement '${placement.id}' and entity '${entity.id}' use different locations.`,
        id: placement.id,
      });
    }
  }
}

function validatePawnSheets(
  pawnSheets: Record<string, unknown>,
  placements: ScenarioAssetPlacement[],
  assets: ScenarioAsset[],
  assetIds: Set<string>,
  issues: ScenarioValidationIssue[],
) {
  for (const [placementId, sheet] of Object.entries(pawnSheets)) {
    if (!isScenarioPawnSheet(sheet)) {
      issues.push({
        code: "invalid_pawn_sheet",
        message: `Pawn sheet '${placementId}' is malformed.`,
        id: placementId,
      });
      continue;
    }

    const placement = placements.find((candidate) => candidate.id === placementId);

    if (!placement) {
      issues.push({
        code: "pawn_sheet_placement_not_found",
        message: `Pawn sheet '${placementId}' does not have a placement.`,
        id: placementId,
      });
      continue;
    }

    if (placement.category !== "PAWN") {
      issues.push({
        code: "pawn_sheet_placement_category",
        message: `Pawn sheet '${placementId}' must belong to a PAWN placement.`,
        id: placementId,
      });
    }

    for (const assetId of getPawnSheetAssetIds(sheet)) {
      const asset = assets.find((candidate) => candidate.id === assetId);

      if (!assetIds.has(assetId) || !asset) {
        issues.push({
          code: "pawn_sheet_asset_not_found",
          message: `Pawn sheet '${placementId}' references missing asset '${assetId}'.`,
          id: placementId,
        });
        continue;
      }

      const expectedCategory = sheet.counters.some(
        (counter) => counter.assetId === assetId,
      )
        ? "TOKEN"
        : "CARD";

      if (asset.category !== expectedCategory) {
        issues.push({
          code: "pawn_sheet_asset_category",
          message: `Pawn sheet '${placementId}' references a non-${expectedCategory} asset '${assetId}'.`,
          id: placementId,
        });
      }
    }
  }
}

function validateCardDeckState(
  cardDeckState: CardDeckState,
  assets: ScenarioAsset[],
  assetIds: Set<string>,
  issues: ScenarioValidationIssue[],
) {
  const zoneIds = new Set<string>();
  const cardIds = new Set<string>();

  for (const zone of cardDeckState.zones) {
    if (!isScenarioCardZone(zone)) {
      issues.push({
        code: "invalid_card_zone",
        message: "Every card zone must have id, name, kind, cards, and JSON state.",
      });
      continue;
    }

    if (zoneIds.has(zone.id)) {
      issues.push({
        code: "duplicate_card_zone_id",
        message: `Card zone id '${zone.id}' is duplicated.`,
        id: zone.id,
      });
    }

    zoneIds.add(zone.id);

    for (const card of zone.cards) {
      if (!isScenarioCardRef(card)) {
        issues.push({
          code: "invalid_card_ref",
          message: `Card zone '${zone.id}' contains a malformed card ref.`,
          id: zone.id,
        });
        continue;
      }

      if (cardIds.has(card.id)) {
        issues.push({
          code: "duplicate_card_ref_id",
          message: `Card ref id '${card.id}' is duplicated across card zones.`,
          id: card.id,
        });
      }

      cardIds.add(card.id);

      const asset = assets.find((candidate) => candidate.id === card.assetId);

      if (!assetIds.has(card.assetId) || !asset) {
        issues.push({
          code: "card_ref_asset_not_found",
          message: `Card ref '${card.id}' references missing asset '${card.assetId}'.`,
          id: card.id,
        });
        continue;
      }

      if (asset.category !== "CARD") {
        issues.push({
          code: "card_ref_asset_category",
          message: `Card ref '${card.id}' must reference a CARD asset.`,
          id: card.id,
        });
      }

      if (
        card.faceId &&
        asset.faces &&
        !asset.faces.includes(card.faceId)
      ) {
        issues.push({
          code: "card_ref_face_not_found",
          message: `Card ref '${card.id}' references missing face '${card.faceId}'.`,
          id: card.id,
        });
      }
    }
  }
}

function validateDiceState(
  diceState: DiceState,
  assets: ScenarioAsset[],
  assetIds: Set<string>,
  issues: ScenarioValidationIssue[],
) {
  const dieIds = new Set<string>();
  const dieById = new Map<string, DieDefinition>();
  const faceByDieAndFace = new Map<string, DieFaceRef>();

  for (const definition of diceState.definitions) {
    if (!isScenarioDieDefinition(definition)) {
      issues.push({
        code: "invalid_die_definition",
        message: "Every die definition must have id, name, faces, and JSON state.",
      });
      continue;
    }

    if (dieIds.has(definition.id)) {
      issues.push({
        code: "duplicate_die_id",
        message: `Die definition id '${definition.id}' is duplicated.`,
        id: definition.id,
      });
    }

    dieIds.add(definition.id);
    dieById.set(definition.id, definition);

    const faceIds = new Set<string>();

    for (const face of definition.faces) {
      if (!isScenarioDieFace(face)) {
        issues.push({
          code: "invalid_die_face",
          message: `Die definition '${definition.id}' contains a malformed face ref.`,
          id: definition.id,
        });
        continue;
      }

      if (faceIds.has(face.id)) {
        issues.push({
          code: "duplicate_die_face_id",
          message: `Die face id '${face.id}' is duplicated in die '${definition.id}'.`,
          id: definition.id,
        });
      }

      faceIds.add(face.id);
      faceByDieAndFace.set(getDieFaceKey(definition.id, face.id), face);

      const asset = assets.find((candidate) => candidate.id === face.assetId);

      if (!assetIds.has(face.assetId) || !asset) {
        issues.push({
          code: "die_face_asset_not_found",
          message: `Die face '${face.id}' references missing asset '${face.assetId}'.`,
          id: definition.id,
        });
        continue;
      }

      if (asset.category !== "TOKEN") {
        issues.push({
          code: "die_face_asset_category",
          message: `Die face '${face.id}' must reference a TOKEN asset.`,
          id: definition.id,
        });
      }

      if (face.faceId && asset.faces && !asset.faces.includes(face.faceId)) {
        issues.push({
          code: "die_face_asset_face_not_found",
          message: `Die face '${face.id}' references missing asset face '${face.faceId}'.`,
          id: definition.id,
        });
      }
    }
  }

  const poolIds = new Set<string>();
  const poolDieIds = new Set<string>();
  const poolById = new Map<string, DicePool>();

  for (const pool of diceState.pools) {
    if (!isScenarioDicePool(pool)) {
      issues.push({
        code: "invalid_dice_pool",
        message: "Every dice pool must have id, name, dice, and JSON state.",
      });
      continue;
    }

    if (poolIds.has(pool.id)) {
      issues.push({
        code: "duplicate_dice_pool_id",
        message: `Dice pool id '${pool.id}' is duplicated.`,
        id: pool.id,
      });
    }

    poolIds.add(pool.id);
    poolById.set(pool.id, pool);

    for (const poolDie of pool.dice) {
      if (!isScenarioDicePoolDie(poolDie)) {
        issues.push({
          code: "invalid_dice_pool_die",
          message: `Dice pool '${pool.id}' contains a malformed die entry.`,
          id: pool.id,
        });
        continue;
      }

      if (poolDieIds.has(poolDie.id)) {
        issues.push({
          code: "duplicate_dice_pool_die_id",
          message: `Dice pool die id '${poolDie.id}' is duplicated.`,
          id: poolDie.id,
        });
      }

      poolDieIds.add(poolDie.id);

      if (!dieIds.has(poolDie.dieId)) {
        issues.push({
          code: "dice_pool_die_not_found",
          message: `Dice pool '${pool.id}' references missing die '${poolDie.dieId}'.`,
          id: pool.id,
        });
      }
    }
  }

  const rollIds = new Set<string>();
  const rollResultIds = new Set<string>();

  for (const roll of diceState.rollHistory) {
    if (!isScenarioDiceRoll(roll)) {
      issues.push({
        code: "invalid_dice_roll",
        message: "Every dice roll must have id, poolId, mode, rolledAt, results, and JSON state.",
      });
      continue;
    }

    if (rollIds.has(roll.id)) {
      issues.push({
        code: "duplicate_dice_roll_id",
        message: `Dice roll id '${roll.id}' is duplicated.`,
        id: roll.id,
      });
    }

    rollIds.add(roll.id);

    if (!poolById.has(roll.poolId)) {
      issues.push({
        code: "dice_roll_pool_not_found",
        message: `Dice roll '${roll.id}' references missing pool '${roll.poolId}'.`,
        id: roll.id,
      });
    }

    for (const result of roll.results) {
      if (!isScenarioDiceRollResult(result)) {
        issues.push({
          code: "invalid_dice_roll_result",
          message: `Dice roll '${roll.id}' contains a malformed result.`,
          id: roll.id,
        });
        continue;
      }

      if (rollResultIds.has(result.id)) {
        issues.push({
          code: "duplicate_dice_roll_result_id",
          message: `Dice roll result id '${result.id}' is duplicated.`,
          id: result.id,
        });
      }

      rollResultIds.add(result.id);

      const die = dieById.get(result.dieId);

      if (!die) {
        issues.push({
          code: "dice_roll_die_not_found",
          message: `Dice roll result '${result.id}' references missing die '${result.dieId}'.`,
          id: result.id,
        });
        continue;
      }

      const face = faceByDieAndFace.get(getDieFaceKey(result.dieId, result.faceRefId));

      if (!face) {
        issues.push({
          code: "dice_roll_face_not_found",
          message: `Dice roll result '${result.id}' references missing face '${result.faceRefId}'.`,
          id: result.id,
        });
        continue;
      }

      if (
        result.assetId !== face.assetId ||
        (result.faceId ?? undefined) !== (face.faceId ?? undefined)
      ) {
        issues.push({
          code: "dice_roll_face_not_found",
          message: `Dice roll result '${result.id}' does not match face '${result.faceRefId}'.`,
          id: result.id,
        });
      }
    }
  }

  if (
    diceState.lastRollId !== undefined &&
    !diceState.rollHistory.some((roll) => roll.id === diceState.lastRollId)
  ) {
    issues.push({
      code: "invalid_dice_state",
      message: `Last dice roll '${diceState.lastRollId}' is not in rollHistory.`,
      id: diceState.lastRollId,
    });
  }
}

function validateSlotState(
  slotState: SlotState,
  assets: ScenarioAsset[],
  assetIds: Set<string>,
  placements: ScenarioAssetPlacement[],
  locationIds: Set<string>,
  issues: ScenarioValidationIssue[],
) {
  const slotIds = new Set<string>();
  const placementById = new Map(placements.map((placement) => [placement.id, placement]));

  for (const slot of slotState.slots) {
    if (!isScenarioSlot(slot)) {
      issues.push({
        code: "invalid_slot",
        message: "Every slot must have id, name, owner, coordinates, and JSON state.",
      });
      continue;
    }

    if (slotIds.has(slot.id)) {
      issues.push({
        code: "duplicate_slot_id",
        message: `Slot id '${slot.id}' is duplicated.`,
        id: slot.id,
      });
    }

    slotIds.add(slot.id);

    if (slot.ownerType === "location" && !locationIds.has(slot.ownerId)) {
      issues.push({
        code: "slot_owner_not_found",
        message: `Slot '${slot.id}' references missing Location '${slot.ownerId}'.`,
        id: slot.id,
      });
    }

    if (!isNormalizedNumber(slot.x) || !isNormalizedNumber(slot.y)) {
      issues.push({
        code: "invalid_slot",
        message: `Slot '${slot.id}' coordinates must be between 0 and 1.`,
        id: slot.id,
      });
    }

    if (slot.assetId) {
      const asset = assets.find((candidate) => candidate.id === slot.assetId);

      if (!assetIds.has(slot.assetId) || !asset) {
        issues.push({
          code: "slot_asset_not_found",
          message: `Slot '${slot.id}' references missing asset '${slot.assetId}'.`,
          id: slot.id,
        });
      } else if (!isSlotAssetCategory(asset.category)) {
        issues.push({
          code: "slot_asset_category",
          message: `Slot '${slot.id}' must reference a TILE or TOKEN asset.`,
          id: slot.id,
        });
      }
    }

    if (slot.placementId) {
      const placement = placementById.get(slot.placementId);

      if (!placement) {
        issues.push({
          code: "slot_placement_not_found",
          message: `Slot '${slot.id}' references missing placement '${slot.placementId}'.`,
          id: slot.id,
        });
      } else if (slot.assetId && placement.assetId !== slot.assetId) {
        issues.push({
          code: "slot_placement_mismatch",
          message: `Slot '${slot.id}' placement does not use slot asset '${slot.assetId}'.`,
          id: slot.id,
        });
      }
    }
  }
}

function validateStackState(
  stackState: StackState,
  assets: ScenarioAsset[],
  assetIds: Set<string>,
  placements: ScenarioAssetPlacement[],
  entityIds: Set<string>,
  locationIds: Set<string>,
  issues: ScenarioValidationIssue[],
) {
  const supplyZoneIds = new Set<string>();
  const stackIds = new Set<string>();
  const placementById = new Map(placements.map((placement) => [placement.id, placement]));

  for (const zone of stackState.supplyZones) {
    if (!isScenarioSupplyZone(zone)) {
      issues.push({
        code: "invalid_supply_zone",
        message: "Every supply zone must have id, name, and JSON state.",
      });
      continue;
    }

    if (supplyZoneIds.has(zone.id)) {
      issues.push({
        code: "duplicate_supply_zone_id",
        message: `Supply zone id '${zone.id}' is duplicated.`,
        id: zone.id,
      });
    }

    supplyZoneIds.add(zone.id);
  }

  for (const stack of stackState.stacks) {
    if (!isScenarioPawnStack(stack)) {
      issues.push({
        code: "invalid_pawn_stack",
        message: "Every pawn stack must have id, asset, container, count, and JSON state.",
      });
      continue;
    }

    if (stackIds.has(stack.id)) {
      issues.push({
        code: "duplicate_pawn_stack_id",
        message: `Pawn stack id '${stack.id}' is duplicated.`,
        id: stack.id,
      });
    }

    stackIds.add(stack.id);

    const asset = assets.find((candidate) => candidate.id === stack.assetId);

    if (!assetIds.has(stack.assetId) || !asset) {
      issues.push({
        code: "stack_asset_not_found",
        message: `Stack '${stack.id}' references missing asset '${stack.assetId}'.`,
        id: stack.id,
      });
    } else if (!isStackAssetCategory(asset.category)) {
      issues.push({
        code: "stack_asset_category",
        message: `Stack '${stack.id}' must reference a PAWN or TOKEN asset.`,
        id: stack.id,
      });
    }

    if (
      stack.container.type === "location" &&
      !locationIds.has(stack.container.id)
    ) {
      issues.push({
        code: "stack_container_not_found",
        message: `Stack '${stack.id}' references missing Location '${stack.container.id}'.`,
        id: stack.id,
      });
    }

    if (
      stack.container.type === "supply" &&
      !supplyZoneIds.has(stack.container.id)
    ) {
      issues.push({
        code: "stack_container_not_found",
        message: `Stack '${stack.id}' references missing supply zone '${stack.container.id}'.`,
        id: stack.id,
      });
    }

    if (stack.placementId) {
      const placement = placementById.get(stack.placementId);

      if (!placement) {
        issues.push({
          code: "stack_placement_not_found",
          message: `Stack '${stack.id}' references missing placement '${stack.placementId}'.`,
          id: stack.id,
        });
      } else if (
        placement.assetId !== stack.assetId ||
        placement.category !== stack.category
      ) {
        issues.push({
          code: "stack_placement_mismatch",
          message: `Stack '${stack.id}' placement does not match stack asset/category.`,
          id: stack.id,
        });
      }
    }

    if (stack.entityId && !entityIds.has(stack.entityId)) {
      issues.push({
        code: "stack_placement_mismatch",
        message: `Stack '${stack.id}' references missing entity '${stack.entityId}'.`,
        id: stack.id,
      });
    }
  }
}

function getPawnSheetAssetIds(sheet: ScenarioPawnSheet) {
  return [
    ...(sheet.characterCardAssetId ? [sheet.characterCardAssetId] : []),
    ...sheet.heldCardAssetIds,
    ...sheet.counters.map((counter) => counter.assetId),
  ];
}

function isBoardState(value: unknown): value is BoardState {
  return (
    isRecord(value) &&
    (value.background === null || isRecord(value.background)) &&
    Array.isArray(value.locations) &&
    Array.isArray(value.edges)
  );
}

function isEntityState(value: unknown): value is EntityState {
  return isRecord(value) && Array.isArray(value.entities);
}

function isCardDeckState(value: unknown): value is CardDeckState {
  return isRecord(value) && Array.isArray(value.zones);
}

function isDiceState(value: unknown): value is DiceState {
  return (
    isRecord(value) &&
    Array.isArray(value.definitions) &&
    Array.isArray(value.pools) &&
    Array.isArray(value.rollHistory) &&
    (value.lastRollId === undefined || isNonEmptyString(value.lastRollId))
  );
}

function isSlotState(value: unknown): value is SlotState {
  return isRecord(value) && Array.isArray(value.slots);
}

function isStackState(value: unknown): value is StackState {
  return (
    isRecord(value) &&
    Array.isArray(value.supplyZones) &&
    Array.isArray(value.stacks)
  );
}

function isScenarioCardZone(value: unknown): value is CardZone {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isCardZoneKind(String(value.kind)) &&
    Array.isArray(value.cards) &&
    isRecord(value.state)
  );
}

function isScenarioCardRef(value: unknown): value is CardRef {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.assetId) &&
    (value.faceId === undefined || isNonEmptyString(value.faceId)) &&
    (value.label === undefined || isNonEmptyString(value.label)) &&
    typeof value.faceUp === "boolean" &&
    isRecord(value.state)
  );
}

function isScenarioDieDefinition(value: unknown): value is DieDefinition {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    Array.isArray(value.faces) &&
    value.faces.length > 0 &&
    isRecord(value.state)
  );
}

function isScenarioDieFace(value: unknown): value is DieFaceRef {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.assetId) &&
    (value.faceId === undefined || isNonEmptyString(value.faceId)) &&
    (value.label === undefined || isNonEmptyString(value.label)) &&
    isRecord(value.state)
  );
}

function isScenarioDicePool(value: unknown): value is DicePool {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    Array.isArray(value.dice) &&
    isRecord(value.state)
  );
}

function isScenarioDicePoolDie(value: unknown): value is DicePoolDie {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.dieId) &&
    Number.isInteger(value.count) &&
    Number(value.count) > 0 &&
    isRecord(value.state)
  );
}

function isScenarioDiceRoll(value: unknown): value is DiceRoll {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.poolId) &&
    isDiceRollMode(String(value.mode)) &&
    isNonEmptyString(value.rolledAt) &&
    Array.isArray(value.results) &&
    isRecord(value.state)
  );
}

function isScenarioDiceRollResult(value: unknown): value is DiceRollResult {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.poolDieId) &&
    isNonEmptyString(value.dieId) &&
    isNonEmptyString(value.faceRefId) &&
    isNonEmptyString(value.assetId) &&
    (value.faceId === undefined || isNonEmptyString(value.faceId)) &&
    (value.label === undefined || isNonEmptyString(value.label)) &&
    typeof value.isOverride === "boolean" &&
    isRecord(value.state)
  );
}

function isScenarioSlot(value: unknown): value is BoardSlot {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isSlotOwnerType(String(value.ownerType)) &&
    isNonEmptyString(value.ownerId) &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    (value.assetId === undefined || isNonEmptyString(value.assetId)) &&
    (value.placementId === undefined || isNonEmptyString(value.placementId)) &&
    isRecord(value.state)
  );
}

function isScenarioSupplyZone(value: unknown): value is SupplyZone {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isRecord(value.state)
  );
}

function isScenarioPawnStack(value: unknown): value is PawnStack {
  if (!isRecord(value)) {
    return false;
  }
  const category = String(value.category);

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.assetId) &&
    isResourceCategory(category) &&
    isStackAssetCategory(category) &&
    isRecord(value.container) &&
    isStackContainerType(String(value.container.type)) &&
    isNonEmptyString(value.container.id) &&
    Number.isInteger(value.count) &&
    Number(value.count) > 0 &&
    (value.capacity === undefined ||
      (Number.isInteger(value.capacity) && Number(value.capacity) > 0)) &&
    (value.placementId === undefined || isNonEmptyString(value.placementId)) &&
    (value.entityId === undefined || isNonEmptyString(value.entityId)) &&
    isRecord(value.state)
  );
}

function isScenarioPawnSheet(value: unknown): value is ScenarioPawnSheet {
  return (
    isRecord(value) &&
    (value.characterCardAssetId === undefined ||
      isNonEmptyString(value.characterCardAssetId)) &&
    Array.isArray(value.heldCardAssetIds) &&
    value.heldCardAssetIds.every(isNonEmptyString) &&
    Array.isArray(value.counters) &&
    value.counters.every(
      (counter) =>
        isRecord(counter) &&
        isNonEmptyString(counter.assetId) &&
        typeof counter.count === "number" &&
        Number.isInteger(counter.count) &&
        counter.count >= 0,
    )
  );
}

function isViewport(value: unknown): value is ScenarioViewport {
  return (
    isRecord(value) &&
    isPositiveNumber(value.boardZoom) &&
    isRecord(value.boardPan) &&
    isFiniteNumber(value.boardPan.x) &&
    isFiniteNumber(value.boardPan.y)
  );
}

function normalizeScenarioPackage(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  return {
    ...value,
    mode: value.mode ?? "edit",
    cardDeckState: value.cardDeckState ?? createEmptyCardDeckState(),
    diceState: value.diceState ?? createEmptyDiceState(),
    slotState: value.slotState ?? createEmptySlotState(),
    stackState: value.stackState ?? createEmptyStackState(),
    boardState: value.boardState ?? {},
    locationStates: value.locationStates ?? {},
    edgeStates: value.edgeStates ?? {},
    frozenSetup: normalizeFrozenSetup(value.frozenSetup),
  };
}

function normalizeFrozenSetup(value: unknown): unknown {
  if (value === undefined || value === null || !isRecord(value)) {
    return null;
  }

  return {
    ...value,
    cardDeckState: value.cardDeckState ?? createEmptyCardDeckState(),
    diceState: value.diceState ?? createEmptyDiceState(),
    slotState: value.slotState ?? createEmptySlotState(),
    stackState: value.stackState ?? createEmptyStackState(),
    boardState: value.boardState ?? {},
    locationStates: value.locationStates ?? {},
    edgeStates: value.edgeStates ?? {},
    viewport: value.viewport ?? {
      boardZoom: 1,
      boardPan: {
        x: 0,
        y: 0,
      },
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getArray<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value as T[]) : null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getDieFaceKey(dieId: string, faceRefId: string) {
  return `${dieId}::${faceRefId}`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isNormalizedNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
