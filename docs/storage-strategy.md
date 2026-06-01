# 存储策略

当前阶段不引入 Supabase 或其他远端数据库。项目文件以 JSON 为主，后续通过适配层扩展。

## 第一阶段：JSON 文件

- Save/Load 使用本地 JSON。
- 导出文件必须包含 `schemaVersion`。
- 导入时必须校验 schema、引用完整性和坐标边界。
- JSON 是跨会话和跨工具的事实来源。

## 第二阶段：本地草稿

可选加入浏览器本地草稿：
- `localStorage` 只保存轻量 metadata。
- `IndexedDB` 保存较大的项目草稿。
- 草稿不能替代正式 JSON 导出。

## 未来阶段：云端适配

只有出现以下需求时再考虑 Supabase：
- 多设备同步。
- 多人协作。
- 云端地图库。
- 用户账号和权限。
- 共享战役房间。

## 适配层接口

业务逻辑不应直接依赖 JSON 文件或 Supabase。推荐抽象：

```ts
interface MapStorageAdapter {
  loadProject(source: string | File): Promise<MapProject>
  saveProject(project: MapProject): Promise<void>
  exportProject(project: MapProject): Promise<Blob>
  importProject(file: File): Promise<MapProject>
}
```

第一版实现：
- `JsonFileStorageAdapter`

后续可扩展：
- `LocalDraftStorageAdapter`
- `SupabaseStorageAdapter`

## 迁移规则

任何 schema 变更必须：
1. 提升 `schemaVersion`。
2. 增加迁移函数。
3. 增加旧版本导入测试。
4. 更新 `data-schema.md`。
