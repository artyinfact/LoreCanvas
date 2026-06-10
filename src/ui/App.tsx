import {
  CreditCard,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Download,
  FileInput,
  FolderOpen,
  ImageIcon,
  Link2,
  MapPinPlus,
  MousePointer2,
  Network,
  Minus,
  Plus,
  Play,
  Pencil,
  RotateCcw,
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
  useState,
} from "react";
import type { ChangeEvent, DragEvent } from "react";
import { getSelectedLocation, useBoardStore } from "../state/boardStore";
import {
  canPlaceAssetForCategory,
  RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_DEFINITIONS,
} from "../engine/entity";
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

const LOCAL_SCENARIO_STORAGE_KEY = "lorecanvas:last-scenario";
const EMPTY_JSON_STATE: JsonRecord = {};

const TOOL_OPTIONS: Array<{
  id: BoardTool;
  label: string;
  Icon: typeof MousePointer2;
}> = [
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "location", label: "Add Location", Icon: MapPinPlus },
  { id: "edge", label: "Add Edge", Icon: Network },
];

const BoardCanvas = lazy(() =>
  import("./BoardCanvas").then((module) => ({ default: module.BoardCanvas })),
);

interface ImageImportOptions {
  category?: ResourceCategory;
  inferCategoryFromPath?: boolean;
}

