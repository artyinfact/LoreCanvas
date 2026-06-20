import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gitCommand = process.platform === "win32" ? "git.exe" : "git";

export function validateRepositoryState(root = defaultRoot) {
  const errors = [];
  const warnings = [];

  if (existsSync(path.join(root, "agent_work/pending-transaction.json"))) {
    errors.push(
      "Interrupted agent-state transaction found. Run any mutating agent-run command to recover it.",
    );
  }

  checkRequiredFiles(root, errors);
  if (errors.length > 0) {
    return { errors, warnings };
  }

  const featureList = readJson(root, "feature_list.json", errors);
  const harness = readJson(root, "agent_harness.json", errors);
  const run = readJson(root, "agent_work/current.json", errors);

  if (featureList) {
    validateFeatureList(root, featureList, errors);
  }

  if (harness) {
    validateAgentHarness(root, harness, errors);
  }

  if (featureList && harness && run) {
    validateActiveRun(featureList, harness, run, errors);
  }

  validateLocalFixtureIgnored(root, errors);
  validateArchitectureBoundaries(root, errors, warnings);

  return { errors, warnings };
}

export function printValidationResult(result) {
  for (const warning of result.warnings) {
    console.warn(`WARNING: ${warning}`);
  }

  for (const error of result.errors) {
    console.error(`ERROR: ${error}`);
  }

  if (result.errors.length === 0) {
    console.log("LoreCanvas feature and agent harness state is valid.");
  }
}

function checkRequiredFiles(root, errors) {
  const requiredFiles = [
    "AGENTS.md",
    "feature_list.json",
    "agent_harness.json",
    "agent_work/current.json",
    "progress.md",
    "docs/product.md",
    "docs/agent-system.md",
    "docs/architecture.md",
    "docs/human-gates.md",
    "docs/codex-capabilities.md",
    "docs/skill-candidates.md",
    "clean-state-checklists.md",
    "schemas/agent-run.schema.json",
    "schemas/evidence.schema.json",
    ".gitignore",
    ".gitattributes",
    ".nvmrc",
    "init.sh",
    "init.ps1",
    "scripts/init.mjs",
    "scripts/run-with-modern-node.mjs",
    "scripts/dev-server.mjs",
    "scripts/validate-agent-harness.d.mts",
    "scripts/with-vite-stopped.ps1",
    ".agents/skills/lorecanvas-feature-loop/SKILL.md",
    ".agents/skills/lorecanvas-browser-qa/SKILL.md",
    ".agents/skills/lorecanvas-pattern-miner/SKILL.md",
  ];

  for (const file of requiredFiles) {
    if (!existsSync(path.join(root, file))) {
      errors.push(`Missing required harness file: ${file}`);
    }
  }
}

