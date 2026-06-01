# 雷达规则

雷达用于发现隐藏目标，不负责移动或直接触发对话。

## 数据输入

扫描函数输入：
- 当前地图层：`world` 或 `local`。
- 玩家位置：`currentZoneId` 或 `{ localMapId, cell }`。
- 时间：`Day | Night`。
- 扫描配置：范围、距离公式、是否暴露精确位置。
- 候选目标：hidden zone、hidden NPC、event signal。

## 大地图扫描

- 默认距离使用 edge hop 数。
- 扫描半径默认 2 hop。
- 锁定 edge 不计入可达扫描，除非配置允许穿透。
- 结果可以是 zone、NPC 或 event signal。
- 默认只暴露方向性提示，不直接揭示精确节点，除非目标配置 `revealExactLocation: true`。

## 小地图扫描

- 默认距离使用曼哈顿距离。
- 扫描半径默认 6 格。
- `blocksRadar` tile 或 building 可阻挡扫描；第一版可以先只按距离计算，并把阻挡作为后续任务。
- NPC 处于 `Hidden` 或 `hiddenUntilDiscovered` 时可被扫描发现。

## 结果结构

```json
{
  "targetType": "npc",
  "targetId": "npc-clockmaker",
  "distance": 4,
  "precision": "rough",
  "hint": "北侧传来微弱机械声",
  "revealsExactLocation": false
}
```

## 重复扫描

- 已发现目标仍可出现在结果中，但应标记 `alreadyDiscovered`。
- 一次性事件不能因重复扫描重复触发。
- UI 可以显示扫描冷却，但冷却不是第一版核心逻辑。
