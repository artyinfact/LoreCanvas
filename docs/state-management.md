# 状态管理约定

全局状态使用 Zustand。Store 需要把编辑状态、地图数据和 Runner 状态分开，避免 UI 临时状态污染可导出的地图 schema。

## 推荐状态分区

- `editor`: Maker 模式状态，包括当前地图层、当前工具、当前 palette 项、选中实体、拖拽中的实体。
- `worldMap`: 大地图数据，包括 `zones`、`edges`、挂载在 zone 上的建筑和 NPC。
- `localMaps`: 小地图字典，key 为 `localMapId`，值包含 `gridSize`、`dimensions`、`tiles`、`buildings`、`npcs`。
- `runner`: Runner 模式状态，包括玩家当前位置、当前时间、当前所在地图层、已触发事件。

## 工具语义

左侧工具栏使用统一语义：
- `select`: 选择实体并打开 Inspector。
- `place`: 放置 zone、building、tile 或 npc。
- `move`: 移动已存在实体；大地图移动节点坐标，小地图移动格子坐标。
- `delete`: 删除实体，并清理相关引用。

大地图和小地图可以共享工具按钮，但 action 必须根据当前地图层写入不同数据结构。

## Action 约束

- 不直接在组件中修改深层对象；所有变更通过 Store action。
- 坐标转换、引用校验、实体占用检测必须是可单测的纯函数。
- 删除 zone 时必须拒绝或显式处理相关 edge、building、npc 和 localMap 引用。
- 导入 JSON 时先校验 schema，再替换 Store。
