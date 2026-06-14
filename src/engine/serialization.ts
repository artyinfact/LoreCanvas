import type { BoardState } from "./board";
import { validateBoard } from "./board";
import { createEmptyCardDeckState, isCardZoneKind } from "./cardDeck";
import type { CardDeckState, CardRef, CardZone } from "./cardDeck";
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
  | "boardState"
  | "locationStates"
  | "edgeStates"
  | "frozenSetup"
> & {
  metadata?: ScenarioMetadata;
  viewport?: Partial<ScenarioViewport>;
  mode?: ScenarioMode;
  cardDeckState?: CardDeckState;
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
    !cardDeckState
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

  if (
    !assets ||
    !board ||
    !entityState ||
    !assetPlacements ||
    !pawnSheets ||
    !cardDeckState ||
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
