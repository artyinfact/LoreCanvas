# AGENTS.md: LoreCanvas Agent 入口

`LoreCanvas` 是一款为线下跑团/桌游 GM 提供地图面板编辑、桌游配件操作、规则事件编辑与运行模拟的数字辅助工具。核心目标是把真实桌游的地图面板、配件和规则书流程搬到一个可操作的数字桌面里。

技术栈：React + Zustand + PixiJS + Vitest。仓库当前以 harness 为系统事实来源，所有实现任务必须从 `feature_list.json` 中单线程领取。

## 1. 知识路由
不要猜测特定技术实现。进入对应领域前先读取本地文档：
- 产品基础框架：`docs/product-framework.md`
- 功能验收清单：`acceptance-checklists.md`
- PixiJS 渲染与交互：必须优先调用官方 PixiJS Skills，并结合 `@pixi/react` 声明式语法；禁止编造 v5/v6 旧 API。

## 2. 开工流程
每次启动新会话或接手新任务时，按顺序执行：
1. 运行 `pwd` 确认处于项目根目录。
2. 读取 `agent-progress.md`，了解已验证状态和 blocker。
3. 读取 `feature_list.json`，选择 `status: "pending"` 且 `priority` 最小的任务。
4. 运行 `git status --short --branch`、`git remote -v` 和 `git log --oneline -5` 查看分支、远端与近期变更。项目默认远端仓库为 `https://github.com/artyinfact/LoreCanvas`。
5. 如果当前分支配置了 upstream 且工作区干净，优先 `git pull --ff-only` 同步远端；如果没有 upstream，可用默认远端 URL 执行只读 `git fetch` 并确认本地 HEAD 与远端基线关系。如果存在本地未提交变更，先判断是否属于当前任务，避免覆盖用户工作。
6. 运行 `./init.sh` 做 harness 与测试基线验证。

红线：如果 `./init.sh` 在已有 `package.json` 的实现阶段报错，停止新功能开发，先修复基础状态。不要在损坏的起点上叠加代码。

## 3. 产品边界
- 地图编辑器导入一张桌游地图面板背景图，并允许手动放置、移动、删除各种桌游配件。
- 配件是通用对象，不预设 NPC、建筑、雷达目标或格子地块等固定玩法语义。
- 事件编辑器用于预设桌游规则书中的流程规则，在适当时机弹出剧情、投骰判定、规则提示或其他窗口。
- Runner 模式模拟玩家操作配件后的游戏流程，按预设规则触发事件；它只消费 Maker 产物，不直接修改项目模板。
- 小地图、方形格子移动、区域节点图、雷达索敌、昼夜系统、固定 NPC roster 和自动寻路均不属于当前范围。

## 4. 执行规则
- 单线程推进：一次只做一个 `feature_list.json` 功能节点。
- 最小化干涉：除非为当前任务消除 blocker，不重构无关文件。
- 测试优先：核心状态、坐标转换、序列化、配件操作和事件触发均需 Vitest 覆盖。
- 事实来源：以仓库文件为准，不依赖聊天记忆。需求变化必须同步到 harness 文档。

## 5. 完成定义
一个功能节点只有在以下条件全部满足时才算完成：
1. 目标行为已实现。
2. 对应 `verification` 命令通过；实现阶段的全量 `npx vitest run` 必须全绿。
3. 涉及 PixiJS 视觉、拖拽、事件弹窗或地图交互时，在 `agent-progress.md` 记录手动验证步骤。
4. `feature_list.json` 状态已更新，`agent-progress.md` 可让下一轮 agent 直接续上。

## 6. 收尾
会话结束或功能验收后：
1. 更新 `agent-progress.md` 的已完成、当前状态、下一步和 blocker。
2. 将已通过验证的任务在 `feature_list.json` 标记为 `completed`。
3. 保持 `./init.sh` 可运行；没有实现脚手架时它应清楚报告 scaffold 尚未创建。
4. 当前步骤已完成且通过验证时，执行 `git add`、`git commit` 和 `git push`。如果仓库没有配置 remote，可使用默认远端 URL 显式 push；如果认证或权限失败，记录 blocker 并向用户说明需要处理 GitHub 凭据。