export function App() {
  const mode = useBoardStore((state) => state.mode);
  const board = useBoardStore((state) => state.board);
  const entityState = useBoardStore((state) => state.entityState);
  const assets = useBoardStore((state) => state.assets);
  const assetPlacements = useBoardStore((state) => state.assetPlacements);
  const pawnSheets = useBoardStore((state) => state.pawnSheets);
  const boardState = useBoardStore((state) => state.boardState);
  const locationStates = useBoardStore((state) => state.locationStates);
  const edgeStates = useBoardStore((state) => state.edgeStates);
  const frozenSetup = useBoardStore((state) => state.frozenSetup);
  const selectedLocationId = useBoardStore((state) => state.selectedLocationId);
  const selectedPlacementId = useBoardStore((state) => state.selectedPlacementId);
  const activeTool = useBoardStore((state) => state.activeTool);
  const boardZoom = useBoardStore((state) => state.boardZoom);
  const isCreationPanelCollapsed = useBoardStore(
    (state) => state.isCreationPanelCollapsed,
  );
  const isInspectorCollapsed = useBoardStore(
    (state) => state.isInspectorCollapsed,
  );
  const edgeDraftFromId = useBoardStore((state) => state.edgeDraftFromId);
  const lastError = useBoardStore((state) => state.lastError);
  const addAsset = useBoardStore((state) => state.addAsset);
  const removeAsset = useBoardStore((state) => state.removeAsset);
  const updateAssetCategory = useBoardStore((state) => state.updateAssetCategory);
  const updateAssetPlacementConfig = useBoardStore(
    (state) => state.updateAssetPlacementConfig,
  );
  const setBackgroundAsset = useBoardStore((state) => state.setBackgroundAsset);
  const setActiveTool = useBoardStore((state) => state.setActiveTool);
  const setBoardZoom = useBoardStore((state) => state.setBoardZoom);
  const resetBoardView = useBoardStore((state) => state.resetBoardView);
  const setCreationPanelCollapsed = useBoardStore(
    (state) => state.setCreationPanelCollapsed,
  );
  const setInspectorCollapsed = useBoardStore(
    (state) => state.setInspectorCollapsed,
  );
  const updateSelectedLocationName = useBoardStore(
    (state) => state.updateSelectedLocationName,
  );
  const deleteSelectedLocation = useBoardStore(
    (state) => state.deleteSelectedLocation,
  );
  const updateEdgeLabel = useBoardStore((state) => state.updateEdgeLabel);
  const deleteEdge = useBoardStore((state) => state.deleteEdge);
  const updateAssetPlacement = useBoardStore(
    (state) => state.updateAssetPlacement,
  );
  const deleteSelectedPlacement = useBoardStore(
    (state) => state.deleteSelectedPlacement,
  );
  const setPawnCharacterCard = useBoardStore(
    (state) => state.setPawnCharacterCard,
  );
  const addPawnHeldCard = useBoardStore((state) => state.addPawnHeldCard);
  const removePawnHeldCard = useBoardStore((state) => state.removePawnHeldCard);
  const adjustPawnCounter = useBoardStore((state) => state.adjustPawnCounter);
  const updateBoardState = useBoardStore((state) => state.updateBoardState);
  const updateEntityObjectState = useBoardStore(
    (state) => state.updateEntityObjectState,
  );
  const updateLocationState = useBoardStore((state) => state.updateLocationState);
  const updateEdgeState = useBoardStore((state) => state.updateEdgeState);
  const enterRunMode = useBoardStore((state) => state.enterRunMode);
  const returnToEditMode = useBoardStore((state) => state.returnToEditMode);
  const moveEntityToLocation = useBoardStore((state) => state.moveEntityToLocation);
  const adjustEntityCounter = useBoardStore((state) => state.adjustEntityCounter);
  const moveCardToZone = useBoardStore((state) => state.moveCardToZone);
  const setLastError = useBoardStore((state) => state.setLastError);
  const selectedLocation = getSelectedLocation(board, selectedLocationId);
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
  const handleImageImport = useCallback(
    async (
      event: ChangeEvent<HTMLInputElement>,
      options: ImageImportOptions = {},
    ) => {
      const input = event.currentTarget;
      const files = Array.from(input.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );
      const batchId = createImportBatchId();

      for (const [index, file] of files.entries()) {
        const url = URL.createObjectURL(file);
        const dimensions = await readImageDimensions(url);
        const relativePath = getFileRelativePath(file);
        const category =
          options.category ??
          (options.inferCategoryFromPath
            ? inferResourceCategoryFromPath(relativePath || file.name)
            : "OTHER");
        const asset = createImportedImageAsset({
          batchId,
          category,
          dimensions,
          file,
          index,
          url,
        });

        addAsset(asset);

        if (
          asset.category === "BOARD" &&
          !useBoardStore.getState().board.background
        ) {
          setBackgroundAsset(asset.id);
        }
      }

      input.value = "";
    },
    [addAsset, setBackgroundAsset],
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
              id="tools"
              isCollapsed={collapsedSections.tools}
              onToggle={toggleSection}
              title="Tools"
              trailing={
                edgeDraftFromId ? (
                  <span className="draft-pill">
                    <Link2 aria-hidden="true" size={14} />
                    {edgeDraftFromId}
                  </span>
                ) : null
              }
            >
              <div className="tool-switcher" role="toolbar">
                {TOOL_OPTIONS.map(({ id, label, Icon }) => (
                  <button
                    aria-pressed={activeTool === id}
                    className="tool-button"
                    data-active={activeTool === id}
                    key={id}
                    onClick={() => setActiveTool(id)}
                    title={label}
                    type="button"
                  >
                    <Icon aria-hidden="true" size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

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
              />
              <div className="asset-list">
                {assets.length === 0 ? (
                  <p className="empty-state">No images imported</p>
                ) : (
                  RESOURCE_CATEGORIES.map((category) => {
                    const categoryAssets = assets.filter(
                      (asset) => asset.category === category,
                    );

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
                        {categoryAssets.map((asset) => (
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
                      </section>
                    );
                  })
                )}
              </div>
            </CollapsibleSection>

            {lastError ? <p className="error-banner">{lastError}</p> : null}
          </div>
        </aside>

        <section className="stage-region" aria-label="Map canvas">
          <div className="stage-toolbar" aria-label="Map zoom controls">
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
            <output className="zoom-value">{Math.round(boardZoom * 100)}%</output>
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
          </div>
          <Suspense
            fallback={<div className="board-canvas-loading">Loading map...</div>}
          >
            <BoardCanvas />
          </Suspense>
        </section>

        <aside
          aria-label="Board inspector"
          className="tool-panel tool-panel--inspector"
        >
          <button
            aria-expanded={!isInspectorCollapsed}
            className="panel-collapse-button"
            onClick={() => setInspectorCollapsed(!isInspectorCollapsed)}
            type="button"
          >
            <ChevronsRight aria-hidden="true" size={17} />
            <span>Inspector</span>
          </button>

          <div className="inspector-content">
            <ModeStatus mode={mode} frozenSetup={frozenSetup} />
            <ScenarioStatePanels
              boardState={boardState}
              connectedEdges={connectedEdges}
              edgeStates={edgeStates}
              mode={mode}
              selectedEntity={selectedEntity}
              selectedLocation={selectedLocation}
              selectedPlacement={selectedPlacement}
              locationStates={locationStates}
              updateBoardState={updateBoardState}
              updateEdgeState={updateEdgeState}
              updateEntityObjectState={updateEntityObjectState}
              updateLocationState={updateLocationState}
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
            ) : (
              <>
                <CollapsibleSection
                  id="placement"
                  isCollapsed={collapsedSections.placement}
                  onToggle={toggleSection}
                  title="Placed Entity"
                  trailing={
                    selectedPlacement ? <span>{selectedPlacement.id}</span> : null
                  }
                >
                  {selectedPlacement && selectedPlacementAsset ? (
                    <div className="inspector-stack">
                      <div className="selected-piece-card">
                        <img alt="" src={selectedPlacementAsset.url} />
                        <div>
                          <strong>{selectedPlacementAsset.name}</strong>
                          <span>
                            {selectedPlacement.category} /{" "}
                            {selectedPlacement.entityId}
                          </span>
                        </div>
                      </div>
                      {selectedPlacement.locationId ? (
                        <p className="binding-pill">
                          Bound to {selectedPlacement.locationId}
                        </p>
                      ) : null}
                      <div className="coordinate-row">
                        <span>X {formatCoordinate(selectedPlacement.x)}</span>
                        <span>Y {formatCoordinate(selectedPlacement.y)}</span>
                      </div>
                      <div className="piece-controls piece-controls--wide">
                        <label>
                          <span>W</span>
                          <input
                            min={12}
                            max={640}
                            onChange={(event) =>
                              updateAssetPlacement(selectedPlacement.id, {
                                width: toNumber(
                                  event.currentTarget.value,
                                  selectedPlacement.width,
                                ),
                              })
                            }
                            type="number"
                            value={selectedPlacement.width}
                          />
                        </label>
                        <label>
                          <span>H</span>
                          <input
                            min={12}
                            max={640}
                            onChange={(event) =>
                              updateAssetPlacement(selectedPlacement.id, {
                                height: toNumber(
                                  event.currentTarget.value,
                                  selectedPlacement.height,
                                ),
                              })
                            }
                            type="number"
                            value={selectedPlacement.height}
                          />
                        </label>
                      </div>
                      <button
                        className="danger-button"
                        onClick={deleteSelectedPlacement}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                        <span>Delete placed entity</span>
                      </button>
                    </div>
                  ) : (
                    <p className="empty-state">No placed entity selected</p>
                  )}
                </CollapsibleSection>

                <CollapsibleSection
                  id="location"
                  isCollapsed={collapsedSections.location}
                  onToggle={toggleSection}
                  title="Location"
                  trailing={
                    selectedLocation ? <span>{selectedLocation.id}</span> : null
                  }
                >
                  {selectedLocation ? (
                    <div className="inspector-stack">
                      <label className="field">
                        <span>Name</span>
                        <input
                          onChange={(event) =>
                            updateSelectedLocationName(event.currentTarget.value)
                          }
                          value={selectedLocation.name}
                        />
                      </label>
                      <div className="coordinate-row">
                        <span>X {formatCoordinate(selectedLocation.x)}</span>
                        <span>Y {formatCoordinate(selectedLocation.y)}</span>
                      </div>
                      <button
                        className="danger-button"
                        onClick={deleteSelectedLocation}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                        <span>Delete location</span>
                      </button>
                    </div>
                  ) : (
                    <p className="empty-state">No location selected</p>
                  )}
                </CollapsibleSection>

                <CollapsibleSection
                  id="edges"
                  isCollapsed={collapsedSections.edges}
                  onToggle={toggleSection}
                  title="Edges"
                  trailing={<span>{connectedEdges.length}</span>}
                >
                  <div className="edge-list">
                    {connectedEdges.length === 0 ? (
                      <p className="empty-state">No connected edges</p>
                    ) : (
                      connectedEdges.map((edge) => (
                        <article className="edge-item" key={edge.id}>
                          <div>
                            <strong>{edge.id}</strong>
                            <span>
                              {edge.fromId} / {edge.toId}
                            </span>
                          </div>
                          <input
                            aria-label={`${edge.id} label`}
                            onChange={(event) =>
                              updateEdgeLabel(edge.id, event.currentTarget.value)
                            }
                            placeholder="Label"
                            value={edge.label ?? ""}
                          />
                          <button
                            aria-label={`Delete ${edge.id}`}
                            className="icon-only"
                            onClick={() => deleteEdge(edge.id)}
                            title="Delete edge"
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={15} />
                          </button>
                        </article>
                      ))
                    )}
                  </div>
                </CollapsibleSection>
              </>
            )}
          </div>
        </aside>

        {isInspectorCollapsed ? (
          <button
            aria-label="Expand inspector"
            className="inspector-tab"
            onClick={() => setInspectorCollapsed(false)}
            type="button"
          >
            <ChevronsRight aria-hidden="true" size={18} />
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

interface ScenarioStatePanelsProps {
  boardState: JsonRecord;
  connectedEdges: BoardEdge[];
  edgeStates: Record<string, JsonRecord>;
  mode: ScenarioMode;
  selectedEntity: Entity | null;
  selectedLocation: BoardLocation | null;
  selectedPlacement: AssetPlacement | null;
  locationStates: Record<string, JsonRecord>;
  updateBoardState: (patch: JsonRecord) => void;
  updateEdgeState: (edgeId: string, patch: JsonRecord) => void;
  updateEntityObjectState: (entityId: string, patch: JsonRecord) => void;
  updateLocationState: (locationId: string, patch: JsonRecord) => void;
}

function ScenarioStatePanels({
  boardState,
  connectedEdges,
  edgeStates,
  mode,
  selectedEntity,
  selectedLocation,
  selectedPlacement,
  locationStates,
  updateBoardState,
  updateEdgeState,
  updateEntityObjectState,
  updateLocationState,
}: ScenarioStatePanelsProps) {
  return (
    <section className="state-panel-stack" aria-label="Scenario state panels">
      <JsonStateEditor
        description={
          mode === "edit"
            ? "Global setup state"
            : "Current global runtime state"
        }
        title="Board State"
        value={boardState}
        onApply={updateBoardState}
      />
      <JsonStateEditor
        description={
          selectedEntity
            ? `${selectedEntity.id} / ${selectedPlacement?.category ?? selectedEntity.type}`
            : "Select an object"
        }
        isDisabled={!selectedEntity}
        title="Object State"
        value={selectedEntity?.state ?? EMPTY_JSON_STATE}
        onApply={(patch) => {
          if (selectedEntity) {
            updateEntityObjectState(selectedEntity.id, patch);
          }
        }}
      />
      <JsonStateEditor
        description={
          selectedLocation ? selectedLocation.id : "Select a Location"
        }
        isDisabled={!selectedLocation}
        title="Location State"
        value={
          selectedLocation
            ? locationStates[selectedLocation.id] ?? {}
            : EMPTY_JSON_STATE
        }
        onApply={(patch) => {
          if (selectedLocation) {
            updateLocationState(selectedLocation.id, patch);
          }
        }}
      />
      <section className="state-panel">
        <div className="state-panel__heading">
          <h2>Edge State</h2>
          <span>{connectedEdges.length} connected</span>
        </div>
        {connectedEdges.length === 0 ? (
          <p className="empty-state">Select a Location with connected Edges</p>
        ) : (
          <div className="edge-state-list">
            {connectedEdges.map((edge) => (
              <JsonStateEditor
                description={`${edge.fromId} / ${edge.toId}`}
                key={edge.id}
                title={edge.id}
                value={edgeStates[edge.id] ?? {}}
                onApply={(patch) => updateEdgeState(edge.id, patch)}
              />
            ))}
          </div>
        )}
      </section>
    </section>
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
  ) => void | Promise<void>;
}

const DIRECTORY_INPUT_PROPS = {
  directory: "",
  webkitdirectory: "",
} as Record<string, string>;

function AssetImportPanel({ isDisabled, onImport }: AssetImportPanelProps) {
  return (
    <div className="asset-import-panel" data-disabled={isDisabled}>
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
        <img alt="" src={placementAsset.url} />
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
            <img alt="" src={characterCard.url} />
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
                <img alt="" src={asset.url} />
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
                <img alt="" src={asset.url} />
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
      <img alt="" src={asset.url} />
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

function readImageDimensions(url: string): Promise<{
  width?: number;
  height?: number;
}> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      resolve({});
    };
    image.src = url;
  });
}

function getFileRelativePath(file: File) {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
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
