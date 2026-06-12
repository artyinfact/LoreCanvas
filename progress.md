# Agent 进度与交接 (Agent Progress Handoff)
 
这是 `LoreCanvas` 的长时任务系统事实来源。每次会话开始时先读本文件，结束时写回已验证状态、下一步和 blocker。

## 当前会话目标

- 已完成 F-00 收尾确认，并完成 `F-01-GraphBoard`（大地图编辑模式 / 核心图谱 Board）。
- F-01 的用户可体验目标：上传图片素材，选择图片作为大地图背景，在 PixiJS 画布上手动创建 Location 和 Edge，并在侧边栏从图片素材创建可配置、可拖放、可删除的通用配件模板。
- 本轮继续返工 F-01 UI：菜单需要折叠；Piece Template 应位于贴近地图的侧边创作工具栏，降低从模板拖到地图的操作成本。

## 已完成 / 已验证状态

- [x] 已按 `AGENTS.md` 开工流程运行 `pwd`，确认项目根目录为 `C:\Users\xyzg\Downloads\LoreCanvas`。
- [x] 已读取 `progress.md`、`feature_list.json`、`docs/product.md`、`clean-state-checklists.md`。
- [x] 已运行 `git status --short --branch`、`git remote -v`、`git log --oneline -5`；远端为 `https://github.com/artyinfact/LoreCanvas`。
- [x] 工作区开工时干净且有 upstream，已运行 `git pull --ff-only`，结果为 `Already up to date.`。
- [x] 开工基线 `bash ./init.sh` 通过：harness validation、依赖安装、TypeScript、Vitest 全绿。
- [x] 已确认 `F-00-EnvironmentAndVercel` 在 `feature_list.json` 中为 `completed` 且 evidence 完整：Vercel production URL 为 `https://lorecanvas-mu.vercel.app`。
- [x] 已领取 `F-01-GraphBoard`，并在收尾时标记为 `completed`。
- [x] 已读取 PixiJS skills：入口 `pixijs`、`pixijs-scene-graphics`、`pixijs-events`、`pixijs-scene-sprite`、`pixijs-math`、`pixijs-assets`。
- [x] 已新增 `src/engine/board.ts`：纯 TypeScript Board 引擎层，支持任意背景图片引用、normalized Location 坐标、Edge 引用、增删改 API、悬挂引用校验、删除 Location 时清理相关 Edge。
- [x] 已新增 `tests/engine/board.test.ts`：覆盖背景引用、Location 增删改、Edge 增删改、删除 Location 清边、缺失 Location 引用校验、无效坐标、自环和重复连接。
- [x] 已新增 `src/state/boardStore.ts`：Zustand 管理 Board、上传图片素材、工具模式、选中 Location、Edge 草稿和配件模板。
- [x] 已重写 `src/ui/App.tsx` 和 `src/styles.css`：从 F-00 smoke screen 切换为中性的 Maker 工作台 UI，包含顶部状态栏、PixiJS 大地图画布、右侧工具栏、素材列表、Location inspector、Edge inspector 和 Piece Templates。
- [x] 已新增 `src/ui/BoardCanvas.tsx`：使用 `@pixi/react` 声明式组件和 PixiJS v8 API 渲染底图、Location、Edge，并处理指针点击、拖动和连线。
- [x] 已按用户反馈修正 F-01 浏览器验收缺口：图片素材可删除，Piece Template 可删除，模板可设置渲染宽高与 max copies，Select 工具可将模板从侧栏拖放到 GraphBoard 并受 copy 上限约束。
- [x] Tools 的 2/3 文案已从 `Location` / `Edge` 改为 `Add Location` / `Add Edge`。
- [x] 已按用户二次反馈重排 F-01 Maker UI：左侧为 `Creation toolbar`，中央为 GraphBoard，右侧为可折叠 `Board inspector`。
- [x] 已给 `Tools`、`Piece Templates`、`Image Assets`、`Location`、`Edges` 菜单增加折叠功能。
- [x] `Piece Templates` 已移到左侧创作工具栏并位于 `Image Assets` 之前，便于从侧栏直接拖动到地图。
- [x] 已新增 `public/favicon.svg` 并在 `index.html` 添加 favicon 链接，避免浏览器默认 `/favicon.ico` 404。
- [x] 已引入 `lucide-react` 作为 UI 图标依赖。

## 验证记录

