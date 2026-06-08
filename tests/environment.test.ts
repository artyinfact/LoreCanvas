import { describe, expect, it } from "vitest";
import { useBoardStore } from "../src/state/boardStore";

describe("F-00 environment scaffold", () => {
  it("boots the real Maker board store without harness-only state", () => {
    const state = useBoardStore.getState();

    expect(state.activeTool).toBe("select");
    expect(state.board.locations).toHaveLength(0);
    expect(state.board.edges).toHaveLength(0);
    expect(state.entityState.entities).toHaveLength(0);
  });
});
