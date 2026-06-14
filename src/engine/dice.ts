import type { JsonRecord } from "./entity";

export const DICE_ROLL_MODES = ["random", "manual", "deterministic"] as const;

export type DiceRollMode = (typeof DICE_ROLL_MODES)[number];

export interface DieFaceRef {
  id: string;
  assetId: string;
  faceId?: string;
  label?: string;
  state: JsonRecord;
}

export interface DieDefinition {
  id: string;
  name: string;
  faces: DieFaceRef[];
  state: JsonRecord;
}

export interface DicePoolDie {
  id: string;
  dieId: string;
  count: number;
  state: JsonRecord;
}

export interface DicePool {
  id: string;
  name: string;
  dice: DicePoolDie[];
  state: JsonRecord;
}

export interface DiceRollResult {
  id: string;
  poolDieId: string;
  dieId: string;
  faceRefId: string;
  assetId: string;
  faceId?: string;
  label?: string;
  isOverride: boolean;
  state: JsonRecord;
}

export interface DiceRoll {
  id: string;
  poolId: string;
  mode: DiceRollMode;
  rolledAt: string;
  results: DiceRollResult[];
  state: JsonRecord;
}

export interface DiceState {
  definitions: DieDefinition[];
  pools: DicePool[];
  rollHistory: DiceRoll[];
  lastRollId?: string;
}

export type DiceErrorCode =
  | "duplicate_die_id"
  | "duplicate_face_id"
  | "duplicate_pool_id"
  | "duplicate_pool_die_id"
  | "duplicate_roll_id"
  | "invalid_die"
  | "invalid_face"
  | "invalid_pool"
  | "invalid_pool_die"
  | "invalid_roll"
  | "die_not_found"
  | "face_not_found"
  | "pool_not_found"
  | "pool_die_not_found"
  | "roll_not_found"
  | "roll_result_not_found";

export class DiceError extends Error {
  readonly code: DiceErrorCode;

  constructor(code: DiceErrorCode, message: string) {
    super(message);
    this.name = "DiceError";
    this.code = code;
  }
}

export interface AddDieDefinitionInput {
  id: string;
  name: string;
  faces: Array<{
    id: string;
    assetId: string;
    faceId?: string;
    label?: string;
    state?: JsonRecord;
  }>;
  state?: JsonRecord;
}

export interface AddDicePoolInput {
  id: string;
  name: string;
  state?: JsonRecord;
}

export interface AddDieToPoolInput {
  id: string;
  dieId: string;
  count?: number;
  poolId: string;
  state?: JsonRecord;
}

export interface RollDicePoolInput {
  id: string;
  faceRefIds?: string[];
  mode?: DiceRollMode;
  poolId: string;
  random?: () => number;
  resultIdPrefix?: string;
  rolledAt?: string;
  state?: JsonRecord;
}

export function createEmptyDiceState(): DiceState {
  return {
    definitions: [],
    pools: [],
    rollHistory: [],
  };
}

export function isDiceRollMode(value: string): value is DiceRollMode {
  return DICE_ROLL_MODES.includes(value as DiceRollMode);
}

export function addDieDefinition(
  state: DiceState,
  input: AddDieDefinitionInput,
): DiceState {
  assertDieInput(input);

  if (state.definitions.some((definition) => definition.id === input.id)) {
    throw new DiceError(
      "duplicate_die_id",
      `Die definition '${input.id}' already exists.`,
    );
  }

  return {
    ...state,
    definitions: [
      ...state.definitions,
      {
        id: input.id,
        name: input.name,
        faces: input.faces.map(normalizeFace),
        state: { ...(input.state ?? {}) },
      },
    ],
  };
}

export function updateDieDefinition(
  state: DiceState,
  dieId: string,
  patch: Partial<Pick<DieDefinition, "name" | "state">>,
): DiceState {
  findDieOrThrow(state, dieId);

  return {
    ...state,
    definitions: state.definitions.map((definition) =>
      definition.id === dieId
        ? {
            ...definition,
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.state !== undefined ? { state: { ...patch.state } } : {}),
          }
        : definition,
    ),
  };
}

export function removeDieDefinition(state: DiceState, dieId: string): DiceState {
  findDieOrThrow(state, dieId);

  return cleanDiceStateReferences(
    {
      ...state,
      definitions: state.definitions.filter((definition) => definition.id !== dieId),
    },
    new Set([dieId]),
  );
}

