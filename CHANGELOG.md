# 变更日志

## [Unreleased]

### P0 Fixed (2026-06-04) - record-level sync metadata

- LedgerRecord 新增 updatedAt，用于判断删除、恢复、编辑、结账的最新状态
- Cloud 同步数据新增 removedRecords，用于同步永久删除和清空回收站
- mergeRecordsForSync 改为按 updatedAt 选择最新记录，并用 removedRecords 阻止旧记录被补回
- 永久删除、清空回收站、过期回收站清理都会写入 removedRecords
- 旧数据缺少 updatedAt 时由 sanitizeRecord 自动补默认值

### Security Fix (2026-06-04) - push 前合并云端数据

- 新增 mergeRecordsForSync：按 id 合并 local+cloud records
- record.updatedAt 较新的状态获胜，removedRecords 表示永久删除
- 修改 maybePushToCloud：push 前 fetchLedger → merge → pushLedger
- 过期 deletedAt tombstone（>30天）在合并时转入 removedRecords

### Fixed (2026-06-04) - 删除后同步复活

- sanitizeRecord 现在保留 deletedAt 字段

### Added (2026-06-04)

- 本地开发云同步禁用 + VITE_APP_ENV 安全守卫

### Fix (2026-06-04)

- 状态筛选/客户搜索 UI 统一

### Added (2026-06-03)

- 筛选清空按钮 + 批量自动取消选中
