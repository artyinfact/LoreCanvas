#!/bin/sh

# LoreCanvas harness entrypoint for POSIX shells and Git Bash.
# PowerShell users should run ./init.ps1 or npm.cmd run harness.

set -eu

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required to run the LoreCanvas harness." >&2
  exit 1
fi

node ./scripts/init.mjs
