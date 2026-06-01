# UI 工作流

本文描述 Maker 与 Runner 的用户流程。实现 UI 前先确认当前任务属于哪条流程。

## Maker: 创建项目

1. 打开应用后进入 Maker 模式。
2. 中央显示大地图画布，左侧显示工具栏，右侧显示 Inspector。
3. GM 放置 zone，连接 edge，命名区域。
4. GM 为 zone 绑定 local map，或创建新的小地图。
5. GM 进入小地图，放置 tile、building、npc 和事件触发点。
6. GM 保存项目为 JSON。

## Maker: 编辑大地图

1. 选择 `zone` + `place`，点击画布创建区域节点。
2. 选择 `edge` + `place`，依次点击两个 zone 创建连接。
3. 选择 `select`，点击 zone 或 edge，在 Inspector 中编辑名称、描述、可见性和目标小地图。
4. 选择 `move`，拖动 zone 改变大地图布局。
5. 选择 `delete`，点击 zone 或 edge；删除 zone 前必须提示其关联 edge、building、npc 和 local map。

## Maker: 编辑小地图

1. 从大地图 zone 进入绑定的小地图。
2. 选择 `tile` + `place`，在格子上刷地块。
3. 选择 `building` + `place`，放置建筑、墙、门或障碍。
4. 选择 `npc` + `place`，从 NPC roster 选择角色并放到格子。
5. 选择 `move`，拖动 building 或 npc 到合法格子。
6. 选择 `delete`，删除实体并清理引用。

## Runner: 大地图导航

1. Runner 从 `startZoneId` 开始。
2. 大地图只显示当前时间可见、已发现或 GM 允许展示的 zone。
3. 点击相邻可达 zone 执行 Point-and-Click 导航。
4. 点击绑定小地图的 zone 或 building 进入小地图。
5. 无法到达的 zone 必须给出明确反馈。

## Runner: 小地图探索

1. 玩家从 entry point 出现。
2. 点击相邻可行走格移动。
3. 接近 NPC 或触发点时显示交互提示。
4. 触发 dialogue 或 event 后，底部显示对话界面。
5. 离开小地图时返回来源 zone。

## 雷达扫描

1. Runner 打开雷达面板。
2. 点击扫描后，UI 显示冷却/扫描状态。
3. 扫描结果以结构化列表展示，并在地图上标记粗略或精确位置。
4. 重复扫描不应重复触发一次性事件。
