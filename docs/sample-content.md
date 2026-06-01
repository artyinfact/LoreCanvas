# 最小示例内容

本文件定义第一版测试和人工验收可使用的最小地图内容。实现后可转换为 `tests/fixtures/sampleProject.ts` 或 JSON fixture。

## 项目

- project id: `project-demo-district`
- name: `Demo District`
- schemaVersion: `0.1.0`

## 大地图 Zones

### zone-market

- name: 晨曦集市
- position: `{ x: 240, y: 220 }`
- icon: `market`
- appearanceTime: `Always`
- localMapId: `local-market-square`
- NPC: `npc-market-scout`

### zone-clocktower

- name: 旧钟楼
- position: `{ x: 520, y: 160 }`
- icon: `tower`
- appearanceTime: `Night`
- localMapId: `local-clocktower-ground`
- NPC: `npc-clockmaker`

### zone-gate

- name: 北门
- position: `{ x: 120, y: 420 }`
- icon: `gate`
- appearanceTime: `Always`
- NPC: `npc-gatekeeper`

### zone-alley

- name: 无名暗巷
- position: `{ x: 460, y: 420 }`
- icon: `alley`
- appearanceTime: `Hidden`
- NPC: `npc-shadow-broker`

## 大地图 Edges

- `edge-gate-market`: 北门 <-> 晨曦集市。
- `edge-market-clocktower`: 晨曦集市 <-> 旧钟楼。
- `edge-market-alley`: 晨曦集市 <-> 无名暗巷，默认 hidden。

## 小地图 local-market-square

- dimensions: `12 x 8`
- gridSize: `48`
- entry point: `{ x: 1, y: 6 }`
- tiles: 默认 `floor`。
- buildings:
  - `building-stall-1`: 摊位，占用 `{ x: 4, y: 3, width: 2, height: 1 }`。
  - `building-fountain`: 喷泉，占用 `{ x: 8, y: 4, width: 2, height: 2 }`。
- NPC placements:
  - `npc-market-scout` at `{ x: 3, y: 5 }`。

## 小地图 local-clocktower-ground

- dimensions: `8 x 10`
- gridSize: `48`
- entry point: `{ x: 4, y: 9 }`
- buildings:
  - `building-clockwork-door`: 锁门，占用 `{ x: 3, y: 2, width: 2, height: 1 }`。
- NPC placements:
  - `npc-clockmaker` at `{ x: 5, y: 3 }`，Night only。

## 核心验收路径

1. Runner 从 `zone-gate` 开始。
2. 点击移动到 `zone-market`。
3. 进入 `local-market-square`。
4. 与 `npc-market-scout` 触发雷达教学对话。
5. 夜晚扫描发现 `zone-alley` 或 `npc-clockmaker`。
