# LoreCanvas Human Decision Gates

Agents should continue autonomously until one of these gates is triggered.
Record the question, options, recommendation, and status in
`agent_work/current.json`.

## Domain gate

Trigger when a change determines what a board-game concept means rather than how
the generic engine represents it.

Examples:

- whether an Edge is directed for a specific scenario;
- how a rulebook ambiguity should resolve;
- whether a card, tracker, stack, or token has a game-specific exception;
- whether a fixture interpretation is canonical.

The agent may extract rulebook evidence and propose generic representations. The
human product/domain owner decides the semantics. The decision must not become a
game-specific branch in product code.

Required record:

- source material;
- question;
- two or more viable options when available;
- recommendation and tradeoff;
- human decision and date.

## Visual gate

Trigger when success depends on taste, art direction, hierarchy, or theatrical
feel rather than objective correctness.

Examples:

- layout direction or information density;
- Cut-in timing and dramatic emphasis;
- color, typography, visual hierarchy, or animation style;
- choosing among materially different mockups.

The web agent should produce a small number of rendered alternatives. Browser QA
must capture the relevant viewport. The human chooses a direction before the
agent performs broad polish.

Objective defects such as overflow, unreadable contrast, broken focus order, or
console errors do not require this gate.

## External-action gate

Trigger before:

- deploying or promoting production;
- creating credentials or changing permissions;
- deleting nontrivial local or cloud data;
- committing, pushing, opening a PR, or sending messages unless explicitly
  requested;
- uploading private fixtures or user data.

The gate records the exact action, destination, and affected data.

## Gate resolution

A gate can be:

- `pending`: automation pauses at `awaiting_human`;
- `approved`: work continues within the approved scope;
- `rejected`: planner revises the plan;
- `not-required`: planner records why the trigger does not apply.

Silence is not approval. Existing product boundaries in `docs/product.md` are
already approved and do not need to be re-litigated.
