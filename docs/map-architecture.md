# 地图架构说明

`GM-Scout-Canvas` 使用双层地图模型，避免把所有玩法都塞进单一网格。

## 大地图：区域节点图

大地图采用 Zone-based / Point-and-Click 架构。它不是连续网格，而是由 `zones` 和 `edges` 组成的节点图：
- `zone` 表示一个可点击地点，例如城镇、建筑群、街区、营地、地下入口或野外地点。
- `edge` 表示两个区域之间的可用通路，例如道路、门、暗道、传送点或 GM 自定义路线。
- 建筑在大地图中优先建模为 zone 的子实体，必要时也可以提升为独立 zone。
- NPC 可以挂在 zone 上，表示其大地图层级的可发现位置。

Point-and-Click 行为应产出导航意图，例如选择目标 zone、进入建筑或切换到绑定的小地图，而不是伪造网格路径。

## 小地图：方形格子

小地图采用 square-grid，用于房间、战斗、探索和精确移动：
- `tile` 表示地块或地面类型。
- `building` 表示占用一个或多个格子的建筑、墙体、门或大型地物。
- `npc` 表示可交互角色或隐藏目标。
- 玩家移动默认使用曼哈顿邻接；A* 可以作为后续扩展，但不能阻塞基础移动。

所有像素坐标转换必须通过 `screenToGrid` / `gridToScreen` 一类纯函数完成，并由 Vitest 覆盖。

## 地图切换

大地图 zone 或 building 可以引用 `localMapId`。Runner 模式中，点击或进入该实体时切换到对应小地图；离开小地图时返回来源 zone。

编辑器必须保存引用完整性：任何 `edge.zoneId`、`npc.zoneId`、`npc.localMapId`、`building.zoneId`、`building.localMapId` 都必须指向存在的对象。
