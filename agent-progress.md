# Agent 进度与交接 (Agent Progress Handoff)

这是 `GM-Scout-Canvas` 的长时任务系统事实来源。每次会话开始时先读本文件，结束时写回已验证状态、下一步和 blocker。

## 当前会话目标
- 补全非图片、非 Skills 的 harness 部分，使后续实现有完整的 schema、交互、UI 文字规范、NPC、示例内容和验收标准。

## 已完成 / 已验证状态
- [x] 已读取原始 harness 文件：`AGENTS.md`、`feature_list.json`、`agent-progress.md`、`init.sh`。
- [x] 已运行 `git log --oneline -5`，当前历史为 `f93bec6 Initial commit`。
- [x] 已执行 `./init.sh`，当前 shell 返回成功；但仓库尚未包含 `package.json` 或源码，因此该结果只能视为 harness 层检查，不代表 Vitest 已真实运行。
- [x] 已将任务清单重排为 F-00 至 F-10，覆盖项目骨架、双层地图 Store、大地图节点渲染、小地图格子渲染、左侧工具栏、Inspector、序列化、昼夜、导航、雷达与事件对话。
- [x] 已将 Git 工作流写入 `AGENTS.md`：任务开始前优先检查远端同步并按需 `git pull --ff-only`；步骤完成且验证通过后执行 `git add`、`git commit`、`git push`。
- [x] 已确认默认远端仓库为 `https://github.com/artyinfact/GM-Scout-Canvas`；上一轮 harness 已提交并推送为 `25aa19d Add agent harness for dual-map canvas`。
- [x] 已补充 harness 文档清单、数据 schema、UI 工作流、布局、样式、组件、编辑器工具、交互规则、渲染契约、视觉验收、NPC roster、对话事件、雷达规则、模式生命周期、存储策略、示例内容和验收清单。

## 当前系统状态
- 仓库当前仍是 harness-only 状态，没有 React/Vite 源码、`package.json`、`src/` 或 `tests/`。
- 下一轮 agent 应从 `feature_list.json` 中优先级最高的 pending 任务开始：`F-00` 创建 React + Zustand + PixiJS + Vitest 项目骨架。
- 在 `F-00` 完成前，`init.sh` 只应验证 harness 文件完整性并清楚报告实现脚手架尚未创建；`F-00` 完成后必须恢复为真实类型检查和 Vitest 反馈回路。

## 遗留风险 / 卡点 (Blockers)
- 当前仓库未配置 git remote，但已知默认远端 URL；可用显式 URL fetch/push。
- UI 参考图仍未创建，后续应放入 `docs/ui-references/` 并在 UI 文档中索引。
- 注意：执行任何依赖 `@pixi/react` 的任务前，必须调用官方 PixiJS Skills 确认当前版本语法，避免使用过时 API。

## 下一步行动 (Next Steps)
1. 运行 `./init.sh` 确认 harness 检查通过。
2. 执行 `F-00`：创建项目运行骨架、依赖和最小测试。
3. 再次运行 `./init.sh`，确保类型检查与 `npx vitest run` 真实通过。
4. 将 `F-00` 标记为 `completed`，再进入 `F-01` 双层地图 Store。