- [x] `npx vitest run tests/engine/board.test.ts` 通过：1 个测试文件 / 7 个测试。
- [x] `npm run check-types` 通过。
- [x] `npm run build` 通过；2026-06-08 已通过 lazy-loading BoardCanvas 消除 PixiJS big chunk warning。
- [x] 完整 `bash ./init.sh` 通过：3 个测试文件 / 10 个测试，全量 Vitest 绿。
- [x] 已启动本地 Vite dev server：`http://127.0.0.1:5173`，后台进程 id 为 `15808`。
- [x] 已用 Playwright 打开本地页面并截图检查：画布非空、侧栏不挤压、按钮文本可读。
- [x] Playwright 交互验证：点击 PixiJS 画布创建 2 个 Location，切换 Edge 工具后点击两个节点创建 1 条 Edge，Edge inspector 出现 label 输入和删除按钮。
- [x] Playwright 上传验证：用 `public/favicon.svg` 模拟图片素材上传，Images 计数变为 1，自动设为 Background，并通过 PixiJS 渲染到底图；console error/warning 均为 0。
- [x] Playwright 配件模板验证：点击上传素材的 `Piece` 按钮，Pieces 计数变为 1，Piece Templates 列表出现 `piece-1`。
- [x] Playwright 返工验证：Tools 显示 `Select`、`Add Location`、`Add Edge`。
- [x] Playwright 返工验证：Piece Template 可编辑宽高与 Max copies；设置为 `80 x 40`、Max `2` 后，使用 Select 从侧栏拖到 Board 两次，模板显示 `2 / 2 copies`。
- [x] Playwright 返工验证：第三次拖放同一模板被 copy limit 拦截，显示 `favicon has reached its 2 copy limit.`。
- [x] Playwright 返工验证：删除 Piece Template 后，模板列表和已放置 copy 均清空；删除上传图片后，Images 回到 0、背景清空、模板列表为空；console error/warning 均为 0。
- [x] Playwright 二次返工验证：页面结构为左侧 `Creation toolbar`、中央 `Map canvas`、右侧 `Board inspector`。
- [x] Playwright 二次返工验证：`Piece Templates` section 和右侧 `Inspector` 均可折叠；右侧 inspector 可收起为窄栏。
- [x] Playwright 二次返工验证：上传 `public/favicon.svg`、创建 template、切换 `Select` 后，从左侧 `Piece Templates` 拖到 Board，模板 copy 计数更新为 `1 / 1 copies`；console error/warning 均为 0。

## 当前系统状态

- `F-00-EnvironmentAndVercel` 已完成并可复查。
- `F-01-GraphBoard` 已完成并写入 `feature_list.json` evidence。
- 当前最高优先级 pending 任务为 `F-03-MovementValidation`。
- Board 模型使用 normalized 坐标，规则层不依赖图片尺寸或画布像素。
- F-01 UI 中的 Entity Templates 和拖放到 Board 的 copy 已在 F-02 映射为运行时 Entity；F-03 应基于 Location 绑定实现图移动校验。
- F-01 Maker UI 当前采用左侧创作工具栏和右侧折叠检查器；后续 F-02 应沿用这一布局，不要把模板拖放入口重新放回远离地图的位置。
- 本轮没有执行 `git add`、`git commit` 或 `git push`。

## 遗留风险 / 卡点 (Blockers)

- 当前没有阻塞 F-02 的已知 blocker。
- Vite production build 的 PixiJS big chunk warning 已在 2026-06-08 消除：BoardCanvas/PixiJS 被拆成 async chunk，主入口保持在 500 kB 阈值以下。
- `local-fixtures/lotr/` 仍应保持 `.gitignore` / `.vercelignore` 排除，只用于本地 E2E 验收。
- 执行依赖 PixiJS 或 `@pixi/react` 的后续任务前，仍必须优先读取对应 PixiJS skills。

## 下一步行动 (Next Steps)

1. 新会话先运行 `bash ./init.sh` 确认 F-01 后的基线仍通过。
2. 按 `feature_list.json` 单线程领取 `F-02-EntitySystem`。
3. F-02 应把本轮 Piece Templates 扩展为真正通用 Entity 模型 `{ id, type, state: Record<string, any> }`，并处理 Entity 与 Location 的绑定/解绑。
4. F-02 完成后运行 `npx vitest run tests/engine/entity.test.ts`，再运行完整 `bash ./init.sh`。

## 2026-06-04 F-01 Third Browser Rework

- Completed the latest F-01 rework requested from browser feedback: scroll-contained sidebars for large image/template sets, map zoom controls, central board expansion when sidebars collapse, and editable/deletable placed piece copies.
- Browser verification used temporary Playwright with local Chrome against `http://127.0.0.1:5173`: bulk-uploaded 28 SVG assets, confirmed `document.body.scrollHeight` stayed at the `920px` viewport height while `.asset-list` scrolled internally (`386px` client height / `3910px` scroll height), and console error/warning count was 0.
- Browser verification confirmed collapsing both sidebars expanded the GraphBoard canvas from `752px` to `1312px`, zoom controls changed the board zoom from `100%` to `120%`, and a dragged placed piece could be edited to `144 x 96`, selected again from the canvas, and deleted back to `0 / 1 copies`.
- `F-00-EnvironmentAndVercel`, `F-01-GraphBoard`, and `F-02-EntitySystem` are marked `completed` in `feature_list.json`. The next pending task is `F-03-MovementValidation`.

## 2026-06-04 F-01 Collapsed Sidebar Canvas Fix

- Fixed a severe F-01 layout bug where hiding sidebars expanded `.board-canvas` but left the PixiJS `<canvas>` at its old width, making the map appear clipped or covered.
- Root cause: Pixi renderer/canvas size was not reliably synchronized after the board host resized. `BoardCanvas` now keeps an `ApplicationRef`, explicitly calls `app.renderer.resize(...)` on viewport changes, and measures the host with `clientWidth/clientHeight` so the canvas uses the content box rather than the bordered outer box.
- Browser verification: before the fix, collapsing both sidebars expanded `.board-canvas` from `752px` to `1312px` while the canvas stayed `750px` wide. After the fix, the collapsed canvas resized to `1310 x 734`, matching the expanded board content area; body remained fixed at viewport height with no horizontal overflow.
- Deferred known issue: uploading several hundred MB of image assets can still make the app sluggish; this is intentionally left for F-02/resource-management work.

