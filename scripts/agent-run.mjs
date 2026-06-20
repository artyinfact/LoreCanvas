import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  printValidationResult,
  validateRepositoryState,
} from "./validate-agent-harness.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const command = process.argv[2] ?? "status";
const argument = process.argv[3];

const transitions = new Map([
  ["planning", new Set(["awaiting_human", "ready", "blocked"])],
  ["awaiting_human", new Set(["planning", "ready", "blocked"])],
  ["ready", new Set(["implementing", "blocked"])],
  ["implementing", new Set(["verifying", "blocked"])],
  ["verifying", new Set(["reviewing", "repairing", "blocked"])],
  ["reviewing", new Set(["repairing", "blocked"])],
  ["repairing", new Set(["implementing", "verifying", "blocked"])],
  ["blocked", new Set(["planning", "ready", "implementing", "verifying"])],
]);

try {
  switch (command) {
    case "status": {
      validateCurrentState();
      const featureList = readJson("feature_list.json");
      const currentRun = readJson("agent_work/current.json");
      printStatus(featureList, currentRun);
      break;
    }
    case "next": {
      validateCurrentState();
      const featureList = readJson("feature_list.json");
      printNext(featureList);
      break;
    }
    case "start":
      withMutationLock(() => {
        validateCurrentState();
        startFeature(
          readJson("feature_list.json"),
          readJson("agent_work/current.json"),
          argument,
        );
      });
      break;
    case "transition":
      withMutationLock(() => {
        validateCurrentState();
        transitionRun(readJson("agent_work/current.json"), argument);
      });
      break;
    case "release":
      withMutationLock(() => {
        validateCurrentState();
        releaseFeature(
          readJson("feature_list.json"),
          readJson("agent_work/current.json"),
        );
      });
      break;
    default:
      fail(
        "Usage: node scripts/agent-run.mjs status|next|start <feature-id>|transition <state>|release",
      );
  }
} catch (error) {
  console.error(`ERROR: ${getErrorMessage(error)}`);
  process.exitCode = 1;
}

function printStatus(featureList, currentRun) {
  const activeFeature = featureList.features.find(
    (feature) => feature.id === currentRun.activeFeatureId,
  );
  console.log(
    JSON.stringify(
      {
        activeFeature: activeFeature
          ? {
              id: activeFeature.id,
              title: activeFeature.title,
              status: activeFeature.status,
            }
          : null,
        run: currentRun,
        next: getReadyFeatures(featureList).map(toFeatureSummary),
      },
      null,
      2,
    ),
  );
}

function printNext(featureList) {
  console.log(JSON.stringify(getReadyFeatures(featureList).map(toFeatureSummary), null, 2));
}

function startFeature(featureList, currentRun, featureId) {
  if (!featureId) {
    fail("start requires a feature id");
  }
  if (currentRun.activeFeatureId !== null || currentRun.state !== "idle") {
    fail(`Cannot start ${featureId}; another run is active`);
  }

  const ready = getReadyFeatures(featureList);
  const feature = ready.find((candidate) => candidate.id === featureId);
  if (!feature) {
    fail(`${featureId} is not dependency-ready and pending`);
  }

  feature.status = "in_progress";
  commitFeatureAndRun(featureList, {
    ...currentRun,
    activeFeatureId: featureId,
    state: "planning",
    iteration: 0,
    revision: (currentRun.revision ?? 0) + 1,
    workPackets: [],
    humanGates: [],
    evidence: {},
    blockers: [],
  });
  console.log(`Started ${featureId} in planning state.`);
}

function transitionRun(currentRun, targetState) {
  if (!targetState) {
    fail("transition requires a target state");
  }
  if (currentRun.activeFeatureId === null) {
    fail("Cannot transition an idle run");
  }

  const allowed = transitions.get(currentRun.state);
  if (!allowed?.has(targetState)) {
    fail(`Invalid run transition: ${currentRun.state} -> ${targetState}`);
  }

  if (targetState === "repairing" && (currentRun.iteration ?? 0) >= 3) {
    fail("Repair iteration limit reached; record a blocker and request direction");
  }

  writeJsonAtomic("agent_work/current.json", {
    ...currentRun,
    state: targetState,
    iteration:
      targetState === "repairing"
        ? (currentRun.iteration ?? 0) + 1
        : currentRun.iteration ?? 0,
    revision: (currentRun.revision ?? 0) + 1,
  });
  console.log(`Transitioned ${currentRun.activeFeatureId} to ${targetState}.`);
}

