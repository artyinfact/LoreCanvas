import { Application, extend } from "@pixi/react";
import {
  Assets,
  Circle,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
} from "pixi.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApplicationRef } from "@pixi/react";
import type {
  FederatedPointerEvent,
  Graphics as PixiGraphics,
  PointData,
  Texture,
} from "pixi.js";
import type { DragEvent, RefObject } from "react";
import type { BoardImageRef, BoardLocation } from "../engine/board";
import { useBoardStore } from "../state/boardStore";
import type { AccessoryTemplate } from "../state/boardStore";

extend({
  Container,
  Graphics,
  Sprite,
  Text,
});

interface ViewportSize {
  width: number;
  height: number;
}

interface BoardFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoardPanDrag {
  origin: PointData;
  start: PointData;
}

const FALLBACK_VIEWPORT: ViewportSize = {
  width: 960,
  height: 640,
};

export function BoardCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<ApplicationRef>(null);
  const viewport = useElementSize(hostRef, FALLBACK_VIEWPORT);
  const board = useBoardStore((state) => state.board);
  const activeTool = useBoardStore((state) => state.activeTool);
  const boardZoom = useBoardStore((state) => state.boardZoom);
  const boardPan = useBoardStore((state) => state.boardPan);
  const selectedLocationId = useBoardStore((state) => state.selectedLocationId);
  const selectedPlacementId = useBoardStore((state) => state.selectedPlacementId);
  const edgeDraftFromId = useBoardStore((state) => state.edgeDraftFromId);
  const accessoryTemplates = useBoardStore((state) => state.accessoryTemplates);
  const templatePlacements = useBoardStore((state) => state.templatePlacements);
  const createLocationAt = useBoardStore((state) => state.createLocationAt);
  const createTemplatePlacement = useBoardStore(
    (state) => state.createTemplatePlacement,
  );
  const moveLocation = useBoardStore((state) => state.moveLocation);
  const selectLocation = useBoardStore((state) => state.selectLocation);
  const selectPlacement = useBoardStore((state) => state.selectPlacement);
  const setBoardPan = useBoardStore((state) => state.setBoardPan);
  const setLastError = useBoardStore((state) => state.setLastError);
  const startOrCompleteEdge = useBoardStore((state) => state.startOrCompleteEdge);
  const updateTemplatePlacement = useBoardStore(
    (state) => state.updateTemplatePlacement,
  );
  const [draggingLocationId, setDraggingLocationId] = useState<string | null>(
    null,
  );
  const [draggingPlacementId, setDraggingPlacementId] = useState<string | null>(
    null,
  );
  const [draggingBoardPan, setDraggingBoardPan] =
    useState<BoardPanDrag | null>(null);
  const frame = useMemo(
    () => computeBoardFrame(viewport, board.background, boardZoom, boardPan),
    [board.background, boardPan, boardZoom, viewport],
  );
  useEffect(() => {
    const app = appRef.current?.getApplication();
    const canvas = appRef.current?.getCanvas();

    if (!app || !canvas) {
      return;
    }

    app.renderer.resize(viewport.width, viewport.height);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
  }, [viewport.height, viewport.width]);
  const hitArea = useMemo(
    () => new Rectangle(0, 0, viewport.width, viewport.height),
    [viewport],
  );
  const locationById = useMemo(
    () => new Map(board.locations.map((location) => [location.id, location])),
    [board.locations],
  );
  const templateById = useMemo(
    () =>
      new Map(
        accessoryTemplates.map((template) => [template.id, template] as const),
      ),
    [accessoryTemplates],
  );
  const canvasCursor = getCanvasCursor({
    activeTool,
    hasSelection: Boolean(selectedLocationId || selectedPlacementId),
    isPanning: Boolean(draggingBoardPan),
  });
  const drawBoardFrame = useCallback(
    (graphics: PixiGraphics) => {
      graphics.clear();
      graphics.rect(0, 0, viewport.width, viewport.height).fill(0xd8dce2);
      graphics
        .rect(frame.x, frame.y, frame.width, frame.height)
        .fill({ color: 0xf7f8f6 })
        .stroke({ color: 0x2f343a, width: 2, alpha: 0.32 });

      if (!board.background) {
        const spacing = 56;

        for (
          let offset = -frame.height;
          offset < frame.width;
          offset += spacing
        ) {
          graphics
            .moveTo(frame.x + offset, frame.y + frame.height)
            .lineTo(frame.x + offset + frame.height, frame.y)
            .stroke({ color: 0xaeb4bd, width: 1, alpha: 0.32 });
        }
      }
    },
    [board.background, frame, viewport],
  );
  const drawEdges = useCallback(
    (graphics: PixiGraphics) => {
      graphics.clear();

      for (const edge of board.edges) {
        const from = locationById.get(edge.fromId);
        const to = locationById.get(edge.toId);

        if (!from || !to) {
          continue;
        }

        const fromPoint = locationToScenePoint(from, frame);
        const toPoint = locationToScenePoint(to, frame);

        graphics
          .moveTo(fromPoint.x, fromPoint.y)
          .lineTo(toPoint.x, toPoint.y)
          .stroke({ color: 0x111827, width: 7, alpha: 0.18, cap: "round" });
        graphics
          .moveTo(fromPoint.x, fromPoint.y)
          .lineTo(toPoint.x, toPoint.y)
          .stroke({ color: 0xf2b84b, width: 3, alpha: 0.92, cap: "round" });
      }
    },
    [board.edges, frame, locationById],
  );
  const handleCanvasPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      if (activeTool === "select") {
        if (selectedLocationId || selectedPlacementId) {
          selectLocation(null);
          selectPlacement(null);
          return;
        }

        setDraggingBoardPan({
          origin: { x: boardPan.x, y: boardPan.y },
          start: { x: event.global.x, y: event.global.y },
        });
        return;
      }

      if (activeTool !== "location") {
        return;
      }

      const boardPoint = scenePointToBoardPoint(event.global, frame);

      if (boardPoint) {
        createLocationAt(boardPoint.x, boardPoint.y);
      }
    },
    [
      activeTool,
      boardPan.x,
      boardPan.y,
      createLocationAt,
      frame,
      selectLocation,
      selectPlacement,
      selectedLocationId,
      selectedPlacementId,
    ],
  );
  const handleGlobalPointerMove = useCallback(
    (event: FederatedPointerEvent) => {
      if (draggingPlacementId) {
        const boardPoint = scenePointToClampedBoardPoint(event.global, frame);
        updateTemplatePlacement(draggingPlacementId, {
          x: boardPoint.x,
          y: boardPoint.y,
        });
        return;
      }

      if (draggingLocationId) {
        const boardPoint = scenePointToClampedBoardPoint(event.global, frame);
        moveLocation(draggingLocationId, boardPoint.x, boardPoint.y);
        return;
      }

      if (!draggingBoardPan) {
        return;
      }

      setBoardPan({
        x: draggingBoardPan.origin.x + event.global.x - draggingBoardPan.start.x,
        y: draggingBoardPan.origin.y + event.global.y - draggingBoardPan.start.y,
      });
    },
    [
      draggingBoardPan,
      draggingLocationId,
      draggingPlacementId,
      frame,
      moveLocation,
      updateTemplatePlacement,
    ],
  );
  const stopDragging = useCallback(() => {
    setDraggingLocationId(null);
    setDraggingPlacementId(null);
    setDraggingBoardPan(null);
  }, []);
  const handleLocationPointerDown = useCallback(
    (locationId: string, event: FederatedPointerEvent) => {
      event.stopPropagation();

      if (activeTool === "edge") {
        startOrCompleteEdge(locationId);
        return;
      }

      selectLocation(locationId);
      setDraggingLocationId(locationId);
    },
    [activeTool, selectLocation, startOrCompleteEdge],
  );
  const handlePlacementPointerDown = useCallback(
    (placementId: string, event: FederatedPointerEvent) => {
      event.stopPropagation();

      selectPlacement(placementId);

      if (activeTool === "select") {
        setDraggingPlacementId(placementId);
      }
    },
    [activeTool, selectPlacement],
  );
  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (event.dataTransfer.types.includes("application/x-lorecanvas-template")) {
        event.preventDefault();
        event.dataTransfer.dropEffect = activeTool === "select" ? "copy" : "none";
      }
    },
    [activeTool],
  );
  const handleTemplateDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const templateId = event.dataTransfer.getData(
        "application/x-lorecanvas-template",
      );

      if (!templateId) {
        return;
      }

      event.preventDefault();

      if (activeTool !== "select") {
        setLastError("Switch to Select before placing a piece template.");
        return;
      }

      const hostRect = event.currentTarget.getBoundingClientRect();
      const boardPoint = scenePointToBoardPoint(
        {
          x: event.clientX - hostRect.left,
          y: event.clientY - hostRect.top,
        },
        frame,
      );

      if (!boardPoint) {
        setLastError("Drop the piece template inside the board background.");
        return;
      }

      createTemplatePlacement(templateId, boardPoint.x, boardPoint.y);
    },
    [activeTool, createTemplatePlacement, frame, setLastError],
  );

  return (
    <div
      aria-label="Board editor"
      className="board-canvas"
      onDragOver={handleDragOver}
      onDrop={handleTemplateDrop}
      ref={hostRef}
    >
      <Application
        antialias
        autoDensity
        background={0xd8dce2}
        height={viewport.height}
        ref={appRef}
        resolution={window.devicePixelRatio}
        resizeTo={hostRef}
        width={viewport.width}
      >
        <pixiContainer
          cursor={canvasCursor}
          eventMode="static"
          hitArea={hitArea}
          onGlobalPointerMove={handleGlobalPointerMove}
          onPointerDown={handleCanvasPointerDown}
          onPointerUp={stopDragging}
          onPointerUpOutside={stopDragging}
        >
          <pixiGraphics draw={drawBoardFrame} />
          <BoardBackgroundSprite background={board.background} frame={frame} />
          {templatePlacements.map((placement) => {
            const template = templateById.get(placement.templateId);

            if (!template) {
              return null;
            }

            return (
              <PiecePlacementSprite
                frame={frame}
                isSelected={selectedPlacementId === placement.id}
                key={placement.id}
                onPointerDown={handlePlacementPointerDown}
                placementId={placement.id}
                template={template}
                height={placement.height}
                x={placement.x}
                y={placement.y}
                width={placement.width}
              />
            );
          })}
          <pixiGraphics draw={drawEdges} />
          {board.locations.map((location, index) => (
            <LocationNode
              frame={frame}
              index={index}
              isDraftOrigin={edgeDraftFromId === location.id}
              isSelected={selectedLocationId === location.id}
              key={location.id}
              location={location}
              onPointerDown={handleLocationPointerDown}
            />
          ))}
        </pixiContainer>
      </Application>
    </div>
  );
}

