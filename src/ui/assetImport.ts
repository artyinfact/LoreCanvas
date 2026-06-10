import { RESOURCE_CATEGORIES } from "../engine/entity";
import type { ResourceCategory } from "../engine/entity";
import type { UploadedImageAsset } from "../state/boardStore";

export interface ImageImportFileLike {
  name: string;
  type: string;
  size: number;
}

export interface ImportedImageDimensions {
  width?: number;
  height?: number;
}

export interface CreateImportedImageAssetInput {
  batchId?: string;
  category: ResourceCategory;
  dimensions?: ImportedImageDimensions;
  file: ImageImportFileLike;
  index: number;
  url: string;
}

const CATEGORY_PATH_SEGMENTS: Record<ResourceCategory, string[]> = {
  BOARD: ["board", "boards", "map", "maps"],
  PAWN: ["pawn", "pawns", "character", "characters", "figure", "figures"],
  TOKEN: ["token", "tokens", "marker", "markers", "dice", "die"],
  TILE: ["tile", "tiles", "terrain", "terrains"],
  CARD: ["card", "cards", "deck", "decks"],
  OTHER: ["other", "others", "misc", "miscellaneous"],
};

export function inferResourceCategoryFromPath(
  path: string,
): ResourceCategory {
  const segments = path
    .split(/[\\/]+/)
    .map((segment) => segment.trim().toLowerCase())
    .filter(Boolean);

  for (const category of RESOURCE_CATEGORIES) {
    const aliases = CATEGORY_PATH_SEGMENTS[category];

    if (segments.some((segment) => aliases.includes(segment))) {
      return category;
    }
  }

  return "OTHER";
}

export function createImportedImageAsset({
  batchId = createImportBatchId(),
  category,
  dimensions = {},
  file,
  index,
  url,
}: CreateImportedImageAssetInput): UploadedImageAsset {
  const placementSize = getDefaultPlacementSize(dimensions);

  return {
    id: createImportAssetId(file.name, index, batchId),
    category,
    name: file.name,
    url,
    mimeType: file.type,
    size: file.size,
    ...dimensions,
    maxCopies: getDefaultMaxCopies(category),
    placementWidth: placementSize.width,
    placementHeight: placementSize.height,
  };
}

export function createImportBatchId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function createImportAssetId(
  fileName: string,
  index: number,
  batchId: string,
) {
  const safeName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);

  return `asset-${index + 1}-${safeName || "image"}-${batchId}`;
}

export function getDefaultMaxCopies(category: ResourceCategory) {
  return category === "TOKEN" ? 999 : 1;
}

export function getDefaultPlacementSize(dimensions: ImportedImageDimensions) {
  if (!dimensions.width || !dimensions.height) {
    return {
      width: 64,
      height: 64,
    };
  }

  const scale = Math.min(96 / dimensions.width, 96 / dimensions.height, 1);

  return {
    width: Math.max(24, Math.round(dimensions.width * scale)),
    height: Math.max(24, Math.round(dimensions.height * scale)),
  };
}
