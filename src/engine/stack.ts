import type { JsonRecord, ResourceCategory } from "./entity";

export const STACK_CONTAINER_TYPES = ["location", "supply"] as const;

export type StackContainerType = (typeof STACK_CONTAINER_TYPES)[number];
export type StackAssetCategory = Extract<ResourceCategory, "PAWN" | "TOKEN">;

export interface StackContainerRef {
  type: StackContainerType;
  id: string;
}

export interface SupplyZone {
  id: string;
  name: string;
  state: JsonRecord;
}

export interface PawnStack {
  id: string;
  name: string;
  assetId: string;
  category: StackAssetCategory;
  container: StackContainerRef;
  count: number;
  capacity?: number;
  placementId?: string;
  entityId?: string;
  state: JsonRecord;
}

export interface StackState {
  supplyZones: SupplyZone[];
  stacks: PawnStack[];
}

export type StackErrorCode =
  | "duplicate_supply_zone_id"
  | "duplicate_stack_id"
  | "invalid_supply_zone"
  | "invalid_stack"
  | "invalid_count"
  | "supply_zone_not_found"
  | "stack_not_found"
  | "stack_asset_mismatch";

export class StackError extends Error {
  readonly code: StackErrorCode;

  constructor(code: StackErrorCode, message: string) {
    super(message);
    this.name = "StackError";
    this.code = code;
  }
}

export interface AddSupplyZoneInput {
  id: string;
  name: string;
  state?: JsonRecord;
}

export interface AddPawnStackInput {
  id: string;
  name?: string;
  assetId: string;
  category: StackAssetCategory;
  container: StackContainerRef;
  count: number;
  capacity?: number;
  placementId?: string;
  entityId?: string;
  state?: JsonRecord;
}

export type SupplyZonePatch = Partial<Pick<SupplyZone, "name" | "state">>;
export type PawnStackPatch = Partial<
  Pick<
    PawnStack,
    | "name"
    | "container"
    | "count"
    | "capacity"
    | "placementId"
    | "entityId"
    | "state"
  >
>;

export interface SplitPawnStackInput {
  sourceStackId: string;
  newStackId: string;
  count: number;
  target: StackContainerRef;
  name?: string;
  placementId?: string;
  entityId?: string;
  state?: JsonRecord;
}

export interface MergePawnStackInput {
  sourceStackId: string;
  targetStackId: string;
  count?: number;
}

export function createEmptyStackState(): StackState {
  return {
    supplyZones: [],
    stacks: [],
  };
}

export function isStackContainerType(value: string): value is StackContainerType {
  return STACK_CONTAINER_TYPES.includes(value as StackContainerType);
}

export function isStackAssetCategory(
  value: ResourceCategory,
): value is StackAssetCategory {
  return value === "PAWN" || value === "TOKEN";
}

export function addSupplyZone(
  state: StackState,
  input: AddSupplyZoneInput,
): StackState {
  assertSupplyZoneInput(input);

  if (state.supplyZones.some((zone) => zone.id === input.id)) {
    throw new StackError(
      "duplicate_supply_zone_id",
      `Supply zone '${input.id}' already exists.`,
    );
  }

  return {
    ...state,
    supplyZones: [
      ...state.supplyZones,
      {
        id: input.id,
        name: input.name,
        state: { ...(input.state ?? {}) },
      },
    ],
  };
}

export function updateSupplyZone(
  state: StackState,
  zoneId: string,
  patch: SupplyZonePatch,
): StackState {
  findSupplyZoneOrThrow(state, zoneId);

  if (patch.state !== undefined && !isJsonRecord(patch.state)) {
    throw new StackError(
      "invalid_supply_zone",
      "Supply zone state must be a JSON object.",
    );
  }

  return {
    ...state,
    supplyZones: state.supplyZones.map((zone) =>
      zone.id === zoneId
        ? {
            ...zone,
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.state !== undefined ? { state: { ...patch.state } } : {}),
          }
        : zone,
    ),
  };
}

export function removeSupplyZone(state: StackState, zoneId: string): StackState {
  findSupplyZoneOrThrow(state, zoneId);

  return {
    supplyZones: state.supplyZones.filter((zone) => zone.id !== zoneId),
    stacks: state.stacks.filter(
      (stack) =>
        stack.container.type !== "supply" || stack.container.id !== zoneId,
    ),
  };
}

