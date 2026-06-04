export interface BoardImageRef {
  assetId: string;
  name: string;
  url: string;
  mimeType?: string;
  width?: number;
  height?: number;
}

export interface BoardLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  notes?: string;
}

export interface BoardEdge {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

export interface BoardState {
  background: BoardImageRef | null;
  locations: BoardLocation[];
  edges: BoardEdge[];
}

export type BoardValidationCode =
  | "duplicate_location_id"
  | "duplicate_edge_id"
  | "duplicate_edge_pair"
  | "invalid_coordinate"
  | "location_not_found"
  | "edge_not_found"
  | "edge_self_loop"
  | "edge_missing_location";

export interface BoardValidationIssue {
  code: BoardValidationCode;
  message: string;
  locationId?: string;
  edgeId?: string;
}

export class BoardValidationError extends Error {
  readonly code: BoardValidationCode;

  constructor(code: BoardValidationCode, message: string) {
    super(message);
    this.name = "BoardValidationError";
    this.code = code;
  }
}

export type CreateLocationInput = Omit<BoardLocation, "name"> & {
  name?: string;
};

export type UpdateLocationInput = Partial<Omit<BoardLocation, "id">>;

export type CreateEdgeInput = Omit<BoardEdge, "label"> & {
  label?: string;
};

export type UpdateEdgeInput = Partial<Omit<BoardEdge, "id">>;

export function createEmptyBoard(): BoardState {
  return {
    background: null,
    locations: [],
    edges: [],
  };
}

export function createSequentialId(prefix: string, existingIds: Iterable<string>) {
  const existing = new Set(existingIds);
  let index = 1;

  while (existing.has(`${prefix}-${index}`)) {
    index += 1;
  }

  return `${prefix}-${index}`;
}

export function setBoardBackground(
  board: BoardState,
  background: BoardImageRef | null,
): BoardState {
  return {
    ...board,
    background: background ? { ...background } : null,
  };
}

export function addLocation(
  board: BoardState,
  input: CreateLocationInput,
): BoardState {
  assertLocationIdAvailable(board, input.id);
  assertValidCoordinate(input.x, input.y, input.id);

  const location: BoardLocation = {
    id: input.id,
    name: normalizeName(input.name, input.id),
    x: input.x,
    y: input.y,
    ...(input.notes ? { notes: input.notes } : {}),
  };

  return {
    ...board,
    locations: [...board.locations, location],
  };
}

export function updateLocation(
  board: BoardState,
  locationId: string,
  patch: UpdateLocationInput,
): BoardState {
  const location = findLocationOrThrow(board, locationId);
  const nextLocation = {
    ...location,
    ...patch,
    name: normalizeName(patch.name ?? location.name, location.id),
  };

  assertValidCoordinate(nextLocation.x, nextLocation.y, locationId);

  return {
    ...board,
    locations: board.locations.map((candidate) =>
      candidate.id === locationId ? nextLocation : candidate,
    ),
  };
}

export function removeLocation(board: BoardState, locationId: string): BoardState {
  findLocationOrThrow(board, locationId);

  return {
    ...board,
    locations: board.locations.filter((location) => location.id !== locationId),
    edges: board.edges.filter(
      (edge) => edge.fromId !== locationId && edge.toId !== locationId,
    ),
  };
}

export function addEdge(board: BoardState, input: CreateEdgeInput): BoardState {
  assertEdgeIdAvailable(board, input.id);
  assertEdgeEndpoints(board, input.fromId, input.toId);
  assertEdgePairAvailable(board, input.fromId, input.toId);

  const edge: BoardEdge = {
    id: input.id,
    fromId: input.fromId,
    toId: input.toId,
    ...(input.label ? { label: input.label } : {}),
  };

  return {
    ...board,
    edges: [...board.edges, edge],
  };
}

export function updateEdge(
  board: BoardState,
  edgeId: string,
  patch: UpdateEdgeInput,
): BoardState {
  const edge = findEdgeOrThrow(board, edgeId);
  const nextEdge = {
    ...edge,
    ...patch,
  };

  assertEdgeEndpoints(board, nextEdge.fromId, nextEdge.toId);
  assertEdgePairAvailable(board, nextEdge.fromId, nextEdge.toId, edgeId);

  return {
    ...board,
    edges: board.edges.map((candidate) =>
      candidate.id === edgeId ? nextEdge : candidate,
    ),
  };
}

export function removeEdge(board: BoardState, edgeId: string): BoardState {
  findEdgeOrThrow(board, edgeId);

  return {
    ...board,
    edges: board.edges.filter((edge) => edge.id !== edgeId),
  };
}

export function validateBoard(board: BoardState): BoardValidationIssue[] {
  const issues: BoardValidationIssue[] = [];
  const locationIds = new Set<string>();
  const edgeIds = new Set<string>();
  const edgePairs = new Set<string>();

  for (const location of board.locations) {
    if (locationIds.has(location.id)) {
      issues.push({
        code: "duplicate_location_id",
        message: `Location id '${location.id}' is duplicated.`,
        locationId: location.id,
      });
    }

    locationIds.add(location.id);

    if (!isValidCoordinate(location.x) || !isValidCoordinate(location.y)) {
      issues.push({
        code: "invalid_coordinate",
        message: `Location '${location.id}' must use normalized coordinates between 0 and 1.`,
        locationId: location.id,
      });
    }
  }

  for (const edge of board.edges) {
    if (edgeIds.has(edge.id)) {
      issues.push({
        code: "duplicate_edge_id",
        message: `Edge id '${edge.id}' is duplicated.`,
        edgeId: edge.id,
      });
    }

    edgeIds.add(edge.id);

    if (edge.fromId === edge.toId) {
      issues.push({
        code: "edge_self_loop",
        message: `Edge '${edge.id}' cannot connect a location to itself.`,
        edgeId: edge.id,
      });
    }

    if (!locationIds.has(edge.fromId) || !locationIds.has(edge.toId)) {
      issues.push({
        code: "edge_missing_location",
        message: `Edge '${edge.id}' references a missing location.`,
        edgeId: edge.id,
      });
    }

    const pair = getEdgePairKey(edge.fromId, edge.toId);
    if (edgePairs.has(pair)) {
      issues.push({
        code: "duplicate_edge_pair",
        message: `Edge '${edge.id}' duplicates an existing connection.`,
        edgeId: edge.id,
      });
    }

    edgePairs.add(pair);
  }

  return issues;
}

export function assertValidBoard(board: BoardState): BoardState {
  const issues = validateBoard(board);

  if (issues[0]) {
    throw new BoardValidationError(issues[0].code, issues[0].message);
  }

  return board;
}

function findLocationOrThrow(board: BoardState, locationId: string) {
  const location = board.locations.find((candidate) => candidate.id === locationId);

  if (!location) {
    throw new BoardValidationError(
      "location_not_found",
      `Location '${locationId}' does not exist.`,
    );
  }

  return location;
}

function findEdgeOrThrow(board: BoardState, edgeId: string) {
  const edge = board.edges.find((candidate) => candidate.id === edgeId);

  if (!edge) {
    throw new BoardValidationError(
      "edge_not_found",
      `Edge '${edgeId}' does not exist.`,
    );
  }

  return edge;
}

function assertLocationIdAvailable(board: BoardState, locationId: string) {
  if (board.locations.some((location) => location.id === locationId)) {
    throw new BoardValidationError(
      "duplicate_location_id",
      `Location '${locationId}' already exists.`,
    );
  }
}

function assertEdgeIdAvailable(board: BoardState, edgeId: string) {
  if (board.edges.some((edge) => edge.id === edgeId)) {
    throw new BoardValidationError(
      "duplicate_edge_id",
      `Edge '${edgeId}' already exists.`,
    );
  }
}

function assertEdgeEndpoints(board: BoardState, fromId: string, toId: string) {
  if (fromId === toId) {
    throw new BoardValidationError(
      "edge_self_loop",
      "An edge must connect two different locations.",
    );
  }

  findLocationOrThrow(board, fromId);
  findLocationOrThrow(board, toId);
}

function assertEdgePairAvailable(
  board: BoardState,
  fromId: string,
  toId: string,
  ignoredEdgeId?: string,
) {
  const nextPair = getEdgePairKey(fromId, toId);
  const duplicate = board.edges.find(
    (edge) =>
      edge.id !== ignoredEdgeId && getEdgePairKey(edge.fromId, edge.toId) === nextPair,
  );

  if (duplicate) {
    throw new BoardValidationError(
      "duplicate_edge_pair",
      `Locations '${fromId}' and '${toId}' are already connected.`,
    );
  }
}

function assertValidCoordinate(x: number, y: number, locationId: string) {
  if (!isValidCoordinate(x) || !isValidCoordinate(y)) {
    throw new BoardValidationError(
      "invalid_coordinate",
      `Location '${locationId}' must use normalized coordinates between 0 and 1.`,
    );
  }
}

function isValidCoordinate(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function normalizeName(name: string | undefined, fallback: string) {
  const trimmed = name?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function getEdgePairKey(fromId: string, toId: string) {
  return [fromId, toId].sort().join("::");
}