interface PiecePlacementSpriteProps {
  frame: BoardFrame;
  height: number;
  isSelected: boolean;
  onPointerDown: (placementId: string, event: FederatedPointerEvent) => void;
  placementId: string;
  template: AccessoryTemplate;
  width: number;
  x: number;
  y: number;
}

function PiecePlacementSprite({
  frame,
  height,
  isSelected,
  onPointerDown,
  placementId,
  template,
  width,
  x,
  y,
}: PiecePlacementSpriteProps) {
  const point = {
    x: frame.x + x * frame.width,
    y: frame.y + y * frame.height,
  };
  const hitArea = useMemo(
    () => new Rectangle(-width / 2, -height / 2, width, height),
    [height, width],
  );
  const drawSelection = useCallback(
    (graphics: PixiGraphics) => {
      graphics.clear();

      if (!isSelected) {
        return;
      }

      graphics
        .rect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8)
        .stroke({ color: 0x2f6f73, width: 3, alpha: 0.95 });
    },
    [height, isSelected, width],
  );
  const handlePointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      onPointerDown(placementId, event);
    },
    [onPointerDown, placementId],
  );

  return (
    <pixiContainer
      cursor="grab"
      eventMode="static"
      hitArea={hitArea}
      onPointerDown={handlePointerDown}
      x={point.x}
      y={point.y}
    >
      <ImageSprite
        height={height}
        name={template.name}
        url={template.imageUrl}
        width={width}
        x={0}
        y={0}
      />
      <pixiGraphics draw={drawSelection} />
    </pixiContainer>
  );
}

