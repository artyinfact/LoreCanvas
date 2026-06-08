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