function validateFeatureList(root, data, errors) {
  for (const field of ["project", "version", "harnessDocs", "features"]) {
    if (!(field in data)) {
      errors.push(`feature_list.json missing top-level field: ${field}`);
    }
  }

  const features = Array.isArray(data.features) ? data.features : [];
  if (features.length === 0) {
    errors.push("feature_list.json features must be a non-empty list");
    return;
  }

  const ids = new Set();
  const allowedStatuses = new Set(["pending", "in_progress", "blocked", "completed"]);
  const inProgress = [];

  for (const [index, feature] of features.entries()) {
    if (!isObject(feature)) {
      errors.push(`Feature at index ${index} must be an object`);
      continue;
    }

    for (const field of [
      "id",
      "priority",
      "title",
      "description",
      "status",
      "dependencies",
      "verification",
      "evidence",
    ]) {
      if (!(field in feature)) {
        errors.push(`Feature at index ${index} missing field: ${field}`);
      }
    }

    if (typeof feature.id !== "string" || feature.id.length === 0) {
      errors.push(`Feature at index ${index} has invalid id`);
      continue;
    }

    if (ids.has(feature.id)) {
      errors.push(`Duplicate feature id: ${feature.id}`);
    }
    ids.add(feature.id);

    if (!Number.isInteger(feature.priority)) {
      errors.push(`Feature ${feature.id} has non-integer priority`);
    }

    if (!allowedStatuses.has(feature.status)) {
      errors.push(`Feature ${feature.id} has invalid status: ${feature.status}`);
    }

    if (feature.status === "in_progress") {
      inProgress.push(feature.id);
    }

    if (feature.status === "completed" && !isObject(feature.evidence)) {
      errors.push(`Completed feature ${feature.id} must include object evidence`);
    }

    if (!Array.isArray(feature.dependencies)) {
      errors.push(`Feature ${feature.id} dependencies must be a list`);
    }
  }

  if (inProgress.length > 1) {
    errors.push(`Only one feature may be in_progress: ${inProgress.join(", ")}`);
  }

  const byId = new Map(features.filter(isObject).map((feature) => [feature.id, feature]));
  for (const feature of byId.values()) {
    if (!Array.isArray(feature.dependencies)) {
      continue;
    }

    for (const dependency of feature.dependencies) {
      if (!byId.has(dependency)) {
        errors.push(`Feature ${feature.id} depends on unknown feature ${dependency}`);
      }
    }

    if (feature.status === "in_progress") {
      const incomplete = feature.dependencies.filter(
        (dependency) => byId.get(dependency)?.status !== "completed",
      );
      if (incomplete.length > 0) {
        errors.push(
          `In-progress feature ${feature.id} has incomplete dependencies: ${incomplete.join(", ")}`,
        );
      }
    }
  }

  detectFeatureCycles(byId, errors);

  if (!Array.isArray(data.harnessDocs)) {
    errors.push("feature_list.json harnessDocs must be a list");
  } else {
    for (const doc of data.harnessDocs) {
      if (typeof doc !== "string" || !existsSync(path.join(root, doc))) {
        errors.push(`harnessDocs entry does not exist: ${doc}`);
      }
    }
  }

  const packageJsonPath = path.join(root, "package.json");
  if (existsSync(packageJsonPath)) {
    const packageJson = readJson(root, "package.json", errors);
    if (packageJson && packageJson.version !== data.version) {
      errors.push(
        `Version mismatch: package.json=${packageJson.version}, feature_list.json=${data.version}`,
      );
    }
  }
}

