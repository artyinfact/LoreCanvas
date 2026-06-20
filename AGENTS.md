# AGENTS.md: LoreCanvas Agent Entry

LoreCanvas is a theatrical VTT engine for story-driven board games. The product
uses a background-image Node-Graph, generic Entities, JSON rules, and a
CCFOLIA-style theatrical renderer. The stack is React, Zustand, PixiJS v8, and
Vitest.

This file is the entry map. Detailed behavior belongs in the linked harness
documents, custom agents, skills, code, and tests.

## 1. Start here

Run these steps at the beginning of every implementation or harness session:

1. Confirm the repository root with `Get-Location` or `pwd`.
2. Read `progress.md`.
3. Read `agent_harness.json` and `agent_work/current.json`.
4. Read the next dependency-ready item in `feature_list.json`.
5. Run `git status --short --branch`, `git remote -v`, and
   `git log --oneline -5`.
6. If the worktree is clean and the branch has an upstream, run
   `git pull --ff-only`.
7. Run the canonical harness:
   - Windows: `.\init.ps1` or `npm.cmd run harness`
   - POSIX/Git Bash: `./init.sh`

If the baseline fails after `package.json` exists, stop feature work and repair
the baseline first.

## 2. Use the multi-agent loop

For feature implementation, invoke `$lorecanvas-feature-loop`. The orchestrator
owns requirements, task decomposition, write-set assignment, integration,
evidence, and closure. Use the project agents in `.codex/agents/`:

- `lorecanvas-planner`: read-only planning and human-gate detection.
- `lorecanvas-engine-worker`: pure engine/state/serialization implementation.
- `lorecanvas-web-worker`: React/PixiJS interaction and presentation.
- `lorecanvas-test-worker`: focused Vitest and regression coverage.
- `lorecanvas-browser-qa`: rendered-flow verification and evidence.
- `lorecanvas-reviewer`: independent correctness and boundary review.

Only one product feature may be active at a time. Multiple subagents may work
inside that feature when their write sets are disjoint. Never let two agents
edit `src/state/boardStore.ts`, `src/ui/App.tsx`, `feature_list.json`,
`progress.md`, or `agent_work/current.json` concurrently.

The main agent remains the sole integrator for shared files and final status.
Subagents return concise findings, changed paths, commands, and evidence.

## 3. Human decision gates

Do not autonomously finalize:

- board-game domain interpretation or game-rule semantics;
- visual direction, layout taste, or theatrical art direction;
- destructive external actions, production publication, credentials, or
  permission changes.

Agents may research and present options, but must record the pending decision in
`agent_work/current.json` and ask the human owner. See `docs/human-gates.md`.

## 4. Knowledge routing

- Product definition and boundaries: `docs/product.md`
- Agent architecture and loop: `docs/agent-system.md`
- Code ownership and dependency boundaries: `docs/architecture.md`
- Human decision gates: `docs/human-gates.md`
- Acceptance requirements: `clean-state-checklists.md`
- Current handoff: `progress.md`
- Browser verification: `$lorecanvas-browser-qa`
- Repeated-work mining: `$lorecanvas-pattern-miner`
- PixiJS work: use the `pixijs` router skill first, then the relevant PixiJS
  v8 skill. Use `@pixi/react` declarative APIs; do not invent v5/v6 APIs.

## 5. Product boundaries

- Board is a background-image Node-Graph. Location and Edge are first-class.
  Grid, A*, hex, tactical distance, and tile-path assumptions are out of scope.
- Entity remains generic: `{ id, type, state: Record<string, unknown> }` plus
  optional Location binding.
- Game semantics live in data, state, and JSON rules. Product code must not
  contain LOTR-specific branches.
- Runner state is derived from and isolated from Maker setup.
- The theatrical renderer consumes commands; it does not decide game rules.
- `local-fixtures/lotr/` is ignored local validation data, never product assets.

## 6. Validation and evidence

Run the feature's declared verification plus:

```powershell
npm.cmd run check-types
npm.cmd run test
npm.cmd run build
.\init.ps1
```

For UI, PixiJS, Cut-in, filter, file-picker, or interaction changes, use
`$lorecanvas-browser-qa` and record route, viewport, actions, assertions,
console/network findings, and artifact paths. Prefer the in-app Browser and its
Developer mode. Use Computer Use only for Windows-native or browser flows that
the in-app Browser cannot cover.

A feature is complete only when implementation, focused verification, full
harness, independent review, required browser evidence, `feature_list.json`
evidence, `progress.md`, and `agent_work/current.json` all agree.

## 7. Git and scope

- Preserve unrelated user changes.
- Do not refactor outside the active feature unless removing a demonstrated
  blocker.
- Do not run `git add`, `git commit`, `git push`, deploy, or open a PR unless
  the user explicitly requests it.
- Use worktrees for independent background write tasks. Use same-checkout
  subagents primarily for read-heavy work or strictly disjoint files.

## 8. Windows harness

The canonical implementation is `scripts/init.mjs`.

- PowerShell: `.\init.ps1`
- CMD: `.\init.cmd`
- npm: `npm.cmd run harness`
- Git Bash/POSIX: `./init.sh`

If `bash ./init.sh` resolves to `C:\Windows\System32\bash.exe` without WSL, use
the PowerShell or npm entrypoint. That is command resolution, not a broken
LoreCanvas baseline.
