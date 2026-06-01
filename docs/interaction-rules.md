# 交互规则

本文件定义点击、拖拽、放置、删除和命中检测的默认规则。

## 点击优先级

当多个实体重叠时，命中优先级从高到低：
1. 当前拖拽中的实体。
2. NPC。
3. Event trigger。
4. Building。
5. Zone 或 Tile。
6. Edge。
7. 空画布。

## 拖拽

- 鼠标按下后移动超过 4px 才进入拖拽。
- 拖拽过程中显示 ghost 预览。
- 松开时执行合法性校验。
- 非法位置必须回弹，并显示原因。

## 放置

- 小地图放置必须吸附到格子。
- 大地图放置 zone 使用画布坐标，不吸附格子。
- Building 放置前必须检查占用范围是否越界、是否与不可重叠实体冲突。
- NPC 默认占用单格，同一格是否允许多个 NPC 由地图配置决定；第一版默认不允许。

## 删除

- 删除 edge 可直接执行。
- 删除 zone 必须检查相关 edge、building、npc、event 和 localMap。
- 删除 localMap 前必须检查是否被 zone 或 building 引用。
- 删除 NPC roster 角色必须检查所有 placement 和 dialogue 引用。

## 反馈

所有失败操作都应返回结构化错误：
- `code`: 稳定错误码。
- `message`: 面向用户的文本。
- `details`: 可选调试信息。

UI 负责显示错误，Store action 负责产出错误。

## 键盘快捷键

第一版推荐：
- `V`: select。
- `P`: place。
- `M`: move。
- `Delete` 或 `Backspace`: delete selected。
- `Esc`: 取消当前拖拽或清空选择。
- `Ctrl+S`: 导出或保存当前项目。
