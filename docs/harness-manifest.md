# Harness 文档清单

本文件是 `docs/` 的路由入口。Agent 在实现功能前应按任务类型读取对应文档，避免把需求散落在聊天记录中。

## 必读基础文档

- `map-architecture.md`: 双层地图架构，大地图 zone graph 与小地图 square grid 的边界。
- `data-schema.md`: 可导出项目文件的 schema、实体字段和引用完整性规则。
- `state-management.md`: Zustand 状态分区、action 约束和编辑状态边界。
- `game-mechanics.md`: 昼夜、导航、移动和雷达的核心数学规则。
- `storage-strategy.md`: 本地 JSON、草稿保存和未来云端适配策略。

## 编辑器与 UI 行为文档

- `ui-workflows.md`: Maker/Runner 的主要用户流程。
- `ui-layout-spec.md`: 不依赖图片的布局约束。
- `ui-style-guide.md`: 不依赖参考图的视觉语言、颜色和组件密度。
- `ui-components.md`: 工具栏、Inspector、对话框、雷达面板等组件契约。
- `editor-tools.md`: 左侧工具栏工具矩阵。
- `interaction-rules.md`: 点击、拖拽、放置、删除和命中检测规则。
- `rendering-contract.md`: PixiJS 层级、坐标、缩放和高亮约定。
- `visual-acceptance.md`: 人工视觉验收标准。

## 内容与玩法文档

- `npc-roster.md`: 首批 NPC 角色列表和字段规范。
- `dialogue-events.md`: 对话结构、触发条件和事件效果。
- `radar-rules.md`: 大地图与小地图雷达扫描细则。
- `mode-lifecycle.md`: Maker 与 Runner 的生命周期边界。
- `sample-content.md`: 最小可验证示例地图内容。

## 根目录执行清单

- `../acceptance-checklists.md`: 每个功能节点的验收清单。该文件属于 feedback/checklist 层，放在仓库根目录，便于收尾时与 `AGENTS.md`、`feature_list.json`、`agent-progress.md` 一起检查。

## 图片参考缺口

UI 参考图应后续放入 `docs/ui-references/`，但当前任务不生成图片。没有图片前，以 `ui-layout-spec.md`、`ui-style-guide.md`、`ui-components.md` 和 `visual-acceptance.md` 作为可执行视觉约束。
