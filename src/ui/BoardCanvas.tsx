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
import type { BoardEdge, BoardImageRef, BoardLocation } from "../engine/board";
import { useBoardStore } from "../state/boardStore";
import type { AssetPlacement, UploadedImageAsset } from "../state/boardStore";

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

const MIN_BOARD_ZOOM = 0.5;
const MAX_BOARD_ZOOM = 4;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;

export function BoardCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<ApplicationRef>(null);
  const viewport = useElementSize(hostRef, FALLBACK_VIEWPORT);
  const board = useBoardStore((state) => state.board);
  const mode = useBoardStore((state) => state.mode);
  const activeTool = useBoardStore((state) => state.activeTool);
  const boardZoom = useBoardStore((state) => state.boardZoom);
  const boardPan = useBoardStore((state) => state.boardPan);
  const selectedLocationId = useBoardStore((state) => state.selectedLocationId);
  const selectedPlacementId = useBoardStore((state) => state.selectedPlacementId);
  const selectedEdgeId = useBoardStore((state) => state.selectedEdgeId);
  const edgeDraftFromId = useBoardStore((state) => state.edgeDraftFromId);
  const assets = useBoardStore((state) => state.assets);
  const assetPlacements = useBoardStore((state) => state.assetPlacements);
  const createLocationAt = useBoardStore((state) => state.createLocationAt);
  const createAssetPlacement = useBoardStore(
    (state) => state.createAssetPlacement,
  );
  const moveLocation = useBoardStore((state) => state.moveLocation);
  const selectLocation = useBoardStore((state) => state.selectLocation);
  const selectPlacement = useBoardStore((state) => state.selectPlacement);
  const selectEdge = useBoardStore((state) => state.selectEdge);
  const setBoardPan = useBoardStore((state) => state.setBoardPan);
  const setBoardZoom = useBoardStore((state) => state.setBoardZoom);
  const setLastError = useBoardStore((state) => state.setLastError);
  const startOrCompleteEdge = useBoardStore((state) => state.startOrCompleteEdge);
  const updateAssetPlacement = useBoardStore(
    (state) => state.updateAssetPlacement,
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
  const assetById = useMemo(
    () =>
      new Map(
        assets.map((asset) => [asset.id, asset] as const),
      ),
    [assets],
  );
  const selectedPlacement = useMemo(
    () =>
      selectedPlacementId
        ? assetPlacements.find(
            (placement) => placement.id === selectedPlacementId,
          ) ?? null
        : null,
    [assetPlacements, selectedPlacementId],
  );
  const tilePlacements = useMemo(
    () => assetPlacements.filter((placement) => placement.category === "TILE"),
    [assetPlacements],
  );
  const upperPlacements = useMemo(
    () => assetPlacements.filter((placement) => placement.category !== "TILE"),
    [assetPlacements],
  );
  const canvasCursor = getCanvasCursor({
    activeTool,
    hasSelection: Boolean(selectedLocationId || selectedPlacementId || selectedEdgeId),
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

        const isSelected = edge.id === selectedEdgeId;

        graphics
          .moveTo(fromPoint.x, fromPoint.y)
          .lineTo(toPoint.x, toPoint.y)
          .stroke({
            color: isSelected ? 0x2f6f73 : 0x111827,
            width: isSelected ? 13 : 7,
            alpha: isSelected ? 0.32 : 0.18,
            cap: "round",
          });
        graphics
          .moveTo(fromPoint.x, fromPoint.y)
          .lineTo(toPoint.x, toPoint.y)
          .stroke({
            color: isSelected ? 0xe6f3f1 : 0xf2b84b,
            width: isSelected ? 5 : 3,
            alpha: 0.92,
            cap: "round",
          });
      }
    },
    [board.edges, frame, locationById, selectedEdgeId],
  );
  const handleCanvasPointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      if (activeTool === "select") {
        if (selectedLocationId || selectedPlacementId || selectedEdgeId) {
          selectLocation(null);
          selectPlacement(null);
          selectEdge(null);
          return;
        }

        setDraggingBoardPan({
          origin: { x: boardPan.x, y: boardPan.y },
          start: { x: event.global.x, y: event.global.y },
        });
        return;
      }

      if (mode === "run") {
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
      selectEdge,
      selectedEdgeId,
      selectedLocationId,
      selectedPlacementId,
      mode,
    ],
  );
  const handleEdgePointerDown = useCallback(
    (edgeId: string, event: FederatedPointerEvent) => {
      event.stopPropagation();

      if (activeTool !== "select") {
        return;
      }

      selectEdge(edgeId);
    },
    [activeTool, selectEdge],
  );
  const handleGlobalPointerMove = useCallback(
    (event: FederatedPointerEvent) => {
      if (draggingPlacementId) {
        const boardPoint = scenePointToClampedBoardPoint(event.global, frame);
        updateAssetPlacement(draggingPlacementId, {
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
      updateAssetPlacement,
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
        if (mode === "run") {
          selectLocation(locationId);
          return;
        }

        startOrCompleteEdge(locationId);
        return;
      }

      selectLocation(locationId);
      if (mode === "edit") {
        setDraggingLocationId(locationId);
      }
    },
    [activeTool, mode, selectLocation, startOrCompleteEdge],
  );
  const handlePlacementPointerDown = useCallback(
    (placementId: string, event: FederatedPointerEvent) => {
      event.stopPropagation();

      selectPlacement(placementId);

      if (activeTool === "select" && mode === "edit") {
        setDraggingPlacementId(placementId);
      }
    },
    [activeTool, mode, selectPlacement],
  );
  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (mode === "run") {
        return;
      }

      if (event.dataTransfer.types.includes("application/x-lorecanvas-asset")) {
        event.preventDefault();
        event.dataTransfer.dropEffect = activeTool === "select" ? "copy" : "none";
      }
    },
    [activeTool, mode],
  );
  const handleAssetDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const assetId = event.dataTransfer.getData(
        "application/x-lorecanvas-asset",
      );

      if (!assetId) {
        return;
      }

      event.preventDefault();

      if (mode === "run") {
        setLastError("Run mode cannot add setup assets. Switch to Edit.");
        return;
      }

      if (activeTool !== "select") {
        setLastError("Switch to Select before placing an asset.");
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
        setLastError("Drop the asset inside the board background.");
        return;
      }

      const asset = assetById.get(assetId);

      if (!asset) {
        setLastError(`Asset '${assetId}' was not found.`);
        return;
      }

      if (asset.category === "PAWN" || asset.category === "TOKEN") {
        const nearestLocation = findNearestLocation(boardPoint, board.locations);

        if (!nearestLocation) {
          setLastError(`${asset.category} assets must be dropped on a location.`);
          return;
        }

        createAssetPlacement(
          assetId,
          nearestLocation.x,
          nearestLocation.y,
          nearestLocation.id,
        );
        return;
      }

      createAssetPlacement(assetId, boardPoint.x, boardPoint.y);
    },
    [
      activeTool,
      assetById,
      board.locations,
      createAssetPlacement,
      frame,
      mode,
      setLastError,
    ],
  );
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (activeTool !== "select") {
        return;
      }

      event.preventDefault();

      const scale = getWheelScale(event.deltaY);

      if (selectedPlacement) {
        if (mode === "run") {
          return;
        }

        updateAssetPlacement(selectedPlacement.id, {
          width: selectedPlacement.width * scale,
          height: selectedPlacement.height * scale,
        });
        return;
      }

      if (selectedLocationId) {
        return;
      }

      const nextZoom = clamp(boardZoom * scale, MIN_BOARD_ZOOM, MAX_BOARD_ZOOM);

      if (nextZoom === boardZoom) {
        return;
      }

      const hostRect = hostRef.current?.getBoundingClientRect();

      if (!hostRect) {
        return;
      }

      const pointer = {
        x: event.clientX - hostRect.left,
        y: event.clientY - hostRect.top,
      };
      const zoomRatio = nextZoom / boardZoom;
      const nextFrameX = pointer.x + (frame.x - pointer.x) * zoomRatio;
      const nextFrameY = pointer.y + (frame.y - pointer.y) * zoomRatio;
      const nextBaseFrame = computeBoardFrame(
        viewport,
        board.background,
        nextZoom,
        { x: 0, y: 0 },
      );

      setBoardZoom(nextZoom);
      setBoardPan({
        x: nextFrameX - nextBaseFrame.x,
        y: nextFrameY - nextBaseFrame.y,
      });
    },
    [
      activeTool,
      board.background,
      boardZoom,
      frame.x,
      frame.y,
      mode,
      selectedLocationId,
      selectedPlacement,
      setBoardPan,
      setBoardZoom,
      updateAssetPlacement,
      viewport,
    ],
  );
  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    host.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      host.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  return (
    <div
      aria-label="Board editor"
      className="board-canvas"
      onDragOver={handleDragOver}
      onDrop={handleAssetDrop}
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
          <PlacementSprites
            frame={frame}
            onPointerDown={handlePlacementPointerDown}
            placements={tilePlacements}
            selectedPlacementId={selectedPlacementId}
            assetById={assetById}
          />
          <pixiGraphics draw={drawEdges} />
          <EdgeHitTargets
            activeTool={activeTool}
            edges={board.edges}
            frame={frame}
            locationById={locationById}
            onPointerDown={handleEdgePointerDown}
            selectedEdgeId={selectedEdgeId}
          />
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
          <PlacementSprites
            frame={frame}
            onPointerDown={handlePlacementPointerDown}
            placements={upperPlacements}
            selectedPlacementId={selectedPlacementId}
            assetById={assetById}
          />
        </pixiContainer>
      </Application>
    </div>
  );
}