## 2026-06-04 F-01 Select Default And Map Pan

- Fixed browser feedback on the Select tool: `Select` is now the default tool instead of `Add Location`.
- Added empty-map panning in Select mode. When no location or placed piece is selected, the PixiJS canvas uses a hand cursor (`grab`) and dragging the background pans the visible board frame in x/y screen space.
- Interaction priority remains: dragging placed pieces moves the piece, dragging locations moves the location, and background dragging pans only when nothing is selected.
- In-app Browser verification against `http://127.0.0.1:5173/`: default active tool was `Select`, hovering empty board canvas reported cursor `grab`, and before/after screenshots confirmed the board background shifted after a drag gesture.

## 2026-06-04 F-01 Reset View Fix

- Updated the Reset zoom button to reset the full board view, not only the zoom value. Board pan is now stored in `boardStore`, and `resetBoardView()` restores `boardZoom` to `1` and `boardPan` to `{ x: 0, y: 0 }`.
- `BoardCanvas` now reads and updates pan through the store, so toolbar controls can reset pan created by Select-mode background dragging.
- In-app Browser verification: starting from default `100%`, zoomed to `120%`, dragged the board background to pan, then clicked `Reset zoom`; the zoom label returned to `100%` and the board framing visually returned to the initial view.

## 2026-06-05 F-01 Mouse Wheel Zoom Addendum

- Added mouse-wheel zoom for F-01: in Select drag mode with no selected object, wheel input over the board canvas zooms the map around the pointer and updates the toolbar zoom label.
- Added selected-copy wheel scaling: when a placed template copy is selected, wheel input over the board canvas scales that copy's width/height instead of changing map zoom.
- Implementation detail: `BoardCanvas` uses a native non-passive `wheel` listener on the canvas host so `preventDefault()` works without passive-listener console errors.
- In-app Browser verification: default Select mode on `http://127.0.0.1:5173/`, wheel input on the board canvas changed the zoom label from `100%` to `246%`.
- Supplemental temporary Playwright/Chrome verification was used because the Browser API does not expose file upload. It uploaded `public/favicon.svg`, created a template and placed copy, confirmed map wheel zoom changed `100%` to `172%`, then confirmed selected copy wheel scaling changed the copy from `96 x 96` to `165 x 165` while map zoom stayed `100%`; console error/warning count was 0.
## 2026-06-08 F-02 Entity System And Asset Categories

- Completed `F-02-EntitySystem`: added `src/engine/entity.ts` with generic `Entity { id, type, state, locationId? }`, `EntityState`, arbitrary state patching, create/remove, Location bind/unbind, and `clearLocationBindings` for deleted Locations.
- Added six resource categories for Maker assets: `BOARD`, `PAWN`, `TOKEN`, `TILE`, `CARD`, `OTHER`. Category metadata now records layer order, template eligibility, Location binding support, and pathing rights; only `PAWN` is marked path-capable for future F-03/F-05 movement logic.
- Updated F-01 toolbar/store integration: uploaded image assets have a category selector; board backgrounds are `BOARD`; graph templates are created only for placeable categories; placed template copies now create runtime Entities and delete their Entities when the copy/template/asset is removed.
- Updated GraphBoard placement behavior: `TILE` renders above the Board and below graph nodes, while other placed entities render above nodes; `PAWN` and `TOKEN` drops must land near a Location and create a Location-bound Entity.
- Added `tests/engine/entity.test.ts` and `tests/state/boardStore.test.ts`. Verification passed with `npm.cmd run check-types`, `npm.cmd exec -- vitest run tests/engine/entity.test.ts`, `npm.cmd run test` (5 files / 19 tests), and `npm.cmd run build`.
- `bash ./init.sh` could not complete in this Windows session because `bash` resolves to the WSL shim and WSL is unavailable; Git Bash ran harness validation but its `npm` step hit the same WSL shim. Equivalent implementation checks were run directly through `npm.cmd`.
- Browser/plugin verification was attempted but blocked by the Browser Node REPL bridge failing with `windows sandbox failed: spawn setup refresh`; no browser evidence was recorded for this F-02 pass. Next pending feature is `F-03-MovementValidation`.
## 2026-06-08 Harness And Windows Environment Fix

- Fixed the harness/environment limitation recorded after F-02 by standardizing baseline validation on `scripts/init.mjs`.
- Windows entrypoints now work without WSL: `.\init.ps1`, `.\init.cmd`, and `npm.cmd run harness`. POSIX/Git Bash still uses `./init.sh`, which delegates to the same Node harness.
- `scripts/init.mjs` validates required harness files, validates `feature_list.json`, checks ignored LOTR fixtures, runs dependency installation with `npm ci` when `package-lock.json` exists, then runs type-check and full Vitest.
- Verification passed sequentially with `.\init.ps1`, `npm.cmd run harness`, `.\init.cmd`, and explicit Git Bash `& 'C:\Program Files\Git\bin\bash.exe' ./init.sh`; each run completed 5 test files / 19 tests.
- `bash ./init.sh` from PowerShell may still resolve to `C:\Windows\System32\bash.exe` on machines without WSL. That is now documented as an environment command-resolution issue; on Windows use `.\init.ps1` or `npm.cmd run harness`.

