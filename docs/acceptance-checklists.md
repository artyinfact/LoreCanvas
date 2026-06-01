# 功能验收清单

每个 feature 完成时，除对应测试命令外，还应检查本文件中的人工验收项。

## F-00 项目骨架

- `package.json` 存在。
- `npm install` 可成功。
- `npx vitest run` 可成功。
- `./init.sh` 在实现脚手架存在时真实执行类型检查和测试。

## F-01 双层地图 Store

- 可以创建 world zone 和 edge。
- 可以创建 local map、tile、building、npc placement。
- 删除实体时引用完整性被校验。
- `sample-content.md` 的内容可以被表达。

## F-02 大地图渲染

- Zone、edge、label 和选中态可见。
- 点击 zone 可以选中。
- 点击 edge 可以选中。
- Runner 中当前 zone 高亮。

## F-03 小地图渲染

- 方形格子准确显示。
- `screenToGrid` 与 `gridToScreen` 测试通过。
- building 占用范围可见。
- NPC 与 building 不混淆。

## F-04 左侧工具栏

- 当前动作和目标类型都有选中态。
- 无效工具组合被禁用或给出明确反馈。
- 大地图与小地图使用同一工具语义但写入正确数据结构。

## F-05 Inspector

- 选中实体后字段正确显示。
- 保存通过 Store action。
- 危险操作有明确视觉和确认。

## F-06 序列化

- 导出 JSON 包含 `schemaVersion`。
- 导入无效引用会失败并给出错误。
- 导入 `sample-content.md` 对应 fixture 后地图可正常打开。

## F-07 Runner 与昼夜

- Day/Night 切换影响可见性。
- Runner 不修改 Maker 源数据。
- 视觉滤镜不是可见性事实来源。

## F-08 导航

- 大地图只能沿可用 edge 移动。
- 小地图只能移动到相邻可行走格。
- 进入和退出 local map 的来源关系正确。

## F-09 雷达

- 大地图按 hop 距离扫描。
- 小地图按格子距离扫描。
- 已发现目标不会重复触发一次性事件。

## F-10 对话事件

- 接近 NPC 或进入目标区域可触发 dialogue。
- choice 能切换节点。
- event effects 能更新 runner session。
