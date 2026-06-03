# Agent 进度与交接 (Agent Progress Handoff)

这是 `LoreCanvas` 的长时任务系统事实来源。每次会话开始时先读本文件，结束时写回已验证状态、下一步和 blocker。

## 当前会话目标
- 将 harness 从旧的通用桌面路线改为 `LoreCanvas` 的 Node-Graph / Cut-in 戏剧化 VTT 引擎路线。
- 将本地 LOTR Tabletop Simulator 模组素材移动到被忽略的 fixture 目录，作为后续阶段性 E2E 验收输入。

## 已完成 / 已验证状态
- [x] 已读取当前 harness 文件：`AGENTS.md`、`feature_list.json`、`new_feature_list.json`、`docs/product.md`、`clean-state-checklists.md`、`progress.md`、`init.sh`。
- [x] 已运行 `git status --short --branch`、`git remote -v`、`git log --oneline -5` 查看分支、远端与近期提交。
- [x] 已将 `feature_list.json` 改写为 F-01 至 F-08 的新引擎路线：Graph Board、Entity System、Movement Validation、Global Trackers、Rule Trigger Engine、Theatrical Renderer、State Serialization、LOTR E2E Validation。
- [x] 已将 `AGENTS.md` 改写为新的项目定位、知识路由、产品边界、执行规则和完成定义。
- [x] 已根据 CCFOLIA 的房间准备、玩家操作、自动展示和读档思路重写 `docs/product.md`，并明确不照搬账号、商店、聊天和权限生态。
- [x] 已将 `clean-state-checklists.md` 对齐到新的 F-01 至 F-08 验收项。
- [x] 已将 `init.sh` 对齐到当前 harness 文件名：`progress.md`、`docs/product.md`、`clean-state-checklists.md`。
- [x] 已创建 `.gitignore`，并将 `local-fixtures/`、`3727065341.json`、`lotr/`、`new_feature_list.json` 标记为不提交。
- [x] 已将 LOTR 测试素材移动到 `local-fixtures/lotr/`。
- [x] 已移除根目录 `new_feature_list.json`。
- [x] 已运行 `bash ./init.sh`，harness 检查通过；当前仍无 `package.json`，因此实现层 TypeScript 与 Vitest 按预期跳过。
- [x] 已运行 `python -m json.tool feature_list.json`，确认新任务清单是有效 JSON。

## 当前系统状态
- 仓库当前仍是 harness-only 状态，没有 React/Vite 源码、`package.json`、`src/` 或 `tests/`。
- 下一轮 agent 应从 `feature_list.json` 中优先级最高的 pending 任务开始：`F-01-GraphBoard`。
- 在实现脚手架创建前，`init.sh` 只验证 harness 文件完整性并清楚报告 implementation scaffold 尚未创建；一旦存在 `package.json`，必须真实执行依赖安装、类型检查和 Vitest。
- LOTR fixture 位于 `local-fixtures/lotr/`，应只在本地 E2E 验收中读取，不得上传 GitHub。

## 遗留风险 / 卡点 (Blockers)
- 当前仓库配置了远端 `https://github.com/artyinfact/LoreCanvas`。
- UI 参考图仍未创建；当前 harness 先用 `docs/product.md` 和 `clean-state-checklists.md` 约束产品范围。
- 注意：执行任何依赖 `@pixi/react` 的任务前，必须调用官方 PixiJS Skills 确认当前版本语法，避免使用过时 API。
- 如果后续 E2E 环境缺少 `local-fixtures/lotr/`，应明确 skip 或提示本地 fixture 缺失，而不是提交素材。

## 下一步行动 (Next Steps)
1. 运行 `./init.sh` 确认 harness 检查通过。
2. 执行 `F-01-GraphBoard`：建立 Board、Location、Edge 的核心类型、Store/API 和基础 UI。
3. 运行 `npx vitest run tests/engine/board.test.ts`，并在有实现脚手架后运行全量 `npx vitest run`。
4. 将 `F-01-GraphBoard` 标记为 `completed` 并写入 evidence，再进入 `F-02-EntitySystem`。