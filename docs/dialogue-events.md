# 对话与事件

对话和事件是 Runner 模式的主要互动层。UI 负责展示，规则由数据驱动。

## Dialogue

对话采用节点图结构。

```json
{
  "id": "dialogue-gatekeeper-intro",
  "speakerNpcId": "npc-gatekeeper",
  "startNodeId": "start",
  "nodes": {
    "start": {
      "text": "夜里别靠近钟楼。",
      "choices": [
        {
          "label": "询问原因",
          "nextNodeId": "why"
        }
      ]
    }
  }
}
```

## Choice

`Choice` 字段：
- `label`
- `nextNodeId`
- `conditions`
- `effects`

没有 choice 的节点显示继续或结束按钮。

## EventTrigger

事件触发器字段：
- `id`
- `trigger`: `enterZone | enterLocalMap | approachNpc | scanRadar | dialogueChoice`
- `targetId`
- `conditions`
- `effects`
- `repeatable`

## Conditions

第一版支持：
- 当前时间是 Day/Night。
- 玩家在某个 zone。
- 玩家在某个 localMap。
- 某事件是否已触发。
- 雷达是否发现某目标。

## Effects

第一版支持：
- 标记事件已触发。
- 显示 dialogue。
- 显示 toast。
- 揭示 hidden zone 或 NPC。
- 切换 globalTime。

## 记录规则

Runner 会话需要记录：
- `triggeredEventIds`
- `discoveredZoneIds`
- `discoveredNpcIds`
- `dialogueHistory`

这些记录属于 runner session，不应直接污染 Maker 地图源数据。
