import { describe, expect, it, vi } from "vitest";
import {
  isScenarioFilePickerAbort,
  openScenarioTextFile,
  saveScenarioTextFile,
  SCENARIO_FILE_NAME,
  SCENARIO_FILE_PICKER_ID,
} from "../../src/ui/scenarioFilePicker";
import type { ScenarioPickerHost } from "../../src/ui/scenarioFilePicker";

describe("scenario file picker", () => {
  it("saves scenario JSON through a native picker with the shared picker id", async () => {
    const close = vi.fn(async () => {});
    const write = vi.fn(async (_contents: string) => {});
    const createWritable = vi.fn(async () => ({ close, write }));
    const showSaveFilePicker = vi.fn(async () => ({ createWritable }));
    const host: ScenarioPickerHost = { showSaveFilePicker };

    await expect(saveScenarioTextFile("{\"ok\":true}", host)).resolves.toBe(true);

    expect(showSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SCENARIO_FILE_PICKER_ID,
        suggestedName: SCENARIO_FILE_NAME,
        startIn: "documents",
      }),
    );
    expect(write).toHaveBeenCalledWith("{\"ok\":true}");
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("loads scenario JSON through a native picker using the same picker id", async () => {
    const getFile = vi.fn(async () => ({
      text: async () => "{\"loaded\":true}",
    }));
    const showOpenFilePicker = vi.fn(async () => [{ getFile }]);
    const host: ScenarioPickerHost = { showOpenFilePicker };

    await expect(openScenarioTextFile(host)).resolves.toBe("{\"loaded\":true}");

    expect(showOpenFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SCENARIO_FILE_PICKER_ID,
        multiple: false,
        startIn: "documents",
      }),
    );
  });

  it("falls back when native file picker APIs are unavailable", async () => {
    await expect(saveScenarioTextFile("{}", {})).resolves.toBe(false);
    await expect(openScenarioTextFile({})).resolves.toBeNull();
  });

  it("recognizes user cancellation from the native picker", () => {
    expect(isScenarioFilePickerAbort({ name: "AbortError" })).toBe(true);
    expect(isScenarioFilePickerAbort(new Error("AbortError"))).toBe(false);
  });
});
