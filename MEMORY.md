# MEMORY

## 项目记忆

- 项目名称：销售台账 (sales-ledger)
- 云端同步使用腾讯云 CloudBase，环境 ID: sales-ledger-d9gp6k3tz489082a1
- Firebase 代码存在于 src/lib/firebase.ts 但未被实际使用（死代码）
- 密码存储在环境变量 VITE_ACCESS_PASSWORD 中
- 本地开发默认禁用云同步（VITE_ENABLE_CLOUD_SYNC=false）
- 云同步闸门位于 tcb.ts 的 isTcbConfigured()

## 关键设计决策

- 软删除：记录删除后标记 deletedAt，30 天自动清理
- 同步策略：5 秒轮询 + updatedAt 时间戳判断
- push 前合并：maybePushToCloud 先 fetchLedger() → mergeRecordsForSync() → pushLedger()
- mergeRecordsForSync 按 id 合并，record.updatedAt 较新的记录获胜
- removedRecords 用于同步永久删除/清空回收站，removedAt 晚于 record.updatedAt 时记录不再恢复
- hydrateFromCloud 全量替换本地 records，sanitizeRecord 必须保留 deletedAt
- Dashboard 汇总：仅统计已选中记录
- 环境安全：VITE_APP_ENV=development 时强制禁用云同步
- 超过 30 天的 deletedAt tombstone 在 push 合并时转入 removedRecords

## 已知陷阱

- sanitizeRecord 返回字段必须对齐 LedgerRecord，漏字段会导致 pull 时数据丢失
- 旧数据没有 updatedAt 时，sanitizeRecord 会自动补默认值用于同步合并
- push 从前是全量覆盖，现已改为 fetch-merge-push 流程
- 旧客户端如果在永久删除后继续编辑同一条旧记录，并产生更晚 updatedAt，可能赢过 removed tombstone
