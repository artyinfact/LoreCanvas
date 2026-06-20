import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadataPath = path.join(root, "agent_work", "dev-server.json");
const forwardedArgs =
  process.argv.length > 2
    ? process.argv.slice(2)
    : ["--host", "0.0.0.0"];
const vite = path.join(root, "node_modules", "vite", "bin", "vite.js");

assertModernNode();
removeStaleMetadata();

const child = spawn(process.execPath, [vite, ...forwardedArgs], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

writeMetadata({
  schemaVersion: 1,
  root,
  wrapperPid: process.pid,
  childPid: child.pid,
  args: forwardedArgs,
  startedAt: new Date().toISOString(),
});

let shuttingDown = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    child.kill(signal);
  });
}

child.on("error", (error) => {
  cleanupMetadata();
  console.error(error.message);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  cleanupMetadata();
  if (signal) {
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});

function writeMetadata(value) {
  const temporary = `${metadataPath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, metadataPath);
}

function cleanupMetadata() {
  if (existsSync(metadataPath)) {
    unlinkSync(metadataPath);
  }
}

function removeStaleMetadata() {
  if (!existsSync(metadataPath)) {
    return;
  }

  try {
    const current = JSON.parse(readFileSync(metadataPath, "utf8"));
    if (isProcessAlive(current.wrapperPid) || isProcessAlive(current.childPid)) {
      throw new Error(
        `LoreCanvas dev server metadata already points to a live process: ${metadataPath}`,
      );
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn(`Removing invalid stale dev server metadata: ${metadataPath}`);
    } else {
      throw error;
    }
  }

  unlinkSync(metadataPath);
}

function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function assertModernNode() {
  const [major = 0, minor = 0] = process.versions.node
    .split(".")
    .map((part) => Number.parseInt(part, 10));
  const supported = major > 22 || (major === 22 && minor >= 12);
  if (!supported) {
    throw new Error(
      `LoreCanvas dev server requires Node >=22.12.0; current Node is ${process.versions.node}.`,
    );
  }
}