export function addPawnStack(
  state: StackState,
  input: AddPawnStackInput,
): StackState {
  assertStackInput(input);
  assertContainerExistsIfNeeded(state, input.container);

  if (state.stacks.some((stack) => stack.id === input.id)) {
    throw new StackError(
      "duplicate_stack_id",
      `Pawn stack '${input.id}' already exists.`,
    );
  }

  return {
    ...state,
    stacks: [
      ...state.stacks,
      {
        id: input.id,
        name: input.name ?? input.id,
        assetId: input.assetId,
        category: input.category,
        container: { ...input.container },
        count: input.count,
        ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
        ...(input.placementId ? { placementId: input.placementId } : {}),
        ...(input.entityId ? { entityId: input.entityId } : {}),
        state: { ...(input.state ?? {}) },
      },
    ],
  };
}

export function updatePawnStack(
  state: StackState,
  stackId: string,
  patch: PawnStackPatch,
): StackState {
  findStackOrThrow(state, stackId);

  if (patch.container) {
    assertContainerInput(patch.container);
    assertContainerExistsIfNeeded(state, patch.container);
  }

  if (patch.count !== undefined) {
    assertPositiveCount(patch.count, "Stack count");
  }

  if (patch.capacity !== undefined) {
    assertOptionalCapacity(patch.capacity);
  }

  if (patch.state !== undefined && !isJsonRecord(patch.state)) {
    throw new StackError("invalid_stack", "Stack state must be a JSON object.");
  }

  return {
    ...state,
    stacks: state.stacks.map((stack) => {
      if (stack.id !== stackId) {
        return stack;
      }

      const nextStack: PawnStack = {
        ...stack,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.container !== undefined
          ? { container: { ...patch.container } }
          : {}),
        ...(patch.count !== undefined ? { count: patch.count } : {}),
        ...(patch.capacity !== undefined ? { capacity: patch.capacity } : {}),
        ...(patch.state !== undefined ? { state: { ...patch.state } } : {}),
      };

      if (patch.placementId !== undefined) {
        if (patch.placementId) {
          nextStack.placementId = patch.placementId;
        } else {
          delete nextStack.placementId;
        }
      }

      if (patch.entityId !== undefined) {
        if (patch.entityId) {
          nextStack.entityId = patch.entityId;
        } else {
          delete nextStack.entityId;
        }
      }

      return nextStack;
    }),
  };
}

export function removePawnStack(
  state: StackState,
  stackId: string,
): StackState {
  findStackOrThrow(state, stackId);

  return {
    ...state,
    stacks: state.stacks.filter((stack) => stack.id !== stackId),
  };
}

export function adjustPawnStackCount(
  state: StackState,
  stackId: string,
  delta: number,
): StackState {
  const stack = findStackOrThrow(state, stackId);

  if (!Number.isInteger(delta)) {
    throw new StackError("invalid_count", "Stack count delta must be an integer.");
  }

  const nextCount = stack.count + delta;

  if (nextCount <= 0) {
    return removePawnStack(state, stackId);
  }

  assertWithinCapacity(stack, nextCount);

  return updatePawnStack(state, stackId, { count: nextCount });
}

export function movePawnStack(
  state: StackState,
  stackId: string,
  target: StackContainerRef,
): StackState {
  findStackOrThrow(state, stackId);
  assertContainerInput(target);
  assertContainerExistsIfNeeded(state, target);

  return updatePawnStack(state, stackId, { container: target });
}

export function splitPawnStack(
  state: StackState,
  input: SplitPawnStackInput,
): StackState {
  const source = findStackOrThrow(state, input.sourceStackId);
  assertContainerInput(input.target);
  assertContainerExistsIfNeeded(state, input.target);
  assertPositiveCount(input.count, "Split count");

  if (input.count >= source.count) {
    throw new StackError(
      "invalid_count",
      "Split count must be less than the source stack count.",
    );
  }

  if (state.stacks.some((stack) => stack.id === input.newStackId)) {
    throw new StackError(
      "duplicate_stack_id",
      `Pawn stack '${input.newStackId}' already exists.`,
    );
  }

  return addPawnStack(
    updatePawnStack(state, source.id, { count: source.count - input.count }),
    {
      id: input.newStackId,
      name: input.name ?? source.name,
      assetId: source.assetId,
      category: source.category,
      container: input.target,
      count: input.count,
      ...(source.capacity !== undefined ? { capacity: source.capacity } : {}),
      ...(input.placementId ? { placementId: input.placementId } : {}),
      ...(input.entityId ? { entityId: input.entityId } : {}),
      state: { ...source.state, ...(input.state ?? {}) },
    },
  );
}

