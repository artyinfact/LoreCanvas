import type { PointData } from "pixi.js";
import type { BoardImageRef } from "../engine/board";

export interface ViewportSize {
  width: number;
  height: number;
}

export interface BoardFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export function resolveFrameBackground(
  background: BoardImageRef | null,
  assetSize: ImageSize | null,
  textureSize: ImageSize | null,
): BoardImageRef | null {
  if (!background) {
    return null;
  }

  const resolvedSize = getImageSize(background) ?? assetSize ?? textureSize;

  return resolvedSize
    ? {
        ...background,
        width: resolvedSize.width,
        height: resolvedSize.height,
      }
    : background;
}

export function getImageSize(
  image: Pick<BoardImageRef, "height" | "width"> | null | undefined,
): ImageSize | null {
  if (!image?.width || !image.height || image.width <= 0 || image.height <= 0) {
    return null;
  }

  return {
    width: image.width,
    height: image.height,
  };
}

export function computeBoardFrame(
  viewport: ViewportSize,
  background: BoardImageRef | null,
  zoom: number,
  pan: PointData,
): BoardFrame {
  const padding = Math.max(20, Math.min(viewport.width, viewport.height) * 0.04);
  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);

  if (!background?.width || !background.height) {
    return {
      x: (viewport.width - availableWidth * zoom) / 2 + pan.x,
      y: (viewport.height - availableHeight * zoom) / 2 + pan.y,
      width: availableWidth * zoom,
      height: availableHeight * zoom,
    };
  }

  const imageRatio = background.width / background.height;
  const availableRatio = availableWidth / availableHeight;
  const width =
    imageRatio > availableRatio ? availableWidth : availableHeight * imageRatio;
  const height =
    imageRatio > availableRatio ? availableWidth / imageRatio : availableHeight;

  return {
    x: (viewport.width - width * zoom) / 2 + pan.x,
    y: (viewport.height - height * zoom) / 2 + pan.y,
    width: width * zoom,
    height: height * zoom,
  };
}
