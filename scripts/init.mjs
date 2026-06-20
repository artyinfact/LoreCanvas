import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  printValidationResult,
  validateRepositoryState,
} from "./validate-agent-harness.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const options = new Set(process.argv.slice(2));
const validateOnly = options.has("--validate-only");
const noInstall = options.has("--no-install");

process.chdir(root);

main();

function main() {
  console.log("[1/7] Validating feature and agent harness state...");
  const validation = validateRepositoryState(root);
  printValidationResult(validation);
  if (validation.errors.length > 0) {
    process.exit(1);
  }
  console.log("[1/7] Harness state is valid.");

  if (validateOnly) {
    console.log("Validation-only mode completed without installing dependencies.");
    return;
  }

  console.log("[2/7] Checking implementation scaffold...");
  if (!existsSync("package.json")) {
    console.log(
      "[2/7] package.json not found. This is expected before the implementation scaffold exists.",
    );
    console.log("[3/7] Skipping dependency installation.");
    console.log("[4/7] Skipping TypeScript, Vitest, and build checks.");
    console.log(
      "[7/7] Next required task: run the LoreCanvas feature loop.",
    );
    console.log("Harness is ready; implementation scaffold is still pending.");
    return;
  }

  if (noInstall) {
    console.log("[3/7] Skipping dependency installation (--no-install).");
  } else {
    console.log("[3/7] Installing npm dependencies...");
    installDependencies();
    installMissingLinuxRolldownBinding();
    console.log("[3/7] Dependencies are ready.");
  }

  console.log("[4/7] Running TypeScript checks...");
  run(npmCommand, ["run", "check-types", "--if-present"]);
  console.log("[4/7] Project type-check script passed.");

  console.log("[5/7] Running Vitest...");
  run(npmCommand, ["run", "test"]);
  console.log("[5/7] Vitest passed.");

  console.log("[6/7] Running production build...");
  run(npmCommand, ["run", "build", "--if-present"]);
  console.log("[6/7] Production build passed.");

  console.log("[7/7] Implementation baseline is healthy.");
  console.log("LoreCanvas is ready for the multi-agent feature loop.");
}

function installDependencies() {
  if (existsSync("package-lock.json")) {
    run(npmCommand, ["ci", "--silent"]);
    return;
  }

  run(npmCommand, ["install", "--silent"]);
}

function installMissingLinuxRolldownBinding() {
  if (
    process.platform !== "linux" ||
    !existsSync("node_modules/rolldown") ||
    existsSync("node_modules/@rolldown/binding-linux-x64-gnu")
  ) {
    return;
  }

  const lock = readJson("package-lock.json");
  const optionalDependencies =
    lock.packages?.["node_modules/rolldown"]?.optionalDependencies ?? {};
  const version = optionalDependencies["@rolldown/binding-linux-x64-gnu"];

  if (typeof version === "string" && version.length > 0) {
    console.log("[4/6] Installing missing Linux Rolldown optional binding...");
    run(npmCommand, [
      "install",
      "--no-save",
      "--silent",
      `@rolldown/binding-linux-x64-gnu@${version}`,
    ]);
  }
}

function run(command, args) {
  const useWindowsCmdShim = process.platform === "win32" && command.endsWith(".cmd");
  const result = spawnSync(useWindowsCmdShim ? process.env.ComSpec ?? "cmd.exe" : command, useWindowsCmdShim
    ? ["/d", "/s", "/c", [command, ...args].map(quoteCmdArg).join(" ")]
    : args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function quoteCmdArg(value) {
  if (/^[A-Za-z0-9_./:@=-]+$/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '\\"')}"`;
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${filePath} is not valid JSON: ${getErrorMessage(error)}`);
  }
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
