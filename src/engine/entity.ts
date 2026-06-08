import type { BoardLocation, BoardState } from "./board";

export const RESOURCE_CATEGORIES = [
  "BOARD",
  "PAWN",
  "TOKEN",
  "TILE",
  "CARD",
  "OTHER",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
export type BoardEntityCategory = Exclude<ResourceCategory, "BOARD" | "OTHER">;

export type JsonRecord = Record<string, unknown>;

export interface Entity {
  id: string;
  type: string;
  state: JsonRecord;
  locationId?: string;
}

export interface EntityState {
  entities: Entity[];
}

export type EntityValidationCode =
  | "duplicate_entity_id"
  | "entity_not_found"
  | "location_not_found"
  | "invalid_entity_id"
  | "invalid_entity_type"
  | "invalid_entity_state";

export class EntityValidationError extends Error {
  readonly code: EntityValidationCode;

  constructor(code: EntityValidationCode, message: string) {
    super(message);
    this.name = "EntityValidationError";
    this.code = code;
  }
}

export interface CreateEntityInput {
  id: string;
  type: string;
  state?: JsonRecord;
  locationId?: string;
}

export type EntityStatePatch = JsonRecord;

export interface ResourceCategoryDefinition {
  id: ResourceCategory;
  label: string;
  layer: number;
  canPlaceAsset: boolean;
  canBindToLocation: boolean;
  canPath: boolean;
  description: string;
}

export const RESOURCE_CATEGORY_DEFINITIONS: Record<
  ResourceCategory,
  ResourceCategoryDefinition
> = {
  BOARD: {
    id: "BOARD",
    label: "Board",
    layer: 0,
    canPlaceAsset: false,
    canBindToLocation: false,
    canPath: false,
    description: "Base map image and absolute graph coordinate surface.",
  },
  TILE: {
    id: "TILE",
    label: "Tile",
    layer: 20,
    canPlaceAsset: true,
    canBindToLocation: false,
    canPath: false,
    description: "Map overlay above the board and below actors.",
  },
  PAWN: {
    id: "PAWN",
    label: "Pawn",
    layer: 60,
    canPlaceAsset: true,
    canBindToLocation: true,
    canPath: true,
    description: "Entity actor placed on graph locations with future pathing.",
  },
  TOKEN: {
    id: "TOKEN",
    label: "Token",
    layer: 70,
    canPlaceAsset: true,
    canBindToLocation: true,
    canPath: false,
    description: "State marker attached to a pawn or location.",
  },
  CARD: {
    id: "CARD",
    label: "Card",
    layer: 80,
    canPlaceAsset: true,
    canBindToLocation: false,
    canPath: false,
    description: "Data display asset for floating card/image popovers.",
  },
  OTHER: {
    id: "OTHER",
    label: "Other",
    layer: 90,
    canPlaceAsset: false,
    canBindToLocation: false,
    canPath: false,
    description: "Off-board cut-in, UI, or performance asset.",
  },
};

export function createEmptyEntityState(): EntityState {
  return {
    entities: [],
  };
}

export function createEntity(
  entityState: EntityState,
  input: CreateEntityInput,
  board?: BoardState,
): EntityState {
  assertEntityId(input.id);
  assertEntityType(input.type);

  if (entityState.entities.some((entity) => entity.id === input.id)) {
    throw new EntityValidationError(
      "duplicate_entity_id",
      `Entity '${input.id}' already exists.`,
    );
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new EntityValidationError(
      "invalid_entity_state",
      `Entity '${input.id}' state must be a JSON object.`,
    );
  }

  if (input.locationId && board) {
    findLocationOrThrow(board, input.locationId);
  }

  const entity: Entity = {
    id: input.id,
    type: input.type,
    state: { ...(input.state ?? {}) },
    ...(input.locationId ? { locationId: input.locationId } : {}),
  };

  return {
    entities: [...entityState.entities, entity],
  };
}

export function updateEntityState(
  entityState: EntityState,
  entityId: string,
  patch: EntityStatePatch,
): EntityState {
  findEntityOrThrow(entityState, entityId);

  if (!isJsonRecord(patch)) {
    throw new EntityValidationError(
      "invalid_entity_state",
      `Entity '${entityId}' state patch must be a JSON object.`,
    );
  }

  return {
    entities: entityState.entities.map((entity) =>
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
  };
}

export function bindEntityToLocation(
  entityState: EntityState,
  board: BoardState,
  entityId: string,
  locationId: string,
): EntityState {
  findEntityOrThrow(entityState, entityId);
  findLocationOrThrow(board, locationId);

  return {
    entities: entityState.entities.map((entity) =>
      entity.id === entityId ? { ...entity, locationId } : entity,
    ),
  };
}

export function unbindEntityFromLocation(
  entityState: EntityState,
  entityId: string,
): EntityState {
  findEntityOrThrow(entityState, entityId);

  return {
    entities: entityState.entities.map((entity) => {
      if (entity.id !== entityId) {
        return entity;
      }

      const { locationId: _locationId, ...unboundEntity } = entity;
      return unboundEntity;
    }),
  };
}

export function removeEntity(
  entityState: EntityState,
  entityId: string,
): EntityState {
  findEntityOrThrow(entityState, entityId);

  return {
    entities: entityState.entities.filter((entity) => entity.id !== entityId),
  };
}

export function clearLocationBindings(
  entityState: EntityState,
  removedLocationId: string,
): EntityState {
  return {
    entities: entityState.entities.map((entity) => {
      if (entity.locationId !== removedLocationId) {
        return entity;
      }

      const { locationId: _locationId, ...unboundEntity } = entity;
      return unboundEntity;
    }),
  };
}

export function getEntitiesAtLocation(
  entityState: EntityState,
  locationId: string,
): Entity[] {
  return entityState.entities.filter((entity) => entity.locationId === locationId);
}

export function isResourceCategory(value: string): value is ResourceCategory {
  return RESOURCE_CATEGORIES.includes(value as ResourceCategory);
}

export function isBoardEntityCategory(
  value: ResourceCategory,
): value is BoardEntityCategory {
  return value !== "BOARD" && value !== "OTHER";
}

export function canPlaceAssetForCategory(category: ResourceCategory) {
  return RESOURCE_CATEGORY_DEFINITIONS[category].canPlaceAsset;
}

export function canBindCategoryToLocation(category: ResourceCategory) {
  return RESOURCE_CATEGORY_DEFINITIONS[category].canBindToLocation;
}

function findEntityOrThrow(entityState: EntityState, entityId: string) {
  const entity = entityState.entities.find((candidate) => candidate.id === entityId);

  if (!entity) {
    throw new EntityValidationError(
      "entity_not_found",
      `Entity '${entityId}' does not exist.`,
    );
  }

  return entity;
}

function findLocationOrThrow(board: BoardState, locationId: string): BoardLocation {
  const location = board.locations.find((candidate) => candidate.id === locationId);

  if (!location) {
    throw new EntityValidationError(
      "location_not_found",
      `Location '${locationId}' does not exist.`,
    );
  }

  return location;
}

function assertEntityId(id: string) {
  if (!id.trim()) {
    throw new EntityValidationError(
      "invalid_entity_id",
      "Entity id must be a non-empty string.",
    );
  }
}

function assertEntityType(type: string) {
  if (!type.trim()) {
    throw new EntityValidationError(
      "invalid_entity_type",
      "Entity type must be a non-empty string.",
    );
  }
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
