import type { JsonRecord } from "./entity";

export const CARD_ZONE_KINDS = [
  "deck",
  "discard",
  "hand",
  "display",
  "objective",
  "setAside",
  "unused",
  "setup",
] as const;

export type CardZoneKind = (typeof CARD_ZONE_KINDS)[number];

export interface CardRef {
  id: string;
  assetId: string;
  faceId?: string;
  label?: string;
  faceUp: boolean;
  state: JsonRecord;
}

export interface CardZone {
  id: string;
  name: string;
  kind: CardZoneKind;
  cards: CardRef[];
  state: JsonRecord;
}

export interface CardDeckState {
  zones: CardZone[];
}

export type CardDeckErrorCode =
  | "duplicate_zone_id"
  | "duplicate_card_id"
  | "invalid_zone"
  | "invalid_card"
  | "zone_not_found"
  | "card_not_found"
  | "invalid_count"
  | "invalid_shuffle_order";

export class CardDeckError extends Error {
  readonly code: CardDeckErrorCode;

  constructor(code: CardDeckErrorCode, message: string) {
    super(message);
    this.name = "CardDeckError";
    this.code = code;
  }
}

export interface AddCardZoneInput {
  id: string;
  name: string;
  kind: CardZoneKind;
  state?: JsonRecord;
}

export interface AddCardInput {
  id: string;
  assetId: string;
  faceId?: string;
  label?: string;
  faceUp?: boolean;
  state?: JsonRecord;
}

export interface MoveCardsInput {
  cardIds: string[];
  fromZoneId: string;
  toIndex?: number;
  toZoneId: string;
}

export interface DrawCardsInput {
  count: number;
  fromZoneId: string;
  toZoneId: string;
}

export interface DealCardsInput {
  countPerZone: number;
  fromZoneId: string;
  toZoneIds: string[];
}

export interface ShuffleZoneOptions {
  order?: string[];
  random?: () => number;
}

export function createEmptyCardDeckState(): CardDeckState {
  return {
    zones: [],
  };
}

export function isCardZoneKind(value: string): value is CardZoneKind {
  return CARD_ZONE_KINDS.includes(value as CardZoneKind);
}

export function addCardZone(
  state: CardDeckState,
  input: AddCardZoneInput,
): CardDeckState {
  assertZoneInput(input);

  if (state.zones.some((zone) => zone.id === input.id)) {
    throw new CardDeckError(
      "duplicate_zone_id",
      `Card zone '${input.id}' already exists.`,
    );
  }

  return {
    zones: [
      ...state.zones,
      {
        id: input.id,
        name: input.name,
        kind: input.kind,
        cards: [],
        state: { ...(input.state ?? {}) },
      },
    ],
  };
}

export function updateCardZone(
  state: CardDeckState,
  zoneId: string,
  patch: Partial<Pick<CardZone, "name" | "kind" | "state">>,
): CardDeckState {
  findZoneOrThrow(state, zoneId);

  return {
    zones: state.zones.map((zone) =>
      zone.id === zoneId
        ? {
            ...zone,
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
            ...(patch.state !== undefined ? { state: { ...patch.state } } : {}),
          }
        : zone,
    ),
  };
}

export function removeCardZone(
  state: CardDeckState,
  zoneId: string,
): CardDeckState {
  findZoneOrThrow(state, zoneId);

  return {
    zones: state.zones.filter((zone) => zone.id !== zoneId),
  };
}

export function addCardsToZone(
  state: CardDeckState,
  zoneId: string,
  cards: AddCardInput[],
): CardDeckState {
  findZoneOrThrow(state, zoneId);

  const knownCardIds = new Set(getAllCards(state).map((card) => card.id));
  const nextCards = cards.map((card) => {
    assertCardInput(card);

    if (knownCardIds.has(card.id)) {
      throw new CardDeckError(
        "duplicate_card_id",
        `Card '${card.id}' already exists in card zones.`,
      );
    }

    knownCardIds.add(card.id);

    return normalizeCard(card);
  });

  return {
    zones: state.zones.map((zone) =>
      zone.id === zoneId
        ? {
            ...zone,
            cards: [...zone.cards, ...nextCards],
          }
        : zone,
    ),
  };
}