export function addDicePool(state: DiceState, input: AddDicePoolInput): DiceState {
  assertPoolInput(input);

  if (state.pools.some((pool) => pool.id === input.id)) {
    throw new DiceError(
      "duplicate_pool_id",
      `Dice pool '${input.id}' already exists.`,
    );
  }

  return {
    ...state,
    pools: [
      ...state.pools,
      {
        id: input.id,
        name: input.name,
        dice: [],
        state: { ...(input.state ?? {}) },
      },
    ],
  };
}

export function updateDicePool(
  state: DiceState,
  poolId: string,
  patch: Partial<Pick<DicePool, "name" | "state">>,
): DiceState {
  findPoolOrThrow(state, poolId);

  return {
    ...state,
    pools: state.pools.map((pool) =>
      pool.id === poolId
        ? {
            ...pool,
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.state !== undefined ? { state: { ...patch.state } } : {}),
          }
        : pool,
    ),
  };
}

export function removeDicePool(state: DiceState, poolId: string): DiceState {
  findPoolOrThrow(state, poolId);

  const rollHistory = state.rollHistory.filter((roll) => roll.poolId !== poolId);

  return {
    ...state,
    pools: state.pools.filter((pool) => pool.id !== poolId),
    rollHistory,
    lastRollId: getLastRollId(rollHistory),
  };
}

export function addDieToPool(
  state: DiceState,
  input: AddDieToPoolInput,
): DiceState {
  findPoolOrThrow(state, input.poolId);
  findDieOrThrow(state, input.dieId);
  assertPoolDieInput(input);

  const knownPoolDieIds = new Set(
    state.pools.flatMap((pool) => pool.dice.map((poolDie) => poolDie.id)),
  );

  if (knownPoolDieIds.has(input.id)) {
    throw new DiceError(
      "duplicate_pool_die_id",
      `Pool die '${input.id}' already exists.`,
    );
  }

  return {
    ...state,
    pools: state.pools.map((pool) =>
      pool.id === input.poolId
        ? {
            ...pool,
            dice: [
              ...pool.dice,
              {
                id: input.id,
                dieId: input.dieId,
                count: input.count ?? 1,
                state: { ...(input.state ?? {}) },
              },
            ],
          }
        : pool,
    ),
  };
}

export function updatePoolDieCount(
  state: DiceState,
  poolId: string,
  poolDieId: string,
  count: number,
): DiceState {
  const pool = findPoolOrThrow(state, poolId);

  if (!pool.dice.some((poolDie) => poolDie.id === poolDieId)) {
    throw new DiceError(
      "pool_die_not_found",
      `Pool die '${poolDieId}' does not exist in pool '${poolId}'.`,
    );
  }

  if (!Number.isInteger(count) || count <= 0) {
    throw new DiceError("invalid_pool_die", "Pool die count must be positive.");
  }

  return {
    ...state,
    pools: state.pools.map((candidate) =>
      candidate.id === poolId
        ? {
            ...candidate,
            dice: candidate.dice.map((poolDie) =>
              poolDie.id === poolDieId ? { ...poolDie, count } : poolDie,
            ),
          }
        : candidate,
    ),
  };
}

export function removeDieFromPool(
  state: DiceState,
  poolId: string,
  poolDieId: string,
): DiceState {
  const pool = findPoolOrThrow(state, poolId);

  if (!pool.dice.some((poolDie) => poolDie.id === poolDieId)) {
    throw new DiceError(
      "pool_die_not_found",
      `Pool die '${poolDieId}' does not exist in pool '${poolId}'.`,
    );
  }

  return {
    ...state,
    pools: state.pools.map((candidate) =>
      candidate.id === poolId
        ? {
            ...candidate,
            dice: candidate.dice.filter((poolDie) => poolDie.id !== poolDieId),
          }
        : candidate,
    ),
  };
}

export function rollDicePool(
  state: DiceState,
  input: RollDicePoolInput,
): DiceState {
  assertRollInput(state, input);

  if (state.rollHistory.some((roll) => roll.id === input.id)) {
    throw new DiceError("duplicate_roll_id", `Dice roll '${input.id}' already exists.`);
  }

  const pool = findPoolOrThrow(state, input.poolId);
  const expandedDice = expandPoolDice(state, pool);

  if (expandedDice.length === 0) {
    throw new DiceError("invalid_roll", `Dice pool '${input.poolId}' is empty.`);
  }

  const random = input.random ?? Math.random;
  const resultIdPrefix = input.resultIdPrefix ?? `${input.id}-result`;
  const results = expandedDice.map(({ die, poolDie }, index) => {
    const overrideFaceRefId = input.faceRefIds?.[index];
    const face = overrideFaceRefId
      ? findFaceOrThrow(die, overrideFaceRefId)
      : selectRandomFace(die, random);

    return createRollResult({
      die,
      face,
      id: `${resultIdPrefix}-${index + 1}`,
      isOverride: Boolean(overrideFaceRefId),
      poolDie,
    });
  });
  const mode =
    input.mode ?? (input.faceRefIds && input.faceRefIds.length > 0 ? "manual" : "random");
  const roll: DiceRoll = {
    id: input.id,
    poolId: input.poolId,
    mode,
    rolledAt: input.rolledAt ?? new Date().toISOString(),
    results,
    state: { ...(input.state ?? {}) },
  };

  return {
    ...state,
    rollHistory: [...state.rollHistory, roll],
    lastRollId: roll.id,
  };
}

