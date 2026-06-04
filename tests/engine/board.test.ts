import { describe, expect, it } from "vitest";
import {
  addEdge,
  addLocation,
  assertValidBoard,
  BoardValidationError,
  createEmptyBoard,
  createSequentialId,
  removeEdge,
  removeLocation,
  setBoardBackground,
  updateEdge,
  updateLocation,
  validateBoard,
} from "../../src/engine/board";
import type { BoardState } from "../../src/engine/board";

describe("F-01 node graph board", () => {
  it("stores an arbitrary image reference as the board background", () => {
    const board = setBoardBackground(createEmptyBoard(), {
      assetId: "asset-background",
      name: "uploaded-map.png",
      url: "blob:lorecanvas-map",
      width: 2400,
      height: 1600,
    });

    expect(board.background).toMatchObject({
      assetId: "asset-background",
      name: "uploaded-map.png",
      url: "blob:lorecanvas-map",
    });
  });

  it("creates, updates, and removes locations without coordinate side effects", () => {
    const initial = createEmptyBoard();
    const withLocation = addLocation(initial, {
      id: "loc-1",
      name: "Harbor",
      x: 0.2,
      y: 0.35,
    });
    const renamed = updateLocation(withLocation, "loc-1", {
      name: "Harbor Gate",
      x: 0.3,
    });
    const cleared = removeLocation(renamed, "loc-1");

    expect(initial.locations).toHaveLength(0);
    expect(renamed.locations[0]).toMatchObject({
      id: "loc-1",
      name: "Harbor Gate",
      x: 0.3,
      y: 0.35,
    });
    expect(cleared.locations).toHaveLength(0);
  });

  it("creates, updates, and removes edges between existing locations", () => {
    const board = addLocation(
      addLocation(createEmptyBoard(), {
        id: "loc-a",
        x: 0.1,
        y: 0.1,
      }),
      {
        id: "loc-b",
        x: 0.9,
        y: 0.9,
      },
    );
    const connected = addEdge(board, {
      id: "edge-1",
      fromId: "loc-a",
      toId: "loc-b",
      label: "trail",
    });
    const updated = updateEdge(connected, "edge-1", {
      label: "secret trail",
    });
    const disconnected = removeEdge(updated, "edge-1");

    expect(updated.edges[0]).toMatchObject({
      id: "edge-1",
      fromId: "loc-a",
      toId: "loc-b",
      label: "secret trail",
    });
    expect(disconnected.edges).toHaveLength(0);
  });

  it("removes connected edges when a location is deleted", () => {
    const board = addEdge(
      addLocation(
        addLocation(createEmptyBoard(), {
          id: "loc-a",
          x: 0.2,
          y: 0.2,
        }),
        {
          id: "loc-b",
          x: 0.7,
          y: 0.4,
        },
      ),
      {
        id: "edge-1",
        fromId: "loc-a",
        toId: "loc-b",
      },
    );

    expect(removeLocation(board, "loc-a").edges).toHaveLength(0);
  });

  it("rejects edges that reference missing locations", () => {
    const invalidBoard: BoardState = {
      background: null,
      locations: [
        {
          id: "loc-a",
          name: "loc-a",
          x: 0.5,
          y: 0.5,
        },
      ],
      edges: [
        {
          id: "edge-1",
          fromId: "loc-a",
          toId: "missing-location",
        },
      ],
    };

    expect(validateBoard(invalidBoard)).toContainEqual(
      expect.objectContaining({
        code: "edge_missing_location",
        edgeId: "edge-1",
      }),
    );
    expect(() => assertValidBoard(invalidBoard)).toThrow(BoardValidationError);
  });

  it("blocks invalid coordinates, self loops, and duplicate connections", () => {
    const board = addLocation(
      addLocation(createEmptyBoard(), {
        id: "loc-a",
        x: 0,
        y: 0,
      }),
      {
        id: "loc-b",
        x: 1,
        y: 1,
      },
    );
    const connected = addEdge(board, {
      id: "edge-1",
      fromId: "loc-a",
      toId: "loc-b",
    });

    expect(() =>
      addLocation(createEmptyBoard(), {
        id: "bad",
        x: 1.2,
        y: 0.5,
      }),
    ).toThrow(BoardValidationError);
    expect(() =>
      addEdge(board, {
        id: "loop",
        fromId: "loc-a",
        toId: "loc-a",
      }),
    ).toThrow(BoardValidationError);
    expect(() =>
      addEdge(connected, {
        id: "edge-2",
        fromId: "loc-b",
        toId: "loc-a",
      }),
    ).toThrow(BoardValidationError);
  });

  it("allocates stable sequential ids from existing graph ids", () => {
    expect(createSequentialId("loc", ["loc-1", "loc-2", "edge-1"])).toBe(
      "loc-3",
    );
  });
});
