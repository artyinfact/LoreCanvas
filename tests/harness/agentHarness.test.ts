import { describe, expect, it } from "vitest";

import {
  getWriteSetErrors,
  pathPatternsOverlap,
} from "../../scripts/validate-agent-harness.mjs";
import type { WriteSetHarness } from "../../scripts/validate-agent-harness.mjs";

const harness: WriteSetHarness = {
  maxParallelWriteAgents: 2,
  sharedFiles: ["src/state/boardStore.ts", "src/ui/App.tsx"],
  roles: [
    { id: "engine", mode: "write" },
    { id: "web", mode: "write" },
    { id: "test", mode: "write" },
    { id: "reviewer", mode: "read" },
  ],
};

describe("multi-agent write-set validation", () => {
  it("detects exact, parent-child, and glob overlap", () => {
    expect(
      pathPatternsOverlap("src/engine/movement.ts", "src/engine/movement.ts"),
    ).toBe(true);
    expect(pathPatternsOverlap("src/ui", "src/ui/App.tsx")).toBe(true);
    expect(pathPatternsOverlap("src/state/**", "src/state/boardStore.ts")).toBe(
      true,
    );
    expect(pathPatternsOverlap("src/engine/**", "tests/engine/**")).toBe(false);
    expect(
      pathPatternsOverlap(
        "src/ui/features/../App.tsx",
        "src/ui/App.tsx",
      ),
    ).toBe(true);
    expect(pathPatternsOverlap("SRC/UI/App.tsx", "src/ui/App.tsx")).toBe(
      process.platform === "win32",
    );
  });

  it("accepts two disjoint write packets", () => {
    expect(
      getWriteSetErrors(harness, [
        packet("engine", "engine", ["src/engine/movement.ts"]),
        packet("tests", "test", ["tests/engine/movement.test.ts"]),
      ]),
    ).toEqual([]);
  });

  it("rejects broad claims over shared files and overlapping agents", () => {
    const errors = getWriteSetErrors(harness, [
      packet("state", "engine", ["src/state/**"]),
      packet("store", "web", ["src/state/boardStore.ts"]),
    ]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          `must claim shared file ${
            process.platform === "win32"
              ? "src/state/boardstore.ts"
              : "src/state/boardStore.ts"
          } explicitly`,
        ),
        expect.stringContaining("overlapping active write sets"),
      ]),
    );
  });

  it("enforces write-role and parallel-writer limits", () => {
    const errors = getWriteSetErrors(harness, [
      packet("one", "engine", ["src/engine/one.ts"]),
      packet("two", "web", ["src/ui/features/two.tsx"]),
      packet("three", "test", ["tests/engine/three.test.ts"]),
      packet("review", "reviewer", ["docs/review.md"]),
    ]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("owner reviewer is not a write role"),
        expect.stringContaining("exceeds maxParallelWriteAgents=2"),
      ]),
    );
  });

  it("rejects write paths that normalize to the repository root", () => {
    const errors = getWriteSetErrors(harness, [
      packet("blank", "engine", [" "]),
      packet("dot", "web", ["."]),
      packet("parent", "test", ["src/.."]),
    ]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("invalid write path"),
      ]),
    );
    expect(errors.filter((error) => error.includes("invalid write path"))).toHaveLength(
      3,
    );
  });
});

function packet(id: string, owner: string, writeSet: string[]) {
  return {
    id,
    owner,
    status: "in_progress",
    writeSet,
  };
}
