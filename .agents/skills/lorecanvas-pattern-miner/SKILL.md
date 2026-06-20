---
name: lorecanvas-pattern-miner
description: Inspect LoreCanvas progress and feature evidence for repeated agent work, classify the correct Codex surface, and propose or refine reusable skills. Use during recurring workflow reviews, after repeated failures, or from a scheduled pattern-mining automation.
---

# LoreCanvas Pattern Miner

Read `progress.md`, recent feature evidence, `docs/skill-candidates.md`, and
existing repository skills. This workflow is read-only unless the user
explicitly requests creating or updating a skill.

## Mine patterns

1. Identify actions, failures, or manual evidence steps repeated at least three
   times.
2. Link each occurrence.
3. Normalize variable inputs, stable steps, outputs, and success criteria.
4. Reject one-off incidents and workflows driven mainly by subjective judgment.

## Select the right surface

- `AGENTS.md`: durable repository rule or boundary.
- Script: deterministic transformation or validation.
- Hook: cheap lifecycle enforcement that must run automatically.
- Skill: reusable judgment/workflow with progressive disclosure.
- Plugin/MCP: shared package or structured external system.
- Automation: a proven skill or check that should run on a schedule.
- Human gate: domain meaning, visual taste, or sensitive external decision.

## Promotion rule

Promote a skill only when:

- at least three occurrences exist;
- inputs and outputs are stable;
- success is reviewable;
- replay is safe;
- no existing skill already covers it.

Add or update one row in `docs/skill-candidates.md` only when authorized. If
creating a skill, use `$skill-creator`, validate it, and forward-test it with a
fresh subagent.

## Product limitation

Record & Replay is currently macOS-only and its initial availability excludes
the EEA, UK, and Switzerland. Do not describe it as the Windows implementation
for LoreCanvas. Use this miner plus repository skills and Codex automations.