export function removeCardsFromZone(
  state: CardDeckState,
  zoneId: string,
  cardIds: string[],
): CardDeckState {
  const zone = findZoneOrThrow(state, zoneId);
  const removedIds = new Set(cardIds);

  if (!zone.cards.some((card) => removedIds.has(card.id))) {
    throw new CardDeckError(
      "card_not_found",
      `None of the requested cards exist in zone '${zoneId}'.`,
    );
  }

  return {
    zones: state.zones.map((candidate) =>
      candidate.id === zoneId
        ? {
            ...candidate,
            cards: candidate.cards.filter((card) => !removedIds.has(card.id)),
          }
        : candidate,
    ),
  };
}

export function moveCardsBetweenZones(
  state: CardDeckState,
  input: MoveCardsInput,
): CardDeckState {
  const sourceZone = findZoneOrThrow(state, input.fromZoneId);
  findZoneOrThrow(state, input.toZoneId);

  if (input.cardIds.length === 0) {
    throw new CardDeckError("card_not_found", "Move requires at least one card.");
  }

  const movingIds = new Set(input.cardIds);
  const movingCards = sourceZone.cards.filter((card) => movingIds.has(card.id));

  if (movingCards.length !== input.cardIds.length) {
    throw new CardDeckError(
      "card_not_found",
      `One or more cards were not found in zone '${input.fromZoneId}'.`,
    );
  }

  const withoutMoving = sourceZone.cards.filter((card) => !movingIds.has(card.id));

  return {
    zones: state.zones.map((zone) => {
      if (zone.id === input.fromZoneId && zone.id === input.toZoneId) {
        return {
          ...zone,
          cards: insertCards(withoutMoving, movingCards, input.toIndex),
        };
      }

      if (zone.id === input.fromZoneId) {
        return {
          ...zone,
          cards: withoutMoving,
        };
      }

      if (zone.id === input.toZoneId) {
        return {
          ...zone,
          cards: insertCards(zone.cards, movingCards, input.toIndex),
        };
      }

      return zone;
    }),
  };
}

export function drawCards(
  state: CardDeckState,
  input: DrawCardsInput,
): CardDeckState {
  if (!Number.isInteger(input.count) || input.count <= 0) {
    throw new CardDeckError("invalid_count", "Draw count must be a positive integer.");
  }

  const sourceZone = findZoneOrThrow(state, input.fromZoneId);
  findZoneOrThrow(state, input.toZoneId);
  const cardIds = sourceZone.cards.slice(0, input.count).map((card) => card.id);

  if (cardIds.length === 0) {
    throw new CardDeckError(
      "card_not_found",
      `Zone '${input.fromZoneId}' has no cards to draw.`,
    );
  }

  return moveCardsBetweenZones(state, {
    cardIds,
    fromZoneId: input.fromZoneId,
    toZoneId: input.toZoneId,
  });
}

export function dealCards(
  state: CardDeckState,
  input: DealCardsInput,
): CardDeckState {
  if (!Number.isInteger(input.countPerZone) || input.countPerZone <= 0) {
    throw new CardDeckError(
      "invalid_count",
      "Deal count must be a positive integer.",
    );
  }

  if (input.toZoneIds.length === 0) {
    throw new CardDeckError("zone_not_found", "Deal requires at least one target zone.");
  }

  let nextState = state;

  for (let round = 0; round < input.countPerZone; round += 1) {
    for (const toZoneId of input.toZoneIds) {
      nextState = drawCards(nextState, {
        count: 1,
        fromZoneId: input.fromZoneId,
        toZoneId,
      });
    }
  }

  return nextState;
}

export function flipCards(
  state: CardDeckState,
  zoneId: string,
  cardIds: string[],
  faceUp?: boolean,
): CardDeckState {
  const zone = findZoneOrThrow(state, zoneId);
  const flippedIds = new Set(cardIds);

  if (!zone.cards.some((card) => flippedIds.has(card.id))) {
    throw new CardDeckError(
      "card_not_found",
      `None of the requested cards exist in zone '${zoneId}'.`,
    );
  }

  return {
    zones: state.zones.map((candidate) =>
      candidate.id === zoneId
        ? {
            ...candidate,
            cards: candidate.cards.map((card) =>
              flippedIds.has(card.id)
                ? {
                    ...card,
                    faceUp: faceUp ?? !card.faceUp,
                  }
                : card,
            ),
          }
        : candidate,
    ),
  };
}

