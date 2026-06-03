# 变更日志

## [Unreleased]

### Security Fix (2026-06-04) - push 前合并云端数据

- 新增 mergeRecordsForSync：按 id 合并 local+cloud records
- cloud deletedAt 优先级高于 local（防止旧记录覆盖删除）
- 修改 maybePushToCloud：push 前 fetchLedger → merge → pushLedger
- 过期 tombstone（>30天）在合并时自动清理

### Fixed (2026-06-04) - 删除后同步复活

- sanitizeRecord 现在保留 deletedAt 字段

### Added (2026-06-04)

- 本地开发云同步禁用 + VITE_APP_ENV 安全守卫

### Fix (2026-06-04)

- 状态筛选/客户搜索 UI 统一

### Added (2026-06-03)

- 筛选清空按钮 + 批量自动取消选中
