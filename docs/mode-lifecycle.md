# Maker / Runner 生命周期

Maker 与 Runner 必须有明确边界。Maker 产生地图，Runner 消费地图。

## Maker 模式

Maker 可执行：
- 创建、编辑、删除 zone、edge、localMap、tile、building、NPC placement、event。
- 编辑 NPC、dialogue、visibility、entry point。
- 保存和导出项目 JSON。

Maker 不应执行：
- 玩家移动。
- 事件触发记录。
- 雷达发现记录。

## Runner 模式

Runner 可执行：
- 从 startZoneId 或指定入口开始。
- 大地图导航。
- 小地图移动。
- 触发对话和事件。
- 记录 session 状态，例如已发现、已触发。

Runner 不应执行：
- 修改地图源数据。
- 删除或创建 Maker 实体。
- 绕过 schema 直接写入导出项目。

## 模式切换

从 Maker 切到 Runner：
1. 校验项目 schema。
2. 校验 startZoneId 和 entry points。
3. 创建新的 runner session。

从 Runner 回到 Maker：
1. 保留地图源数据。
2. 可选择丢弃或导出 runner session。
3. 清空临时高亮、雷达结果和对话 UI。

## 存档边界

第一版只保存 Maker 项目 JSON。Runner session 可先保存在内存中，后续再决定是否导出战役记录。
