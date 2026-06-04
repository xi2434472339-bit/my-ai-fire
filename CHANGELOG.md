# 变更日志

## [Unreleased]

### Added (2026-06-04) - 自动备份 P1

- 首页新增备份状态面板，显示上一次备份时间、当前备份模式和 backups 权限检测结果。
- 新增“立即备份”按钮，手动备份不受 12 小时间隔限制，成功后更新 lastBackupAt。
- 备份过程显示备份中、备份成功、备份失败状态。
- 新增 testBackupPermission，仅对 CloudBase backups 集合写入并删除 isPermissionTest 测试数据。

### Added (2026-06-04) - 自动备份与动态汇总

- 新增自动备份最小可用版本：打开网页且距离上次备份超过 12 小时自动创建备份。
- CloudBase 可用时写入 backups 集合；本地/禁用云同步时写入 localStorage。
- 自动备份默认开启，首页提供开关并持久化保存。
- 左上角 Dashboard 继续只统计勾选记录；底部 FooterSummary 改为统计当前筛选后的表格记录。

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
