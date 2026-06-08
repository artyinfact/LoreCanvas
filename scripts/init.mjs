import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const gitCommand = process.platform === "win32" ? "git.exe" : "git";

process.chdir(root);

main();

function main() {
  console.log("[1/6] Checking harness files...");
  checkRequiredFiles();
  console.log("[1/6] Harness files are present.");

  console.log("[2/6] Validating harness state...");
  validateHarnessState();
  console.log("[2/6] Harness state is valid.");

  console.log("[3/6] Checking implementation scaffold...");
  if (!existsSync("package.json")) {
    console.log(
      "[3/6] package.json not found. This is expected before the implementation scaffold exists.",
    );
    console.log("[4/6] Skipping dependency installation.");
    console.log("[5/6] Skipping TypeScript and Vitest checks.");
    console.log(
      "[6/6] Next required task: complete the smallest-priority pending feature in feature_list.json.",
    );
    console.log("Harness is ready; implementation scaffold is still pending.");
    return;
  }

  console.log("[4/6] Installing npm dependencies...");
  installDependencies();
  installMissingLinuxRolldownBinding();
  console.log("[4/6] Dependencies are ready.");

  console.log("[5/6] Running TypeScript checks...");
  run(npmCommand, ["run", "check-types", "--if-present"]);
  console.log("[5/6] Project type-check script passed.");

  console.log("[6/6] Running Vitest...");
  run(npmCommand, ["run", "test"]);
  console.log("[6/6] Vitest passed.");

  console.log("Implementation baseline is healthy.");
  console.log("LoreCanvas is ready for the next pending feature.");
}

function checkRequiredFiles() {
  const requiredFiles = [
    "AGENTS.md",
    "feature_list.json",
    "progress.md",
    "docs/product.md",
    "clean-state-checklists.md",
    ".gitignore",
    ".gitattributes",
    ".nvmrc",
    "init.sh",
    "init.ps1",
    "scripts/init.mjs",
    "scripts/run-with-modern-node.mjs",
  ];

  const missing = requiredFiles.filter((file) => !existsSync(file));

  if (missing.length > 0) {
    fail(`Missing required harness file(s): ${missing.join(", ")}`);
  }
}

function validateHarnessState() {
  const data = readJson("feature_list.json");
  const errors = [];
  const requiredTop = ["project", "version", "harnessDocs", "features"];

  for (const field of requiredTop) {
    if (!(field in data)) {
      errors.push(`Missing top-level field: ${field}`);
    }
  }

  const features = Array.isArray(data.features) ? data.features : [];
  if (features.length === 0) {
    errors.push("features must be a non-empty list");
  }

  const ids = new Set();
  const allowedStatuses = new Set([
    "pending",
    "in_progress",
    "blocked",
    "completed",
  ]);
  const inProgress = [];

  features.forEach((feature, index) => {
    if (!isObject(feature)) {
      errors.push(`Feature at index ${index} must be an object`);
      return;
    }

    const requiredFeature = [
      "id",
      "priority",
      "title",
      "description",
      "status",
      "dependencies",
      "verification",
      "evidence",
    ];

    for (const field of requiredFeature) {
      if (!(field in feature)) {
        errors.push(`Feature at index ${index} missing field: ${field}`);
      }
    }

    const featureId = feature.id;
    if (typeof featureId !== "string" || featureId.length === 0) {
      errors.push(`Feature at index ${index} has invalid id`);
    } else if (ids.has(featureId)) {
      errors.push(`Duplicate feature id: ${featureId}`);
    } else {
      ids.add(featureId);
    }

    if (!Number.isInteger(feature.priority)) {
      errors.push(`Feature ${featureId || index} has non-integer priority`);
    }

    if (!allowedStatuses.has(feature.status)) {
      errors.push(`Feature ${featureId || index} has invalid status: ${feature.status}`);
    }

    if (feature.status === "in_progress") {
      inProgress.push(featureId || String(index));
    }

    if (feature.status === "completed" && !feature.evidence) {
      errors.push(`Completed feature ${featureId || index} must include evidence`);
    }

    if (!Array.isArray(feature.dependencies)) {
      errors.push(`Feature ${featureId || index} dependencies must be a list`);
    } else {
      for (const dependency of feature.dependencies) {
        if (typeof dependency !== "string") {
          errors.push(`Feature ${featureId || index} has non-string dependency`);
        }
      }
    }
  });

  if (inProgress.length > 1) {
    errors.push(`Only one feature may be in_progress, found: ${inProgress.join(", ")}`);
  }

  for (const feature of features) {
    if (!isObject(feature) || !Array.isArray(feature.dependencies)) {
      continue;
    }

    for (const dependency of feature.dependencies) {
      if (!ids.has(dependency)) {
        errors.push(`Feature ${feature.id} depends on unknown feature ${dependency}`);
      }
    }
  }

  if (!Array.isArray(data.harnessDocs)) {
    errors.push("harnessDocs must be a list");
  } else {
    for (const doc of data.harnessDocs) {
      if (typeof doc !== "string" || !existsSync(doc)) {
        errors.push(`harnessDocs entry does not exist: ${doc}`);
      }
    }
  }

  validateLocalFixtureIgnored(errors);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR: ${error}`);
    }

    process.exit(1);
  }

  console.log("feature_list.json structure is valid.");
}

function validateLocalFixtureIgnored(errors) {
  const fixturePath = "local-fixtures/lotr/tts-save.json";

  if (!existsSync(fixturePath)) {
    return;
  }

  const insideWorkTree = spawnSync(
    gitCommand,
    ["rev-parse", "--is-inside-work-tree"],
    { stdio: "ignore", shell: false },
  );

  if (insideWorkTree.status !== 0) {
    return;
  }

  const checkIgnore = spawnSync(gitCommand, ["check-ignore", "-q", fixturePath], {
    stdio: "ignore",
    shell: false,
  });

  if (checkIgnore.status !== 0) {
    errors.push("local LOTR fixture is not ignored by git.");
  }
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

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