## 2026-06-08 PixiJS Chunk Split

- Analyzed the production build warning: the main entry imported `BoardCanvas` synchronously, which pulled `@pixi/react` and `pixi.js` into the first application chunk.
- Fixed it by lazy-loading `BoardCanvas` with `React.lazy` and `Suspense`, keeping the stage layout stable with `.board-canvas-loading`. No warning-threshold increase was used.
- Verification: `npm.cmd run build` now emits no Vite large chunk warning. Largest JS chunks after the split were `BoardCanvas` at about 350 KB and the main `index` chunk at about 223 KB.
- Verification: Vite preview served `/` and the async `BoardCanvas` chunk with HTTP 200.
- Verification: `npm.cmd run harness` passed with 5 test files / 19 tests. Browser REPL had no browser control globals exposed in this session, so this change was validated by build and tests rather than manual browser interaction.

## 2026-06-08 F-01 Direct Asset Placement Rework

- Reworked the Maker asset workflow so image assets are the direct drag source for placed entity copies. The separate Entity Templates section and `Template` asset button were removed from the UI.
- Uploaded assets now own placement configuration: category, default placed width/height, and `maxCopies` with a default of 1. `PAWN`, `TOKEN`, `TILE`, and `CARD` assets can be dragged to the GraphBoard; `BOARD` and `OTHER` assets remain non-placeable.
- `BoardCanvas` now accepts `application/x-lorecanvas-asset` drops and calls `createAssetPlacement`. `PAWN` and `TOKEN` still require dropping near a Location; other placeable categories can be placed directly on the board.
- Store state now tracks `assetPlacements` instead of template placements. Deleting a source image removes its placed copies and generated Entities; deleting a placed copy removes its Entity.
- Verification: `npm.cmd run check-types`, `npm.cmd run test` (5 files / 20 tests), and `npm.cmd run build` all passed.
- Browser verification: Browser DOM check at `http://localhost:5173/` confirmed the Maker page loads, Image Assets is present, `Template` text is absent, and no Vite error overlay is rendered. Browser screenshot capture timed out, so screenshot evidence came from temporary Playwright.
- Temporary Playwright verification uploaded `public/favicon.svg`, changed its category to `TILE`, confirmed `Template` text was absent, dragged the asset card directly onto `.board-canvas`, observed `1 / 1 copies` and `Entities1`, then attempted a second drag and confirmed the copy-limit error while Entities stayed at 1. Only Chromium headless WebGL driver performance warnings were filtered; app console errors were not observed in that run.

## 2026-06-08 F-01/F-02 Bound Pawn Inspector Rework

- Reworked the inspector for selected bound `PAWN` placements. When a pawn is bound to a Location, the inspector now shows a pawn sheet instead of the generic Location and Edges sections.
- Added per-pawn sheet state keyed by placement id: optional character card, held card list, and token/dice counters. Deleting a pawn placement or source asset cleans the related sheet references.
- Character and held card slots accept `CARD` assets. The token/dice tray accepts `TOKEN` assets; repeated drops increase the count, left-click increases, right-click decreases, and the count clamps at 0.
- Token assets now default to a high copy limit when an uploaded asset is categorized as `TOKEN`, matching the intended default-unlimited behavior while still respecting explicit asset copy limits.
- Verification: `npm.cmd run check-types`, `npm.cmd run test` (5 files / 22 tests), `npm.cmd run build`, and `npm.cmd run harness` all passed.
- Temporary Playwright verification uploaded four SVG assets, categorized them as `PAWN`, `CARD`, `CARD`, and `TOKEN`, created a Location, dropped the pawn onto that Location, confirmed the inspector showed `Character Card`, `Held Cards`, and `Tokens / Dice` while omitting `Location` and `Edges`, then verified card drops, repeated token drops, left-click increment, and right-click decrement. App console errors were not observed; Chromium headless WebGL driver performance warnings were filtered.

## 2026-06-09 MVP Feature Route Update

- Updated `feature_list.json` to prioritize a manual scenario MVP after completed `F-01-GraphBoard` and `F-02-EntitySystem`.
- The next pending feature is now `F-03-ScenarioLoadSave`, not movement validation. It must implement generic `.lorecanvas` import/export for the complete current scenario state: asset manifest, Board background, Locations, Edges, placed assets, runtime Entities, arbitrary Entity state, Location bindings, pawn sheets, held cards, token/dice counters, viewport state, and package metadata.
- Movement validation moved to `F-05-MovementValidation`; global tracker state moved to `F-06-GlobalTrackerState`; rule triggers and Cut-in rendering are explicitly deferred until after the manual MVP.
- The ignored local validation fixture is now `local-fixtures/lotr/LotR-FotF`, including renamed image assets, sliced cards, dice faces, the complete board artwork, and `LOTRRule.pdf`. This fixture is future test input for auto-setup and event-trigger work, but implementation must remain generic and must not hard-code LOTR semantics.
- Baseline before the feature-list update: `.\init.ps1` passed with 5 test files / 22 tests.

## 2026-06-09 F-03 Scenario Load/Save

