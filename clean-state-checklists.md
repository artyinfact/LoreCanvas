# 功能验收清单

## Cross-Platform Harness

- Canonical implementation: `node ./scripts/init.mjs`.
- Windows / PowerShell accepted baseline commands: `.\init.ps1`, `.\init.cmd`, or `npm.cmd run harness`.
- POSIX / Git Bash accepted baseline command: `./init.sh`.
- A failure from `C:\Windows\System32\bash.exe` when WSL is not installed is not a project baseline failure; rerun the harness through `.\init.ps1` or `npm.cmd run harness`.

每个 feature 完成时，除 `feature_list.json` 中的 verification 命令外，还应检查本文件中的人工验收项。

## 全局清洁状态

- `./init.sh` 可运行；没有 `package.json` 时应清楚报告实现脚手架尚未创建。
- `./init.sh` 的 harness state validation 通过，包括 `feature_list.json` 结构、依赖、状态和 evidence 校验。
- 已有实现阶段中，`npx vitest run` 必须全绿。
- `feature_list.json`、`progress.md` 和本清单保持一致。
- `local-fixtures/lotr/` 必须处于 `.gitignore` 覆盖范围内，不得作为正式资产提交。
- 新实现不得为了 LOTR 场景写入游戏专属分支。
- 会话结束前确认新 agent 只凭 `AGENTS.md`、`feature_list.json`、`progress.md` 和本清单即可接手；如果需要聊天记忆，必须补 harness 状态文件。

## F-00-EnvironmentAndVercel 环境配置与 Vercel 部署

- `package.json`、lockfile、`src/` 和 `tests/` 存在。
- `npm install` 可成功。
- `npm run build` 可成功并产出静态构建目录。
- `bash ./init.sh` 在脚手架存在后真实执行依赖安装、类型检查和 Vitest。
- 至少有一个 Vitest smoke test 证明测试框架可运行。
- Vercel 项目部署配置存在，并从 main 分支构建和发布生产站点。
- Vercel production deployment 通过，部署 URL 写入 `feature_list.json` 的 evidence。

## F-01-GraphBoard 核心图谱 Board

- 可以导入任意图片作为 Board 背景图。
- 可以创建、更新、删除 Location。
- 可以创建、更新、删除 Edge。
- Edge 引用不存在的 Location 时校验失败。
- 代码和 UI 不包含 Grid、格子移动或 A* 假设。

## F-02-EntitySystem 通用 Entity 系统

- Entity 最小模型包含 `id`、`type`、`state` 和节点绑定信息。
- `state` 支持任意 JSON 字典，不限制固定属性列表。
- Entity 可以绑定到 Location，也可以从 Location 解绑。
- 删除 Location 时，相关 Entity 绑定有明确处理策略。

## F-03-MovementValidation 图谱移动校验

- Entity 只能沿存在的 Edge 在 Location 间移动。
- 无连接关系时移动被阻断并返回可解释错误。
- 有连接关系时移动成功并更新 Entity 的节点绑定。
- 移动校验不依赖画布坐标、格子距离或图像尺寸。

## F-04-GlobalTrackerAndVisuals 全局追踪器与视觉映射

- 可以创建和更新任意 Global Tracker。
- 追踪器数值进入映射区间时，Store 中的 activeFilters 正确切换。
- 多个映射命中时有稳定的优先级或合并规则。
- 视觉映射数据可序列化，不依赖运行时闭包。

## F-05-RuleTriggerEngine JSON 规则触发器引擎

- 可以加载 JSON 规则树并校验基本结构。
- `ENTITY_MOVE`、`ENTITY_STATE_CHANGE`、`TRACKER_CHANGE` 和 `MANUAL_TRIGGER` 至少有可测试路径。
- 条件命中时发射预期 actions。
- 条件未命中时不产生副作用。
- 无效 operator、缺失引用或 malformed rule 会返回明确错误。

## F-06-TheatricalRenderer Cut-in 演出渲染层

- `DISPATCH_CUT_IN` 指令可以进入渲染总线。
- Cut-in payload 支持遮罩、图片资源引用和打字机文本。
- 组件层只消费演出 payload，不直接判断游戏规则。
- 涉及 PixiJS 或动画的手动验证步骤记录在 `progress.md`。

## F-07-StateSerialization .lorecanvas 剧本包序列化

- 导出内容覆盖 Board、Location、Edge、Entity、Global Trackers、规则树和演出资源引用。
- 导入时校验 schemaVersion 和跨对象引用。
- 反序列化后可重新运行 F-01 至 F-06 的核心行为。
- `.lorecanvas` 包不内嵌 `local-fixtures/lotr/` 的图片二进制。

## F-08-E2E-LOTR-Validation LOTR 本地端到端验收

- E2E 测试只读取被忽略的 `local-fixtures/lotr/`。
- 测试通过公开引擎 API 搭建场景，不访问内部私有状态。
- 至少覆盖一次“戒灵拦截 -> 追踪器变化 -> 滤镜变深 -> Cut-in 演出”的完整链路。
- 缺少本地 LOTR fixture 时，测试应明确 skip 或报告 fixture 缺失，而不是提交素材。

## 2026-06-09 MVP Route Override

The active feature route in `feature_list.json` now supersedes the older pending-feature order above.

### F-03-ScenarioLoadSave Load and Save Scenario Packages

- Export produces a complete generic `.lorecanvas` scenario package.
- Export covers asset manifest entries for `BOARD`, `PAWN`, `TOKEN`, `TILE`, `CARD`, and `OTHER`.
- Export covers Board background references, Locations, Edges, placed assets, runtime Entities, arbitrary Entity state, Location bindings, pawn sheets, held cards, token/dice counters, viewport state, and package metadata.
- Import restores the same playable manual state without requiring rules, Cut-in actions, online services, or LOTR-specific branches.
- The implementation stays generic even when using the ignored `local-fixtures/lotr/LotR-FotF` fixture for local validation.

### F-04-ManualScenarioPrototype Manual Scenario Prototype

- Edit mode edits setup definition only: asset manifest, Board Template, background, Locations, Edges, region/area membership, board zones, default placement slots, and Setup Preset entities/cards/tokens/counters.
- Edit mode does not create or mutate runtime scenario state.
- Run mode opens a finalized scenario, freezes the Board Template and Setup Preset, and derives an initial runtime snapshot from setup.
- Run mode supports semantic manual board operations instead of pixel-level setup labor: move Location-bound Entities between Locations, adjust stacked troop/token/dice counters, move cards between deck/discard/hand/display zones, inspect current runtime state, save, and reload.
- Run mode must not mutate Board Template or Setup Preset.
- Automatic event triggers, path validation, Cut-in rendering, visual filter automation, and game-specific rules are intentionally out of scope.

### Deferred After Manual MVP

- `F-05-MovementValidation`: graph adjacency/connectivity validation only, no grid/A*/distance assumptions.
- `F-06-GlobalTrackerState`: manually editable trackers serialized through `.lorecanvas`, without visual automation.
- `F-07-RuleTriggerEngine`: generic JSON rule triggers after manual MVP.
- `F-08-TheatricalRenderer`: CCFOLIA-style Cut-in renderer after rule actions exist.
- `F-09-LOTR-FotF-Validation`: local E2E validation using `local-fixtures/lotr/LotR-FotF`, including `LOTRRule.pdf` as future auto-setup/event-trigger test input.
