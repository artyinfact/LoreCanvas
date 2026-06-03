#!/bin/bash

# ==============================================================================
# LoreCanvas - Agent initialization and state validation script
# Harness principle: fail fast once implementation exists, but keep the seed
# harness runnable before the implementation scaffold creates package.json.
# ==============================================================================

set -euo pipefail

echo "[1/6] Checking harness files..."

required_files=(
  "AGENTS.md"
  "feature_list.json"
  "progress.md"
  "docs/product.md"
  "clean-state-checklists.md"
  ".gitignore"
  ".gitattributes"
  ".nvmrc"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Missing required harness file: $file"
    exit 1
  fi
done

echo "[1/6] Harness files are present."

echo "[2/6] Validating harness state..."
if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=(python3)
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=(python)
elif command -v py >/dev/null 2>&1; then
  PYTHON_CMD=(py -3)
else
  echo "ERROR: Python 3 is required for harness validation."
  exit 1
fi

"${PYTHON_CMD[@]}" - <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(".")
feature_path = root / "feature_list.json"

try:
    data = json.loads(feature_path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"ERROR: feature_list.json is not valid JSON: {exc}")
    sys.exit(1)

errors = []
required_top = {"project", "version", "harnessDocs", "features"}
missing_top = required_top - data.keys()
if missing_top:
    errors.append(f"Missing top-level fields: {sorted(missing_top)}")

features = data.get("features")
if not isinstance(features, list) or not features:
    errors.append("features must be a non-empty list")
    features = []

ids = set()
allowed_statuses = {"pending", "in_progress", "blocked", "completed"}
in_progress = []

for index, feature in enumerate(features):
    if not isinstance(feature, dict):
        errors.append(f"Feature at index {index} must be an object")
        continue

    required_feature = {"id", "priority", "title", "description", "status", "dependencies", "verification", "evidence"}
    missing_feature = required_feature - feature.keys()
    if missing_feature:
        errors.append(f"Feature at index {index} missing fields: {sorted(missing_feature)}")

    feature_id = feature.get("id")
    if not isinstance(feature_id, str) or not feature_id:
        errors.append(f"Feature at index {index} has invalid id")
    elif feature_id in ids:
        errors.append(f"Duplicate feature id: {feature_id}")
    else:
        ids.add(feature_id)

    if not isinstance(feature.get("priority"), int):
        errors.append(f"Feature {feature_id or index} has non-integer priority")

    status = feature.get("status")
    if status not in allowed_statuses:
        errors.append(f"Feature {feature_id or index} has invalid status: {status}")
    if status == "in_progress":
        in_progress.append(feature_id or str(index))
    if status == "completed" and not feature.get("evidence"):
        errors.append(f"Completed feature {feature_id or index} must include evidence")

    dependencies = feature.get("dependencies")
    if not isinstance(dependencies, list):
        errors.append(f"Feature {feature_id or index} dependencies must be a list")
    else:
        for dependency in dependencies:
            if not isinstance(dependency, str):
                errors.append(f"Feature {feature_id or index} has non-string dependency")

if len(in_progress) > 1:
    errors.append(f"Only one feature may be in_progress, found: {in_progress}")

for feature in features:
    if not isinstance(feature, dict):
        continue
    feature_id = feature.get("id")
    for dependency in feature.get("dependencies", []):
        if dependency not in ids:
            errors.append(f"Feature {feature_id} depends on unknown feature {dependency}")

for doc in data.get("harnessDocs", []):
    if not (root / doc).exists():
        errors.append(f"harnessDocs entry does not exist: {doc}")

if errors:
    for error in errors:
        print(f"ERROR: {error}")
    sys.exit(1)

print("feature_list.json structure is valid.")
PY

if [ -f "local-fixtures/lotr/tts-save.json" ]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if ! git check-ignore -q "local-fixtures/lotr/tts-save.json"; then
      echo "ERROR: local LOTR fixture is not ignored by git."
      exit 1
    fi
  fi
fi
echo "[2/6] Harness state is valid."

echo "[3/6] Checking implementation scaffold..."
if [ ! -f "package.json" ]; then
  echo "[3/6] package.json not found. This is expected before the implementation scaffold exists."
  echo "[4/6] Skipping dependency installation."
  echo "[5/6] Skipping TypeScript and Vitest checks."
  echo "[6/6] Next required task: complete the smallest-priority pending feature in feature_list.json."
  echo "Harness is ready; implementation scaffold is still pending."
  exit 0
fi

echo "[4/6] Installing npm dependencies..."
npm install --silent
echo "[4/6] Dependencies are ready."

echo "[5/6] Running TypeScript checks..."
if npm run check-types --if-present; then
  echo "[5/6] Project type-check script passed."
else
  npx tsc --noEmit
fi

echo "[6/6] Running Vitest..."
npx vitest run
echo "[6/6] Vitest passed."

echo "Implementation baseline is healthy."
echo "LoreCanvas is ready for the next pending feature."

exit 0