- Completed `F-03-ScenarioLoadSave`: added a generic `lorecanvas.scenario` v1 JSON snapshot boundary in `src/engine/serialization.ts`.
- Scenario packages now preserve package metadata, all six image asset categories, Board background references, Locations, Edges, placed assets, runtime Entities with arbitrary JSON state and Location bindings, pawn sheets with held cards and token/dice counters, and viewport zoom/pan state.
- Added `src/state/scenarioStore.ts` to export the serializable subset of the Zustand board store and apply/import a scenario while clearing transient UI state such as selected asset, selected Location, selected placement, edge draft, active tool, and last error.
- Added `tests/engine/serialization.test.ts` for scenario round-trip, malformed package rejection, cross-reference validation, arbitrary Entity state preservation, pawn sheet cards/counters, and viewport preservation.
- Added `tests/state/scenarioStore.test.ts` for store apply/export round-trip plus a local LOTRRule setup snapshot. The LOTR test reads all entries from `local-fixtures/lotr/LotR-FotF/manifest.json` and validates setup state from `LOTRRule.pdf`: friendly troops, shadow troops, Nazgul, Eye of Sauron, threat/hope markers, supplies, shadow discard specials, objective display, player deck metadata, and unresolved random shadow deployment metadata.
- Verification passed: `npm.cmd exec -- vitest run tests/engine/serialization.test.ts tests/state/scenarioStore.test.ts`, `npm.cmd run check-types`, `npm.cmd run test` (7 files / 27 tests), `npm.cmd run build`, and `.\init.ps1`.
- `feature_list.json` now marks `F-03-ScenarioLoadSave` as completed with evidence. The next pending task is `F-04-ManualScenarioPrototype`.

## 2026-06-09 F-04 Route Clarification: Edit/Run Manual Board MVP

- Updated the active harness route before starting F-04. The project mode split is now explicit: Edit mode edits setup definition; Run mode consumes a finalized setup and produces runtime state.
- Edit mode scope: asset manifest, Board Template, background, Locations, Edges, region/area membership, board zones, default placement slots, and Setup Preset entities/cards/tokens/counters. Edit mode should not create or mutate runtime scenario state.
- Run mode scope: freeze Board Template and Setup Preset, derive the initial runtime snapshot, then support manual semantic operations such as moving Location-bound Entities between Locations, adjusting troop/token/dice stacks, moving cards between deck/discard/hand/display zones, inspecting current runtime state, saving, and reloading.
- F-04 should not optimize for manually dragging every card/token/pawn to raw board coordinates. Runtime state should prefer `locationId` and zone semantics; exact `x/y` placement is a rendering/default-slot concern unless deliberately overridden.
- `feature_list.json` and `clean-state-checklists.md` now reflect this F-04 target. F-09 LOTR validation was also clarified to validate an Edit-mode Board Template + Setup Preset opened as a frozen Run-mode board.
- Deferred remains unchanged: automatic setup parsing, event triggers, path validation, Cut-in rendering, online services, and game-specific rules stay out of F-04.

## 2026-06-09 F-04 Edit State Panel Clarification

- Updated the harness again so Edit mode has four explicit editable state surfaces rather than a single generic setup inspector.
- `Board State` covers scenario-wide/global state: trackers, decks, event piles, setup variables, and metadata. For LOTR-like validation this includes hope, threat/danger level, event deck state, shadow deck state, player deck setup, and objective display state.
- `Object State` covers any Entity/Object: character pawns, troop stacks, cards, tokens, dice, pawn sheets, held cards, counters, visibility, and notes.
- `Location State` covers each Location's semantic state: display name, region/area membership, recruitment availability, terrain/tile binding, haven/stronghold flags, default slots, and notes.
- `Edge State` covers each graph connection's semantic state: directed/undirected traversal, traversal cost, labels, locks, and notes.
- These state panels remain generic JSON/state editors. LOTR examples are fixture guidance only, not product-specific branches.

## 2026-06-09 F-04 Edit/Run Manual Board Prototype

- Completed `F-04-ManualScenarioPrototype`, now titled `Edit/Run Manual Board Prototype` in `feature_list.json`.
- Added mode-aware store state in `src/state/boardStore.ts`: `mode`, `boardState`, `locationStates`, `edgeStates`, `frozenSetup`, and actions for entering Run mode, returning to Edit mode, editing the four state surfaces, moving runtime Entities by Location, adjusting numeric counters, and moving card-like objects between zones.
- Edit mode remains the only mode that can mutate setup structure: assets, background, Locations, Edges, setup placements, and raw placement coordinates. Run mode keeps selection and board panning but blocks structural setup edits and raw coordinate dragging.
- Run mode freezes the current setup snapshot before deriving runtime state. Runtime actions mutate only current state; `frozenSetup` remains a copy of the original Board Template and Setup Preset.
- Updated `src/engine/serialization.ts` and `src/state/scenarioStore.ts` so `.lorecanvas` packages preserve mode, Board State, Location State, Edge State, and frozen setup snapshots while remaining backward-compatible with F-03 packages that lack those fields.
- Updated `src/ui/App.tsx` and `src/styles.css` to expose Edit/Run buttons, local Save/Load, mode status, Board/Object/Location/Edge JSON state panels, and Run Controls for semantic Location movement, count adjustment, and card/zone changes.
- Added `tests/state/editRunMode.test.ts` and `tests/state/manualScenario.test.ts`. F-04 verification passed with `npm.cmd exec -- vitest run tests/state/manualScenario.test.ts tests/state/editRunMode.test.ts`.
- Full verification passed: `npm.cmd run check-types`, `npm.cmd run test` (9 files / 31 tests), `npm.cmd run build`, and `.\init.ps1`.
- Browser verification used Playwright through Node REPL fallback because the Browser plugin did not expose direct browser-control tools. It loaded a prepared scenario through the UI, entered Run mode, selected a pawn on the PixiJS board, moved it from `loc-haven` to `loc-road`, incremented its count, selected a card, moved it to `discard-zone`, saved, and parsed the saved JSON. Evidence confirmed runtime state changed while `frozenSetup` preserved the original setup.
- `feature_list.json` now marks `F-04-ManualScenarioPrototype` as completed. The next pending feature is `F-05-MovementValidation`.