interface PlacementSpritesProps {
  frame: BoardFrame;
  onPointerDown: (placementId: string, event: FederatedPointerEvent) => void;
  placements: AssetPlacement[];
  selectedPlacementId: string | null;
  assetById: Map<string, UploadedImageAsset>;
}

interface EdgeHitTargetsProps {
  activeTool: string;
  edges: BoardEdge[];
  frame: BoardFrame;
  locationById: Map<string, BoardLocation>;
  onPointerDown: (edgeId: string, event: FederatedPointerEvent) => void;
  selectedEdgeId: string | null;
}

function EdgeHitTargets({
  activeTool,
  edges,
  frame,
  locationById,
  onPointerDown,
  selectedEdgeId,
}: EdgeHitTargetsProps) {
  return (
    <>
      {edges.map((edge) => {
        const from = locationById.get(edge.fromId);
        const to = locationById.get(edge.toId);

        if (!from || !to) {
          return null;
        }

        return (
          <EdgeHitTarget
            edge={edge}
            eventMode={activeTool === "select" ? "static" : "none"}
            frame={frame}
            from={from}
            isSelected={selectedEdgeId === edge.id}
            key={edge.id}
            onPointerDown={onPointerDown}
            to={to}
          />
        );
      })}
    </>
  );
}

interface EdgeHitTargetProps {
  edge: BoardEdge;
  eventMode: "static" | "none";
  frame: BoardFrame;
  from: BoardLocation;
  isSelected: boolean;
  onPointerDown: (edgeId: string, event: FederatedPointerEvent) => void;
  to: BoardLocation;
}