function validateAgentHarness(root, harness, errors) {
  for (const field of [
    "version",
    "taskSource",
    "activeRun",
    "roles",
    "sharedFiles",
    "states",
    "loop",
    "humanGates",
    "evidenceRequired",
  ]) {
    if (!(field in harness)) {
      errors.push(`agent_harness.json missing field: ${field}`);
    }
  }

  if (harness.taskSource !== "feature_list.json") {
    errors.push("agent_harness.json taskSource must be feature_list.json");
  }
  if (harness.activeRun !== "agent_work/current.json") {
    errors.push("agent_harness.json activeRun must be agent_work/current.json");
  }

  const roles = Array.isArray(harness.roles) ? harness.roles : [];
  const roleIds = new Set();
  for (const role of roles) {
    if (!isObject(role) || typeof role.id !== "string") {
      errors.push("Every agent harness role requires an id");
      continue;
    }
    if (roleIds.has(role.id)) {
      errors.push(`Duplicate agent harness role: ${role.id}`);
    }
    roleIds.add(role.id);
    if (!["read", "write"].includes(role.mode)) {
      errors.push(`Role ${role.id} must declare mode read or write`);
    }
    if (typeof role.agent !== "string" || !existsSync(path.join(root, role.agent))) {
      errors.push(`Role ${role.id} agent definition does not exist: ${role.agent}`);
    }
  }

  const states = Array.isArray(harness.states) ? harness.states : [];
  if (new Set(states).size !== states.length || !states.includes("idle")) {
    errors.push("agent_harness.json states must be unique and include idle");
  }

  const loopIds = new Set();
  for (const step of Array.isArray(harness.loop) ? harness.loop : []) {
    if (!isObject(step) || typeof step.id !== "string") {
      errors.push("Every loop step requires an id");
      continue;
    }
    if (loopIds.has(step.id)) {
      errors.push(`Duplicate loop step: ${step.id}`);
    }
    loopIds.add(step.id);
    if (!roleIds.has(step.owner)) {
      errors.push(`Loop step ${step.id} has unknown owner role: ${step.owner}`);
    }
  }

  if (
    !Number.isInteger(harness.maxActiveFeatures) ||
    harness.maxActiveFeatures !== 1
  ) {
    errors.push("LoreCanvas maxActiveFeatures must remain 1");
  }
  if (
    !Number.isInteger(harness.maxParallelWriteAgents) ||
    harness.maxParallelWriteAgents < 1
  ) {
    errors.push("agent_harness.json maxParallelWriteAgents must be a positive integer");
  }

  if (!Array.isArray(harness.sharedFiles)) {
    errors.push("agent_harness.json sharedFiles must be a list");
  } else {
    for (const sharedFile of harness.sharedFiles) {
      const normalized = normalizeWritePattern(sharedFile);
      if (!isValidWritePattern(normalized) || hasGlob(normalized)) {
        errors.push(`sharedFiles entry must be an explicit relative file: ${sharedFile}`);
      }
    }
  }

  if (
    typeof harness.orchestratorSkill !== "string" ||
    !existsSync(path.join(root, harness.orchestratorSkill))
  ) {
    errors.push(`Orchestrator skill does not exist: ${harness.orchestratorSkill}`);
  }

  if (
    !isObject(harness.automation) ||
    typeof harness.automation.patternMinerSkill !== "string" ||
    !existsSync(path.join(root, harness.automation.patternMinerSkill))
  ) {
    errors.push("Agent harness automation.patternMinerSkill must point to an existing skill");
  }
}

function validateActiveRun(featureList, harness, run, errors) {
  if (!isObject(run)) {
    errors.push("agent_work/current.json must be an object");
    return;
  }

  const states = new Set(Array.isArray(harness.states) ? harness.states : []);
  if (!states.has(run.state)) {
    errors.push(`Active run has invalid state: ${run.state}`);
  }

  const features = new Map(
    featureList.features.filter(isObject).map((feature) => [feature.id, feature]),
  );
  if (run.activeFeatureId === null) {
    if (run.state !== "idle") {
      errors.push("Active run without a feature must be idle");
    }
  } else if (!features.has(run.activeFeatureId)) {
    errors.push(`Active run references unknown feature: ${run.activeFeatureId}`);
  } else if (run.state === "idle") {
    errors.push("Active run with a feature cannot be idle");
  } else if (features.get(run.activeFeatureId)?.status !== "in_progress") {
    errors.push(
      `Active run feature ${run.activeFeatureId} must be in_progress in feature_list.json`,
    );
  }

  const inProgress = featureList.features.filter(
    (feature) => isObject(feature) && feature.status === "in_progress",
  );
  if (run.activeFeatureId === null && inProgress.length > 0) {
    errors.push("feature_list.json has in_progress work but active run is idle");
  }
  if (
    run.activeFeatureId !== null &&
    inProgress.some((feature) => feature.id !== run.activeFeatureId)
  ) {
    errors.push("Active run feature does not match feature_list.json in_progress feature");
  }

  const roleIds = new Set(harness.roles.map((role) => role.id));
  const packetIds = new Set();
  const packets = Array.isArray(run.workPackets) ? run.workPackets : [];
  for (const packet of packets) {
    if (!isObject(packet) || typeof packet.id !== "string") {
      errors.push("Every work packet requires an id");
      continue;
    }
    if (packetIds.has(packet.id)) {
      errors.push(`Duplicate work packet id: ${packet.id}`);
    }
    packetIds.add(packet.id);
    if (!roleIds.has(packet.owner)) {
      errors.push(`Work packet ${packet.id} has unknown owner: ${packet.owner}`);
    }
    if (!Array.isArray(packet.writeSet)) {
      errors.push(`Work packet ${packet.id} writeSet must be a list`);
    }
  }

  errors.push(...getWriteSetErrors(harness, packets));

  for (const packet of packets) {
    if (!isObject(packet) || !Array.isArray(packet.dependsOn)) {
      continue;
    }
    for (const dependency of packet.dependsOn) {
      if (!packetIds.has(dependency)) {
        errors.push(`Work packet ${packet.id} depends on unknown packet ${dependency}`);
      }
    }
  }

  if (!Number.isInteger(run.iteration) || run.iteration < 0 || run.iteration > 3) {
    errors.push("Active run iteration must be an integer from 0 through 3");
  }
}

