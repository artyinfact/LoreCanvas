# Agent 进度与交接 (Agent Progress Handoff)

这是 `LoreCanvas` 的长时任务系统事实来源。每次会话开始时先读本文件，结束时写回已验证状态、下一步和 blocker。

## 当前会话目标
- 将 F00 部署目标设为 Vercel，要求先完成项目环境配置与 Vercel production deployment，再进入引擎功能实现。

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
- [x] 已新增 `.nvmrc` 和 `.gitattributes`，补齐环境自描述和跨平台行尾约束。
- [x] 已更新 `AGENTS.md` 的知识路由和标准验证命令，使其保持入口地图而不是大而全手册。
- [x] 已增强 `init.sh`：自动校验 harness 文件、`feature_list.json` 结构、状态枚举、依赖引用、单一 in-progress 约束、completed evidence 和 LOTR fixture ignore 状态。
- [x] 已更新 `clean-state-checklists.md`，把 harness state validation 与交接自检纳入收尾标准。
- [x] 已运行增强版 `bash ./init.sh`，harness state validation 通过；当前仍无 `package.json`，实现层检查按预期跳过。
- [x] 已按用户要求删除上一轮新增的 `docs/harness.md` 与 `docs/environment.md`，并移除所有 harness 引用。
- [x] 已在 `AGENTS.md` 中明确：初始化完成后，后续 feature 交给 Codex 按“计划 -> 实现 -> 验收”循环推进；产品 docs 默认不在日常实现循环中改写。
- [x] 删除多余 docs 后已重新运行 `bash ./init.sh`，harness state validation 通过。
- [x] 已在 `feature_list.json` 中新增 `F-00-EnvironmentAndVercel`，作为 priority 0 的前置任务。
- [x] 已将 `F-01-GraphBoard` 依赖调整为 `F-00-EnvironmentAndVercel`。
- [x] 已在 `AGENTS.md` 和 `clean-state-checklists.md` 中明确 F0 的环境、构建、测试与 Vercel 部署完成要求。
- [x] 已运行 `bash ./init.sh`，确认新增 F0 后 harness state validation 通过。
- [x] 已将 F00 设为 `F-00-EnvironmentAndVercel`，并同步 F01 依赖、验收清单和 Codex 初始化完成定义。
- [x] 已执行 `npx skills add https://github.com/pixijs/pixijs-skills`，安装 26 个 PixiJS skills；`skills-lock.json` 记录来源与 hash，skills 文件位于 `.agents/skills/`。
- [x] 已完成 `F-00-EnvironmentAndVercel`：新增 React + Vite + TypeScript + Zustand + PixiJS + Vitest 脚手架、npm scripts、lockfile、smoke tests、Vercel 配置和 `.vercelignore`。
- [x] 已修复当前 Windows/WSL 混合环境下的 Node 与 Rolldown native binding 问题：npm scripts 通过 `scripts/run-with-modern-node.mjs` 在旧 Node 下临时使用 Node 24.13.0；`init.sh` 会补齐 WSL 需要的 Linux Rolldown optional binding。
- [x] 已运行 `bash -lc "./init.sh && npm run build"`：harness validation、依赖安装、TypeScript、Vitest 2 个测试文件 / 3 个测试、Vite production build 全部通过。
- [x] 已运行 `npm audit --audit-level=moderate`，结果为 0 vulnerabilities。
- [x] 已完成 Vercel production deployment：project `lorecanvas`，deployment `dpl_CqR6L6HPGmTiXzFi2Rk3XZH6W9ky`，生产 URL `https://lorecanvas-mu.vercel.app`，状态 Ready。
- [x] 已用 HTTP 检查 `https://lorecanvas-mu.vercel.app` 返回 200，页面内容包含 LoreCanvas。

## 当前系统状态
- `F-00-EnvironmentAndVercel` 已完成并写入 `feature_list.json` evidence。
- 仓库现在已有实现脚手架：`package.json`、`package-lock.json`、`src/`、`tests/`、Vite/Vitest/TypeScript 配置和 Vercel 部署配置。
- `init.sh` 在存在 `package.json` 后会真实执行依赖安装、类型检查和 Vitest；当前已验证通过。
- Vercel production deployment 已通过，生产 URL 为 `https://lorecanvas-mu.vercel.app`。
- 下一轮 agent 应从 `feature_list.json` 中优先级最高的 pending 任务开始：`F-01-GraphBoard`。
- LOTR fixture 位于 `local-fixtures/lotr/`，被 `.gitignore` 和 `.vercelignore` 排除，应只在本地 E2E 验收中读取，不得上传 GitHub 或 Vercel。

## 遗留风险 / 卡点 (Blockers)
- 当前仓库配置了远端 `https://github.com/artyinfact/LoreCanvas`。
- UI 参考图仍未创建；当前 harness 先用 `docs/product.md` 和 `clean-state-checklists.md` 约束产品范围。
- 注意：执行任何依赖 `@pixi/react` 的任务前，必须调用官方 PixiJS Skills 确认当前版本语法，避免使用过时 API。
- 如果后续 E2E 环境缺少 `local-fixtures/lotr/`，应明确 skip 或提示本地 fixture 缺失，而不是提交素材。
- Vite production build 当前有 PixiJS chunk 大于 500 kB 的提示；F-00 阶段可接受，后续进入功能实现和资源加载后再评估 code splitting。
- 当前本地分支 `main` 比 `origin/main` ahead 3，且存在本轮和此前未提交变更；未按用户要求执行 git add/commit/push。

## 下一步行动 (Next Steps)
1. 运行 `bash ./init.sh` 确认环境基线仍通过。
2. 按单线程规则领取 `F-01-GraphBoard`。
3. 进入 PixiJS/`@pixi/react` 地图交互前，先读取官方 PixiJS skills 中对应领域文档。
4. 为 F-01 实现最小 Node-Graph Board 闭环，并运行 `npx vitest run tests/engine/board.test.ts`。
