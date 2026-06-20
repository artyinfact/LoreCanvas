---
name: lorecanvas-browser-qa
description: Verify LoreCanvas rendered web flows and PixiJS interactions with reproducible browser evidence. Use after UI, layout, PixiJS, file-picker, animation, asset, or interaction changes, or when diagnosing a browser-only regression.
---

# LoreCanvas Browser QA

Read `references/evidence.md` before reporting results.

## Surface selection

1. Prefer the Codex in-app Browser for localhost and unauthenticated web flows.
2. Use Browser Developer mode when console, network, DOM/styles, memory, or
   performance tracing matters. Full CDP requires explicit product approval.
3. Use Chrome only when real profile/login/extensions are required.
4. Use Computer Use only for Windows-native UI or flows the in-app Browser
   cannot cover. It uses the Windows foreground desktop.
5. Use Playwright CLI only as a documented fallback when the Browser surface
   cannot perform the required flow.

Follow the installed browser/computer-use skill instructions for the selected
surface.

## Workflow

1. Confirm the expected route, viewport, starting scenario, and acceptance
   assertions.
2. Start or reuse the dev server. Avoid running `npm ci` while it is active.
3. Load the route and collect the cheapest state that proves page identity.
4. Exercise only the changed flow.
5. After each meaningful interaction, inspect fresh DOM state or a screenshot.
6. Record console errors/warnings. Use Developer mode for relevant network or
   style assertions.
7. Capture screenshots when visual state is part of acceptance.
8. Separate objective failures from visual-taste questions.
9. Return pass/fail evidence. Do not edit source files while acting as QA.

## Minimum assertions

- correct route and application identity;
- no framework error overlay;
- no unexpected console error;
- target interaction changes the authoritative UI/state signal;
- persisted or frozen state remains correct when relevant;
- responsive/viewport behavior is checked when layout changed;
- PixiJS canvas and host sizes agree when canvas layout changed.
