import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  CreditCard,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Dices,
  Download,
  FileInput,
  FolderOpen,
  ImageIcon,
  Link2,
  MapPinPlus,
  Maximize,
  Minimize,
  MousePointer2,
  Network,
  Minus,
  PanelBottomClose,
  PanelBottomOpen,
  Plus,
  Play,
  Pencil,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import {
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, DragEvent } from "react";
import { getSelectedLocation, useBoardStore } from "../state/boardStore";
import {
  canPlaceAssetForCategory,
  RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_DEFINITIONS,
} from "../engine/entity";
import { CARD_ZONE_KINDS, searchCards } from "../engine/cardDeck";
import type { CardDeckState, CardRef, CardZoneKind } from "../engine/cardDeck";
import type {
  DicePool,
  DiceRoll,
  DiceState,
  DieFaceRef,
} from "../engine/dice";
import type { BoardEdge, BoardLocation } from "../engine/board";
import type {
  AssetPlacement,
  BoardTool,
  FrozenSetupSnapshot,
  PawnSheet,
  ScenarioMode,
  UploadedImageAsset,
} from "../state/boardStore";
import type { Entity, JsonRecord, ResourceCategory } from "../engine/entity";
import { serializeScenarioPackage } from "../engine/serialization";
import {
  applyScenarioPackageToBoardStore,
  exportBoardStoreScenario,
} from "../state/scenarioStore";
import {
  createImportBatchId,
  createImportedImageAsset,
  inferResourceCategoryFromPath,
} from "./assetImport";
import { processAssetMedia } from "./assetMedia";
import type { AssetMediaTask } from "./assetMedia";

const LOCAL_SCENARIO_STORAGE_KEY = "lorecanvas:last-scenario";
const EMPTY_JSON_STATE: JsonRecord = {};
const ASSET_CATEGORY_VISIBLE_INCREMENT = 32;
const MEDIA_PROGRESS_UPDATE_INTERVAL = 8;

const TOOL_OPTIONS: Array<{
  id: BoardTool;
  label: string;
  Icon: typeof MousePointer2;
}> = [
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "location", label: "Add Location", Icon: MapPinPlus },
  { id: "edge", label: "Add Edge", Icon: Network },
];

type WorkbenchTab =
  | "locations"
  | "edges"
  | "objects"
  | "cards"
  | "dice"
  | "board";
export type LocationSortField = "name" | "region";
export type SortDirection = "asc" | "desc";

export interface LocationSortState {
  direction: SortDirection;
  field: LocationSortField;
}

const WORKBENCH_TABS: Array<{
  id: WorkbenchTab;
  label: string;
  Icon: typeof MousePointer2;
}> = [
  { id: "locations", label: "Locations", Icon: MapPinPlus },
  { id: "edges", label: "Edges", Icon: Network },
  { id: "objects", label: "Objects", Icon: CreditCard },
  { id: "cards", label: "Cards", Icon: CreditCard },
  { id: "dice", label: "Dice", Icon: Dices },
  { id: "board", label: "Board State", Icon: Database },
];

const BoardCanvas = lazy(() =>
  import("./BoardCanvas").then((module) => ({ default: module.BoardCanvas })),
);

interface ImageImportOptions {
  category?: ResourceCategory;
  inferCategoryFromPath?: boolean;
}

interface MediaProgress {
  done: number;
  total: number;
}

