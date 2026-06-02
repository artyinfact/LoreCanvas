#!/bin/bash

# ==============================================================================
# GM-Scout-Canvas - Agent 初始化与状态验证脚本
# Harness principle: fail fast once implementation exists, but keep the seed
# harness runnable before F-00 creates package.json.
# ==============================================================================

set -euo pipefail

echo "[1/5] Checking harness files..."

required_files=(
  "AGENTS.md"
  "agent-progress.md"
  "feature_list.json"
  "docs/product-framework.md"
  "acceptance-checklists.md"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Missing required harness file: $file"
    exit 1
  fi
done

echo "[1/5] Harness files are present."

echo "[2/5] Checking implementation scaffold..."
if [ ! -f "package.json" ]; then
  echo "[2/5] package.json not found. This is expected before feature F-00."
  echo "[3/5] Skipping dependency installation."
  echo "[4/5] Skipping TypeScript and Vitest checks."
  echo "[5/5] Next required task: complete F-00 in feature_list.json."
  echo "Harness is ready; implementation scaffold is still pending."
  exit 0
fi

echo "[2/5] Installing npm dependencies..."
npm install --silent
echo "[2/5] Dependencies are ready."

echo "[3/5] Running TypeScript checks..."
if npm run check-types --if-present; then
  echo "[3/5] Project type-check script passed."
else
  npx tsc --noEmit
fi

echo "[4/5] Running Vitest..."
npx vitest run
echo "[4/5] Vitest passed."

echo "[5/5] Implementation baseline is healthy."
echo "GM-Scout-Canvas is ready for the next pending feature."

exit 0