function detectFeatureCycles(byId, errors) {
  const visiting = new Set();
  const visited = new Set();

  function visit(id, trail) {
    if (visiting.has(id)) {
      errors.push(`Feature dependency cycle: ${[...trail, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) {
      return;
    }

    visiting.add(id);
    const feature = byId.get(id);
    for (const dependency of feature?.dependencies ?? []) {
      if (byId.has(dependency)) {
        visit(dependency, [...trail, id]);
      }
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of byId.keys()) {
    visit(id, []);
  }
}

export function pathPatternsOverlap(left, right) {
  const normalizedLeft = normalizeWritePattern(left);
  const normalizedRight = normalizeWritePattern(right);
  const leftHasGlob = hasGlob(normalizedLeft);
  const rightHasGlob = hasGlob(normalizedRight);

  if (!leftHasGlob && !rightHasGlob) {
    return isSameOrAncestor(normalizedLeft, normalizedRight);
  }

  const leftBase = getPatternBase(normalizedLeft);
  const rightBase = getPatternBase(normalizedRight);
  if (leftBase === "" || rightBase === "") {
    return true;
  }

  return isSameOrAncestor(leftBase, rightBase);
}

export function getWriteSetErrors(harness, packets) {
  const errors = [];
  const roles = new Map(
    (Array.isArray(harness.roles) ? harness.roles : []).map((role) => [
      role.id,
      role,
    ]),
  );
  const sharedFiles = (
    Array.isArray(harness.sharedFiles) ? harness.sharedFiles : []
  ).map(normalizeWritePattern);
  const activeClaims = [];
  const activeWritePackets = [];

  for (const packet of packets) {
    if (
      !isObject(packet) ||
      !["ready", "in_progress"].includes(packet.status) ||
      !Array.isArray(packet.writeSet)
    ) {
      continue;
    }

    const role = roles.get(packet.owner);
    if (packet.writeSet.length > 0 && role?.mode !== "write") {
      errors.push(
        `Active packet ${packet.id} has a writeSet but owner ${packet.owner} is not a write role`,
      );
    }
    if (packet.writeSet.length > 0) {
      activeWritePackets.push(packet.id);
    }

    for (const rawOwnedPath of packet.writeSet) {
      const ownedPath = normalizeWritePattern(rawOwnedPath);
      if (!isValidWritePattern(ownedPath)) {
        errors.push(`Work packet ${packet.id} has invalid write path: ${rawOwnedPath}`);
        continue;
      }

      for (const sharedFile of sharedFiles) {
        if (
          ownedPath !== sharedFile &&
          pathPatternsOverlap(ownedPath, sharedFile)
        ) {
          errors.push(
            `Work packet ${packet.id} must claim shared file ${sharedFile} explicitly instead of using ${rawOwnedPath}`,
          );
        }
      }

      for (const claim of activeClaims) {
        if (pathPatternsOverlap(ownedPath, claim.path)) {
          const relationship =
            claim.packetId === packet.id ? "redundant" : "overlapping";
          errors.push(
            `${relationship} active write sets ${claim.path} (${claim.packetId}) and ${ownedPath} (${packet.id})`,
          );
        }
      }

      activeClaims.push({ packetId: packet.id, path: ownedPath });
    }
  }

  if (
    Number.isInteger(harness.maxParallelWriteAgents) &&
    activeWritePackets.length > harness.maxParallelWriteAgents
  ) {
    errors.push(
      `Active write packet count ${activeWritePackets.length} exceeds maxParallelWriteAgents=${harness.maxParallelWriteAgents}: ${activeWritePackets.join(", ")}`,
    );
  }

  return errors;
}

function normalizeWritePattern(value) {
  if (typeof value !== "string") {
    return "";
  }
  const slashNormalized = value
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+/g, "/");
  const normalized = path.posix.normalize(slashNormalized).replace(/\/$/, "");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function isValidWritePattern(value) {
  return (
    value.length > 0 &&
    value !== "." &&
    !path.isAbsolute(value) &&
    !/^[A-Za-z]:\//.test(value) &&
    !value.split("/").includes("..")
  );
}

function hasGlob(value) {
  return /[*?[\]{}]/.test(value);
}

function getPatternBase(value) {
  const wildcardIndex = value.search(/[*?[\]{}]/);
  if (wildcardIndex < 0) {
    return value;
  }

  const prefix = value.slice(0, wildcardIndex);
  const slashIndex = prefix.lastIndexOf("/");
  return slashIndex < 0 ? "" : prefix.slice(0, slashIndex);
}

function isSameOrAncestor(left, right) {
  return (
    left === right ||
    right.startsWith(`${left}/`) ||
    left.startsWith(`${right}/`)
  );
}

function validateLocalFixtureIgnored(root, errors) {
  const fixturePath = "local-fixtures/lotr/LotR-FotF/manifest.json";
  if (!existsSync(path.join(root, fixturePath))) {
    return;
  }

  const insideWorkTree = spawnSync(
    gitCommand,
    ["rev-parse", "--is-inside-work-tree"],
    { cwd: root, stdio: "ignore", shell: false },
  );
  if (insideWorkTree.status !== 0) {
    return;
  }

  const checkIgnore = spawnSync(gitCommand, ["check-ignore", "-q", fixturePath], {
    cwd: root,
    stdio: "ignore",
    shell: false,
  });
  if (checkIgnore.status !== 0) {
    errors.push("local LOTR fixture is not ignored by git");
  }
}

function validateArchitectureBoundaries(root, errors, warnings) {
  const sourceFiles = collectSourceFiles(root, "src");
  for (const file of sourceFiles) {
    const relative = normalizePath(path.relative(root, file));
    const source = readFileSync(file, "utf8");

    if (relative.startsWith("src/engine/")) {
      if (/(?:from|import\()\s*["'][^"']*(?:react|zustand|pixi|\/state\/|\/ui\/)/i.test(source)) {
        errors.push(`Engine import boundary violation: ${relative}`);
      }
    }

    if (
      relative.startsWith("src/state/") &&
      /(?:from|import\()\s*["'][^"']*\/ui\//i.test(source)
    ) {
      errors.push(`State import boundary violation: ${relative}`);
    }
  }

  const testFiles = collectSourceFiles(root, "tests");
  for (const file of testFiles) {
    const relative = normalizePath(path.relative(root, file));
    const source = readFileSync(file, "utf8");
    if (/from\s+["'][^"']+\.test["']/i.test(source)) {
      warnings.push(
        `Test imports another test file and should move shared builders to tests/fixtures: ${relative}`,
      );
    }
  }
}

function collectSourceFiles(root, directory) {
  const base = path.join(root, directory);
  if (!existsSync(base)) {
    return [];
  }

  const results = [];
  const stack = [base];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        stack.push(path.join(current, entry.name));
      } else if (/\.(?:ts|tsx)$/.test(entry.name)) {
        results.push(path.join(current, entry.name));
      }
    }
  }
  return results;
}

function readJson(root, file, errors) {
  try {
    return JSON.parse(readFileSync(path.join(root, file), "utf8"));
  } catch (error) {
    errors.push(`${file} is not valid JSON: ${getErrorMessage(error)}`);
    return null;
  }
}

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateRepositoryState();
  printValidationResult(result);
  if (result.errors.length > 0) {
    process.exit(1);
  }
}