export function App() {
  const mode = useBoardStore((state) => state.mode);
  const board = useBoardStore((state) => state.board);
  const entityState = useBoardStore((state) => state.entityState);
  const assets = useBoardStore((state) => state.assets);
  const assetPlacements = useBoardStore((state) => state.assetPlacements);
  const pawnSheets = useBoardStore((state) => state.pawnSheets);
  const frozenSetup = useBoardStore((state) => state.frozenSetup);
  const selectedLocationId = useBoardStore((state) => state.selectedLocationId);
  const selectedAssetId = useBoardStore((state) => state.selectedAssetId);
  const selectedPlacementId = useBoardStore((state) => state.selectedPlacementId);
  const selectedEdgeId = useBoardStore((state) => state.selectedEdgeId);
  const activeTool = useBoardStore((state) => state.activeTool);
  const boardZoom = useBoardStore((state) => state.boardZoom);
  const isCreationPanelCollapsed = useBoardStore(
    (state) => state.isCreationPanelCollapsed,
  );
  const isInspectorCollapsed = useBoardStore(
    (state) => state.isInspectorCollapsed,
  );
  const isWorkbenchCollapsed = useBoardStore(
    (state) => state.isWorkbenchCollapsed,
  );
  const edgeDraftFromId = useBoardStore((state) => state.edgeDraftFromId);
  const lastError = useBoardStore((state) => state.lastError);
  const addAssets = useBoardStore((state) => state.addAssets);
  const removeAsset = useBoardStore((state) => state.removeAsset);
  const updateAssetCategory = useBoardStore((state) => state.updateAssetCategory);
  const updateAssetPlacementConfig = useBoardStore(
    (state) => state.updateAssetPlacementConfig,
  );
  const setBackgroundAsset = useBoardStore((state) => state.setBackgroundAsset);
  const selectAsset = useBoardStore((state) => state.selectAsset);
  const setActiveTool = useBoardStore((state) => state.setActiveTool);
  const setBoardZoom = useBoardStore((state) => state.setBoardZoom);
  const resetBoardView = useBoardStore((state) => state.resetBoardView);
  const setCreationPanelCollapsed = useBoardStore(
    (state) => state.setCreationPanelCollapsed,
  );
  const setInspectorCollapsed = useBoardStore(
    (state) => state.setInspectorCollapsed,
  );
  const setWorkbenchCollapsed = useBoardStore(
    (state) => state.setWorkbenchCollapsed,
  );
  const updateAssetPlacement = useBoardStore(
    (state) => state.updateAssetPlacement,
  );
  const adjustTokenPlacementCount = useBoardStore(
    (state) => state.adjustTokenPlacementCount,
  );
  const deleteLocation = useBoardStore((state) => state.deleteLocation);
  const deleteEdgeById = useBoardStore((state) => state.deleteEdgeById);
  const deleteSelectedPlacement = useBoardStore(
    (state) => state.deleteSelectedPlacement,
  );
  const setPawnCharacterCard = useBoardStore(
    (state) => state.setPawnCharacterCard,
  );
  const addPawnHeldCard = useBoardStore((state) => state.addPawnHeldCard);
  const removePawnHeldCard = useBoardStore((state) => state.removePawnHeldCard);
  const adjustPawnCounter = useBoardStore((state) => state.adjustPawnCounter);
  const enterRunMode = useBoardStore((state) => state.enterRunMode);
  const returnToEditMode = useBoardStore((state) => state.returnToEditMode);
  const moveEntityToLocation = useBoardStore((state) => state.moveEntityToLocation);
  const adjustEntityCounter = useBoardStore((state) => state.adjustEntityCounter);
  const moveCardToZone = useBoardStore((state) => state.moveCardToZone);
  const setLastError = useBoardStore((state) => state.setLastError);
  const selectedLocation = getSelectedLocation(board, selectedLocationId);
  const selectedEdge =
    board.edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const selectedPlacement =
    assetPlacements.find((placement) => placement.id === selectedPlacementId) ??
    null;
  const selectedPlacementAsset = selectedPlacement
    ? assets.find((asset) => asset.id === selectedPlacement.assetId) ?? null
    : null;
  const selectedEntity = selectedPlacement
    ? entityState.entities.find(
        (entity) => entity.id === selectedPlacement.entityId,
      ) ?? null
    : null;
  const isBoundPawnSelected = Boolean(
    selectedPlacement?.category === "PAWN" &&
      selectedPlacement.locationId &&
      selectedPlacementAsset,
  );
  const selectedPawnSheet = selectedPlacement
    ? pawnSheets[selectedPlacement.id] ?? createEmptyPawnSheet()
    : null;
  const connectedEdges = useMemo(
    () =>
      selectedLocation
        ? board.edges.filter(
            (edge) =>
              edge.fromId === selectedLocation.id ||
              edge.toId === selectedLocation.id,
          )
        : [],
    [board.edges, selectedLocation],
  );
  const [mediaProgress, setMediaProgress] = useState<MediaProgress | null>(null);
  const mediaCountsRef = useRef<MediaProgress>({ done: 0, total: 0 });
  const isUnmountedRef = useRef(false);
  const mapWorkspaceRef = useRef<HTMLElement>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMapFullscreen(
        document.fullscreenElement === mapWorkspaceRef.current &&
          document.fullscreenElement !== null,
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleMapFullscreen = useCallback(() => {
    const workspace = mapWorkspaceRef.current;

    if (!workspace) {
      return;
    }

    if (document.fullscreenElement === workspace) {
      void document.exitFullscreen();
      return;
    }

    void workspace.requestFullscreen();
  }, []);

  useEffect(() => {
    // Reset on every mount so the StrictMode dev double-mount cleanup does not
    // leave the pipeline permanently cancelled.
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  const runMediaPipeline = useCallback((tasks: AssetMediaTask[]) => {
    if (tasks.length === 0) {
      return;
    }

    mediaCountsRef.current.total += tasks.length;
    setMediaProgress({ ...mediaCountsRef.current });

    void processAssetMedia(
      tasks,
      (patches) => {
        useBoardStore.getState().applyAssetMediaPatches(patches);
      },
      {
        isCancelled: () => isUnmountedRef.current,
        onProgress: () => {
          const counts = mediaCountsRef.current;

          counts.done += 1;

          if (counts.done >= counts.total) {
            mediaCountsRef.current = { done: 0, total: 0 };

            if (!isUnmountedRef.current) {
              setMediaProgress(null);
            }
            return;
          }

          if (
            counts.done % MEDIA_PROGRESS_UPDATE_INTERVAL === 0 &&
            !isUnmountedRef.current
          ) {
            setMediaProgress({ ...counts });
          }
        },
      },
    );
  }, []);
  const handleImageImport = useCallback(
    (event: ChangeEvent<HTMLInputElement>, options: ImageImportOptions = {}) => {
      const input = event.currentTarget;
      const files = Array.from(input.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );

      input.value = "";

      if (files.length === 0) {
        return;
      }

      const batchId = createImportBatchId();
      const importedAssets: UploadedImageAsset[] = [];
      const mediaTasks: AssetMediaTask[] = [];

      files.forEach((file, index) => {
        // Import never decodes image data: every file only gets an object URL
        // here, while dimensions and thumbnails are produced later by the
        // bounded background media pipeline.
        const url = URL.createObjectURL(file);
        const relativePath = getFileRelativePath(file);
        const category =
          options.category ??
          (options.inferCategoryFromPath
            ? inferResourceCategoryFromPath(relativePath || file.name)
            : "OTHER");
        const asset = createImportedImageAsset({
          batchId,
          category,
          file,
          index,
          sourcePath: relativePath,
          url,
        });

        importedAssets.push(asset);
        mediaTasks.push({ assetId: asset.id, file, url });
      });

      const shouldSetBackground = !useBoardStore.getState().board.background;
      const backgroundAssetId = importedAssets.find(
        (asset) => asset.category === "BOARD",
      )?.id;

      addAssets(importedAssets);

      if (shouldSetBackground && backgroundAssetId) {
        setBackgroundAsset(backgroundAssetId);
      }

      runMediaPipeline(mediaTasks);
    },
    [addAssets, runMediaPipeline, setBackgroundAsset],
  );
  const handleSaveScenario = useCallback(() => {
    try {
      const scenario = exportBoardStoreScenario(useBoardStore.getState(), {
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(
        LOCAL_SCENARIO_STORAGE_KEY,
        serializeScenarioPackage(scenario),
      );
    } catch (error) {
      setLastError(getErrorMessage(error));
    }
  }, [setLastError]);
  const handleLoadScenario = useCallback(() => {
    const source = localStorage.getItem(LOCAL_SCENARIO_STORAGE_KEY);

    if (!source) {
      setLastError("No saved scenario found in this browser.");
      return;
    }

    try {
      applyScenarioPackageToBoardStore(source);
    } catch (error) {
      setLastError(getErrorMessage(error));
    }
  }, [setLastError]);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});
  const [visibleAssetCounts, setVisibleAssetCounts] = useState<
    Partial<Record<ResourceCategory, number>>
  >({});
  const [tokenSearch, setTokenSearch] = useState("");
  const [activeWorkbenchTab, setActiveWorkbenchTab] =
    useState<WorkbenchTab>("locations");
  const tokenAssets = useMemo(
    () => assets.filter((asset) => asset.category === "TOKEN"),
    [assets],
  );
  const filteredTokenAssets = useMemo(() => {
    const query = tokenSearch.trim().toLowerCase();

    if (!query) {
      return tokenAssets;
    }

    return tokenAssets.filter((asset) =>
      `${asset.name} ${asset.id}`.toLowerCase().includes(query),
    );
  }, [tokenAssets, tokenSearch]);
  const toggleSection = useCallback((id: string) => {
    setCollapsedSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }, []);

  return (
    <main className="maker-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-lockup__mark">LC</span>
          <div>
            <p>LoreCanvas</p>
            <strong>Graph Board Maker</strong>
          </div>
        </div>
        <dl className="board-metrics" aria-label="Board metrics">
          <div>
            <dt>Mode</dt>
            <dd>{mode === "edit" ? "Edit" : "Run"}</dd>
          </div>
          <div>
            <dt>Images</dt>
            <dd>{assets.length}</dd>
          </div>
          <div>
            <dt>Locations</dt>
            <dd>{board.locations.length}</dd>
          </div>
          <div>
            <dt>Edges</dt>
            <dd>{board.edges.length}</dd>
          </div>
          <div>
            <dt>Entities</dt>
            <dd>{entityState.entities.length}</dd>
          </div>
        </dl>
        <div className="scenario-actions">
          <div className="mode-switch" role="group" aria-label="Scenario mode">
            <button
              aria-pressed={mode === "edit"}
              className="mode-button"
              data-active={mode === "edit"}
              onClick={returnToEditMode}
              type="button"
            >
              <Pencil aria-hidden="true" size={16} />
              <span>Edit</span>
            </button>
            <button
              aria-pressed={mode === "run"}
              className="mode-button"
              data-active={mode === "run"}
              onClick={enterRunMode}
              type="button"
            >
              <Play aria-hidden="true" size={16} />
              <span>Run</span>
            </button>
          </div>
          <button
            className="icon-button"
            onClick={handleSaveScenario}
            type="button"
          >
            <Download aria-hidden="true" size={17} />
            <span>Save</span>
          </button>
          <button
            className="icon-button"
            onClick={handleLoadScenario}
            type="button"
          >
            <FileInput aria-hidden="true" size={17} />
            <span>Load</span>
          </button>
        </div>
      </header>

      <section
        className="maker-layout"
        data-creation-collapsed={isCreationPanelCollapsed}
        data-inspector-collapsed={isInspectorCollapsed}
      >
        <aside className="tool-panel tool-panel--creation" aria-label="Creation toolbar">
          <button
            aria-expanded={!isCreationPanelCollapsed}
            className="panel-collapse-button panel-collapse-button--creation"
            onClick={() =>
              setCreationPanelCollapsed(!isCreationPanelCollapsed)
            }
            type="button"
          >
            <ChevronsLeft aria-hidden="true" size={17} />
            <span>Creation</span>
          </button>

          <div className="creation-content">
            <CollapsibleSection
              id="assets"
              isCollapsed={collapsedSections.assets}
              onToggle={toggleSection}
              title="Image Assets"
              trailing={<span>{formatBytes(totalBytes(assets))}</span>}
            >
              <AssetImportPanel
                isDisabled={mode === "run"}
                onImport={handleImageImport}
                progress={mediaProgress}
              />
              <TokenQuickPick
                assetPlacements={assetPlacements}
                assets={tokenAssets}
                filteredAssets={filteredTokenAssets}
                isDisabled={mode === "run"}
                onSearchChange={setTokenSearch}
                onSelectAsset={selectAsset}
                pawnSheets={pawnSheets}
                search={tokenSearch}
                selectedAssetId={selectedAssetId}
              />
              <div className="asset-list">
                {assets.length === 0 ? (
                  <p className="empty-state">No images imported</p>
                ) : (
                  RESOURCE_CATEGORIES.map((category) => {
                    const categoryAssets = assets.filter(
                      (asset) => asset.category === category,
                    );
                    const visibleCount =
                      visibleAssetCounts[category] ??
                      ASSET_CATEGORY_VISIBLE_INCREMENT;
                    const visibleAssets = categoryAssets.slice(0, visibleCount);
                    const hiddenCount =
                      categoryAssets.length - visibleAssets.length;

                    if (categoryAssets.length === 0) {
                      return null;
                    }

                    return (
                      <section className="asset-category-group" key={category}>
                        <div className="asset-category-group__heading">
                          <strong>
                            {RESOURCE_CATEGORY_DEFINITIONS[category].label}
                          </strong>
                          <span>{categoryAssets.length}</span>
                        </div>
                        {visibleAssets.map((asset) => (
                          <AssetItem
                            asset={asset}
                            copyCount={
                              assetPlacements.filter(
                                (placement) => placement.assetId === asset.id,
                              ).length
                            }
                            isBoardBackground={
                              board.background?.assetId === asset.id
                            }
                            key={asset.id}
                            onDelete={removeAsset}
                            onSetBoard={setBackgroundAsset}
                            onUpdateCategory={updateAssetCategory}
                            onUpdatePlacementConfig={
                              updateAssetPlacementConfig
                            }
                          />
                        ))}
                        {hiddenCount > 0 ? (
                          <button
                            className="mini-button asset-show-more"
                            onClick={() =>
                              setVisibleAssetCounts((current) => ({
                                ...current,
                                [category]:
                                  visibleCount +
                                  ASSET_CATEGORY_VISIBLE_INCREMENT,
                              }))
                            }
                            type="button"
                          >
                            Show {Math.min(hiddenCount, ASSET_CATEGORY_VISIBLE_INCREMENT)} more
                            <span>{hiddenCount} hidden</span>
                          </button>
                        ) : null}
                      </section>
                    );
                  })
                )}
              </div>
            </CollapsibleSection>

            {lastError ? <p className="error-banner">{lastError}</p> : null}
          </div>
        </aside>

        <section
          className="stage-region"
          aria-label="Map canvas"
          data-workbench-collapsed={isWorkbenchCollapsed}
        >
          <section
            aria-label="Graph board canvas"
            className="map-workspace"
            data-fullscreen={isMapFullscreen}
            ref={mapWorkspaceRef}
          >
            <div className="stage-toolbar" aria-label="Map controls">
              <div className="stage-toolbar__tools" role="toolbar">
                {TOOL_OPTIONS.map(({ id, label, Icon }) => (
                  <button
                    aria-pressed={activeTool === id}
                    className="toolbar-tool"
                    data-active={activeTool === id}
                    key={id}
                    onClick={() => setActiveTool(id)}
                    title={label}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              {edgeDraftFromId ? (
                <span className="draft-pill draft-pill--toolbar">
                  <Link2 aria-hidden="true" size={14} />
                  {edgeDraftFromId}
                </span>
              ) : null}
              <QuickSelectionActions
                deleteEdgeById={deleteEdgeById}
                deleteLocation={deleteLocation}
                isDisabled={mode === "run"}
                selectedEdge={selectedEdge}
                selectedLocation={selectedLocation}
              />
              <div className="stage-toolbar__zoom">
                <button
                  aria-label="Zoom out"
                  className="icon-only icon-only--neutral"
                  onClick={() => setBoardZoom(boardZoom - 0.1)}
                  title="Zoom out"
                  type="button"
                >
                  <Minus aria-hidden="true" size={16} />
                </button>
                <label className="zoom-control">
                  <span>Zoom</span>
                  <input
                    aria-label="Board zoom"
                    max={400}
                    min={50}
                    onChange={(event) =>
                      setBoardZoom(Number(event.currentTarget.value) / 100)
                    }
                    step={10}
                    type="range"
                    value={Math.round(boardZoom * 100)}
                  />
                </label>
                <output className="zoom-value">
                  {Math.round(boardZoom * 100)}%
                </output>
                <button
                  aria-label="Zoom in"
                  className="icon-only icon-only--neutral"
                  onClick={() => setBoardZoom(boardZoom + 0.1)}
                  title="Zoom in"
                  type="button"
                >
                  <Plus aria-hidden="true" size={16} />
                </button>
                <button
                  aria-label="Reset zoom"
                  className="icon-only icon-only--neutral"
                  onClick={resetBoardView}
                  title="Reset zoom"
                  type="button"
                >
                  <RotateCcw aria-hidden="true" size={16} />
                </button>
                <span className="stage-toolbar__divider" aria-hidden="true" />
                <button
                  aria-label={
                    isWorkbenchCollapsed
                      ? "Show data workbench"
                      : "Hide data workbench"
                  }
                  aria-pressed={!isWorkbenchCollapsed}
                  className="icon-only icon-only--neutral"
                  onClick={() => setWorkbenchCollapsed(!isWorkbenchCollapsed)}
                  title={
                    isWorkbenchCollapsed
                      ? "Show data workbench"
                      : "Hide data workbench"
                  }
                  type="button"
                >
                  {isWorkbenchCollapsed ? (
                    <PanelBottomOpen aria-hidden="true" size={16} />
                  ) : (
                    <PanelBottomClose aria-hidden="true" size={16} />
                  )}
                </button>
                <button
                  aria-label={
                    isMapFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                  aria-pressed={isMapFullscreen}
                  className="icon-only icon-only--neutral"
                  onClick={toggleMapFullscreen}
                  title={
                    isMapFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                  type="button"
                >
                  {isMapFullscreen ? (
                    <Minimize aria-hidden="true" size={16} />
                  ) : (
                    <Maximize aria-hidden="true" size={16} />
                  )}
                </button>
              </div>
            </div>
            <Suspense
              fallback={<div className="board-canvas-loading">Loading map...</div>}
            >
              <BoardCanvas />
            </Suspense>
          </section>
          {!isWorkbenchCollapsed ? (
            <DataWorkbench
              activeTab={activeWorkbenchTab}
              onTabChange={setActiveWorkbenchTab}
            />
          ) : null}
        </section>

        <aside
          aria-label="Context rail"
          className="tool-panel tool-panel--inspector tool-panel--context"
        >
          <button
            aria-expanded={!isInspectorCollapsed}
            className="panel-collapse-button"
            onClick={() => setInspectorCollapsed(!isInspectorCollapsed)}
            type="button"
          >
            <ChevronsRight aria-hidden="true" size={17} />
            <span>Context</span>
          </button>

          <div className="inspector-content">
            <ModeStatus mode={mode} frozenSetup={frozenSetup} />
            <SelectionContext
              connectedEdges={connectedEdges}
              selectedEdge={selectedEdge}
              selectedEntity={selectedEntity}
              selectedLocation={selectedLocation}
              selectedPlacement={selectedPlacement}
            />
            {mode === "run" && selectedEntity ? (
              <RuntimeObjectControls
                adjustEntityCounter={adjustEntityCounter}
                entity={selectedEntity}
                locations={board.locations}
                moveCardToZone={moveCardToZone}
                moveEntityToLocation={moveEntityToLocation}
              />
            ) : null}
            {isBoundPawnSelected &&
            selectedPlacement &&
            selectedPlacementAsset &&
            selectedPawnSheet ? (
              <PawnSheetInspector
                adjustPawnCounter={adjustPawnCounter}
                addPawnHeldCard={addPawnHeldCard}
                assets={assets}
                assetPlacements={assetPlacements}
                deleteSelectedPlacement={deleteSelectedPlacement}
                pawnSheets={pawnSheets}
                placement={selectedPlacement}
                placementAsset={selectedPlacementAsset}
                removePawnHeldCard={removePawnHeldCard}
                setPawnCharacterCard={setPawnCharacterCard}
                sheet={selectedPawnSheet}
                updateAssetPlacement={updateAssetPlacement}
              />
            ) : selectedPlacement && selectedPlacementAsset ? (
              <SelectedPlacementContext
                deleteSelectedPlacement={deleteSelectedPlacement}
                isDisabled={mode === "run"}
                placement={selectedPlacement}
                placementAsset={selectedPlacementAsset}
                entity={selectedEntity}
                adjustTokenPlacementCount={adjustTokenPlacementCount}
                updateAssetPlacement={updateAssetPlacement}
              />
            ) : selectedLocation ? null : (
              <p className="empty-state">
                Select a map node, table row, or placed object.
              </p>
            )}
          </div>
        </aside>

        {isCreationPanelCollapsed ? (
          <button
            aria-label="Show creation toolbar"
            className="panel-expand-tab panel-expand-tab--left"
            onClick={() => setCreationPanelCollapsed(false)}
            title="Show creation toolbar"
            type="button"
          >
            <ChevronsRight aria-hidden="true" size={18} />
          </button>
        ) : null}
        {isInspectorCollapsed ? (
          <button
            aria-label="Show context rail"
            className="panel-expand-tab panel-expand-tab--right"
            onClick={() => setInspectorCollapsed(false)}
            title="Show context rail"
            type="button"
          >
            <ChevronsLeft aria-hidden="true" size={18} />
          </button>
        ) : null}
      </section>
    </main>
  );
}

interface CollapsibleSectionProps {
  children: ReactNode;
  id: string;
  isCollapsed?: boolean;
  onToggle: (id: string) => void;
  title: string;
  trailing?: ReactNode;
}

function CollapsibleSection({
  children,
  id,
  isCollapsed = false,
  onToggle,
  title,
  trailing,
}: CollapsibleSectionProps) {
  return (
    <section className="tool-section" data-collapsed={isCollapsed}>
      <button
        aria-expanded={!isCollapsed}
        className="section-heading section-heading--button"
        onClick={() => onToggle(id)}
        type="button"
      >
        <h2>{title}</h2>
        <span className="section-heading__trailing">
          {trailing}
          <ChevronDown aria-hidden="true" size={16} />
        </span>
      </button>
      {!isCollapsed ? children : null}
    </section>
  );
}

interface ModeStatusProps {
  mode: ScenarioMode;
  frozenSetup: FrozenSetupSnapshot | null;
}

function ModeStatus({ mode, frozenSetup }: ModeStatusProps) {
  return (
    <section className="mode-status" data-mode={mode}>
      <Database aria-hidden="true" size={17} />
      <div>
        <strong>{mode === "edit" ? "Editing setup" : "Running scenario"}</strong>
        <span>
          {mode === "edit"
            ? "Board Template and Setup Preset are mutable."
            : `Setup frozen: ${frozenSetup?.board.locations.length ?? 0} Locations / ${
                frozenSetup?.entityState.entities.length ?? 0
              } Objects`}
        </span>
      </div>
    </section>
  );
}

interface SelectionContextProps {
  connectedEdges: BoardEdge[];
  selectedEdge: BoardEdge | null;
  selectedEntity: Entity | null;
  selectedLocation: BoardLocation | null;
  selectedPlacement: AssetPlacement | null;
}

interface QuickSelectionActionsProps {
  deleteEdgeById: (edgeId: string) => void;
  deleteLocation: (locationId: string) => void;
  isDisabled: boolean;
  selectedEdge: BoardEdge | null;
  selectedLocation: BoardLocation | null;
}

function QuickSelectionActions({
  deleteEdgeById,
  deleteLocation,
  isDisabled,
  selectedEdge,
  selectedLocation,
}: QuickSelectionActionsProps) {
  const selectedLabel = selectedLocation
    ? `Location ${selectedLocation.id}`
    : selectedEdge
      ? `Edge ${selectedEdge.id}`
      : null;

  if (!selectedLabel) {
    return null;
  }

  return (
    <div className="selection-actions" aria-label="Selection actions">
      <span className="selection-actions__label">{selectedLabel}</span>
      <button
        aria-label={`Delete ${selectedLabel}`}
        className="icon-only icon-only--danger"
        disabled={isDisabled}
        onClick={() => {
          if (selectedLocation) {
            deleteLocation(selectedLocation.id);
            return;
          }

          if (selectedEdge) {
            deleteEdgeById(selectedEdge.id);
          }
        }}
        title={
          isDisabled
            ? "Switch to Edit mode to delete setup graph items"
            : `Delete ${selectedLabel}`
        }
        type="button"
      >
        <Trash2 aria-hidden="true" size={16} />
      </button>
    </div>
  );
}

function SelectionContext({
  connectedEdges,
  selectedEdge,
  selectedEntity,
  selectedLocation,
  selectedPlacement,
}: SelectionContextProps) {
  return (
    <section className="selection-context" aria-label="Current selection">
      <div className="state-panel__heading">
        <h2>Selection</h2>
        <span>
          {selectedLocation
            ? selectedLocation.id
            : selectedEdge?.id ?? selectedPlacement?.id ?? selectedEntity?.id ?? "None"}
        </span>
      </div>
      {selectedLocation ? (
        <div className="selection-context__body">
          <strong>{selectedLocation.name}</strong>
          <span>
            X {formatCoordinate(selectedLocation.x)} / Y{" "}
            {formatCoordinate(selectedLocation.y)}
          </span>
          <span>{connectedEdges.length} connected edges</span>
        </div>
      ) : selectedEdge ? (
        <div className="selection-context__body">
          <strong>{selectedEdge.label || selectedEdge.id}</strong>
          <span>
            {selectedEdge.fromId}
            {" -> "}
            {selectedEdge.toId}
          </span>
        </div>
      ) : selectedEntity ? (
        <div className="selection-context__body">
          <strong>{selectedEntity.id}</strong>
          <span>{selectedPlacement?.category ?? selectedEntity.type}</span>
          <span>{selectedEntity.locationId ?? "Unbound object"}</span>
        </div>
      ) : (
        <p className="empty-state">No row or canvas object selected</p>
      )}
    </section>
  );
}

interface SelectedPlacementContextProps {
  adjustTokenPlacementCount: (placementId: string, delta: number) => void;
  deleteSelectedPlacement: () => void;
  entity: Entity | null;
  isDisabled: boolean;
  placement: AssetPlacement;
  placementAsset: UploadedImageAsset;
  updateAssetPlacement: (
    placementId: string,
    patch: Partial<Pick<AssetPlacement, "width" | "height">>,
  ) => void;
}

function SelectedPlacementContext({
  adjustTokenPlacementCount,
  deleteSelectedPlacement,
  entity,
  isDisabled,
  placement,
  placementAsset,
  updateAssetPlacement,
}: SelectedPlacementContextProps) {
  const isToken = placement.category === "TOKEN";
  const tokenCount = getTokenPlacementCount(entity);

  return (
    <section className="selected-placement-context" aria-label="Placed object">
      <div className="selected-piece-card">
        <img alt="" src={getAssetPreviewUrl(placementAsset)} />
        <div>
          <strong>{placementAsset.name}</strong>
          <span>
            {placement.category} / {placement.entityId}
          </span>
        </div>
      </div>
      {placement.locationId ? (
        <p className="binding-pill">Bound to {placement.locationId}</p>
      ) : null}
      <div className="coordinate-row">
        <span>X {formatCoordinate(placement.x)}</span>
        <span>Y {formatCoordinate(placement.y)}</span>
      </div>
      {isToken ? (
        <div className="counter-adjust token-placement-count">
          <span>Count</span>
          <button
            aria-label="Decrease token count"
            className="icon-only icon-only--neutral"
            disabled={isDisabled}
            onClick={() => adjustTokenPlacementCount(placement.id, -1)}
            title="Decrease token count"
            type="button"
          >
            <Minus aria-hidden="true" size={15} />
          </button>
          <strong>{tokenCount}</strong>
          <button
            aria-label="Increase token count"
            className="icon-only icon-only--neutral"
            disabled={isDisabled}
            onClick={() => adjustTokenPlacementCount(placement.id, 1)}
            title="Increase token count"
            type="button"
          >
            <Plus aria-hidden="true" size={15} />
          </button>
        </div>
      ) : null}
      <div className="piece-controls piece-controls--wide">
        <label>
          <span>W</span>
          <input
            disabled={isDisabled}
            min={12}
            max={640}
            onChange={(event) =>
              updateAssetPlacement(placement.id, {
                width: toNumber(event.currentTarget.value, placement.width),
              })
            }
            type="number"
            value={placement.width}
          />
        </label>
        <label>
          <span>H</span>
          <input
            disabled={isDisabled}
            min={12}
            max={640}
            onChange={(event) =>
              updateAssetPlacement(placement.id, {
                height: toNumber(event.currentTarget.value, placement.height),
              })
            }
            type="number"
            value={placement.height}
          />
        </label>
      </div>
      <button
        className="danger-button"
        disabled={isDisabled}
        onClick={deleteSelectedPlacement}
        type="button"
      >
        <Trash2 aria-hidden="true" size={15} />
        <span>Delete placed object</span>
      </button>
    </section>
  );
}

interface DataWorkbenchProps {
  activeTab: WorkbenchTab;
  onTabChange: (tab: WorkbenchTab) => void;
}

function DataWorkbench({ activeTab, onTabChange }: DataWorkbenchProps) {
  const mode = useBoardStore((state) => state.mode);
  const board = useBoardStore((state) => state.board);
  const boardState = useBoardStore((state) => state.boardState);
  const locationStates = useBoardStore((state) => state.locationStates);
  const edgeStates = useBoardStore((state) => state.edgeStates);
  const entityState = useBoardStore((state) => state.entityState);
  const cardDeckState = useBoardStore((state) => state.cardDeckState);
  const diceState = useBoardStore((state) => state.diceState);
  const assets = useBoardStore((state) => state.assets);
  const assetPlacements = useBoardStore((state) => state.assetPlacements);
  const selectedLocationId = useBoardStore((state) => state.selectedLocationId);
  const selectedPlacementId = useBoardStore((state) => state.selectedPlacementId);
  const selectedEdgeId = useBoardStore((state) => state.selectedEdgeId);
  const selectLocation = useBoardStore((state) => state.selectLocation);
  const selectPlacement = useBoardStore((state) => state.selectPlacement);
  const selectEdge = useBoardStore((state) => state.selectEdge);
  const updateLocationDetails = useBoardStore(
    (state) => state.updateLocationDetails,
  );
  const deleteLocation = useBoardStore((state) => state.deleteLocation);
  const updateLocationState = useBoardStore((state) => state.updateLocationState);
  const updateEdgeDetails = useBoardStore((state) => state.updateEdgeDetails);
  const deleteEdgeById = useBoardStore((state) => state.deleteEdgeById);
  const updateEdgeState = useBoardStore((state) => state.updateEdgeState);
  const updateBoardState = useBoardStore((state) => state.updateBoardState);
  const updateEntityObjectState = useBoardStore(
    (state) => state.updateEntityObjectState,
  );
  const moveEntityToLocation = useBoardStore((state) => state.moveEntityToLocation);
  const createCardZone = useBoardStore((state) => state.createCardZone);
  const updateCardZone = useBoardStore((state) => state.updateCardZone);
  const deleteCardZone = useBoardStore((state) => state.deleteCardZone);
  const addCardAssetToZone = useBoardStore(
    (state) => state.addCardAssetToZone,
  );
  const removeCardsFromCardZone = useBoardStore(
    (state) => state.removeCardsFromCardZone,
  );
  const moveCardsBetweenCardZones = useBoardStore(
    (state) => state.moveCardsBetweenCardZones,
  );
  const drawCardsToZone = useBoardStore((state) => state.drawCardsToZone);
  const dealCardsToZones = useBoardStore((state) => state.dealCardsToZones);
  const shuffleCardZone = useBoardStore((state) => state.shuffleCardZone);
  const flipCardsInZone = useBoardStore((state) => state.flipCardsInZone);
  const reorderCardInZone = useBoardStore((state) => state.reorderCardInZone);
  const createDieDefinitionFromAsset = useBoardStore(
    (state) => state.createDieDefinitionFromAsset,
  );
  const createDieDefinitionFromAssets = useBoardStore(
    (state) => state.createDieDefinitionFromAssets,
  );
  const updateDieDefinition = useBoardStore((state) => state.updateDieDefinition);
  const deleteDieDefinition = useBoardStore((state) => state.deleteDieDefinition);
  const createDicePool = useBoardStore((state) => state.createDicePool);
  const updateDicePool = useBoardStore((state) => state.updateDicePool);
  const deleteDicePool = useBoardStore((state) => state.deleteDicePool);
  const addDieToDicePool = useBoardStore((state) => state.addDieToDicePool);
  const updateDicePoolDieCount = useBoardStore(
    (state) => state.updateDicePoolDieCount,
  );
  const removeDieFromDicePool = useBoardStore(
    (state) => state.removeDieFromDicePool,
  );
  const rollDicePool = useBoardStore((state) => state.rollDicePool);
  const overrideDiceRollResult = useBoardStore(
    (state) => state.overrideDiceRollResult,
  );
  const clearDiceRollHistory = useBoardStore(
    (state) => state.clearDiceRollHistory,
  );

  return (
    <section className="data-workbench" aria-label="Scenario data workbench">
      <div className="data-workbench__header">
        <div>
          <h2>Data Workbench</h2>
          <span>
            Batch-edit graph structure and semantic state without reselecting map
            nodes.
          </span>
        </div>
        <div className="workbench-tabs" role="tablist">
          {WORKBENCH_TABS.map(({ id, label, Icon }) => (
            <button
              aria-selected={activeTab === id}
              className="workbench-tab"
              data-active={activeTab === id}
              key={id}
              onClick={() => onTabChange(id)}
              role="tab"
              type="button"
            >
              <Icon aria-hidden="true" size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="data-workbench__body">
        {activeTab === "locations" ? (
          <LocationsTable
            isSetupLocked={mode === "run"}
            locationStates={locationStates}
            locations={board.locations}
            onDeleteLocation={deleteLocation}
            onSelectLocation={selectLocation}
            onUpdateLocation={updateLocationDetails}
            onUpdateLocationState={updateLocationState}
            selectedLocationId={selectedLocationId}
          />
        ) : null}
        {activeTab === "edges" ? (
          <EdgesTable
            edgeStates={edgeStates}
            edges={board.edges}
            isSetupLocked={mode === "run"}
            locations={board.locations}
            onDeleteEdge={deleteEdgeById}
            onSelectEdge={selectEdge}
            onUpdateEdge={updateEdgeDetails}
            onUpdateEdgeState={updateEdgeState}
            selectedEdgeId={selectedEdgeId}
            selectedLocationId={selectedLocationId}
          />
        ) : null}
        {activeTab === "objects" ? (
          <ObjectsTable
            assetPlacements={assetPlacements}
            assets={assets}
            entities={entityState.entities}
            locations={board.locations}
            onMoveEntityToLocation={moveEntityToLocation}
            onSelectPlacement={selectPlacement}
            onUpdateEntityState={updateEntityObjectState}
            selectedPlacementId={selectedPlacementId}
          />
        ) : null}
        {activeTab === "cards" ? (
          <CardZonesWorkbench
            assets={assets}
            cardDeckState={cardDeckState}
            isSetupLocked={mode === "run"}
            onAddCardAssetToZone={addCardAssetToZone}
            onCreateCardZone={createCardZone}
            onDealCardsToZones={dealCardsToZones}
            onDeleteCardZone={deleteCardZone}
            onDrawCardsToZone={drawCardsToZone}
            onFlipCardsInZone={flipCardsInZone}
            onMoveCardsBetweenZones={moveCardsBetweenCardZones}
            onRemoveCardsFromZone={removeCardsFromCardZone}
            onReorderCardInZone={reorderCardInZone}
            onShuffleCardZone={shuffleCardZone}
            onUpdateCardZone={updateCardZone}
          />
        ) : null}
        {activeTab === "dice" ? (
          <DicePoolsWorkbench
            assets={assets}
            diceState={diceState}
            isSetupLocked={mode === "run"}
            onAddDieToPool={addDieToDicePool}
            onClearRollHistory={clearDiceRollHistory}
            onCreateDieFromAsset={createDieDefinitionFromAsset}
            onCreateDieFromAssets={createDieDefinitionFromAssets}
            onCreatePool={createDicePool}
            onDeleteDie={deleteDieDefinition}
            onDeletePool={deleteDicePool}
            onOverrideRollResult={overrideDiceRollResult}
            onRemoveDieFromPool={removeDieFromDicePool}
            onRollPool={rollDicePool}
            onUpdateDie={updateDieDefinition}
            onUpdatePool={updateDicePool}
            onUpdatePoolDieCount={updateDicePoolDieCount}
          />
        ) : null}
        {activeTab === "board" ? (
          <BoardStateWorkbench
            boardState={boardState}
            mode={mode}
            onUpdateBoardState={updateBoardState}
          />
        ) : null}
      </div>
    </section>
  );
}

interface LocationsTableProps {
  isSetupLocked: boolean;
  locations: BoardLocation[];
  locationStates: Record<string, JsonRecord>;
  onDeleteLocation: (locationId: string) => void;
  onSelectLocation: (locationId: string | null) => void;
  onUpdateLocation: (
    locationId: string,
    patch: Partial<Omit<BoardLocation, "id">>,
  ) => void;
  onUpdateLocationState: (locationId: string, patch: JsonRecord) => void;
  selectedLocationId: string | null;
}

function LocationsTable({
  isSetupLocked,
  locations,
  locationStates,
  onDeleteLocation,
  onSelectLocation,
  onUpdateLocation,
  onUpdateLocationState,
  selectedLocationId,
}: LocationsTableProps) {
  const [sort, setSort] = useState<LocationSortState | null>(null);
  const sortedLocations = useMemo(
    () => sortLocationsForWorkbench(locations, locationStates, sort),
    [locations, locationStates, sort],
  );
  const handleSortClick = useCallback((field: LocationSortField) => {
    setSort((currentSort) => {
      if (currentSort?.field !== field) {
        return { field, direction: "asc" };
      }

      return {
        field,
        direction: currentSort.direction === "asc" ? "desc" : "asc",
      };
    });
  }, []);

  if (locations.length === 0) {
    return (
      <p className="empty-state">
        Add Locations on the map, then edit their names, coordinates, semantic
        fields, and JSON state here.
      </p>
    );
  }

  return (
    <div className="workbench-table-scroll">
      <table className="workbench-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">
              <LocationSortButton
                field="name"
                label="Name"
                onSort={handleSortClick}
                sort={sort}
              />
            </th>
            <th scope="col">X%</th>
            <th scope="col">Y%</th>
            <th scope="col">
              <LocationSortButton
                field="region"
                label="Region"
                onSort={handleSortClick}
                sort={sort}
              />
            </th>
            <th scope="col">Tags</th>
            <th scope="col">Notes</th>
            <th scope="col">State JSON</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedLocations.map((location) => {
            const state = locationStates[location.id] ?? EMPTY_JSON_STATE;

            return (
              <tr
                data-selected={selectedLocationId === location.id}
                key={location.id}
                onClick={() => onSelectLocation(location.id)}
              >
                <th scope="row">{location.id}</th>
                <td>
                  <input
                    aria-label={`${location.id} name`}
                    disabled={isSetupLocked}
                    onChange={(event) =>
                      onUpdateLocation(location.id, {
                        name: event.currentTarget.value,
                      })
                    }
                    value={location.name}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${location.id} x percent`}
                    disabled={isSetupLocked}
                    max={100}
                    min={0}
                    onChange={(event) =>
                      onUpdateLocation(location.id, {
                        x: toNormalizedPercent(
                          event.currentTarget.value,
                          location.x,
                        ),
                      })
                    }
                    step={0.1}
                    type="number"
                    value={toPercentNumber(location.x)}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${location.id} y percent`}
                    disabled={isSetupLocked}
                    max={100}
                    min={0}
                    onChange={(event) =>
                      onUpdateLocation(location.id, {
                        y: toNormalizedPercent(
                          event.currentTarget.value,
                          location.y,
                        ),
                      })
                    }
                    step={0.1}
                    type="number"
                    value={toPercentNumber(location.y)}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${location.id} region`}
                    onChange={(event) =>
                      onUpdateLocationState(location.id, {
                        region: event.currentTarget.value,
                      })
                    }
                    value={getStateString(state, "region")}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${location.id} tags`}
                    onChange={(event) =>
                      onUpdateLocationState(location.id, {
                        tags: event.currentTarget.value,
                      })
                    }
                    value={getStateString(state, "tags")}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${location.id} notes`}
                    disabled={isSetupLocked}
                    onChange={(event) =>
                      onUpdateLocation(location.id, {
                        notes: event.currentTarget.value,
                      })
                    }
                    value={location.notes ?? ""}
                  />
                </td>
                <td>
                  <JsonTableStateCell
                    value={state}
                    onApply={(patch) => onUpdateLocationState(location.id, patch)}
                  />
                </td>
                <td>
                  <button
                    aria-label={`Delete ${location.id}`}
                    className="icon-only"
                    disabled={isSetupLocked}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteLocation(location.id);
                    }}
                    title="Delete location"
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface LocationSortButtonProps {
  field: LocationSortField;
  label: string;
  onSort: (field: LocationSortField) => void;
  sort: LocationSortState | null;
}

function LocationSortButton({
  field,
  label,
  onSort,
  sort,
}: LocationSortButtonProps) {
  const isActive = sort?.field === field;
  const nextDirection =
    isActive && sort.direction === "asc" ? "desc" : "asc";
  const Icon = isActive
    ? sort.direction === "asc"
      ? ArrowUpAZ
      : ArrowDownAZ
    : ArrowUpDown;

  return (
    <button
      aria-label={`Sort locations by ${label} ${
        nextDirection === "asc" ? "A to Z" : "Z to A"
      }`}
      className="table-sort-button"
      data-active={isActive}
      onClick={() => onSort(field)}
      type="button"
    >
      <span>{label}</span>
      <Icon aria-hidden="true" size={13} />
      {isActive ? (
        <span className="table-sort-button__direction">
          {sort.direction === "asc" ? "A-Z" : "Z-A"}
        </span>
      ) : null}
    </button>
  );
}

export function sortLocationsForWorkbench(
  locations: readonly BoardLocation[],
  locationStates: Record<string, JsonRecord>,
  sort: LocationSortState | null,
): BoardLocation[] {
  if (!sort) {
    return [...locations];
  }

  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });
  const directionMultiplier = sort.direction === "asc" ? 1 : -1;

  return [...locations].sort((first, second) => {
    const firstValue = getLocationSortValue(first, locationStates, sort.field);
    const secondValue = getLocationSortValue(second, locationStates, sort.field);
    const primary = collator.compare(firstValue, secondValue);

    if (primary !== 0) {
      return primary * directionMultiplier;
    }

    return collator.compare(first.id, second.id);
  });
}

function getLocationSortValue(
  location: BoardLocation,
  locationStates: Record<string, JsonRecord>,
  field: LocationSortField,
) {
  if (field === "name") {
    return location.name.trim();
  }

  return getStateString(locationStates[location.id] ?? EMPTY_JSON_STATE, "region")
    .trim();
}

interface EdgesTableProps {
  edgeStates: Record<string, JsonRecord>;
  edges: BoardEdge[];
  isSetupLocked: boolean;
  locations: BoardLocation[];
  onDeleteEdge: (edgeId: string) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<Omit<BoardEdge, "id">>) => void;
  onUpdateEdgeState: (edgeId: string, patch: JsonRecord) => void;
  selectedEdgeId: string | null;
  selectedLocationId: string | null;
}

function EdgesTable({
  edgeStates,
  edges,
  isSetupLocked,
  locations,
  onDeleteEdge,
  onSelectEdge,
  onUpdateEdge,
  onUpdateEdgeState,
  selectedEdgeId,
  selectedLocationId,
}: EdgesTableProps) {
  if (edges.length === 0) {
    return (
      <p className="empty-state">
        Use Add Edge on the map to connect Locations, then maintain traversal
        labels, costs, locks, and JSON state here.
      </p>
    );
  }

  return (
    <div className="workbench-table-scroll">
      <table className="workbench-table workbench-table--edges">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">From</th>
            <th scope="col">To</th>
            <th scope="col">Label</th>
            <th scope="col">Directed</th>
            <th scope="col">Cost</th>
            <th scope="col">Lock</th>
            <th scope="col">Notes</th>
            <th scope="col">State JSON</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge) => {
            const state = edgeStates[edge.id] ?? EMPTY_JSON_STATE;
            const isSelected =
              selectedEdgeId === edge.id ||
              selectedLocationId === edge.fromId ||
              selectedLocationId === edge.toId;

            return (
              <tr
                data-selected={isSelected}
                key={edge.id}
                onClick={() => onSelectEdge(edge.id)}
              >
                <th scope="row">{edge.id}</th>
                <td>
                  <select
                    aria-label={`${edge.id} from location`}
                    disabled={isSetupLocked}
                    onChange={(event) =>
                      onUpdateEdge(edge.id, {
                        fromId: event.currentTarget.value,
                      })
                    }
                    value={edge.fromId}
                  >
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    aria-label={`${edge.id} to location`}
                    disabled={isSetupLocked}
                    onChange={(event) =>
                      onUpdateEdge(edge.id, {
                        toId: event.currentTarget.value,
                      })
                    }
                    value={edge.toId}
                  >
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    aria-label={`${edge.id} label`}
                    disabled={isSetupLocked}
                    onChange={(event) =>
                      onUpdateEdge(edge.id, {
                        label: event.currentTarget.value,
                      })
                    }
                    value={edge.label ?? ""}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${edge.id} directed`}
                    checked={getStateBoolean(state, "directed")}
                    className="workbench-checkbox"
                    onChange={(event) =>
                      onUpdateEdgeState(edge.id, {
                        directed: event.currentTarget.checked,
                      })
                    }
                    type="checkbox"
                  />
                </td>
                <td>
                  <input
                    aria-label={`${edge.id} cost`}
                    min={0}
                    onChange={(event) =>
                      onUpdateEdgeState(edge.id, {
                        cost: toNumber(event.currentTarget.value, 0),
                      })
                    }
                    type="number"
                    value={getStateNumber(state, "cost")}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${edge.id} lock`}
                    onChange={(event) =>
                      onUpdateEdgeState(edge.id, {
                        lock: event.currentTarget.value,
                      })
                    }
                    value={getStateString(state, "lock")}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${edge.id} notes`}
                    onChange={(event) =>
                      onUpdateEdgeState(edge.id, {
                        notes: event.currentTarget.value,
                      })
                    }
                    value={getStateString(state, "notes")}
                  />
                </td>
                <td>
                  <JsonTableStateCell
                    value={state}
                    onApply={(patch) => onUpdateEdgeState(edge.id, patch)}
                  />
                </td>
                <td>
                  <button
                    aria-label={`Delete ${edge.id}`}
                    className="icon-only"
                    disabled={isSetupLocked}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteEdge(edge.id);
                    }}
                    title="Delete edge"
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface ObjectsTableProps {
  assetPlacements: AssetPlacement[];
  assets: UploadedImageAsset[];
  entities: Entity[];
  locations: BoardLocation[];
  onMoveEntityToLocation: (entityId: string, locationId: string) => void;
  onSelectPlacement: (placementId: string | null) => void;
  onUpdateEntityState: (entityId: string, patch: JsonRecord) => void;
  selectedPlacementId: string | null;
}

function ObjectsTable({
  assetPlacements,
  assets,
  entities,
  locations,
  onMoveEntityToLocation,
  onSelectPlacement,
  onUpdateEntityState,
  selectedPlacementId,
}: ObjectsTableProps) {
  if (entities.length === 0) {
    return (
      <p className="empty-state">
        Drag placeable image assets onto the board to create editable generic
        Objects.
      </p>
    );
  }

  return (
    <div className="workbench-table-scroll">
      <table className="workbench-table workbench-table--objects">
        <thead>
          <tr>
            <th scope="col">Entity ID</th>
            <th scope="col">Type</th>
            <th scope="col">Asset</th>
            <th scope="col">Location</th>
            <th scope="col">Zone</th>
            <th scope="col">Count</th>
            <th scope="col">State JSON</th>
          </tr>
        </thead>
        <tbody>
          {entities.map((entity) => {
            const placement = assetPlacements.find(
              (candidate) => candidate.entityId === entity.id,
            );
            const asset = placement
              ? assets.find((candidate) => candidate.id === placement.assetId)
              : null;

            return (
              <tr
                data-selected={selectedPlacementId === placement?.id}
                key={entity.id}
                onClick={() => onSelectPlacement(placement?.id ?? null)}
              >
                <th scope="row">{entity.id}</th>
                <td>{entity.type}</td>
                <td>{asset?.name ?? "Unlinked"}</td>
                <td>
                  <select
                    aria-label={`${entity.id} location`}
                    onChange={(event) =>
                      onMoveEntityToLocation(entity.id, event.currentTarget.value)
                    }
                    value={entity.locationId ?? ""}
                  >
                    <option value="" disabled>
                      Unbound
                    </option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    aria-label={`${entity.id} zone`}
                    onChange={(event) =>
                      onUpdateEntityState(entity.id, {
                        zoneId: event.currentTarget.value,
                      })
                    }
                    value={getStateString(entity.state, "zoneId")}
                  />
                </td>
                <td>
                  <input
                    aria-label={`${entity.id} count`}
                    min={0}
                    onChange={(event) =>
                      onUpdateEntityState(entity.id, {
                        count: toNumber(event.currentTarget.value, 0),
                      })
                    }
                    type="number"
                    value={getStateNumber(entity.state, "count")}
                  />
                </td>
                <td>
                  <JsonTableStateCell
                    value={entity.state}
                    onApply={(patch) => onUpdateEntityState(entity.id, patch)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface CardZonesWorkbenchProps {
  assets: UploadedImageAsset[];
  cardDeckState: CardDeckState;
  isSetupLocked: boolean;
  onAddCardAssetToZone: (zoneId: string, assetId: string) => string | null;
  onCreateCardZone: (name: string, kind: CardZoneKind) => string | null;
  onDealCardsToZones: (
    fromZoneId: string,
    toZoneIds: string[],
    countPerZone: number,
  ) => void;
  onDeleteCardZone: (zoneId: string) => void;
  onDrawCardsToZone: (
    fromZoneId: string,
    toZoneId: string,
    count: number,
  ) => void;
  onFlipCardsInZone: (
    zoneId: string,
    cardIds: string[],
    faceUp?: boolean,
  ) => void;
  onMoveCardsBetweenZones: (
    fromZoneId: string,
    toZoneId: string,
    cardIds: string[],
    toIndex?: number,
  ) => void;
  onRemoveCardsFromZone: (zoneId: string, cardIds: string[]) => void;
  onReorderCardInZone: (
    zoneId: string,
    cardId: string,
    toIndex: number,
  ) => void;
  onShuffleCardZone: (zoneId: string, order?: string[]) => void;
  onUpdateCardZone: (
    zoneId: string,
    patch: Partial<{
      kind: CardZoneKind;
      name: string;
      state: JsonRecord;
    }>,
  ) => void;
}

function CardZonesWorkbench({
  assets,
  cardDeckState,
  isSetupLocked,
  onAddCardAssetToZone,
  onCreateCardZone,
  onDealCardsToZones,
  onDeleteCardZone,
  onDrawCardsToZone,
  onFlipCardsInZone,
  onMoveCardsBetweenZones,
  onRemoveCardsFromZone,
  onReorderCardInZone,
  onShuffleCardZone,
  onUpdateCardZone,
}: CardZonesWorkbenchProps) {
  const cardAssets = useMemo(
    () => assets.filter((asset) => asset.category === "CARD"),
    [assets],
  );
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneKind, setNewZoneKind] = useState<CardZoneKind>("deck");
  const [cardAssetId, setCardAssetId] = useState("");
  const [targetZoneId, setTargetZoneId] = useState("");
  const [drawCount, setDrawCount] = useState(1);
  const [dealCount, setDealCount] = useState(1);
  const [dealTargets, setDealTargets] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (
      selectedZoneId &&
      cardDeckState.zones.some((zone) => zone.id === selectedZoneId)
    ) {
      return;
    }

    setSelectedZoneId(cardDeckState.zones[0]?.id ?? null);
  }, [cardDeckState.zones, selectedZoneId]);

  useEffect(() => {
    setCardAssetId((current) =>
      current && cardAssets.some((asset) => asset.id === current)
        ? current
        : cardAssets[0]?.id ?? "",
    );
  }, [cardAssets]);

  const selectedZone =
    cardDeckState.zones.find((zone) => zone.id === selectedZoneId) ?? null;
  const targetZones = selectedZone
    ? cardDeckState.zones.filter((zone) => zone.id !== selectedZone.id)
    : [];
  const visibleCards = selectedZone
    ? searchCards(cardDeckState, selectedZone.id, search)
    : [];

  useEffect(() => {
    setTargetZoneId((current) =>
      current && targetZones.some((zone) => zone.id === current)
        ? current
        : targetZones[0]?.id ?? "",
    );
  }, [targetZones]);

  const handleCreateZone = useCallback(() => {
    const zoneId = onCreateCardZone(newZoneName.trim(), newZoneKind);

    if (zoneId) {
      setSelectedZoneId(zoneId);
      setNewZoneName("");
    }
  }, [newZoneKind, newZoneName, onCreateCardZone]);
  const handleAddCard = useCallback(() => {
    if (!selectedZone || !cardAssetId) {
      return;
    }

    onAddCardAssetToZone(selectedZone.id, cardAssetId);
  }, [cardAssetId, onAddCardAssetToZone, selectedZone]);
  const handleDraw = useCallback(() => {
    if (!selectedZone || !targetZoneId) {
      return;
    }

    onDrawCardsToZone(selectedZone.id, targetZoneId, drawCount);
  }, [drawCount, onDrawCardsToZone, selectedZone, targetZoneId]);
  const handleDeal = useCallback(() => {
    if (!selectedZone) {
      return;
    }

    const targetIds = parseZoneIdList(dealTargets || targetZoneId);

    if (targetIds.length === 0) {
      return;
    }

    onDealCardsToZones(selectedZone.id, targetIds, dealCount);
  }, [dealCount, dealTargets, onDealCardsToZones, selectedZone, targetZoneId]);

  return (
    <div className="card-workbench">
      <section className="card-zone-sidebar" aria-label="Card zones">
        <div className="card-zone-create">
          <input
            aria-label="New card zone name"
            disabled={isSetupLocked}
            onChange={(event) => setNewZoneName(event.currentTarget.value)}
            placeholder="New zone name"
            value={newZoneName}
          />
          <select
            aria-label="New card zone kind"
            disabled={isSetupLocked}
            onChange={(event) =>
              setNewZoneKind(event.currentTarget.value as CardZoneKind)
            }
            value={newZoneKind}
          >
            {CARD_ZONE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {formatCardZoneKind(kind)}
              </option>
            ))}
          </select>
          <button
            className="mini-button"
            disabled={isSetupLocked || !newZoneName.trim()}
            onClick={handleCreateZone}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            <span>Zone</span>
          </button>
        </div>
        {cardDeckState.zones.length === 0 ? (
          <p className="empty-state">Create a deck, hand, discard, or setup pile.</p>
        ) : (
          <div className="card-zone-list">
            {cardDeckState.zones.map((zone) => (
              <button
                className="card-zone-item"
                data-selected={selectedZone?.id === zone.id}
                key={zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
                type="button"
              >
                <strong>{zone.name}</strong>
                <span>
                  {formatCardZoneKind(zone.kind)} / {zone.cards.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card-zone-detail" aria-label="Selected card zone">
        {selectedZone ? (
          <>
            <div className="card-zone-detail__header">
              <div>
                <h3>{selectedZone.name}</h3>
                <span>
                  {selectedZone.id} / {formatCardZoneKind(selectedZone.kind)} /{" "}
                  {selectedZone.cards.length} cards
                </span>
              </div>
              <button
                aria-label={`Delete ${selectedZone.name}`}
                className="icon-only"
                disabled={isSetupLocked}
                onClick={() => onDeleteCardZone(selectedZone.id)}
                title="Delete zone"
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} />
              </button>
            </div>

            <div className="card-zone-fields">
              <label>
                <span>Name</span>
                <input
                  disabled={isSetupLocked}
                  onChange={(event) =>
                    onUpdateCardZone(selectedZone.id, {
                      name: event.currentTarget.value,
                    })
                  }
                  value={selectedZone.name}
                />
              </label>
              <label>
                <span>Kind</span>
                <select
                  disabled={isSetupLocked}
                  onChange={(event) =>
                    onUpdateCardZone(selectedZone.id, {
                      kind: event.currentTarget.value as CardZoneKind,
                    })
                  }
                  value={selectedZone.kind}
                >
                  {CARD_ZONE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {formatCardZoneKind(kind)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Add card</span>
                <select
                  disabled={isSetupLocked || cardAssets.length === 0}
                  onChange={(event) => setCardAssetId(event.currentTarget.value)}
                  value={cardAssetId}
                >
                  {cardAssets.length === 0 ? (
                    <option value="">No CARD assets</option>
                  ) : null}
                  {cardAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="mini-button"
                disabled={isSetupLocked || !cardAssetId}
                onClick={handleAddCard}
                type="button"
              >
                <Plus aria-hidden="true" size={14} />
                <span>Card</span>
              </button>
            </div>

            <div className="card-zone-actions">
              <button
                className="mini-button"
                disabled={selectedZone.cards.length < 2}
                onClick={() => onShuffleCardZone(selectedZone.id)}
                type="button"
              >
                <ArrowUpDown aria-hidden="true" size={14} />
                <span>Shuffle</span>
              </button>
              <label>
                <span>Draw</span>
                <input
                  min={1}
                  onChange={(event) =>
                    setDrawCount(Math.max(1, toNumber(event.currentTarget.value, 1)))
                  }
                  type="number"
                  value={drawCount}
                />
              </label>
              <select
                aria-label="Draw target zone"
                disabled={!targetZoneId}
                onChange={(event) => setTargetZoneId(event.currentTarget.value)}
                value={targetZoneId}
              >
                {targetZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              <button
                className="mini-button"
                disabled={!targetZoneId || selectedZone.cards.length === 0}
                onClick={handleDraw}
                type="button"
              >
                <CreditCard aria-hidden="true" size={14} />
                <span>Draw</span>
              </button>
              <label>
                <span>Deal</span>
                <input
                  min={1}
                  onChange={(event) =>
                    setDealCount(Math.max(1, toNumber(event.currentTarget.value, 1)))
                  }
                  type="number"
                  value={dealCount}
                />
              </label>
              <input
                aria-label="Deal target zone ids"
                onChange={(event) => setDealTargets(event.currentTarget.value)}
                placeholder="zone-2, zone-3"
                value={dealTargets}
              />
              <button
                className="mini-button"
                disabled={selectedZone.cards.length === 0}
                onClick={handleDeal}
                type="button"
              >
                <CreditCard aria-hidden="true" size={14} />
                <span>Deal</span>
              </button>
              <label className="card-search">
                <Search aria-hidden="true" size={14} />
                <input
                  aria-label="Search cards in selected zone"
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  placeholder="Search pile"
                  type="search"
                  value={search}
                />
              </label>
            </div>

            <CardZoneCardList
              assets={assets}
              cards={visibleCards}
              isSetupLocked={isSetupLocked}
              onFlipCard={(cardId) =>
                onFlipCardsInZone(selectedZone.id, [cardId])
              }
              onMoveCard={(cardId) =>
                targetZoneId
                  ? onMoveCardsBetweenZones(
                      selectedZone.id,
                      targetZoneId,
                      [cardId],
                    )
                  : undefined
              }
              onRemoveCard={(cardId) =>
                onRemoveCardsFromZone(selectedZone.id, [cardId])
              }
              onReorderCard={(cardId, toIndex) =>
                onReorderCardInZone(selectedZone.id, cardId, toIndex)
              }
              targetZoneId={targetZoneId}
              zoneCards={selectedZone.cards}
            />
          </>
        ) : (
          <p className="empty-state">
            Create a card zone to inspect and operate on ordered cards.
          </p>
        )}
      </section>
    </div>
  );
}

interface CardZoneCardListProps {
  assets: UploadedImageAsset[];
  cards: CardRef[];
  isSetupLocked: boolean;
  onFlipCard: (cardId: string) => void;
  onMoveCard: (cardId: string) => void | undefined;
  onRemoveCard: (cardId: string) => void;
  onReorderCard: (cardId: string, toIndex: number) => void;
  targetZoneId: string;
  zoneCards: CardRef[];
}

function CardZoneCardList({
  assets,
  cards,
  isSetupLocked,
  onFlipCard,
  onMoveCard,
  onRemoveCard,
  onReorderCard,
  targetZoneId,
  zoneCards,
}: CardZoneCardListProps) {
  if (cards.length === 0) {
    return <p className="empty-state">No cards match this pile view.</p>;
  }

  return (
    <div className="card-zone-card-list">
      {cards.map((card) => {
        const asset = assets.find((candidate) => candidate.id === card.assetId);
        const cardIndex = zoneCards.findIndex((candidate) => candidate.id === card.id);

        return (
          <article className="card-zone-card" key={card.id}>
            {asset?.thumbnailUrl ? (
              <img alt="" src={asset.thumbnailUrl} />
            ) : (
              <span aria-hidden="true" className="asset-thumb-pending">
                <ImageIcon size={18} />
              </span>
            )}
            <div className="card-zone-card__body">
              <strong>{card.label ?? asset?.name ?? card.id}</strong>
              <span>
                {card.id} / {card.faceUp ? "face up" : "face down"}
              </span>
              <small>{asset?.name ?? card.assetId}</small>
            </div>
            <div className="card-zone-card__actions">
              <button
                aria-label={`Move ${card.id} up`}
                className="icon-only"
                disabled={cardIndex <= 0}
                onClick={() => onReorderCard(card.id, cardIndex - 1)}
                title="Move up"
                type="button"
              >
                <ArrowUpAZ aria-hidden="true" size={14} />
              </button>
              <button
                aria-label={`Move ${card.id} down`}
                className="icon-only"
                disabled={cardIndex < 0 || cardIndex >= zoneCards.length - 1}
                onClick={() => onReorderCard(card.id, cardIndex + 1)}
                title="Move down"
                type="button"
              >
                <ArrowDownAZ aria-hidden="true" size={14} />
              </button>
              <button
                className="mini-button"
                onClick={() => onFlipCard(card.id)}
                type="button"
              >
                <span>{card.faceUp ? "Down" : "Up"}</span>
              </button>
              <button
                className="mini-button"
                disabled={!targetZoneId}
                onClick={() => onMoveCard(card.id)}
                type="button"
              >
                <span>Move</span>
              </button>
              <button
                aria-label={`Remove ${card.id}`}
                className="icon-only"
                disabled={isSetupLocked}
                onClick={() => onRemoveCard(card.id)}
                title="Remove card"
                type="button"
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

interface DicePoolsWorkbenchProps {
  assets: UploadedImageAsset[];
  diceState: DiceState;
  isSetupLocked: boolean;
  onAddDieToPool: (
    poolId: string,
    dieId: string,
    count?: number,
  ) => string | null;
  onClearRollHistory: () => void;
  onCreateDieFromAsset: (assetId: string, name?: string) => string | null;
  onCreateDieFromAssets: (name: string, assetIds: string[]) => string | null;
  onCreatePool: (name: string) => string | null;
  onDeleteDie: (dieId: string) => void;
  onDeletePool: (poolId: string) => void;
  onOverrideRollResult: (
    rollId: string,
    resultId: string,
    faceRefId: string,
  ) => void;
  onRemoveDieFromPool: (poolId: string, poolDieId: string) => void;
  onRollPool: (poolId: string, faceRefIds?: string[]) => string | null;
  onUpdateDie: (
    dieId: string,
    patch: Partial<{
      name: string;
      state: JsonRecord;
    }>,
  ) => void;
  onUpdatePool: (
    poolId: string,
    patch: Partial<{
      name: string;
      state: JsonRecord;
    }>,
  ) => void;
  onUpdatePoolDieCount: (
    poolId: string,
    poolDieId: string,
    count: number,
  ) => void;
}

function DicePoolsWorkbench({
  assets,
  diceState,
  isSetupLocked,
  onAddDieToPool,
  onClearRollHistory,
  onCreateDieFromAsset,
  onCreateDieFromAssets,
  onCreatePool,
  onDeleteDie,
  onDeletePool,
  onOverrideRollResult,
  onRemoveDieFromPool,
  onRollPool,
  onUpdateDie,
  onUpdatePool,
  onUpdatePoolDieCount,
}: DicePoolsWorkbenchProps) {
  const dieAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.category === "TOKEN" &&
          asset.kind === "die" &&
          Boolean(asset.faces?.length),
      ),
    [assets],
  );
  const faceFolders = useMemo(() => getDiceFaceFolders(assets), [assets]);
  const [selectedDieId, setSelectedDieId] = useState<string | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [dieAssetId, setDieAssetId] = useState("");
  const [faceFolderKey, setFaceFolderKey] = useState("");
  const [poolName, setPoolName] = useState("");
  const [poolDieId, setPoolDieId] = useState("");
  const [poolDieCount, setPoolDieCount] = useState(1);

  useEffect(() => {
    setSelectedDieId((current) =>
      current && diceState.definitions.some((definition) => definition.id === current)
        ? current
        : diceState.definitions[0]?.id ?? null,
    );
  }, [diceState.definitions]);

  useEffect(() => {
    setSelectedPoolId((current) =>
      current && diceState.pools.some((pool) => pool.id === current)
        ? current
        : diceState.pools[0]?.id ?? null,
    );
  }, [diceState.pools]);

  useEffect(() => {
    setDieAssetId((current) =>
      current && dieAssets.some((asset) => asset.id === current)
        ? current
        : dieAssets[0]?.id ?? "",
    );
  }, [dieAssets]);

  useEffect(() => {
    setFaceFolderKey((current) =>
      current && faceFolders.some((folder) => folder.key === current)
        ? current
        : faceFolders[0]?.key ?? "",
    );
  }, [faceFolders]);

  useEffect(() => {
    setPoolDieId((current) =>
      current && diceState.definitions.some((definition) => definition.id === current)
        ? current
        : diceState.definitions[0]?.id ?? "",
    );
  }, [diceState.definitions]);

  const selectedDie =
    diceState.definitions.find((definition) => definition.id === selectedDieId) ??
    null;
  const selectedPool =
    diceState.pools.find((pool) => pool.id === selectedPoolId) ?? null;
  const lastRoll = getLastRoll(diceState);

  const handleCreateDieFromAsset = useCallback(() => {
    if (!dieAssetId) {
      return;
    }

    const dieId = onCreateDieFromAsset(dieAssetId);

    if (dieId) {
      setSelectedDieId(dieId);
    }
  }, [dieAssetId, onCreateDieFromAsset]);
  const handleCreateDieFromFolder = useCallback(() => {
    const folder = faceFolders.find((candidate) => candidate.key === faceFolderKey);

    if (!folder) {
      return;
    }

    const dieId = onCreateDieFromAssets(
      folder.name,
      folder.assets.map((asset) => asset.id),
    );

    if (dieId) {
      setSelectedDieId(dieId);
    }
  }, [faceFolderKey, faceFolders, onCreateDieFromAssets]);
  const handleCreatePool = useCallback(() => {
    const poolId = onCreatePool(poolName.trim());

    if (poolId) {
      setSelectedPoolId(poolId);
      setPoolName("");
    }
  }, [onCreatePool, poolName]);
  const handleAddDieToPool = useCallback(() => {
    if (!selectedPool || !poolDieId) {
      return;
    }

    onAddDieToPool(selectedPool.id, poolDieId, poolDieCount);
  }, [onAddDieToPool, poolDieCount, poolDieId, selectedPool]);

  return (
    <div className="dice-workbench">
      <section className="dice-panel" aria-label="Dice definitions">
        <div className="dice-panel__header">
          <h3>Dice</h3>
          <span>{diceState.definitions.length}</span>
        </div>
        <div className="dice-create-grid">
          <select
            aria-label="Die asset with face metadata"
            disabled={isSetupLocked || dieAssets.length === 0}
            onChange={(event) => setDieAssetId(event.currentTarget.value)}
            value={dieAssetId}
          >
            {dieAssets.length === 0 ? <option value="">No die assets</option> : null}
            {dieAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} / {asset.faces?.length ?? 0} faces
              </option>
            ))}
          </select>
          <button
            className="mini-button"
            disabled={isSetupLocked || !dieAssetId}
            onClick={handleCreateDieFromAsset}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            <span>Die</span>
          </button>
          <select
            aria-label="Die face folder"
            disabled={isSetupLocked || faceFolders.length === 0}
            onChange={(event) => setFaceFolderKey(event.currentTarget.value)}
            value={faceFolderKey}
          >
            {faceFolders.length === 0 ? (
              <option value="">No face folders</option>
            ) : null}
            {faceFolders.map((folder) => (
              <option key={folder.key} value={folder.key}>
                {folder.name} / {folder.assets.length} faces
              </option>
            ))}
          </select>
          <button
            className="mini-button"
            disabled={isSetupLocked || !faceFolderKey}
            onClick={handleCreateDieFromFolder}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            <span>Folder</span>
          </button>
        </div>

        {diceState.definitions.length === 0 ? (
          <p className="empty-state">No dice defined.</p>
        ) : (
          <div className="dice-list">
            {diceState.definitions.map((definition) => (
              <button
                className="dice-list-item"
                data-selected={selectedDie?.id === definition.id}
                key={definition.id}
                onClick={() => setSelectedDieId(definition.id)}
                type="button"
              >
                <strong>{definition.name}</strong>
                <span>{definition.faces.length} faces</span>
              </button>
            ))}
          </div>
        )}

        {selectedDie ? (
          <div className="dice-detail">
            <div className="dice-detail__heading">
              <input
                aria-label="Die name"
                disabled={isSetupLocked}
                onChange={(event) =>
                  onUpdateDie(selectedDie.id, {
                    name: event.currentTarget.value,
                  })
                }
                value={selectedDie.name}
              />
              <button
                aria-label={`Delete ${selectedDie.name}`}
                className="icon-only"
                disabled={isSetupLocked}
                onClick={() => onDeleteDie(selectedDie.id)}
                title="Delete die"
                type="button"
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>
            <div className="dice-face-grid">
              {selectedDie.faces.map((face) => (
                <div className="dice-face-chip" key={face.id}>
                  {getFaceAsset(assets, face)?.thumbnailUrl ? (
                    <img alt="" src={getFaceAsset(assets, face)!.thumbnailUrl} />
                  ) : (
                    <span aria-hidden="true" className="asset-thumb-pending">
                      <Dices size={16} />
                    </span>
                  )}
                  <span>{formatDieFaceLabel(face)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="dice-panel dice-panel--wide" aria-label="Dice pools">
        <div className="dice-panel__header">
          <h3>Pools</h3>
          <span>{diceState.pools.length}</span>
        </div>
        <div className="dice-pool-create">
          <input
            aria-label="New dice pool name"
            disabled={isSetupLocked}
            onChange={(event) => setPoolName(event.currentTarget.value)}
            placeholder="New pool name"
            value={poolName}
          />
          <button
            className="mini-button"
            disabled={isSetupLocked || !poolName.trim()}
            onClick={handleCreatePool}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            <span>Pool</span>
          </button>
        </div>

        {diceState.pools.length === 0 ? (
          <p className="empty-state">No dice pools defined.</p>
        ) : (
          <div className="dice-list dice-list--horizontal">
            {diceState.pools.map((pool) => (
              <button
                className="dice-list-item"
                data-selected={selectedPool?.id === pool.id}
                key={pool.id}
                onClick={() => setSelectedPoolId(pool.id)}
                type="button"
              >
                <strong>{pool.name}</strong>
                <span>{countPoolDice(pool)} dice</span>
              </button>
            ))}
          </div>
        )}

        {selectedPool ? (
          <div className="dice-pool-detail">
            <div className="dice-detail__heading">
              <input
                aria-label="Dice pool name"
                disabled={isSetupLocked}
                onChange={(event) =>
                  onUpdatePool(selectedPool.id, {
                    name: event.currentTarget.value,
                  })
                }
                value={selectedPool.name}
              />
              <button
                aria-label={`Delete ${selectedPool.name}`}
                className="icon-only"
                disabled={isSetupLocked}
                onClick={() => onDeletePool(selectedPool.id)}
                title="Delete pool"
                type="button"
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>

            <div className="dice-pool-actions">
              <select
                aria-label="Die to add"
                disabled={isSetupLocked || diceState.definitions.length === 0}
                onChange={(event) => setPoolDieId(event.currentTarget.value)}
                value={poolDieId}
              >
                {diceState.definitions.length === 0 ? (
                  <option value="">No dice</option>
                ) : null}
                {diceState.definitions.map((definition) => (
                  <option key={definition.id} value={definition.id}>
                    {definition.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Dice count"
                disabled={isSetupLocked}
                min={1}
                onChange={(event) =>
                  setPoolDieCount(
                    Math.max(1, toNumber(event.currentTarget.value, 1)),
                  )
                }
                type="number"
                value={poolDieCount}
              />
              <button
                className="mini-button"
                disabled={isSetupLocked || !poolDieId}
                onClick={handleAddDieToPool}
                type="button"
              >
                <Plus aria-hidden="true" size={14} />
                <span>Die</span>
              </button>
              <button
                className="mini-button"
                disabled={selectedPool.dice.length === 0}
                onClick={() => onRollPool(selectedPool.id)}
                type="button"
              >
                <Dices aria-hidden="true" size={14} />
                <span>Roll</span>
              </button>
            </div>

            {selectedPool.dice.length === 0 ? (
              <p className="empty-state">No dice in this pool.</p>
            ) : (
              <div className="dice-pool-dice">
                {selectedPool.dice.map((poolDie) => {
                  const definition = diceState.definitions.find(
                    (candidate) => candidate.id === poolDie.dieId,
                  );

                  return (
                    <div className="dice-pool-die" key={poolDie.id}>
                      <strong>{definition?.name ?? poolDie.dieId}</strong>
                      <input
                        aria-label={`${poolDie.id} count`}
                        disabled={isSetupLocked}
                        min={1}
                        onChange={(event) =>
                          onUpdatePoolDieCount(
                            selectedPool.id,
                            poolDie.id,
                            Math.max(1, toNumber(event.currentTarget.value, 1)),
                          )
                        }
                        type="number"
                        value={poolDie.count}
                      />
                      <button
                        aria-label={`Remove ${poolDie.id}`}
                        className="icon-only"
                        disabled={isSetupLocked}
                        onClick={() =>
                          onRemoveDieFromPool(selectedPool.id, poolDie.id)
                        }
                        title="Remove die from pool"
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <DiceRollHistory
          assets={assets}
          diceState={diceState}
          lastRoll={lastRoll}
          onClearRollHistory={onClearRollHistory}
          onOverrideRollResult={onOverrideRollResult}
        />
      </section>
    </div>
  );
}

interface DiceRollHistoryProps {
  assets: UploadedImageAsset[];
  diceState: DiceState;
  lastRoll: DiceRoll | null;
  onClearRollHistory: () => void;
  onOverrideRollResult: (
    rollId: string,
    resultId: string,
    faceRefId: string,
  ) => void;
}

function DiceRollHistory({
  assets,
  diceState,
  lastRoll,
  onClearRollHistory,
  onOverrideRollResult,
}: DiceRollHistoryProps) {
  return (
    <div className="dice-roll-history" aria-label="Dice roll history">
      <div className="dice-panel__header">
        <h3>Last Roll</h3>
        <button
          className="mini-button"
          disabled={diceState.rollHistory.length === 0}
          onClick={onClearRollHistory}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={14} />
          <span>Clear</span>
        </button>
      </div>
      {lastRoll ? (
        <>
          <div className="dice-roll-summary">
            <strong>{lastRoll.id}</strong>
            <span>
              {lastRoll.mode} / {lastRoll.results.length} results /{" "}
              {diceState.rollHistory.length} rolls
            </span>
          </div>
          <div className="dice-roll-results">
            {lastRoll.results.map((result) => {
              const definition = diceState.definitions.find(
                (candidate) => candidate.id === result.dieId,
              );
              const face = definition?.faces.find(
                (candidate) => candidate.id === result.faceRefId,
              );
              const faceAsset = face ? getFaceAsset(assets, face) : null;

              return (
                <div className="dice-roll-result" key={result.id}>
                  {faceAsset?.thumbnailUrl ? (
                    <img alt="" src={faceAsset.thumbnailUrl} />
                  ) : (
                    <span aria-hidden="true" className="asset-thumb-pending">
                      <Dices size={16} />
                    </span>
                  )}
                  <div>
                    <strong>{definition?.name ?? result.dieId}</strong>
                    <span>
                      {result.label ?? result.faceRefId}
                      {result.isOverride ? " / override" : ""}
                    </span>
                  </div>
                  <select
                    aria-label={`${result.id} face override`}
                    onChange={(event) =>
                      onOverrideRollResult(
                        lastRoll.id,
                        result.id,
                        event.currentTarget.value,
                      )
                    }
                    value={result.faceRefId}
                  >
                    {definition?.faces.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {formatDieFaceLabel(candidate)}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="empty-state">No rolls recorded.</p>
      )}
    </div>
  );
}

interface BoardStateWorkbenchProps {
  boardState: JsonRecord;
  mode: ScenarioMode;
  onUpdateBoardState: (patch: JsonRecord) => void;
}

function BoardStateWorkbench({
  boardState,
  mode,
  onUpdateBoardState,
}: BoardStateWorkbenchProps) {
  return (
    <div className="board-state-workbench">
      <JsonStateEditor
        description={
          mode === "edit"
            ? "Scenario-wide setup state"
            : "Current scenario runtime state"
        }
        title="Board State"
        value={boardState}
        onApply={onUpdateBoardState}
      />
    </div>
  );
}

interface JsonTableStateCellProps {
  onApply: (patch: JsonRecord) => void;
  value: JsonRecord;
}

function JsonTableStateCell({ onApply, value }: JsonTableStateCellProps) {
  const [draft, setDraft] = useState(formatJson(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(formatJson(value));
    setError(null);
  }, [value]);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(draft) as unknown;

      if (!isPlainObject(parsed)) {
        setError("JSON object required");
        return;
      }

      onApply(parsed);
      setError(null);
    } catch (parseError) {
      setError(getErrorMessage(parseError));
    }
  }, [draft, onApply]);

  return (
    <div className="json-table-cell">
      <textarea
        aria-label="State JSON"
        onChange={(event) => setDraft(event.currentTarget.value)}
        spellCheck={false}
        value={draft}
      />
      <div>
        {error ? <span>{error}</span> : null}
        <button className="mini-button" onClick={handleApply} type="button">
          Apply
        </button>
      </div>
    </div>
  );
}

interface RuntimeObjectControlsProps {
  adjustEntityCounter: (entityId: string, key: string, delta: number) => void;
  entity: Entity;
  locations: BoardLocation[];
  moveCardToZone: (entityId: string, zoneId: string) => void;
  moveEntityToLocation: (entityId: string, locationId: string) => void;
}

function RuntimeObjectControls({
  adjustEntityCounter,
  entity,
  locations,
  moveCardToZone,
  moveEntityToLocation,
}: RuntimeObjectControlsProps) {
  const [zoneDraft, setZoneDraft] = useState(String(entity.state.zoneId ?? ""));

  useEffect(() => {
    setZoneDraft(String(entity.state.zoneId ?? ""));
  }, [entity.id, entity.state.zoneId]);

  return (
    <section className="runtime-controls" aria-label="Runtime object controls">
      <div className="state-panel__heading">
        <h2>Run Controls</h2>
        <span>{entity.id}</span>
      </div>
      <label className="field">
        <span>Move to Location</span>
        <select
          onChange={(event) =>
            moveEntityToLocation(entity.id, event.currentTarget.value)
          }
          value={entity.locationId ?? ""}
        >
          <option value="" disabled>
            Unbound
          </option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <div className="counter-adjust">
        <span>Count</span>
        <button
          className="icon-only icon-only--neutral"
          onClick={() => adjustEntityCounter(entity.id, "count", -1)}
          type="button"
        >
          <Minus aria-hidden="true" size={15} />
        </button>
        <strong>{Number(entity.state.count ?? 0)}</strong>
        <button
          className="icon-only icon-only--neutral"
          onClick={() => adjustEntityCounter(entity.id, "count", 1)}
          type="button"
        >
          <Plus aria-hidden="true" size={15} />
        </button>
      </div>
      <label className="field">
        <span>Card / Zone Id</span>
        <div className="inline-apply">
          <input
            onChange={(event) => setZoneDraft(event.currentTarget.value)}
            value={zoneDraft}
          />
          <button
            className="mini-button"
            onClick={() => moveCardToZone(entity.id, zoneDraft)}
            type="button"
          >
            Apply
          </button>
        </div>
      </label>
    </section>
  );
}

interface JsonStateEditorProps {
  description: string;
  isDisabled?: boolean;
  onApply: (patch: JsonRecord) => void;
  title: string;
  value: JsonRecord;
}

function JsonStateEditor({
  description,
  isDisabled = false,
  onApply,
  title,
  value,
}: JsonStateEditorProps) {
  const [draft, setDraft] = useState(formatJson(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(formatJson(value));
    setError(null);
  }, [value]);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(draft) as unknown;

      if (!isPlainObject(parsed)) {
        setError("State must be a JSON object.");
        return;
      }

      onApply(parsed);
      setError(null);
    } catch (parseError) {
      setError(getErrorMessage(parseError));
    }
  }, [draft, onApply]);

  return (
    <section className="state-panel" data-disabled={isDisabled}>
      <div className="state-panel__heading">
        <h2>{title}</h2>
        <span>{description}</span>
      </div>
      <textarea
        disabled={isDisabled}
        onChange={(event) => setDraft(event.currentTarget.value)}
        spellCheck={false}
        value={draft}
      />
      <div className="state-panel__footer">
        {error ? <span className="state-error">{error}</span> : <span />}
        <button
          className="mini-button"
          disabled={isDisabled}
          onClick={handleApply}
          type="button"
        >
          Apply
        </button>
      </div>
    </section>
  );
}

interface AssetImportPanelProps {
  isDisabled: boolean;
  onImport: (
    event: ChangeEvent<HTMLInputElement>,
    options?: ImageImportOptions,
  ) => void;
  progress: MediaProgress | null;
}

const DIRECTORY_INPUT_PROPS = {
  directory: "",
  webkitdirectory: "",
} as Record<string, string>;

function AssetImportPanel({ isDisabled, onImport, progress }: AssetImportPanelProps) {
  return (
    <div className="asset-import-panel" data-disabled={isDisabled}>
      {progress ? (
        <p
          aria-live="polite"
          className="asset-import-progress"
          role="status"
        >
          Processing images {progress.done} / {progress.total}
        </p>
      ) : null}
      <label
        aria-disabled={isDisabled}
        className="mini-button asset-import-root"
        data-disabled={isDisabled}
      >
        <FolderOpen aria-hidden="true" size={14} />
        <span>Assets folder</span>
        <input
          {...DIRECTORY_INPUT_PROPS}
          accept="image/*"
          disabled={isDisabled}
          multiple
          onChange={(event) =>
            onImport(event, { inferCategoryFromPath: true })
          }
          type="file"
        />
      </label>

      <div className="asset-import-category-list">
        {RESOURCE_CATEGORIES.map((category) => (
          <div className="asset-import-category" key={category}>
            <strong>{RESOURCE_CATEGORY_DEFINITIONS[category].label}</strong>
            <div className="asset-import-category__actions">
              <label
                aria-disabled={isDisabled}
                className="mini-button"
                data-disabled={isDisabled}
              >
                <FolderOpen aria-hidden="true" size={13} />
                <span>Folder</span>
                <input
                  {...DIRECTORY_INPUT_PROPS}
                  accept="image/*"
                  disabled={isDisabled}
                  multiple
                  onChange={(event) => onImport(event, { category })}
                  type="file"
                />
              </label>
              <label
                aria-disabled={isDisabled}
                className="mini-button"
                data-disabled={isDisabled}
              >
                <Upload aria-hidden="true" size={13} />
                <span>Image</span>
                <input
                  accept="image/*"
                  disabled={isDisabled}
                  multiple
                  onChange={(event) => onImport(event, { category })}
                  type="file"
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PawnSheetInspectorProps {
  adjustPawnCounter: (
    placementId: string,
    assetId: string,
    delta: number,
  ) => void;
  addPawnHeldCard: (placementId: string, assetId: string) => void;
  assets: UploadedImageAsset[];
  assetPlacements: AssetPlacement[];
  deleteSelectedPlacement: () => void;
  pawnSheets: Record<string, PawnSheet>;
  placement: AssetPlacement;
  placementAsset: UploadedImageAsset;
  removePawnHeldCard: (placementId: string, index: number) => void;
  setPawnCharacterCard: (placementId: string, assetId: string) => void;
  sheet: PawnSheet;
  updateAssetPlacement: (
    placementId: string,
    patch: Partial<Pick<AssetPlacement, "width" | "height">>,
  ) => void;
}

function PawnSheetInspector({
  adjustPawnCounter,
  addPawnHeldCard,
  assets,
  assetPlacements,
  deleteSelectedPlacement,
  pawnSheets,
  placement,
  placementAsset,
  removePawnHeldCard,
  setPawnCharacterCard,
  sheet,
  updateAssetPlacement,
}: PawnSheetInspectorProps) {
  const characterCard = sheet.characterCardAssetId
    ? findAsset(assets, sheet.characterCardAssetId)
    : null;
  const heldCards = sheet.heldCardAssetIds
    .map((assetId, index) => ({
      asset: findAsset(assets, assetId),
      index,
    }))
    .filter(
      (card): card is { asset: UploadedImageAsset; index: number } =>
        Boolean(card.asset),
    );
  const counters = sheet.counters
    .map((counter) => ({
      asset: findAsset(assets, counter.assetId),
      count: counter.count,
    }))
    .filter(
      (counter): counter is { asset: UploadedImageAsset; count: number } =>
        Boolean(counter.asset),
    );
  const handleDrop = useCallback(
    (
      event: DragEvent<HTMLElement>,
      target: "character" | "held" | "counter",
    ) => {
      const assetId = getDraggedAssetId(event);

      if (!assetId) {
        return;
      }

      event.preventDefault();

      if (target === "character") {
        setPawnCharacterCard(placement.id, assetId);
        return;
      }

      if (target === "held") {
        addPawnHeldCard(placement.id, assetId);
        return;
      }

      adjustPawnCounter(placement.id, assetId, 1);
    },
    [
      addPawnHeldCard,
      adjustPawnCounter,
      placement.id,
      setPawnCharacterCard,
    ],
  );
  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (event.dataTransfer.types.includes("application/x-lorecanvas-asset")) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  }, []);

  return (
    <section className="pawn-sheet" aria-label="Pawn inspector">
      <div className="selected-piece-card selected-piece-card--pawn">
        <img alt="" src={getAssetPreviewUrl(placementAsset)} />
        <div>
          <strong>{placementAsset.name}</strong>
          <span>
            {placement.entityId} / {placement.locationId}
          </span>
        </div>
      </div>

      <div className="piece-controls piece-controls--wide">
        <label>
          <span>W</span>
          <input
            min={12}
            max={640}
            onChange={(event) =>
              updateAssetPlacement(placement.id, {
                width: toNumber(event.currentTarget.value, placement.width),
              })
            }
            type="number"
            value={placement.width}
          />
        </label>
        <label>
          <span>H</span>
          <input
            min={12}
            max={640}
            onChange={(event) =>
              updateAssetPlacement(placement.id, {
                height: toNumber(event.currentTarget.value, placement.height),
              })
            }
            type="number"
            value={placement.height}
          />
        </label>
      </div>

      <section
        className="pawn-sheet-zone pawn-sheet-zone--card"
        onDragOver={handleDragOver}
        onDrop={(event) => handleDrop(event, "character")}
      >
        <h2>
          <CreditCard aria-hidden="true" size={15} />
          Character Card
        </h2>
        {characterCard ? (
          <div className="sheet-card-slot">
            <img alt="" src={getAssetPreviewUrl(characterCard)} />
            <strong title={characterCard.name}>{characterCard.name}</strong>
          </div>
        ) : (
          <p className="empty-state">No character card</p>
        )}
      </section>

      <section
        className="pawn-sheet-zone"
        onDragOver={handleDragOver}
        onDrop={(event) => handleDrop(event, "held")}
      >
        <h2>
          <CreditCard aria-hidden="true" size={15} />
          Held Cards
        </h2>
        {heldCards.length > 0 ? (
          <div className="held-card-grid">
            {heldCards.map(({ asset, index }) => (
              <article className="held-card" key={`${asset.id}-${index}`}>
                <img alt="" src={getAssetPreviewUrl(asset)} />
                <strong title={asset.name}>{asset.name}</strong>
                <button
                  aria-label={`Remove ${asset.name}`}
                  className="icon-only"
                  onClick={() => removePawnHeldCard(placement.id, index)}
                  title="Remove card"
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={14} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No held cards</p>
        )}
      </section>

      <section
        className="pawn-sheet-zone"
        onDragOver={handleDragOver}
        onDrop={(event) => handleDrop(event, "counter")}
      >
        <h2>
          <Shield aria-hidden="true" size={15} />
          Tokens / Dice
        </h2>
        {counters.length > 0 ? (
          <div className="token-counter-grid">
            {counters.map(({ asset, count }) => (
              <button
                className="token-counter"
                key={asset.id}
                onClick={() => adjustPawnCounter(placement.id, asset.id, 1)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  adjustPawnCounter(placement.id, asset.id, -1);
                }}
                type="button"
              >
                <img alt="" src={getAssetPreviewUrl(asset)} />
                <span>{count}</span>
                <small>
                  {formatRemainingCopies(
                    getAssetRemainingCopies(
                      assets,
                      assetPlacements,
                      pawnSheets,
                      asset.id,
                    ),
                  )}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-state">No tokens</p>
        )}
      </section>

      <button
        className="danger-button"
        onClick={deleteSelectedPlacement}
        type="button"
      >
        <Trash2 aria-hidden="true" size={15} />
        <span>Delete pawn</span>
      </button>
    </section>
  );
}

interface TokenQuickPickProps {
  assetPlacements: AssetPlacement[];
  assets: UploadedImageAsset[];
  filteredAssets: UploadedImageAsset[];
  isDisabled: boolean;
  onSearchChange: (value: string) => void;
  onSelectAsset: (assetId: string | null) => void;
  pawnSheets: Record<string, PawnSheet>;
  search: string;
  selectedAssetId: string | null;
}

function TokenQuickPick({
  assetPlacements,
  assets,
  filteredAssets,
  isDisabled,
  onSearchChange,
  onSelectAsset,
  pawnSheets,
  search,
  selectedAssetId,
}: TokenQuickPickProps) {
  if (assets.length === 0) {
    return null;
  }

  return (
    <section className="token-quick-pick" aria-label="Token quick pick">
      <div className="token-quick-pick__heading">
        <h3>
          <Shield aria-hidden="true" size={14} />
          Tokens
        </h3>
        <span>{assets.length}</span>
      </div>
      <label className="token-quick-search">
        <Search aria-hidden="true" size={14} />
        <input
          aria-label="Search token assets"
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder="Search tokens"
          type="search"
          value={search}
        />
      </label>
      <div className="token-quick-grid">
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => (
            <TokenQuickPickItem
              asset={asset}
              isDisabled={isDisabled}
              isSelected={selectedAssetId === asset.id}
              key={asset.id}
              onSelectAsset={onSelectAsset}
              remainingCopies={getAssetRemainingCopies(
                assets,
                assetPlacements,
                pawnSheets,
                asset.id,
              )}
            />
          ))
        ) : (
          <p className="empty-state">No matching tokens</p>
        )}
      </div>
    </section>
  );
}

interface TokenQuickPickItemProps {
  asset: UploadedImageAsset;
  isDisabled: boolean;
  isSelected: boolean;
  onSelectAsset: (assetId: string | null) => void;
  remainingCopies: number;
}

function TokenQuickPickItem({
  asset,
  isDisabled,
  isSelected,
  onSelectAsset,
  remainingCopies,
}: TokenQuickPickItemProps) {
  const handleDragStart = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("application/x-lorecanvas-asset", asset.id);
      event.dataTransfer.setData("text/plain", asset.name);
    },
    [asset.id, asset.name, isDisabled],
  );

  return (
    <button
      aria-pressed={isSelected}
      className="token-quick-item"
      data-selected={isSelected}
      disabled={isDisabled}
      draggable={!isDisabled}
      onClick={() => onSelectAsset(isSelected ? null : asset.id)}
      onDragStart={handleDragStart}
      title={asset.name}
      type="button"
    >
      {asset.thumbnailUrl ? (
        <img alt="" decoding="async" loading="lazy" src={asset.thumbnailUrl} />
      ) : (
        <span aria-hidden="true" className="asset-thumb-pending">
          <ImageIcon size={18} />
        </span>
      )}
      <span>{asset.name}</span>
      <small>{formatRemainingCopies(remainingCopies)}</small>
    </button>
  );
}

interface AssetItemProps {
  asset: UploadedImageAsset;
  copyCount: number;
  isBoardBackground: boolean;
  onDelete: (assetId: string) => void;
  onSetBoard: (assetId: string) => void;
  onUpdateCategory: (assetId: string, category: ResourceCategory) => void;
  onUpdatePlacementConfig: (
    assetId: string,
    patch: Partial<
      Pick<UploadedImageAsset, "placementWidth" | "placementHeight" | "maxCopies">
    >,
  ) => void;
}

function AssetItem({
  asset,
  copyCount,
  isBoardBackground,
  onDelete,
  onSetBoard,
  onUpdateCategory,
  onUpdatePlacementConfig,
}: AssetItemProps) {
  const isPlaceable = canPlaceAssetForCategory(asset.category);
  const handleDragStart = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isPlaceable) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("application/x-lorecanvas-asset", asset.id);
      event.dataTransfer.setData("text/plain", asset.name);
    },
    [asset.id, asset.name, isPlaceable],
  );

  return (
    <article
      className="asset-item"
      data-draggable={isPlaceable}
      draggable={isPlaceable}
      onDragStart={handleDragStart}
    >
      {asset.thumbnailUrl ? (
        <img alt="" decoding="async" loading="lazy" src={asset.thumbnailUrl} />
      ) : (
        <span aria-hidden="true" className="asset-thumb-pending">
          <ImageIcon size={20} />
        </span>
      )}
      <div className="asset-item__body">
        <strong title={asset.name}>{asset.name}</strong>
        <span>{formatAssetMeta(asset)}</span>
        <label className="asset-category">
          <span>Category</span>
          <select
            aria-label={`${asset.name} category`}
            onChange={(event) =>
              onUpdateCategory(
                asset.id,
                event.currentTarget.value as ResourceCategory,
              )
            }
            value={asset.category}
          >
            {RESOURCE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {RESOURCE_CATEGORY_DEFINITIONS[category].label}
              </option>
            ))}
          </select>
        </label>
        {isPlaceable ? (
          <>
            <span className="copy-meter">
              {copyCount} / {asset.maxCopies} copies
            </span>
            <div className="piece-controls">
              <label>
                <span>W</span>
                <input
                  min={12}
                  max={640}
                  onChange={(event) =>
                    onUpdatePlacementConfig(asset.id, {
                      placementWidth: toNumber(
                        event.currentTarget.value,
                        asset.placementWidth,
                      ),
                    })
                  }
                  type="number"
                  value={asset.placementWidth}
                />
              </label>
              <label>
                <span>H</span>
                <input
                  min={12}
                  max={640}
                  onChange={(event) =>
                    onUpdatePlacementConfig(asset.id, {
                      placementHeight: toNumber(
                        event.currentTarget.value,
                        asset.placementHeight,
                      ),
                    })
                  }
                  type="number"
                  value={asset.placementHeight}
                />
              </label>
              <label>
                <span>Max</span>
                <input
                  min={1}
                  max={999}
                  onChange={(event) =>
                    onUpdatePlacementConfig(asset.id, {
                      maxCopies: toNumber(
                        event.currentTarget.value,
                        asset.maxCopies,
                      ),
                    })
                  }
                  type="number"
                  value={asset.maxCopies}
                />
              </label>
            </div>
          </>
        ) : null}
        <div className="asset-actions">
          <button
            className="mini-button"
            data-active={isBoardBackground}
            onClick={() => onSetBoard(asset.id)}
            type="button"
          >
            <ImageIcon aria-hidden="true" size={14} />
            <span>{isBoardBackground ? "Board" : "Set Board"}</span>
          </button>
          <button
            aria-label={`Delete ${asset.name}`}
            className="mini-button mini-button--danger"
            onClick={() => onDelete(asset.id)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function createEmptyPawnSheet(): PawnSheet {
  return {
    heldCardAssetIds: [],
    counters: [],
  };
}

function findAsset(assets: UploadedImageAsset[], assetId: string) {
  return assets.find((asset) => asset.id === assetId) ?? null;
}

function getDraggedAssetId(event: DragEvent<HTMLElement>) {
  return event.dataTransfer.types.includes("application/x-lorecanvas-asset")
    ? event.dataTransfer.getData("application/x-lorecanvas-asset")
    : "";
}

function getAssetRemainingCopies(
  assets: UploadedImageAsset[],
  assetPlacements: AssetPlacement[],
  pawnSheets: Record<string, PawnSheet>,
  assetId: string,
) {
  const asset = findAsset(assets, assetId);

  if (!asset) {
    return 0;
  }

  return Math.max(
    0,
    asset.maxCopies - countAssetUsage(assetPlacements, pawnSheets, assetId),
  );
}

function countAssetUsage(
  assetPlacements: AssetPlacement[],
  pawnSheets: Record<string, PawnSheet>,
  assetId: string,
) {
  let count = assetPlacements.filter(
    (placement) => placement.assetId === assetId,
  ).length;

  for (const sheet of Object.values(pawnSheets)) {
    if (sheet.characterCardAssetId === assetId) {
      count += 1;
    }

    count += sheet.heldCardAssetIds.filter(
      (heldAssetId) => heldAssetId === assetId,
    ).length;
    count +=
      sheet.counters.find((counter) => counter.assetId === assetId)?.count ?? 0;
  }

  return count;
}

function formatRemainingCopies(remaining: number) {
  return remaining >= 900 ? "unlimited" : `${remaining} left`;
}

function formatCardZoneKind(kind: CardZoneKind) {
  return kind.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function parseZoneIdList(value: string) {
  return value
    .split(/[\s,]+/)
    .map((zoneId) => zoneId.trim())
    .filter(Boolean);
}

function getAssetPreviewUrl(asset: UploadedImageAsset) {
  // Bounded preview slots (selected piece, pawn sheet) may fall back to the
  // full image while the thumbnail is still being generated; unbounded lists
  // must only render asset.thumbnailUrl.
  return asset.thumbnailUrl ?? asset.url;
}

function getFileRelativePath(file: File) {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
}

interface DiceFaceFolder {
  assets: UploadedImageAsset[];
  key: string;
  name: string;
}

function getDiceFaceFolders(assets: UploadedImageAsset[]): DiceFaceFolder[] {
  const groups = new Map<string, UploadedImageAsset[]>();

  for (const asset of assets) {
    if (asset.category !== "TOKEN" || !asset.sourcePath) {
      continue;
    }

    const fileName = getPathFileName(asset.sourcePath);

    if (/source[-_ ]?uv/i.test(fileName)) {
      continue;
    }

    const folder = getPathFolder(asset.sourcePath);

    if (!folder) {
      continue;
    }

    const nextAssets = groups.get(folder) ?? [];
    nextAssets.push(asset);
    groups.set(folder, nextAssets);
  }

  return Array.from(groups.entries())
    .map(([key, groupAssets]) => ({
      key,
      name: getPathFileName(key) || key,
      assets: [...groupAssets].sort((left, right) =>
        (left.sourcePath ?? left.name).localeCompare(right.sourcePath ?? right.name),
      ),
    }))
    .filter((group) => group.assets.length >= 2)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function getPathFolder(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");

  return index > 0 ? normalized.slice(0, index) : "";
}

function getPathFileName(path: string) {
  return path.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "";
}

function getLastRoll(diceState: DiceState) {
  return (
    (diceState.lastRollId
      ? diceState.rollHistory.find((roll) => roll.id === diceState.lastRollId)
      : undefined) ??
    diceState.rollHistory[diceState.rollHistory.length - 1] ??
    null
  );
}

function countPoolDice(pool: DicePool) {
  return pool.dice.reduce((total, poolDie) => total + poolDie.count, 0);
}

function getFaceAsset(assets: UploadedImageAsset[], face: DieFaceRef) {
  return assets.find((asset) => asset.id === face.assetId) ?? null;
}

function formatDieFaceLabel(face: DieFaceRef) {
  return face.label ?? face.faceId ?? face.id;
}

function totalBytes(assets: UploadedImageAsset[]) {
  return assets.reduce((total, asset) => total + asset.size, 0);
}

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const unit = units[exponent] ?? "B";

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${
    unit
  }`;
}

function formatAssetMeta(asset: UploadedImageAsset) {
  const size = formatBytes(asset.size);

  if (!asset.width || !asset.height) {
    return size;
  }

  return `${asset.width} x ${asset.height} / ${size}`;
}

function formatCoordinate(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function toPercentNumber(value: number) {
  return Math.round(value * 1000) / 10;
}

function toNormalizedPercent(value: string, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, parsed / 100));
}

function getStateString(state: JsonRecord, key: string) {
  const value = state[key];

  if (value === undefined || value === null) {
    return "";
  }

  return typeof value === "string" ? value : String(value);
}

function getStateNumber(state: JsonRecord, key: string) {
  const value = state[key];

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getTokenPlacementCount(entity: Entity | null) {
  const value = entity?.state.count;

  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 1;
}

function getStateBoolean(state: JsonRecord, key: string) {
  return state[key] === true;
}

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatJson(value: JsonRecord) {
  return JSON.stringify(value, null, 2);
}

function isPlainObject(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Action failed.";
}
