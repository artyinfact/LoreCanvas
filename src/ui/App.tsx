import {
  Box,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  ImageIcon,
  Link2,
  MapPinPlus,
  MousePointer2,
  Network,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { BoardCanvas } from "./BoardCanvas";
import { getSelectedLocation, useBoardStore } from "../state/boardStore";
import type {
  AccessoryTemplate,
  BoardTool,
  UploadedImageAsset,
} from "../state/boardStore";

const TOOL_OPTIONS: Array<{
  id: BoardTool;
  label: string;
  Icon: typeof MousePointer2;
}> = [
  { id: "select", label: "Select", Icon: MousePointer2 },
  { id: "location", label: "Add Location", Icon: MapPinPlus },
  { id: "edge", label: "Add Edge", Icon: Network },
];

export function App() {
  const board = useBoardStore((state) => state.board);
  const assets = useBoardStore((state) => state.assets);
  const accessoryTemplates = useBoardStore((state) => state.accessoryTemplates);
  const templatePlacements = useBoardStore((state) => state.templatePlacements);
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
  const createAccessoryTemplate = useBoardStore(
    (state) => state.createAccessoryTemplate,
  );
  const updateAccessoryTemplate = useBoardStore(
    (state) => state.updateAccessoryTemplate,
  );
  const deleteAccessoryTemplate = useBoardStore(
    (state) => state.deleteAccessoryTemplate,
  );
  const updateTemplatePlacement = useBoardStore(
    (state) => state.updateTemplatePlacement,
  );
  const deleteSelectedPlacement = useBoardStore(
    (state) => state.deleteSelectedPlacement,
  );
  const selectedLocation = getSelectedLocation(board, selectedLocationId);
  const selectedPlacement =
    templatePlacements.find((placement) => placement.id === selectedPlacementId) ??
    null;
  const selectedPlacementTemplate = selectedPlacement
    ? accessoryTemplates.find(
        (template) => template.id === selectedPlacement.templateId,
      ) ?? null
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
  const handleImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const files = Array.from(input.files ?? []).filter((file) =>
        file.type.startsWith("image/"),
      );

      for (const [index, file] of files.entries()) {
        const url = URL.createObjectURL(file);
        const dimensions = await readImageDimensions(url);
        const asset: UploadedImageAsset = {
          id: createUploadId(file, index),
          name: file.name,
          url,
          mimeType: file.type,
          size: file.size,
          ...dimensions,
        };

        addAsset(asset);

        if (!useBoardStore.getState().board.background) {
          setBackgroundAsset(asset.id);
        }
      }

      input.value = "";
    },
    [addAsset, setBackgroundAsset],
  );
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
            <dt>Pieces</dt>
            <dd>{accessoryTemplates.length}</dd>
          </div>
        </dl>
        <label className="icon-button icon-button--primary">
          <Upload aria-hidden="true" size={18} />
          <span>Import images</span>
          <input
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            type="file"
          />
        </label>
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
              id="pieces"
              isCollapsed={collapsedSections.pieces}
              onToggle={toggleSection}
              title="Piece Templates"
              trailing={<span>{accessoryTemplates.length}</span>}
            >
              <div className="piece-list">
                {accessoryTemplates.length === 0 ? (
                  <p className="empty-state">No piece templates</p>
                ) : (
                  accessoryTemplates.map((template) => (
                    <PieceTemplateItem
                      copyCount={
                        templatePlacements.filter(
                          (placement) => placement.templateId === template.id,
                        ).length
                      }
                      deleteAccessoryTemplate={deleteAccessoryTemplate}
                      key={template.id}
                      template={template}
                      updateAccessoryTemplate={updateAccessoryTemplate}
                    />
                  ))
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="assets"
              isCollapsed={collapsedSections.assets}
              onToggle={toggleSection}
              title="Image Assets"
              trailing={<span>{formatBytes(totalBytes(assets))}</span>}
            >
              <div className="asset-list">
                {assets.length === 0 ? (
                  <p className="empty-state">No images imported</p>
                ) : (
                  assets.map((asset) => (
                    <article className="asset-item" key={asset.id}>
                      <img alt="" src={asset.url} />
                      <div className="asset-item__body">
                        <strong title={asset.name}>{asset.name}</strong>
                        <span>{formatAssetMeta(asset)}</span>
                        <div className="asset-actions">
                          <button
                            className="mini-button"
                            data-active={board.background?.assetId === asset.id}
                            onClick={() => setBackgroundAsset(asset.id)}
                            type="button"
                          >
                            <ImageIcon aria-hidden="true" size={14} />
                            <span>
                              {board.background?.assetId === asset.id
                                ? "Background"
                                : "Set"}
                            </span>
                          </button>
                          <button
                            className="mini-button"
                            onClick={() => createAccessoryTemplate(asset.id)}
                            type="button"
                          >
                            <Box aria-hidden="true" size={14} />
                            <span>Piece</span>
                          </button>
                          <button
                            aria-label={`Delete ${asset.name}`}
                            className="mini-button mini-button--danger"
                            onClick={() => removeAsset(asset.id)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
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
          <BoardCanvas />
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
            <CollapsibleSection
              id="placement"
              isCollapsed={collapsedSections.placement}
              onToggle={toggleSection}
              title="Placed Piece"
              trailing={
                selectedPlacement ? <span>{selectedPlacement.id}</span> : null
              }
            >
              {selectedPlacement && selectedPlacementTemplate ? (
                <div className="inspector-stack">
                  <div className="selected-piece-card">
                    <img alt="" src={selectedPlacementTemplate.imageUrl} />
                    <div>
                      <strong>{selectedPlacementTemplate.name}</strong>
                      <span>{selectedPlacement.id}</span>
                    </div>
                  </div>
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
                          updateTemplatePlacement(selectedPlacement.id, {
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
                          updateTemplatePlacement(selectedPlacement.id, {
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
                    <span>Delete placed piece</span>
                  </button>
                </div>
              ) : (
                <p className="empty-state">No placed piece selected</p>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="location"
              isCollapsed={collapsedSections.location}
              onToggle={toggleSection}
              title="Location"
              trailing={selectedLocation ? <span>{selectedLocation.id}</span> : null}
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

interface PieceTemplateItemProps {
  copyCount: number;
  deleteAccessoryTemplate: (templateId: string) => void;
  template: AccessoryTemplate;
  updateAccessoryTemplate: (
    templateId: string,
    patch: Partial<
      Pick<AccessoryTemplate, "name" | "width" | "height" | "maxCopies">
    >,
  ) => void;
}

function PieceTemplateItem({
  copyCount,
  deleteAccessoryTemplate,
  template,
  updateAccessoryTemplate,
}: PieceTemplateItemProps) {
  const handleDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(
        "application/x-lorecanvas-template",
        template.id,
      );
      event.dataTransfer.setData("text/plain", template.name);
    },
    [template.id, template.name],
  );

  return (
    <article className="piece-item">
      <div className="piece-item__header">
        <button
          aria-label={`Drag ${template.name} to board`}
          className="drag-handle"
          draggable
          onDragStart={handleDragStart}
          title="Drag to board"
          type="button"
        >
          <GripVertical aria-hidden="true" size={16} />
        </button>
        <img alt="" src={template.imageUrl} />
        <div>
          <input
            aria-label={`${template.id} name`}
            onChange={(event) =>
              updateAccessoryTemplate(template.id, {
                name: event.currentTarget.value,
              })
            }
            value={template.name}
          />
          <span>
            {copyCount} / {template.maxCopies} copies
          </span>
        </div>
        <button
          aria-label={`Delete ${template.name}`}
          className="icon-only"
          onClick={() => deleteAccessoryTemplate(template.id)}
          title="Delete piece template"
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} />
        </button>
      </div>
      <div className="piece-controls">
        <label>
          <span>W</span>
          <input
            min={12}
            max={640}
            onChange={(event) =>
              updateAccessoryTemplate(template.id, {
                width: toNumber(event.currentTarget.value, template.width),
              })
            }
            type="number"
            value={template.width}
          />
        </label>
        <label>
          <span>H</span>
          <input
            min={12}
            max={640}
            onChange={(event) =>
              updateAccessoryTemplate(template.id, {
                height: toNumber(event.currentTarget.value, template.height),
              })
            }
            type="number"
            value={template.height}
          />
        </label>
        <label>
          <span>Max</span>
          <input
            min={1}
            max={999}
            onChange={(event) =>
              updateAccessoryTemplate(template.id, {
                maxCopies: toNumber(
                  event.currentTarget.value,
                  template.maxCopies,
                ),
              })
            }
            type="number"
            value={template.maxCopies}
          />
        </label>
      </div>
    </article>
  );
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

function createUploadId(file: File, index: number) {
  const randomId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);

  return `asset-${index + 1}-${safeName || "image"}-${randomId}`;
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
