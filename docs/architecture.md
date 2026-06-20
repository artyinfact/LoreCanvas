# LoreCanvas Engineering Boundaries

## Dependency direction

The intended dependency direction is:

```text
src/engine/*  <-  src/state/*  <-  src/ui/*
```

- `src/engine/` contains deterministic TypeScript models and operations. It must
  not import React, Zustand, PixiJS, browser globals, or UI modules.
- `src/state/` coordinates engine operations and serialization through Zustand.
  It may import engine modules, but not React components.
- `src/ui/` renders state and translates user interactions into store actions.
  It must not duplicate game rules that belong in the engine.
- `tests/engine/`, `tests/state/`, `tests/ui/`, and `tests/e2e/` mirror these
  boundaries.

## Current hotspots

The current implementation has four high-conflict modules:

- `src/state/boardStore.ts`: central state and action integration.
- `src/ui/App.tsx`: most workbench and inspector UI.
- `src/ui/BoardCanvas.tsx`: PixiJS rendering and board interaction.
- `src/engine/serialization.ts`: cross-feature package schema.

These files are integration points, not parallel work queues. Assign one writer
at a time. New features should prefer a focused engine module, focused store
adapter, focused UI component, and matching tests instead of expanding the
hotspots indefinitely.

## Agent ownership

### Engine worker

Own:

- pure models and validation under `src/engine/`;
- focused state adapters explicitly assigned by the planner;
- serialization changes that are part of the same schema unit.

Must provide engine tests and avoid UI imports.

### Web worker

Own:

- focused components under `src/ui/`;
- PixiJS rendering and events after reading the PixiJS skills;
- `src/styles.css` only when explicitly assigned;
- browser-facing accessibility and error states.

Must not invent domain rules or mutate engine state outside store actions.

### Test worker

Own:

- focused behavioral tests in the matching test layer;
- regression tests for demonstrated bugs;
- fixture-independent assertions.

LOTR fixture tests may validate expressiveness, but product tests must remain
generic.

### Browser QA

Own:

- route and viewport verification;
- console and network inspection;
- interaction evidence;
- screenshots when visual state matters;
- defect reports with reproducible actions.

Browser QA does not silently fix source code.

## Parallelization rules

Safe examples:

- engine worker creates `src/engine/movement.ts` while test worker creates
  `tests/engine/movement.test.ts`;
- web worker creates a new focused component while engine worker changes a new
  pure engine module;
- browser QA verifies the existing baseline while implementation workers work
  in isolated worktrees.

Unsafe examples:

- two workers editing `boardStore.ts`;
- one worker changing package schema while another changes restore logic without
  an agreed contract;
- browser QA editing UI during verification;
- parallel feature work that changes the same Entity or serialization semantics.

## Automated architecture checks

The harness validates the agent-system files and can cheaply enforce:

- all configured custom agents and skills exist;
- role ids, loop ids, and feature ids are unique;
- one active feature maximum;
- active feature and run-state consistency;
- completed feature evidence presence;
- local LOTR fixtures remain ignored.

Future checks should be added only when deterministic. Good candidates include
engine import boundaries, source-file size warnings, and generic-product term
scans. Architectural judgment remains a reviewer responsibility.
