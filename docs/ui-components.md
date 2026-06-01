# UI 组件契约

本文件定义组件行为和状态，不绑定具体 React 文件名。

## TopBar

- 显示项目名、当前模式、当前地图层。
- 提供 Maker/Runner 切换。
- 提供 Save、Load、Export 操作。
- 在未保存状态显示 dirty indicator。

## ToolBar

- 左侧常驻，仅 Maker 模式可编辑。
- 包含工具动作：`select`、`place`、`move`、`delete`。
- 包含目标类型：`zone`、`edge`、`building`、`tile`、`npc`、`event`。
- 当前动作和目标类型都必须有明确选中态。

## Palette

- 当工具需要选择具体类型时显示，例如 tile kind、building kind、NPC roster。
- Palette 可以位于左侧工具栏旁，也可以作为底部抽屉。
- 选择结果写入 `editor.currentPaletteItem`。

## Inspector

- 右侧常驻。
- 未选中时显示当前地图摘要。
- 选中实体时显示实体类型、名称、描述、可见性、引用关系、危险操作。
- 保存通过 Store action，不直接修改对象。

## CanvasViewport

- 承载 PixiJS stage。
- 负责缩放、平移、坐标转换和命中检测入口。
- 不直接包含业务写入逻辑；点击/拖拽转成 editor action。

## DialoguePanel

- Runner 模式触发对话时从底部出现。
- 显示 NPC 名称、可选头像占位、正文、选项和继续按钮。
- 支持打字机效果，但正文数据必须可一次性渲染，便于测试。

## RadarPanel

- Runner 模式可打开。
- 显示扫描按钮、扫描范围、冷却状态和结果列表。
- 结果项包含目标类型、距离、提示文本和定位精度。

## Toast / StatusBar

- 用于无效操作反馈，例如不可放置、不可达、导入失败。
- 错误信息必须具体，不使用泛化的 "Something went wrong"。