## 2026-06-10 F-04 Asset Import UX Polish

- Removed the topbar `Import images` action so the topbar remains focused on scenario-level Save/Load and Edit/Run mode controls.
- Added left Creation toolbar import controls inside `Image Assets`: one `Assets folder` directory import that infers categories from paths such as `assets/token/...`, plus per-category `Folder` and `Image` imports for BOARD, PAWN, TOKEN, TILE, CARD, and OTHER.
- Imported assets are now grouped by category in the asset list. Category-specific imports assign the selected category immediately; whole-folder imports infer from folder names; only BOARD imports auto-set the board background when none exists.
- Added `src/ui/assetImport.ts` and `tests/ui/assetImport.test.ts` for path inference, default TOKEN copy limits, and placement-size defaults.
- Verification passed: `npm.cmd exec -- vitest run tests/ui/assetImport.test.ts`, `npm.cmd run check-types`, `npm.cmd run test` (10 files / 34 tests), and `npm.cmd run build`.
- Browser plugin direct controls were not exposed in this session; per Product Design browser constraints, no Playwright fallback was run without explicit user approval. Final harness verification is still required after this progress entry.

## 2026-06-10 F-04 Asset Folder Crash Fix

- Addressed browser feedback that selecting the full `assets` folder could crash Codex/the browser.
- Root cause: folder import decoded image dimensions for every selected file and inserted assets one by one, then the sidebar rendered every imported asset thumbnail at once. The LOTR card folder can contain enough images to make this unsafe in the desktop browser.
- Added `addAssets` to `src/state/boardStore.ts` so full-folder import performs a single Zustand update and de-duplicates ids within the imported batch.
- Updated `src/ui/App.tsx` so large imports skip eager dimension decoding, asset thumbnails use lazy/async decoding, and each category initially renders only 32 asset rows with a `Show more` control.
- Kept the `Assets folder` primary button readable by ensuring the primary import button color overrides generic `.mini-button` color rules.
- Verification passed: `npm.cmd run check-types`, `npm.cmd exec -- vitest run tests/state/boardStore.test.ts tests/ui/assetImport.test.ts`, `npm.cmd run build`, and final `.\init.ps1` (10 files / 35 tests).

## 2026-06-10 Asset Import Rework: Background Media Pipeline

- Reworked image import after browser feedback that uploading the full `assets` folder (LOTR fixture: 498 files / ~830 MB, card scans up to 8 MB) still crashed the tab.
- Root cause: the asset list and inspector previews rendered `<img src={asset.url}>` with the original full-resolution blob. Even with lazy loading and the 32-row cap, scrolling decoded dozens of multi-MB PNGs (a 6 MB scan decodes to tens of MB of RGBA), exhausting tab memory. Large imports also skipped dimension decoding entirely, so the board background lost its aspect ratio.
- New design:
  - Import never decodes image data. `handleImageImport` only creates object URLs and inserts all assets in one `addAssets` batch.
  - New `src/ui/assetMedia.ts` runs a background media pipeline with bounded concurrency (3 decodes at a time): each file is decoded once (`createImageBitmap`, `<img>.decode()` fallback for SVG-in-Chromium), downscaled into a ~128 px thumbnail blob, and closed. Patches flush to the store in batches of 8.
  - New `applyAssetMediaPatches` store action merges width/height/thumbnailUrl into assets in one update, syncs `board.background` dimensions when the background asset is patched, and revokes thumbnails for assets deleted mid-pipeline. `removeAsset` now revokes both the asset URL and its thumbnail.
  - The asset list renders only `asset.thumbnailUrl` (placeholder icon while pending) - never the full-resolution URL. Bounded preview slots (selected piece, pawn sheet, held cards, token counters) prefer the thumbnail and fall back to the full URL.
  - The Image Assets panel shows a "Processing images x / y" live progress line while the pipeline runs; progress state updates are throttled to one per 8 files.
  - `ScenarioAsset` carries an optional transient `thumbnailUrl` so scenario round-trips keep typing consistent.
