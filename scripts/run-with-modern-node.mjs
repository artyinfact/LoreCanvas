import { spawnSync } from "node:child_process";

const MINIMUM_NODE = {
  major: 22,
  minor: 12,
};
const FALLBACK_NODE = "24.13.0";

const [binary, ...args] = process.argv.slice(2);

if (!binary) {
  console.error("Usage: run-with-modern-node <binary> [...args]");
  process.exit(1);
}

const [major = 0, minor = 0] = process.versions.node
  .split(".")
  .map((part) => Number.parseInt(part, 10));
const currentNodeIsModern =
  major > MINIMUM_NODE.major ||
  (major === MINIMUM_NODE.major && minor >= MINIMUM_NODE.minor);

const command = currentNodeIsModern
  ? process.execPath
  : process.platform === "win32"
    ? "npx.cmd"
    : "npx";
const commandArgs = currentNodeIsModern
  ? [binary, ...args]
  : ["-y", `node@${FALLBACK_NODE}`, binary, ...args];

const result = spawnSync(command, commandArgs, {
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
