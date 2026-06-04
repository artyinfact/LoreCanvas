import { describe, expect, it } from "vitest";
import { useHarnessStore } from "../src/state/harnessStore";

describe("F-00 environment scaffold", () => {
  it("boots the Zustand harness store in a ready state", () => {
    expect(useHarnessStore.getState().environment).toBe("ready");
  });

  it("allows the harness state to be updated by tests and UI code", () => {
    useHarnessStore.getState().setEnvironment("checking");
    expect(useHarnessStore.getState().environment).toBe("checking");

    useHarnessStore.getState().setEnvironment("ready");
    expect(useHarnessStore.getState().environment).toBe("ready");
  });
});