export function overrideDiceRollResult(
  state: DiceState,
  rollId: string,
  resultId: string,
  faceRefId: string,
): DiceState {
  const roll = findRollOrThrow(state, rollId);
  const result = roll.results.find((candidate) => candidate.id === resultId);

  if (!result) {
    throw new DiceError(
      "roll_result_not_found",
      `Roll result '${resultId}' does not exist in roll '${rollId}'.`,
    );
  }

  const die = findDieOrThrow(state, result.dieId);
  const face = findFaceOrThrow(die, faceRefId);

  return {
    ...state,
    rollHistory: state.rollHistory.map((candidate) =>
      candidate.id === rollId
        ? {
            ...candidate,
            mode: "manual",
            results: candidate.results.map((candidateResult) =>
              candidateResult.id === resultId
                ? createRollResult({
                    die,
                    face,
                    id: candidateResult.id,
                    isOverride: true,
                    poolDie: {
                      id: candidateResult.poolDieId,
                      dieId: candidateResult.dieId,
                      count: 1,
                      state: {},
                    },
                  })
                : candidateResult,
            ),
          }
        : candidate,
    ),
  };
}

export function clearDiceRollHistory(state: DiceState): DiceState {
  return {
    ...state,
    rollHistory: [],
    lastRollId: undefined,
  };
}

export function removeDiceReferencesByAssetId(
  state: DiceState,
  assetId: string,
): DiceState {
  const definitions = state.definitions
    .map((definition) => ({
      ...definition,
      faces: definition.faces.filter((face) => face.assetId !== assetId),
    }))
    .filter((definition) => definition.faces.length > 0);
  const removedDieIds = new Set(
    state.definitions
      .filter((definition) => !definitions.some((next) => next.id === definition.id))
      .map((definition) => definition.id),
  );

  return cleanDiceStateReferences(
    {
      ...state,
      definitions,
    },
    removedDieIds,
  );
}

export function findLastDiceRoll(state: DiceState): DiceRoll | null {
  return (
    (state.lastRollId
      ? state.rollHistory.find((roll) => roll.id === state.lastRollId)
      : undefined) ??
    state.rollHistory[state.rollHistory.length - 1] ??
    null
  );
}

function assertDieInput(input: AddDieDefinitionInput) {
  if (!input.id.trim() || !input.name.trim()) {
    throw new DiceError("invalid_die", "Die definition requires id and name.");
  }

  if (!Array.isArray(input.faces) || input.faces.length === 0) {
    throw new DiceError("invalid_die", "Die definition requires at least one face.");
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new DiceError("invalid_die", "Die state must be a JSON object.");
  }

  const faceIds = new Set<string>();

  for (const face of input.faces) {
    assertFaceInput(face);

    if (faceIds.has(face.id)) {
      throw new DiceError(
        "duplicate_face_id",
        `Face id '${face.id}' is duplicated in die '${input.id}'.`,
      );
    }

    faceIds.add(face.id);
  }
}

function assertFaceInput(input: AddDieDefinitionInput["faces"][number]) {
  if (!input.id.trim() || !input.assetId.trim()) {
    throw new DiceError("invalid_face", "Die face requires id and assetId.");
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new DiceError("invalid_face", "Die face state must be a JSON object.");
  }
}

function assertPoolInput(input: AddDicePoolInput) {
  if (!input.id.trim() || !input.name.trim()) {
    throw new DiceError("invalid_pool", "Dice pool requires id and name.");
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new DiceError("invalid_pool", "Dice pool state must be a JSON object.");
  }
}

function assertPoolDieInput(input: AddDieToPoolInput) {
  if (!input.id.trim() || !input.dieId.trim() || !input.poolId.trim()) {
    throw new DiceError(
      "invalid_pool_die",
      "Pool die requires id, poolId, and dieId.",
    );
  }

  if (!Number.isInteger(input.count ?? 1) || (input.count ?? 1) <= 0) {
    throw new DiceError("invalid_pool_die", "Pool die count must be positive.");
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new DiceError("invalid_pool_die", "Pool die state must be a JSON object.");
  }
}

