# 数据 Schema

项目文件使用 JSON 保存。所有导出文件必须包含 `schemaVersion`，导入时先校验 schema 和引用完整性，再替换 Store。

## 顶层结构

```json
{
  "schemaVersion": "0.1.0",
  "project": {
    "id": "project-demo",
    "name": "Demo District",
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z"
  },
  "worldMap": {},
  "localMaps": {},
  "dialogues": {},
  "events": {}
}
```

## WorldMap

`worldMap` 表示大地图区域节点图。

- `zones`: `Record<ZoneId, Zone>`
- `edges`: `Record<EdgeId, Edge>`
- `startZoneId`: Runner 默认起点。

`Zone` 字段：
- `id`: 稳定 id。
- `name`: 展示名称。
- `description`: GM 说明。
- `position`: 大地图画布坐标 `{ x, y }`，不是格子坐标。
- `icon`: 语义图标 key，例如 `town`、`building`、`forest`。
- `appearanceTime`: `Always | Day | Night | Hidden`。
- `localMapId`: 可选，进入该区域时打开的小地图。
- `buildingIds`: 挂载在该 zone 下的建筑 id 列表。
- `npcIds`: 挂载在该 zone 下的 NPC id 列表。

`Edge` 字段：
- `id`
- `fromZoneId`
- `toZoneId`
- `label`
- `travelCost`: 默认 1，用于未来路径估算。
- `locked`: 是否暂不可通行。
- `conditions`: 进入条件数组。

## LocalMap

`localMaps` 是 `Record<LocalMapId, LocalMap>`。

`LocalMap` 字段：
- `id`
- `name`
- `parentZoneId`
- `gridSize`: 单格像素大小。
- `dimensions`: `{ columns, rows }`。
- `tiles`: `Record<CellKey, Tile>`，`CellKey` 格式为 `"x,y"`。
- `buildings`: `Record<BuildingId, Building>`。
- `npcs`: `Record<NpcId, NpcPlacement>`。
- `entryPoints`: 命名入口点，例如 `frontDoor`。

`Tile` 字段：
- `id`
- `kind`: `floor | wall | terrain | water | hazard | decoration`。
- `walkable`
- `blocksRadar`
- `appearanceTime`

`Building` 字段：
- `id`
- `name`
- `kind`: `house | door | wall | landmark | obstacle | prop`。
- `origin`: 左上格 `{ x, y }`。
- `size`: `{ width, height }`。
- `walkable`
- `blocksSight`
- `localMapId`: 可选，进入建筑后的目标小地图。

`NpcPlacement` 字段：
- `npcId`: 指向 `npc-roster.md` 中的角色 id。
- `position`: 小地图格子坐标 `{ x, y }`。
- `appearanceTime`
- `dialogueId`
- `hiddenUntilDiscovered`

## Dialogue 与 Event

`dialogues` 使用 `Record<DialogueId, Dialogue>`。`Dialogue` 至少包含：
- `id`
- `speakerNpcId`
- `nodes`
- `startNodeId`

`events` 使用 `Record<EventId, EventTrigger>`。`EventTrigger` 至少包含：
- `id`
- `trigger`: `enterZone | enterLocalMap | approachNpc | scanRadar | dialogueChoice`
- `conditions`
- `effects`
- `repeatable`

## 引用完整性

导入时必须拒绝以下数据：
- `startZoneId` 不存在。
- `edge.fromZoneId` 或 `edge.toZoneId` 不存在。
- `zone.localMapId` 不存在。
- `localMap.parentZoneId` 不存在。
- `building.localMapId` 不存在。
- `NpcPlacement.npcId` 不在 NPC roster 中。
- `dialogue.speakerNpcId` 不在 NPC roster 中。
- 任意小地图坐标越界。
