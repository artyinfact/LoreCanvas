export const SCENARIO_FILE_NAME = "scenario.json";
export const SCENARIO_FILE_PICKER_ID = "lorecanvas-scenario-json";
export const SCENARIO_FILE_ACCEPT = ".json,application/json";

type ScenarioWellKnownDirectory =
  | "desktop"
  | "documents"
  | "downloads"
  | "music"
  | "pictures"
  | "videos";

interface ScenarioFilePickerAcceptType {
  accept: Record<string, string[]>;
  description: string;
}

interface ScenarioSaveFilePickerOptions {
  excludeAcceptAllOption?: boolean;
  id?: string;
  startIn?: ScenarioWellKnownDirectory;
  suggestedName?: string;
  types?: ScenarioFilePickerAcceptType[];
}

interface ScenarioOpenFilePickerOptions {
  excludeAcceptAllOption?: boolean;
  id?: string;
  multiple?: boolean;
  startIn?: ScenarioWellKnownDirectory;
  types?: ScenarioFilePickerAcceptType[];
}

interface ScenarioWritableFileStream {
  close(): Promise<void>;
  write(contents: string): Promise<void>;
}

interface ScenarioSaveFileHandle {
  createWritable(): Promise<ScenarioWritableFileStream>;
}

interface ScenarioReadableFile {
  text(): Promise<string>;
}

interface ScenarioOpenFileHandle {
  getFile(): Promise<ScenarioReadableFile>;
}

export interface ScenarioPickerHost {
  showOpenFilePicker?: (
    options: ScenarioOpenFilePickerOptions,
  ) => Promise<ScenarioOpenFileHandle[]>;
  showSaveFilePicker?: (
    options: ScenarioSaveFilePickerOptions,
  ) => Promise<ScenarioSaveFileHandle>;
}

const SCENARIO_FILE_TYPES: ScenarioFilePickerAcceptType[] = [
  {
    description: "LoreCanvas scenario JSON",
    accept: {
      "application/json": [".json"],
    },
  },
];

const SCENARIO_PICKER_START_DIRECTORY: ScenarioWellKnownDirectory = "documents";

export async function saveScenarioTextFile(
  contents: string,
  host: ScenarioPickerHost = getScenarioPickerHost(),
) {
  if (!host.showSaveFilePicker) {
    return false;
  }

  const fileHandle = await host.showSaveFilePicker({
    id: SCENARIO_FILE_PICKER_ID,
    suggestedName: SCENARIO_FILE_NAME,
    types: SCENARIO_FILE_TYPES,
    startIn: SCENARIO_PICKER_START_DIRECTORY,
    excludeAcceptAllOption: false,
  });
  const writable = await fileHandle.createWritable();

  try {
    await writable.write(contents);
  } finally {
    await writable.close();
  }

  return true;
}

export async function openScenarioTextFile(
  host: ScenarioPickerHost = getScenarioPickerHost(),
) {
  if (!host.showOpenFilePicker) {
    return null;
  }

  const fileHandles = await host.showOpenFilePicker({
    id: SCENARIO_FILE_PICKER_ID,
    multiple: false,
    types: SCENARIO_FILE_TYPES,
    startIn: SCENARIO_PICKER_START_DIRECTORY,
    excludeAcceptAllOption: false,
  });
  const fileHandle = fileHandles[0];

  if (!fileHandle) {
    return null;
  }

  return (await fileHandle.getFile()).text();
}

export function isScenarioFilePickerAbort(error: unknown) {
  return isRecord(error) && error.name === "AbortError";
}

function getScenarioPickerHost(): ScenarioPickerHost {
  return window as unknown as ScenarioPickerHost;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