export function reorderCardInZone(
  state: CardDeckState,
  zoneId: string,
  cardId: string,
  toIndex: number,
): CardDeckState {
  return moveCardsBetweenZones(state, {
    cardIds: [cardId],
    fromZoneId: zoneId,
    toZoneId: zoneId,
    toIndex,
  });
}

export function shuffleCardZone(
  state: CardDeckState,
  zoneId: string,
  options: ShuffleZoneOptions = {},
): CardDeckState {
  const zone = findZoneOrThrow(state, zoneId);
  const shuffledCards = options.order
    ? applyExplicitOrder(zone.cards, options.order)
    : shuffleCards(zone.cards, options.random ?? Math.random);

  return {
    zones: state.zones.map((candidate) =>
      candidate.id === zoneId
        ? {
            ...candidate,
            cards: shuffledCards,
          }
        : candidate,
    ),
  };
}

export function searchCards(
  state: CardDeckState,
  zoneId: string,
  query: string,
): CardRef[] {
  const zone = findZoneOrThrow(state, zoneId);
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...zone.cards];
  }

  return zone.cards.filter((card) =>
    [
      card.id,
      card.assetId,
      card.faceId ?? "",
      card.label ?? "",
      JSON.stringify(card.state),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

export function removeCardsByAssetId(
  state: CardDeckState,
  assetId: string,
): CardDeckState {
  return {
    zones: state.zones.map((zone) => ({
      ...zone,
      cards: zone.cards.filter((card) => card.assetId !== assetId),
    })),
  };
}

export function countCardsByAssetId(state: CardDeckState, assetId: string) {
  return getAllCards(state).filter((card) => card.assetId === assetId).length;
}

function assertZoneInput(input: AddCardZoneInput) {
  if (!input.id.trim() || !input.name.trim() || !isCardZoneKind(input.kind)) {
    throw new CardDeckError("invalid_zone", "Card zone requires id, name, and kind.");
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new CardDeckError("invalid_zone", "Card zone state must be a JSON object.");
  }
}

function assertCardInput(input: AddCardInput) {
  if (!input.id.trim() || !input.assetId.trim()) {
    throw new CardDeckError("invalid_card", "Card ref requires id and assetId.");
  }

  if (!isJsonRecord(input.state ?? {})) {
    throw new CardDeckError("invalid_card", "Card ref state must be a JSON object.");
  }
}

function normalizeCard(input: AddCardInput): CardRef {
  return {
    id: input.id,
    assetId: input.assetId,
    ...(input.faceId ? { faceId: input.faceId } : {}),
    ...(input.label ? { label: input.label } : {}),
    faceUp: input.faceUp ?? false,
    state: { ...(input.state ?? {}) },
  };
}

function findZoneOrThrow(state: CardDeckState, zoneId: string) {
  const zone = state.zones.find((candidate) => candidate.id === zoneId);

  if (!zone) {
    throw new CardDeckError(
      "zone_not_found",
      `Card zone '${zoneId}' does not exist.`,
    );
  }

  return zone;
}

function getAllCards(state: CardDeckState) {
  return state.zones.flatMap((zone) => zone.cards);
}

function insertCards(cards: CardRef[], insertedCards: CardRef[], toIndex = cards.length) {
  const boundedIndex = Math.min(cards.length, Math.max(0, Math.trunc(toIndex)));

  return [
    ...cards.slice(0, boundedIndex),
    ...insertedCards,
    ...cards.slice(boundedIndex),
  ];
}

function shuffleCards(cards: CardRef[], random: () => number) {
  const shuffledCards = [...cards];

  for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const currentCard = shuffledCards[index]!;

    shuffledCards[index] = shuffledCards[swapIndex]!;
    shuffledCards[swapIndex] = currentCard;
  }

  return shuffledCards;
}

function applyExplicitOrder(cards: CardRef[], order: string[]) {
  const cardById = new Map(cards.map((card) => [card.id, card]));

  if (
    order.length !== cards.length ||
    order.some((cardId) => !cardById.has(cardId)) ||
    new Set(order).size !== order.length
  ) {
    throw new CardDeckError(
      "invalid_shuffle_order",
      "Explicit card order must include every card exactly once.",
    );
  }

  return order.map((cardId) => cardById.get(cardId)!);
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
