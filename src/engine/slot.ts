import type { JsonRecord, ResourceCategory } from "./entity";

export const SLOT_OWNER_TYPES = ["location", "track", "display"] as const;

export type SlotOwnerType = (typeof SLOT_OWNER_TYPES)[number];
export type SlotAssetCategory = Extract<ResourceCategory, "TILE" | "TOKEN">;

export interface BoardSlot {
  id: string;
  name: string;
  ownerType: SlotOwnerType;
  ownerId: string;
  x: number;
  y: number;
  assetId?: string;
  placementId?: string;
  state: JsonRecord;
}

export interface SlotState {
  slots: BoardSlot[];
}

export type SlotErrorCode =
  | "duplicate_slot_id"
  | "invalid_slot"
  | "slot_not_found"
  | "slot_asset_not_found";

export class SlotError extends Error {
  readonly code: SlotErrorCode;

  constructor(code: SlotErrorCode, message: string) {
    super(message);
    this.name = "SlotError";
    this.code = code;
  }
}

export interface AddSlotInput {
  id: string;
  name: string;
  ownerType: SlotOwnerType;
  ownerId: string;
  x: number;
  y: number;
  state?: JsonRecord;
}

export type SlotPatch = Partial<
  Pick<BoardSlot, "name" | "ownerType" | "ownerId" | "x" | "y" | "state">
>;

export function createEmptySlotState(): SlotState {
  return {
    slots: [],
  };
}

export function isSlotOwnerType(value: string): value is SlotOwnerType {
  return SLOT_OWNER_TYPES.includes(value as SlotOwnerType);
}

export function isSlotAssetCategory(
  value: ResourceCategory,
): value is SlotAssetCategory {
  return value === "TILE" || value === "TOKEN";
}

export function addSlot(state: SlotState, input: AddSlotInput): SlotState {
  assertSlotInput(input);

  if (state.slots.some((slot) => slot.id === input.id)) {
    throw new SlotError("duplicate_slot_id", `Slot '${input.id}' already exists.`);
  }

  return {
    slots: [
      ...state.slots,
      {
        id: input.id,
        name: input.name,
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        x: input.x,
        y: input.y,
        state: { ...(input.state ?? {}) },
      },
    ],
  };
}

export function updateSlot(
  state: SlotState,
  slotId: string,
  patch: SlotPatch,
): SlotState {
  findSlotOrThrow(state, slotId);

  if (patch.ownerType && !isSlotOwnerType(patch.ownerType)) {
    throw new SlotError("invalid_slot", "Slot owner type is invalid.");
  }

  if (patch.x !== undefined) {
    assertUnitCoordinate(patch.x, "x");
  }

  if (patch.y !== undefined) {
    assertUnitCoordinate(patch.y, "y");
  }

  if (patch.state !== undefined && !isJsonRecord(patch.state)) {
    throw new SlotError("invalid_slot", "Slot state must be a JSON object.");
  }

  return {
    slots: state.slots.map((slot) =>
      slot.id === slotId
        ? {
            ...slot,
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.ownerType !== undefined
              ? { ownerType: patch.ownerType }
              : {}),
            ...(patch.ownerId !== undefined ? { ownerId: patch.ownerId } : {}),
            ...(patch.x !== undefined ? { x: patch.x } : {}),
            ...(patch.y !== undefined ? { y: patch.y } : {}),
            ...(patch.state !== undefined ? { state: { ...patch.state } } : {}),
          }
        : slot,
    ),
  };
}

export function removeSlot(state: SlotState, slotId: string): SlotState {
  findSlotOrThrow(state, slotId);

  return {
    slots: state.slots.filter((slot) => slot.id !== slotId),
  };
}

export function assignSlotAsset(
  state: SlotState,
  slotId: string,
  assetId: string,
  placementId?: string,
): SlotState {
  findSlotOrThrow(state, slotId);

  if (!assetId.trim()) {
    throw new SlotError("slot_asset_not_found", "Slot asset id is required.");
  }

  return {
    slots: state.slots.map((slot) =>
      slot.id === slotId
        ? {
            ...slot,
            assetId,
            ...(placementId ? { placementId } : {}),
          }
        : slot,
    ),
  };
}

export function clearSlotAsset(state: SlotState, slotId: string): SlotState {
  findSlotOrThrow(state, slotId);

  return {
    slots: state.slots.map((slot) => {
      if (slot.id !== slotId) {
        return slot;
      }

      const { assetId: _assetId, placementId: _placementId, ...clearedSlot } = slot;
      return clearedSlot;
    }),
  };
}

export function moveSlotAsset(
  state: SlotState,
  fromSlotId: string,
  toSlotId: string,
): SlotState {
  if (fromSlotId === toSlotId) {
    findSlotOrThrow(state, fromSlotId);
    return state;
  }

  const source = findSlotOrThrow(state, fromSlotId);
  findSlotOrThrow(state, toSlotId);

  if (!source.assetId) {
    throw new SlotError(
      "slot_asset_not_found",
      `Slot '${fromSlotId}' has no asset to move.`,
    );
  }

  return {
    slots: state.slots.map((slot) => {
      if (slot.id === fromSlotId) {
        const {
          assetId: _assetId,
          placementId: _placementId,
          ...clearedSource
        } = slot;
        return clearedSource;
      }

      if (slot.id === toSlotId) {
        return {
          ...slot,
          assetId: source.assetId,
          ...(source.placementId ? { placementId: source.placementId } : {}),
        };
      }

      return slot;
    }),
  };
}

export function removeSlotAssetsByAssetId(
  state: SlotState,
  assetId: string,
): SlotState {
  return {
    slots: state.slots.map((slot) => {
      if (slot.assetId !== assetId) {
        return slot;
      }

      const { assetId: _assetId, placementId: _placementId, ...clearedSlot } = slot;
      return clearedSlot;
    }),
  };
}

export function removeSlotsByOwner(
  state: SlotState,
  ownerType: SlotOwnerType,
  ownerId: string,
): SlotState {
  return {
    slots: state.slots.filter(
      (slot) => slot.ownerType !== ownerType || slot.ownerId !== ownerId,
    ),
  };
}

export function findSlot(state: SlotState, slotId: string): BoardSlot | null {
  return state.slots.find((slot) => slot.id === slotId) ?? null;
}

function assertSlotInput(input: AddSlotInput) {
  if (
    !input.id.trim() ||
    !input.name.trim() ||
    !input.ownerId.trim() ||
    !isSlotOwnerType(input.ownerType)
  ) {
    throw new SlotError(
      "invalid_slot",
      "Slot requires id, name, ownerType, and ownerId.",
    );
  }

  assertUnitCoordinate(input.x, "x");
  assertUnitCoordinate(input.y, "y");

  if (!isJsonRecord(input.state ?? {})) {
    throw new SlotError("invalid_slot", "Slot state must be a JSON object.");
  }
}

function findSlotOrThrow(state: SlotState, slotId: string) {
  const slot = findSlot(state, slotId);

  if (!slot) {
    throw new SlotError("slot_not_found", `Slot '${slotId}' does not exist.`);
  }

  return slot;
}

function assertUnitCoordinate(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new SlotError(
      "invalid_slot",
      `Slot ${label} coordinate must be between 0 and 1.`,
    );
  }
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
