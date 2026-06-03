# 进度记录

## 2026-06-04

### L2/P0：record-level 同步元数据

- [x] LedgerRecord 增加 updatedAt
- [x] CloudLedgerData / store 增加 removedRecords
- [x] add/update/delete/restore/settle/import 刷新 record.updatedAt
- [x] 永久删除和清空回收站写入 removedRecords tombstone
- [x] mergeRecordsForSync 改为 updatedAt + removedRecords 合并规则
- [x] npx tsc --noEmit 零错误

### L2：push 前合并云端数据（防止旧数据覆盖删除）

- [x] 新增 mergeRecordsForSync 函数：按 id 合并 local/cloud records
- [x] 修改 maybePushToCloud：push 前 fetch 云端最新数据并合并
- [x] 合并规则：record.updatedAt 较新者获胜，removedRecords 防永久删除复活
- [x] tsc --noEmit 零错误

### L2 严重 Bug：删除后同步复活

- [x] 定位根因：sanitizeRecord 丢弃 deletedAt
- [x] 修复：sanitizeRecord 增加 deletedAt 字段

### L1+L2：多项 UI 和逻辑修复

- [x] 状态筛选 × 按钮分离
- [x] settleSelected/settleRecord 补全 selectedIds
- [x] Dashboard 汇总仅统计选中
- [x] 客户搜索统一样式

### L2：本地开发禁用云同步

- [x] tcb.ts 安全守卫 + SyncStatus 本地模式

## 2026-06-03

- [x] 筛选框清空按钮
- [x] 批量操作后自动取消选中

## 待办

- [ ] 手动 git commit
- [ ] 补充种子数据
- [ ] 清理死代码（firebase.ts）
- [ ] 添加单元测试
