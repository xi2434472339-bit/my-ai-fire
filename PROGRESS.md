# 进度记录

## 2026-06-04

### L2：自动备份本地时间字段 + 数据变更防抖备份
- [x] backups 新增 createdAtLocal（中国时间）和 timezone=Asia/Shanghai
- [x] 保留 createdAt UTC ISO 字段，records/removedRecords/exchangeRate/recordCount 不变
- [x] store 新增 lastDataChangedAt，覆盖新增、编辑、删除、结账、恢复、永久删除、清空回收站、导入、汇率修改
- [x] useAutoBackup 新增 3 分钟数据变更防抖备份，连续操作只保留最后一次
- [x] 手动备份或 12 小时备份成功后，会抵消已覆盖的数据变更延迟备份

### L2：自动备份 P1 状态与权限检测
- [x] 首页显示上一次备份时间，未备份时显示“暂无”
- [x] 新增“立即备份”按钮，不受 12 小时间隔限制
- [x] 显示备份中、备份成功、备份失败状态
- [x] 显示本地/云端备份模式
- [x] 新增 CloudBase backups 集合权限检测，测试新增后只删除同一条测试数据
- [x] 保持 12 小时自动备份逻辑不变

### L2：自动备份 + 动态汇总
- [x] 新增 src/lib/backup.ts，支持 CloudBase backups / localStorage 备份
- [x] 新增 src/hooks/useAutoBackup.ts，打开网页且超过 12 小时自动备份
- [x] 首页新增“启用自动备份”开关，默认开启并持久化
- [x] 左上角 Dashboard 与底部 FooterSummary 拆分 summary 数据来源
- [x] npx tsc --noEmit 零错误

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
