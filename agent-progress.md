# Agent 进度与交接 (Agent Progress Handoff)

这是 `LoreCanvas` 的长时任务系统事实来源。每次会话开始时先读本文件，结束时写回已验证状态、下一步和 blocker。

## 当前会话目标
- 将项目和 GitHub 仓库从 `GM-Scout-Canvas` 重命名为 `LoreCanvas`。

## 已完成 / 已验证状态
- [x] 已读取原始 harness 文件：`AGENTS.md`、`feature_list.json`、`agent-progress.md`、`init.sh`。
- [x] 已运行 `git log --oneline -5` 查看近期提交历史。
- [x] 已执行 `./init.sh`，当前 shell 返回成功；但仓库尚未包含 `package.json` 或源码，因此该结果只能视为 harness 层检查，不代表 Vitest 已真实运行。
- [x] 已将任务清单重排为 F-00 至 F-08，覆盖项目骨架、项目数据模型、地图背景图画布、配件编辑、Inspector、事件规则编辑、事件弹窗、Runner 模拟与 JSON 导入导出。
- [x] 已将 Git 工作流写入 `AGENTS.md`：任务开始前优先检查远端同步并按需 `git pull --ff-only`；步骤完成且验证通过后执行 `git add`、`git commit`、`git push`。
- [x] 已确认旧默认远端仓库为 `https://github.com/artyinfact/GM-Scout-Canvas`，本次重命名后应使用 `https://github.com/artyinfact/LoreCanvas`。
- [x] 已确认旧的细分 harness 文档不再符合当前产品范围。
- [x] 已将验收清单调整为根目录 `acceptance-checklists.md`，使其作为 feedback/checklist 层文件，而不是领域 docs 文件。
- [x] 已将 docs 收敛为 `docs/product-framework.md`，删除小地图、雷达、NPC roster、昼夜、节点图、战术移动等已砍掉方向的细分文档。
- [x] 已将 harness 中的项目显示名更新为 `LoreCanvas`。

## 当前系统状态
- 仓库当前仍是 harness-only 状态，没有 React/Vite 源码、`package.json`、`src/` 或 `tests/`。
- 下一轮 agent 应从 `feature_list.json` 中优先级最高的 pending 任务开始：`F-00` 创建 React + Zustand + PixiJS + Vitest 项目骨架。
- 在 `F-00` 完成前，`init.sh` 只应验证 harness 文件完整性并清楚报告实现脚手架尚未创建；`F-00` 完成后必须恢复为真实类型检查和 Vitest 反馈回路。

## 遗留风险 / 卡点 (Blockers)
- 当前仓库未配置 git remote，但已知默认远端 URL；重命名前使用旧 URL，重命名后使用 `https://github.com/artyinfact/LoreCanvas`。
- UI 参考图仍未创建；当前 harness 先用 `docs/product-framework.md` 和 `acceptance-checklists.md` 约束产品范围。
- 注意：执行任何依赖 `@pixi/react` 的任务前，必须调用官方 PixiJS Skills 确认当前版本语法，避免使用过时 API。

## 下一步行动 (Next Steps)
1. 运行 `./init.sh` 确认 harness 检查通过。
2. 执行 `F-00`：创建项目运行骨架、依赖和最小测试。
3. 再次运行 `./init.sh`，确保类型检查与 `npx vitest run` 真实通过。
4. 将 `F-00` 标记为 `completed`，再进入 `F-01` 项目数据模型与 Store。