function releaseFeature(featureList, currentRun) {
  if (currentRun.activeFeatureId === null) {
    fail("No active feature to release");
  }
  if (!["planning", "awaiting_human", "blocked"].includes(currentRun.state)) {
    fail(`Cannot release a run in ${currentRun.state} state`);
  }

  const feature = featureList.features.find(
    (candidate) => candidate.id === currentRun.activeFeatureId,
  );
  if (!feature) {
    fail(`Unknown active feature ${currentRun.activeFeatureId}`);
  }

  feature.status = "pending";
  commitFeatureAndRun(featureList, {
    ...currentRun,
    activeFeatureId: null,
    state: "idle",
    iteration: 0,
    revision: (currentRun.revision ?? 0) + 1,
    workPackets: [],
    humanGates: [],
    evidence: {},
    blockers: [],
  });
  console.log(`Released ${feature.id} back to pending.`);
}

function getReadyFeatures(featureList) {
  const byId = new Map(featureList.features.map((feature) => [feature.id, feature]));
  return featureList.features
    .filter((feature) => feature.status === "pending")
    .filter((feature) =>
      feature.dependencies.every(
        (dependency) => byId.get(dependency)?.status === "completed",
      ),
    )
    .sort((left, right) => left.priority - right.priority);
}

function toFeatureSummary(feature) {
  return {
    id: feature.id,
    priority: feature.priority,
    title: feature.title,
    verification: feature.verification,
  };
}

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), "utf8"));
}

function writeJsonAtomic(file, value) {
  const target = path.join(root, file);
  const temporary = `${target}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, target);
}

function validateCurrentState() {
  const validation = validateRepositoryState(root);
  printValidationResult(validation);
  if (validation.errors.length > 0) {
    fail("LoreCanvas harness state is invalid");
  }
}

function withMutationLock(action) {
  const lockPath = path.join(root, "agent_work", ".mutation.lock");
  let handle;
  let lastError;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      handle = openSync(lockPath, "wx");
      break;
    } catch (error) {
      lastError = error;
      if (getErrorCode(error) !== "EEXIST") {
        break;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }

  if (handle === undefined) {
    fail(
      `Could not acquire agent run mutation lock. If no orchestrator is active, remove ${lockPath}. ${getErrorMessage(lastError)}`,
    );
  }

  try {
    writeFileSync(
      handle,
      JSON.stringify(
        {
          pid: process.pid,
          createdAt: new Date().toISOString(),
          command,
          argument: argument ?? null,
        },
        null,
        2,
      ),
      "utf8",
    );
    recoverPendingTransaction();
    action();
  } finally {
    if (handle !== undefined) {
      closeSync(handle);
    }
    unlinkSync(lockPath);
  }
}

function commitFeatureAndRun(featureList, currentRun) {
  const transactionFile = "agent_work/pending-transaction.json";
  writeJsonAtomic(transactionFile, {
    createdAt: new Date().toISOString(),
    featureList,
    currentRun,
  });

  writeJsonAtomic("feature_list.json", featureList);
  writeJsonAtomic("agent_work/current.json", currentRun);
  unlinkSync(path.join(root, transactionFile));
}

function recoverPendingTransaction() {
  const transactionFile = "agent_work/pending-transaction.json";
  const transactionPath = path.join(root, transactionFile);
  if (!existsSync(transactionPath)) {
    return;
  }

  const transaction = readJson(transactionFile);
  if (!transaction.featureList || !transaction.currentRun) {
    fail(`Invalid pending transaction: ${transactionPath}`);
  }

  writeJsonAtomic("feature_list.json", transaction.featureList);
  writeJsonAtomic("agent_work/current.json", transaction.currentRun);
  unlinkSync(transactionPath);
  console.warn("Recovered an interrupted LoreCanvas agent-state transaction.");
}

function fail(message) {
  throw new Error(message);
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function getErrorCode(error) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
}
