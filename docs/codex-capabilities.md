# Codex Capability Matrix

Verified for the LoreCanvas workspace on June 20, 2026.

| Capability | Repository integration | Current environment |
| --- | --- | --- |
| Subagents | `.codex/agents/*.toml` and `$lorecanvas-feature-loop` | Available and used for parallel audits/forward tests |
| Repository skills | `.agents/skills/lorecanvas-*` | Available; three skills pass skill-creator validation |
| In-app Browser | `$lorecanvas-browser-qa` | Available; localhost, console, DOM, and responsive viewport smoke verified |
| Browser Developer mode | Documented in Browser QA routing | Full CDP is user-approved product configuration; it was not advertised by this session, so only normal console inspection was used |
| Computer Use | Windows-native fallback in Browser QA | Plugin present, but June 20 health check failed inside the bundled `@oai/sky` runtime due to an unexported package subpath; not a repository baseline failure |
| Hooks | `.codex/hooks.json` | Read-only Stop validation is configured; a human must review/trust the hook |
| Automations | Pattern-mining workflow uses `$lorecanvas-pattern-miner` | Active worktree automation `lorecanvas-pattern-miner`, Mondays at 09:00 Europe/Stockholm |
| Worktrees | Required for independent background write packets | Product surface is available; ignored LOTR fixtures are intentionally not copied |
| Record & Replay | Not used as the LoreCanvas implementation | Publicly documented as macOS-only, with initial availability excluding EEA/UK/Switzerland |

## Routing rules

- Use structured plugins/MCP before visual automation for external systems.
- Use the in-app Browser for the local web app.
- Use Chrome only for real profile/login/extension state.
- Use Computer Use for native Windows GUI gaps after its health check passes.
- Use hooks for cheap deterministic validation, not dependency installation or
  product reasoning.
- Use automations only after the underlying prompt/skill works interactively.

Capability availability is runtime-specific. The repository documents the
preferred route but does not claim that a plugin is installed, authorized, or
healthy until a session verifies it.

## Official references

- https://developers.openai.com/codex/subagents
- https://developers.openai.com/codex/skills
- https://developers.openai.com/codex/hooks
- https://developers.openai.com/codex/app/automations
- https://developers.openai.com/codex/app/browser
- https://developers.openai.com/codex/app/computer-use
- https://developers.openai.com/codex/app/worktrees
- https://developers.openai.com/codex/record-and-replay
