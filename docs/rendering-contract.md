# PixiJS 渲染契约

实现 PixiJS 相关功能前必须确认当前 `@pixi/react` 版本语法。本文件只定义渲染架构和层级，不定义具体 API。

## 坐标系统

- 大地图使用画布坐标 `{ x, y }`。
- 小地图使用格子坐标 `{ x, y }` 和像素坐标双表示。
- 任何屏幕坐标写入 Store 前必须经过转换函数。
- 缩放和平移属于 viewport 状态，不应改变实体数据坐标。

## 大地图层级

从底到顶：
1. 背景。
2. Edge 连接线。
3. Zone 节点。
4. Building/NPC/Event 标记。
5. 标签。
6. Hover/selected 高亮。
7. 拖拽 ghost。
8. 雷达结果标记。

## 小地图层级

从底到顶：
1. 背景。
2. Tile。
3. Grid lines。
4. Building。
5. Event trigger。
6. NPC。
7. Player。
8. Hover/selected 高亮。
9. Movement preview。
10. 雷达结果标记。

## 性能边界

- 第一版地图规模目标：大地图 50 个 zone 以内，小地图 100x100 格以内。
- 大地图标签可在缩小时隐藏。
- 小地图格线可在缩小时降低透明度或隐藏。
- 不在 React state 中存储每帧动画状态。

## 可测试边界

渲染组件可以做薄层，但以下逻辑必须是纯函数并由 Vitest 覆盖：
- `screenToWorld`
- `worldToScreen`
- `screenToGrid`
- `gridToScreen`
- `hitTestWorldMap`
- `hitTestLocalMap`
- `getRenderLayers`