function assertRollInput(state: DiceState, input: RollDicePoolInput) {
  if (!input.id.trim() || !input.poolId.trim()) {
    throw new DiceError("invalid_roll", "Dice roll requires id and poolId.");
  }

  if (input.mode && !isDiceRollMode(input.mode)) {
    throw new DiceError("invalid_roll", "Dice roll mode is invalid.");
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new DiceError("invalid_roll", "Dice roll state must be a JSON object.");
  }

  if (input.faceRefIds) {
    const pool = findPoolOrThrow(state, input.poolId);
    const expandedDice = expandPoolDice(state, pool);

    if (input.faceRefIds.length > expandedDice.length) {
      throw new DiceError(
        "invalid_roll",
        "Manual face override count cannot exceed the expanded pool size.",
      );
    }

    input.faceRefIds.forEach((faceRefId, index) => {
      findFaceOrThrow(expandedDice[index]!.die, faceRefId);
    });
  }
}

function normalizeFace(input: AddDieDefinitionInput["faces"][number]): DieFaceRef {
  return {
    id: input.id,
    assetId: input.assetId,
    ...(input.faceId ? { faceId: input.faceId } : {}),
    ...(input.label ? { label: input.label } : {}),
    state: { ...(input.state ?? {}) },
  };
}

function findDieOrThrow(state: DiceState, dieId: string) {
  const die = state.definitions.find((candidate) => candidate.id === dieId);

  if (!die) {
    throw new DiceError("die_not_found", `Die definition '${dieId}' does not exist.`);
  }

  return die;
}

function findPoolOrThrow(state: DiceState, poolId: string) {
  const pool = state.pools.find((candidate) => candidate.id === poolId);

  if (!pool) {
    throw new DiceError("pool_not_found", `Dice pool '${poolId}' does not exist.`);
  }

  return pool;
}

function findRollOrThrow(state: DiceState, rollId: string) {
  const roll = state.rollHistory.find((candidate) => candidate.id === rollId);

  if (!roll) {
    throw new DiceError("roll_not_found", `Dice roll '${rollId}' does not exist.`);
  }

  return roll;
}

function findFaceOrThrow(die: DieDefinition, faceRefId: string) {
  const face = die.faces.find((candidate) => candidate.id === faceRefId);

  if (!face) {
    throw new DiceError(
      "face_not_found",
      `Face '${faceRefId}' does not exist in die '${die.id}'.`,
    );
  }

  return face;
}

function expandPoolDice(state: DiceState, pool: DicePool) {
  return pool.dice.flatMap((poolDie) => {
    const die = findDieOrThrow(state, poolDie.dieId);

    return Array.from({ length: poolDie.count }, () => ({
      die,
      poolDie,
    }));
  });
}

function selectRandomFace(die: DieDefinition, random: () => number) {
  const index = Math.min(
    die.faces.length - 1,
    Math.max(0, Math.floor(random() * die.faces.length)),
  );

  return die.faces[index]!;
}

function createRollResult({
  die,
  face,
  id,
  isOverride,
  poolDie,
}: {
  die: DieDefinition;
  face: DieFaceRef;
  id: string;
  isOverride: boolean;
  poolDie: DicePoolDie;
}): DiceRollResult {
  return {
    id,
    poolDieId: poolDie.id,
    dieId: die.id,
    faceRefId: face.id,
    assetId: face.assetId,
    ...(face.faceId ? { faceId: face.faceId } : {}),
    ...(face.label ? { label: face.label } : {}),
    isOverride,
    state: { ...face.state },
  };
}

function cleanDiceStateReferences(
  state: DiceState,
  removedDieIds: Set<string>,
): DiceState {
  if (removedDieIds.size === 0) {
    return state;
  }

  const pools = state.pools.map((pool) => ({
    ...pool,
    dice: pool.dice.filter((poolDie) => !removedDieIds.has(poolDie.dieId)),
  }));
  const rollHistory = state.rollHistory
    .map((roll) => ({
      ...roll,
      results: roll.results.filter((result) => !removedDieIds.has(result.dieId)),
    }))
    .filter((roll) => roll.results.length > 0);

  return {
    ...state,
    pools,
    rollHistory,
    lastRollId: getLastRollId(rollHistory),
  };
}

function getLastRollId(rollHistory: DiceRoll[]) {
  return rollHistory[rollHistory.length - 1]?.id;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