export function mergePawnStacks(
  state: StackState,
  input: MergePawnStackInput,
): StackState {
  const source = findStackOrThrow(state, input.sourceStackId);
  const target = findStackOrThrow(state, input.targetStackId);

  if (
    source.assetId !== target.assetId ||
    source.category !== target.category
  ) {
    throw new StackError(
      "stack_asset_mismatch",
      "Only stacks using the same asset and category can merge.",
    );
  }

  const movedCount = input.count ?? source.count;
  assertPositiveCount(movedCount, "Merge count");

  if (movedCount > source.count) {
    throw new StackError(
      "invalid_count",
      "Merge count cannot exceed the source stack count.",
    );
  }

  assertWithinCapacity(target, target.count + movedCount);

  let nextState = updatePawnStack(state, target.id, {
    count: target.count + movedCount,
  });

  if (movedCount === source.count) {
    nextState = removePawnStack(nextState, source.id);
  } else {
    nextState = updatePawnStack(nextState, source.id, {
      count: source.count - movedCount,
    });
  }

  return nextState;
}

export function findMatchingStack(
  state: StackState,
  assetId: string,
  category: StackAssetCategory,
  container: StackContainerRef,
  exceptStackId?: string,
): PawnStack | null {
  return (
    state.stacks.find(
      (stack) =>
        stack.id !== exceptStackId &&
        stack.assetId === assetId &&
        stack.category === category &&
        stack.container.type === container.type &&
        stack.container.id === container.id,
    ) ?? null
  );
}

export function removeStacksByAssetId(
  state: StackState,
  assetId: string,
): StackState {
  return {
    ...state,
    stacks: state.stacks.filter((stack) => stack.assetId !== assetId),
  };
}

export function removeStacksByContainer(
  state: StackState,
  container: StackContainerRef,
): StackState {
  return {
    ...state,
    stacks: state.stacks.filter(
      (stack) =>
        stack.container.type !== container.type ||
        stack.container.id !== container.id,
    ),
  };
}

export function countStacksByAssetId(state: StackState, assetId: string) {
  return state.stacks.filter((stack) => stack.assetId === assetId).length;
}

export function findPawnStack(
  state: StackState,
  stackId: string,
): PawnStack | null {
  return state.stacks.find((stack) => stack.id === stackId) ?? null;
}

function assertSupplyZoneInput(input: AddSupplyZoneInput) {
  if (!input.id.trim() || !input.name.trim()) {
    throw new StackError(
      "invalid_supply_zone",
      "Supply zone requires id and name.",
    );
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new StackError(
      "invalid_supply_zone",
      "Supply zone state must be a JSON object.",
    );
  }
}

function assertStackInput(input: AddPawnStackInput) {
  if (!input.id.trim() || !input.assetId.trim()) {
    throw new StackError("invalid_stack", "Stack requires id and assetId.");
  }

  if (!isStackAssetCategory(input.category)) {
    throw new StackError(
      "invalid_stack",
      "Stack category must be PAWN or TOKEN.",
    );
  }

  assertContainerInput(input.container);
  assertPositiveCount(input.count, "Stack count");
  assertOptionalCapacity(input.capacity);

  if (
    input.capacity !== undefined &&
    Number.isInteger(input.capacity) &&
    input.count > input.capacity
  ) {
    throw new StackError(
      "invalid_count",
      "Stack count cannot exceed its capacity.",
    );
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new StackError("invalid_stack", "Stack state must be a JSON object.");
  }
}

function assertContainerInput(container: StackContainerRef) {
  if (!isStackContainerType(container.type) || !container.id.trim()) {
    throw new StackError(
      "invalid_stack",
      "Stack container requires a type and id.",
    );
  }
}

function assertContainerExistsIfNeeded(
  state: StackState,
  container: StackContainerRef,
) {
  if (container.type === "location") {
    return;
  }

  findSupplyZoneOrThrow(state, container.id);
}

function assertPositiveCount(count: number, label: string) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new StackError("invalid_count", `${label} must be positive.`);
  }
}

function assertOptionalCapacity(capacity: number | undefined) {
  if (capacity !== undefined && (!Number.isInteger(capacity) || capacity <= 0)) {
    throw new StackError("invalid_count", "Stack capacity must be positive.");
  }
}

function assertWithinCapacity(stack: PawnStack, count: number) {
  if (stack.capacity !== undefined && count > stack.capacity) {
    throw new StackError(
      "invalid_count",
      `Stack '${stack.id}' cannot exceed capacity ${stack.capacity}.`,
    );
  }
}

function findSupplyZoneOrThrow(state: StackState, zoneId: string) {
  const zone = state.supplyZones.find((candidate) => candidate.id === zoneId);

  if (!zone) {
    throw new StackError(
      "supply_zone_not_found",
      `Supply zone '${zoneId}' does not exist.`,
    );
  }

  return zone;
}

function findStackOrThrow(state: StackState, stackId: string) {
  const stack = findPawnStack(state, stackId);

  if (!stack) {
    throw new StackError("stack_not_found", `Stack '${stackId}' does not exist.`);
  }

  return stack;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
