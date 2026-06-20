---
name: lorecanvas-feature-loop
description: Orchestrate one LoreCanvas feature through multi-agent planning, disjoint implementation packets, verification, browser QA, independent review, bounded repair, evidence, and handoff. Use for implementing, continuing, or closing a feature_list.json item, or when coordinating LoreCanvas subagents.
---

# LoreCanvas Feature Loop

Use `AGENTS.md`, `agent_harness.json`, and `agent_work/current.json` as the
operating contract. Read `references/work-packet.md` before delegation.

## 1. Establish the run

1. Run the repository start sequence from `AGENTS.md`.
2. If `agent_work/current.json` has an active feature, resume it.
3. Otherwise select the lowest-priority dependency-ready pending feature.
4. Do not activate a second product feature.
5. Set the run to `planning`; the main/orchestrator agent alone updates run
   state, `feature_list.json`, and `progress.md`.

## 2. Plan with a subagent

Explicitly spawn `lorecanvas-planner` or a read-only explorer. Require:

- acceptance assertions and non-goals;
- human gates;
- exact work packets and disjoint write sets;
- focused verification;
- browser scenarios when required;
- integration order and risks.

Review the plan. If domain or visual semantics remain open, set
`awaiting_human`, record the options, and ask the human owner.

## 3. Delegate implementation

Use subagents only when the user has explicitly authorized multi-agent work.
Prefer parallel read-heavy work. For write work:

- assign exact files or new modules;
- state that other agents are active and unrelated edits must be preserved;
- never assign the same shared file to two workers;
- use worktrees for substantial independent write packets;
- keep shared-file integration with one worker or the orchestrator.

Common lanes:

- engine worker: new pure engine module and behavior;
- test worker: focused tests in a disjoint test file;
- web worker: focused component/helper after contracts are stable.

Do useful integration work while subagents run. Do not redo their assigned task.

## 4. Verify

Run the feature verification, then:

```powershell
npm.cmd run check-types
npm.cmd run test
npm.cmd run build
.\init.ps1
```

If UI, PixiJS, file flow, animation, layout, or interaction changed, invoke
`$lorecanvas-browser-qa`.

## 5. Review and repair

Spawn `lorecanvas-reviewer` with the acceptance contract, diff, test summary,
and browser evidence. Fix P0/P1 findings and rerun affected verification.

Allow at most three repair iterations for the same root cause. After that,
record a blocker and stop the automatic loop.

## 6. Close

Only the orchestrator:

1. marks the feature `completed`;
2. records structured, reproducible evidence;
3. updates `progress.md` with the current snapshot and next task;
4. resets `agent_work/current.json` to `idle`;
5. confirms no unresolved human gate, blocker, or P0/P1 finding remains.

Do not commit, push, deploy, or open a PR unless the user explicitly requests it.