- Tests: new `tests/ui/assetMedia.test.ts` covers thumbnail fitting, one-patch-per-task batch flushing, the concurrency cap, decode-failure tolerance, and cancellation. `tests/state/boardStore.test.ts` covers `applyAssetMediaPatches` background sync and orphan-thumbnail revocation.
- Local verification passed: `npm.cmd run check-types`, `npm.cmd run test` (11 files / 42 tests), `npm.cmd run build` (no chunk warning).
- First browser run exposed a StrictMode bug: the dev double-mount cleanup left `isUnmountedRef` permanently true, so `isCancelled()` cancelled the pipeline before any decode and progress stuck at `0 / 491`. Fixed by resetting the flag on every mount in `App.tsx`.
- Browser verification (temporary Playwright + local Chrome against `http://localhost:5173/`, full fixture `local-fixtures/lotr/LotR-FotF/assets`, 491 images / ~839 MB):
  - Directory submitted in ~0.2 s; all 491 assets inserted in ~1 s with JS heap at 18 MB.
  - Background media pipeline decoded all 491 thumbnails in ~14 s; JS heap settled at 51 MB after the pipeline and stayed at 51 MB after scrolling the asset list (previously this scenario crashed the tab).
  - Categories inferred from folder paths: Board 1, Pawn 20, Token 22, Tile 2, Card 427, Other 19; 96 visible asset rows all rendered blob thumbnails with 0 pending placeholders and a working Show more control.
  - The 16.7 MB game board auto-set as background and rendered through PixiJS with the correct aspect ratio (dimensions delivered by the pipeline patch).
  - No page crash, no error banner, no app console errors or warnings.

## 2026-06-10 Manual MVP Harness Audit And README

- Confirmed the Fable 5 image-upload fix is synchronized into the harness: `feature_list.json` records the full 491-image browser verification, `progress.md` records the background media pipeline rework, and `src/ui/App.tsx` resets `isUnmountedRef.current = false` on every mount so React StrictMode double-mounts no longer leave import stuck at `Processing images 0 / 491`.
- Audited the manual MVP upload/save/load state path and fixed two state-layer cleanup bugs:
  - `setBackgroundAsset` now removes any existing placements, generated Entities, and pawn sheets for an asset that is promoted to the Board background. This prevents stale TILE/TOKEN/CARD placements from referencing an asset that has become `BOARD`.
  - Scenario load now revokes current asset and frozen-setup blob URLs that are not reused by the loaded scenario. Media patching also revokes replaced thumbnail blob URLs.
- Added regression coverage in `tests/state/boardStore.test.ts` for placed-asset-to-board cleanup and thumbnail replacement cleanup.
- Added regression coverage in `tests/state/scenarioStore.test.ts` for object URL cleanup when a scenario replaces the current store while preserving reused URLs.
- Added `README.md` for the pure-manual v1 workflow: install/verify, dev server startup, six-category asset-pack layout, Edit/Run workflow, state panels, Save/Load limits, and development commands.
- Verification passed:
  - `npm.cmd exec -- vitest run tests/state/boardStore.test.ts`
  - `npm.cmd exec -- vitest run tests/state/scenarioStore.test.ts`
  - `npm.cmd run check-types`
  - `npm.cmd run test` (11 files / 45 tests)
  - `npm.cmd run build`
  - `npm.cmd audit --audit-level=moderate` -> 0 vulnerabilities
  - `.\init.ps1` -> harness valid, TypeScript green, 11 test files / 45 tests passed
- Current next pending feature remains `F-05-MovementValidation`. No git staging, commit, or push was performed.

## 2026-06-11 F-04B Maker Workbench 1.0 Batch Editing

- Completed the user-requested Maker UI redesign as `F-04B-MakerWorkbenchV1` in `feature_list.json`, inserted after the manual MVP and before movement validation.
- Replaced the old primary Tools + Map + Inspector editing flow with a 1.0 workbench layout: left rail is now focused on image asset import/library, the center stage contains the map workspace plus a Data Workbench, and the right rail is a compact Context panel rather than the main editing surface.
- Added Data Workbench tabs for `Locations`, `Edges`, `Objects`, and `Board State`.
- Location rows now directly edit name, normalized X/Y percent, region, tags, notes, and arbitrary Location JSON state by `locationId`.
- Edge rows now directly edit endpoints, label, directed, cost, lock, notes, and arbitrary Edge JSON state by `edgeId`.
- Object rows expose generic Entity state, Location binding, zone id, count, and JSON state. Board State remains a JSON editor in the workbench.
- Added store actions in `src/state/boardStore.ts`: `updateLocationDetails`, `deleteLocation`, `updateEdgeDetails`, and `deleteEdgeById`, so table rows no longer depend on selected-object inspector mutations.
- Added regression tests in `tests/state/boardStore.test.ts` for row-level Location and Edge editing/deletion, state cleanup, and selection behavior.
- Browser verification through the Browser plugin:
  - Loaded `http://127.0.0.1:5173/`, confirmed `Data Workbench` rendered, no Vite overlay, and console error/warning count was 0.
  - Created two PixiJS Locations and one Edge via the map controls.
  - Edited `loc-1` to `Haven`, set Location region/tags/notes, edited `edge-1` label to `Road`, set directed true, and set cost to `2` through the table UI.
  - Confirmed metrics showed `Locations2` and `Edges1`, Context showed the selected `loc-1`/`Haven`, and no error banner appeared.
  - Checked a 390 x 844 viewport: no horizontal page overflow, mobile layout uses normal vertical flow, the Data Workbench is reachable, and Context appears after the workbench without overlap.