interface ImageSpriteProps {
  height: number;
  name: string;
  url: string;
  width: number;
  x: number;
  y: number;
}

function ImageSprite({ height, name, url, width, x, y }: ImageSpriteProps) {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let cancelled = false;

    setTexture(null);

    void Assets.load<Texture>({
      parser: getPixiImageParser({ name, url }),
      src: url,
    })
      .then((loadedTexture) => {
        if (!cancelled) {
          setTexture(loadedTexture);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTexture(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [name, url]);

  if (!texture) {
    return null;
  }

  return (
    <pixiSprite
      anchor={0.5}
      height={height}
      texture={texture}
      width={width}
      x={x}
      y={y}
    />
  );
}

interface BoardBackgroundSpriteProps {
  background: BoardImageRef | null;
  frame: BoardFrame;
}

function BoardBackgroundSprite({ background, frame }: BoardBackgroundSpriteProps) {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let cancelled = false;

    setTexture(null);

    if (!background) {
      return () => {
        cancelled = true;
      };
    }

    void Assets.load<Texture>({
      parser: getPixiImageParser(background),
      src: background.url,
    })
      .then((loadedTexture) => {
        if (!cancelled) {
          setTexture(loadedTexture);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTexture(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [background]);

  if (!texture) {
    return null;
  }

  return (
    <pixiSprite
      alpha={0.98}
      height={frame.height}
      texture={texture}
      width={frame.width}
      x={frame.x}
      y={frame.y}
    />
  );
}

interface LocationNodeProps {
  frame: BoardFrame;
  index: number;
  isDraftOrigin: boolean;
  isSelected: boolean;
  location: BoardLocation;
  onPointerDown: (locationId: string, event: FederatedPointerEvent) => void;
}

function LocationNode({
  frame,
  index,
  isDraftOrigin,
  isSelected,
  location,
  onPointerDown,
}: LocationNodeProps) {
  const point = locationToScenePoint(location, frame);
  const hitArea = useMemo(() => new Circle(0, 0, 24), []);
  const label = String(index + 1);
  const drawNode = useCallback(
    (graphics: PixiGraphics) => {
      graphics.clear();
      graphics
        .circle(0, 0, 18)
        .fill({ color: isSelected ? 0x2f6f73 : 0x27313b, alpha: 0.94 })
        .stroke({
          color: isDraftOrigin ? 0xf2b84b : 0xf7f8f6,
          width: isDraftOrigin || isSelected ? 4 : 2,
          alpha: 0.98,
        });
      graphics
        .circle(0, 0, 25)
        .stroke({ color: 0x111827, width: 2, alpha: 0.2 });
    },
    [isDraftOrigin, isSelected],
  );
  const handlePointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      onPointerDown(location.id, event);
    },
    [location.id, onPointerDown],
  );

  return (
    <pixiContainer
      cursor="pointer"
      eventMode="static"
      hitArea={hitArea}
      onPointerDown={handlePointerDown}
      x={point.x}
      y={point.y}
    >
      <pixiGraphics draw={drawNode} />
      <pixiText
        anchor={0.5}
        text={label}
        x={0}
        y={-8}
        style={{
          fill: "#f8fafc",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: 13,
          fontWeight: "800",
        }}
      />
    </pixiContainer>
  );
}

function useElementSize(
  ref: RefObject<HTMLElement | null>,
  fallback: ViewportSize,
) {
  const [size, setSize] = useState(fallback);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      setSize({
        width: Math.max(320, Math.round(element.clientWidth)),
        height: Math.max(320, Math.round(element.clientHeight)),
      });
    };
    const resizeObserver = new ResizeObserver(updateSize);

    updateSize();
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [fallback, ref]);

  return size;
}

function computeBoardFrame(
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

function getCanvasCursor({
  activeTool,
  hasSelection,
  isPanning,
}: {
  activeTool: string;
  hasSelection: boolean;
  isPanning: boolean;
}) {
  if (activeTool === "select" && !hasSelection) {
    return isPanning ? "grabbing" : "grab";
  }

  if (activeTool === "location") {
    return "crosshair";
  }

  return "default";
}

function locationToScenePoint(location: BoardLocation, frame: BoardFrame) {
  return {
    x: frame.x + location.x * frame.width,
    y: frame.y + location.y * frame.height,
  };
}

function scenePointToBoardPoint(
  point: PointData,
  frame: BoardFrame,
): PointData | null {
  if (
    point.x < frame.x ||
    point.y < frame.y ||
    point.x > frame.x + frame.width ||
    point.y > frame.y + frame.height
  ) {
    return null;
  }

  return scenePointToClampedBoardPoint(point, frame);
}

function scenePointToClampedBoardPoint(point: PointData, frame: BoardFrame) {
  return {
    x: clamp((point.x - frame.x) / frame.width),
    y: clamp((point.y - frame.y) / frame.height),
  };
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getPixiImageParser(
  image: Pick<BoardImageRef, "mimeType" | "name" | "url">,
): "svg" | "texture" {
  const mimeType = image.mimeType?.toLowerCase() ?? "";
  const name = image.name.toLowerCase();
  const url = image.url.toLowerCase();

  return mimeType.includes("svg") || name.endsWith(".svg") || url.includes(".svg")
    ? "svg"
    : "texture";
}