function EdgeHitTarget({
  edge,
  eventMode,
  frame,
  from,
  isSelected,
  onPointerDown,
  to,
}: EdgeHitTargetProps) {
  const fromPoint = locationToScenePoint(from, frame);
  const toPoint = locationToScenePoint(to, frame);
  const drawHitTarget = useCallback(
    (graphics: PixiGraphics) => {
      graphics.clear();
      graphics
        .moveTo(fromPoint.x, fromPoint.y)
        .lineTo(toPoint.x, toPoint.y)
        .stroke({
          color: isSelected ? 0x2f6f73 : 0xffffff,
          width: isSelected ? 18 : 16,
          alpha: isSelected ? 0.1 : 0.001,
          cap: "round",
        });
    },
    [fromPoint.x, fromPoint.y, isSelected, toPoint.x, toPoint.y],
  );
  const handlePointerDown = useCallback(
    (event: FederatedPointerEvent) => {
      onPointerDown(edge.id, event);
    },
    [edge.id, onPointerDown],
  );

  return (
    <pixiGraphics
      cursor="pointer"
      draw={drawHitTarget}
      eventMode={eventMode}
      onPointerDown={handlePointerDown}
    />
  );
}

function PlacementSprites({
  assetById,
  frame,
  onPointerDown,
  placements,
  selectedPlacementId,
}: PlacementSpritesProps) {
  return (
    <>
      {placements.map((placement) => {
        const asset = assetById.get(placement.assetId);

        if (!asset) {
          return null;
        }

        return (
          <PiecePlacementSprite
            frame={frame}
            height={placement.height}
            isSelected={selectedPlacementId === placement.id}
            key={placement.id}
            onPointerDown={onPointerDown}
            placementId={placement.id}
            asset={asset}
            width={placement.width}
            x={placement.x}
            y={placement.y}
          />
        );
      })}
    </>
  );
}

interface PiecePlacementSpriteProps {
  asset: UploadedImageAsset;
  frame: BoardFrame;
  height: number;
  isSelected: boolean;
  onPointerDown: (placementId: string, event: FederatedPointerEvent) => void;
  placementId: string;
  width: number;
  x: number;
  y: number;
}

function PiecePlacementSprite({
  asset,
  frame,
  height,
  isSelected,
  onPointerDown,
  placementId,
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
        name={asset.name}
        url={asset.url}
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

function findNearestLocation(point: PointData, locations: BoardLocation[]) {
  const threshold = 0.08;
  let nearest: BoardLocation | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const location of locations) {
    const distance = Math.hypot(location.x - point.x, location.y - point.y);

    if (distance < nearestDistance) {
      nearest = location;
      nearestDistance = distance;
    }
  }

  return nearestDistance <= threshold ? nearest : null;
}

function getWheelScale(deltaY: number) {
  return Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
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