- Verification passed:
  - `npm.cmd run check-types`
  - `npm.cmd exec -- vitest run tests/state/boardStore.test.ts` -> 14 tests
  - `npm.cmd run test` -> 11 files / 47 tests
  - `npm.cmd run build`
  - `.\\init.ps1` -> harness valid, TypeScript green, 11 files / 47 tests
- Current next pending feature is again `F-05-MovementValidation`.
- No git staging, commit, or push was performed.

## 2026-06-12 Maker Canvas Space Rework: Hidden Workbench, Fullscreen, Zero-Width Rails

- Addressed direct user feedback on the F-04B workbench layout: the map canvas was too small, the bottom Data Workbench should be hidden by default, the canvas needs a fullscreen mode, and collapsed side rails left an ugly 48px arrow column.
- Data Workbench is now hidden by default. Added `isWorkbenchCollapsed` (default `true`) and `setWorkbenchCollapsed` to `src/state/boardStore.ts`; `App.tsx` only renders `DataWorkbench` when expanded, and `.stage-region[data-workbench-collapsed="true"]` switches to a single full-height map row.
- Added two stage-toolbar buttons after a divider in the zoom group: a Data Workbench show/hide toggle (PanelBottomOpen/PanelBottomClose) and a map fullscreen toggle (Maximize/Minimize). Fullscreen uses the native Fullscreen API on the `.map-workspace` element (toolbar + PixiJS canvas stay visible); state syncs via a `fullscreenchange` listener, and Esc or the button exits.
- Collapsed side rails are now completely hidden: collapsed grid columns are `0` and the rail gets `display: none`. Re-expansion uses new floating `.panel-expand-tab` chevron buttons vertically centered on the left/right edges of the stage.
- Layout regression found during browser verification: with `display: none` rails, grid auto-placement pushed `.stage-region` into the zero-width first column. Fixed by pinning explicit `grid-row`/`grid-column` positions on `.tool-panel--creation` (column 1), `.stage-region` (column 2), and `.tool-panel--inspector` (column 3).
- BoardCanvas needed no changes: its ResizeObserver + `app.renderer.resize` path already handles workbench toggle, rail collapse, and fullscreen resizes.
- Playwright browser verification against `http://127.0.0.1:5173/` at 1440x900: default view shows no workbench and a full-height canvas; collapsing both rails leaves zero-width columns with floating expand tabs and a full-width PixiJS canvas; the workbench toggle shows/hides the table panel; fullscreen covers the entire screen with working toolbar and exit button; expand tabs restore both rails. Console errors/warnings: 0.
- Environment note: a running Vite dev server locks `@rolldown/binding-win32-x64-msvc`, which makes the harness `npm ci` fail with EPERM and can leave `node_modules` half-deleted. Stop the dev server before running `.\init.ps1`.
- Verification passed: `npm.cmd run check-types`, `npm.cmd run test` (11 files / 47 tests), `npm.cmd run build` (no chunk warning), and full `.\init.ps1` (harness valid, TypeScript green, 11 files / 47 tests).
- No git staging, commit, or push was performed.

## 2026-06-12 F-04C Canvas Quick Delete

- Completed the user-requested deletion refinement after the hidden-workbench/fullscreen rework. Location and Edge deletion no longer requires opening the Data Workbench.
- Added `selectedEdgeId` and `selectEdge` to `src/state/boardStore.ts`. Location, placement, and Edge selections are now mutually exclusive; newly created/updated Edges can become the active selection; deleting a Location clears connected Edge state and any selected connected Edge.
- Added PixiJS Edge hit targets in `src/ui/BoardCanvas.tsx`: Select mode can click an Edge line directly, and the selected Edge is highlighted on the canvas.
- Added a toolbar Selection actions chip in `src/ui/App.tsx` with a direct Trash button for selected Locations and Edges. The Context rail also reports selected Edge id/endpoints.
- Browser verification found a layout regression introduced by the new chip: it overlapped the Add Edge button in the flex toolbar. `src/styles.css` now keeps the tool group non-shrinking, lets the toolbar wrap, and prevents the quick action chip from covering tools.
- Browser verification through the Browser plugin against `http://127.0.0.1:5173/`:
  - Data Workbench was hidden by default.
  - Created two Locations and one Edge using the map tools.
  - Switched to Select, clicked the Edge midpoint, confirmed `Edge edge-1` appeared in the toolbar Selection actions and Context showed `edge-1` endpoints.
  - Clicked the toolbar Trash action for `edge-1`; metrics changed to `Edges0` while Locations remained `2`.
  - Clicked a Location node, confirmed `Location loc-2` appeared in the toolbar Selection actions, clicked Trash, and metrics changed to `Locations1` / `Edges0`.
  - Console errors/warnings: 0.
- Verification passed: `npm.cmd run check-types`, `npm.cmd exec -- vitest run tests/state/boardStore.test.ts tests/state/scenarioStore.test.ts` (19 tests), `npm.cmd run test` (11 files / 49 tests), `npm.cmd run build`, and final `.\init.ps1` (harness valid, TypeScript green, 11 files / 49 tests).
- No git staging, commit, or push was performed.
