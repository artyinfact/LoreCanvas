# AGENTS.md: LoreCanvas Agent 入口

`LoreCanvas` 是一款专为美式/叙事驱动桌游打造的戏剧化虚拟桌面引擎。英文定位：A Theatrical VTT Engine tailored for Story-Driven Board Games.

项目以 CCFOLIA 的“房间准备 -> 玩家操作 -> 自动演出/提示 -> 可读档复位”体验为参考，但核心模型面向复杂美式桌游：使用 Node-Graph 表达地图位置和连接关系，使用通用 Entity 表达棋子、卡牌、威胁、目标和任意配件，使用 JSON 规则树驱动事件流和 Cut-in 演出。

技术栈：React + Zustand + PixiJS + Vitest。仓库当前以 harness 为系统事实来源，所有实现任务必须从 `feature_list.json` 中单线程领取。

## 1. 知识路由
不要猜测特定技术实现。进入对应领域前先读取本地文档：
- 产品定义与 CCFOLIA 参考：`docs/product.md`
- 功能验收清单：`clean-state-checklists.md`
- 进度与交接：`progress.md`
- PixiJS 渲染与交互：必须优先调用官方 PixiJS Skills，并结合 `@pixi/react` 声明式语法；禁止编造 v5/v6 旧 API。

## 2. 开工流程
每次启动新会话或接手新任务时，按顺序执行：
1. 运行 `pwd` 确认处于项目根目录。
2. 读取 `progress.md`，了解已验证状态和 blocker。
3. 读取 `feature_list.json`，选择 `status: "pending"` 且 `priority` 最小的任务。
4. 运行 `git status --short --branch`、`git remote -v` 和 `git log --oneline -5` 查看分支、远端与近期变更。项目默认远端仓库为 `https://github.com/artyinfact/LoreCanvas`。
5. 如果当前分支配置了 upstream 且工作区干净，优先 `git pull --ff-only` 同步远端；如果没有 upstream，可用默认远端 URL 执行只读 `git fetch` 并确认本地 HEAD 与远端基线关系。如果存在本地未提交变更，先判断是否属于当前任务，避免覆盖用户工作。
6. 运行 `./init.sh` 做 harness 与测试基线验证。

红线：如果 `./init.sh` 在已有 `package.json` 的实现阶段报错，停止新功能开发，先修复基础状态。不要在损坏的起点上叠加代码。
在 `F-00-EnvironmentAndPages` 完成前，不进入业务引擎功能实现。

## 3. 标准验证命令
- Harness 基线：`bash ./init.sh`
- 任务验证：运行当前 `feature_list.json` 节点中的 `verification`
- 实现后全量验证：`bash ./init.sh` 必须安装依赖、执行类型检查并跑完整 Vitest
- JSON 清单校验：由 `./init.sh` 自动检查 `feature_list.json` 结构、依赖和 evidence 规则

初始化完成后，后续功能开发交给 Codex 按“计划 -> 实现 -> 验收”循环推进：先根据 `feature_list.json` 选择单个任务并写明计划，再实现最小闭环，最后运行 verification、记录 evidence、更新 `progress.md`。初始化完成的定义包括 `F-00-EnvironmentAndPages` 通过验证，并完成 GitHub Pages workflow 部署。`docs/product.md` 是稳定产品规格，除非用户明确要求或规格变更，Codex 日常实现循环不得改写产品 docs。

## 4. 产品边界
- Board 是带背景图的 Node-Graph，不是方格地图。Location 与 Edge 是一等模型；任何 Grid、A*、战术格移动都不属于核心实现。
- Entity 是通用对象，最小模型为 `{ id, type, state: Record<string, any> }`。具体桌游语义只能通过 JSON 规则和 state 字段表达，不硬编码 LOTR 或其他游戏。
- Global Trackers 表达 Threat、Time、Sanity 等全局变量，并可通过映射表驱动 PixiJS 视觉滤镜。
- Rule Trigger Engine 解析 JSON 规则树，在 Entity 移动、状态变化、手动触发等事件命中条件时发射动作流。
- Theatrical Renderer 负责 CCFOLIA 风格 Cut-in：遮罩、图片滑入、打字机文本、规则提示和其他演出 payload。
- Runner 消费 `.lorecanvas` 剧本包并创建独立运行状态，不直接修改 Maker 源数据。
- `local-fixtures/lotr/` 是本地验收素材目录，必须被 `.gitignore` 排除；它只用于 E2E 验证，不属于正式产品资产。

## 5. 执行规则
- 单线程推进：一次只做一个 `feature_list.json` 功能节点。
- 最小化干涉：除非为当前任务消除 blocker，不重构无关文件。
- 测试优先：图结构、Entity 动态状态、移动校验、追踪器映射、规则解析、Cut-in 指令和序列化均需 Vitest 覆盖。
- 事实来源：以仓库文件为准，不依赖聊天记忆。需求变化必须同步到 harness 文档。
- LOTR fixture 只能作为阶段性验收输入。实现必须保持通用引擎抽象，不允许为了通过 LOTR 场景写入游戏专属分支。
- `AGENTS.md` 只做入口地图；实现细节应在代码和测试中沉淀，产品规格变更才进入 `docs/`。

## 6. 完成定义
一个功能节点只有在以下条件全部满足时才算完成：
1. 目标行为已实现。
2. 对应 `verification` 命令通过；实现阶段的全量 `npx vitest run` 必须全绿。
3. 涉及 PixiJS 视觉、Cut-in、滤镜或地图交互时，在 `progress.md` 记录手动验证步骤。
4. `feature_list.json` 的 `status` 与 `evidence` 已更新，`progress.md` 可让下一轮 agent 直接续上。

## 7. 收尾
会话结束或功能验收后：
1. 更新 `progress.md` 的已完成、当前状态、下一步和 blocker。
2. 将已通过验证的任务在 `feature_list.json` 标记为 `completed`，并写入可复查的 `evidence`。
3. 保持 `./init.sh` 可运行；没有实现脚手架时它应清楚报告 scaffold 尚未创建。
4. 只有在用户明确要求提交时才执行 `git add`、`git commit` 或 `git push`。如需推送但认证或权限失败，记录 blocker 并向用户说明需要处理 GitHub 凭据。