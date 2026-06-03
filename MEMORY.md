# MEMORY

## 项目记忆

- 项目名称：销售台账 (sales-ledger)
- 云端同步使用腾讯云 CloudBase（非 Firebase），环境 ID: sales-ledger-d9gp6k3tz489082a1
- Firebase 代码存在于 `src/lib/firebase.ts` 但未被实际使用（死代码）
- 密码存储在环境变量 VITE_ACCESS_PASSWORD 中
- 数据存储：CloudBase Firestore 或 localStorage（离线模式）
- 种子数据 `SEED_RECORDS` 为空数组，新用户首次打开无示例数据
- 已结账状态可通过编辑记录改回未结（之前误判为不可逆，已纠正）
- 本地开发默认禁用云同步（VITE_ENABLE_CLOUD_SYNC=false），避免污染正式数据
- 云同步闸门位于 tcb.ts 的 isTcbConfigured()，所有 push/pull/poll 都受其控制

## 关键设计决策

- 软删除：记录删除后仅标记 deletedAt 字段，30 天自动清理
- 同步策略：5 秒轮询 + updatedAt 时间戳判断
- 汇率：用户可自定义，影响 USDT 折算计算
- 筛选：多个筛选项支持独立清空按钮，条件叠加筛选
- 排序：支持多列排序，点击表头切换升序/降序
- Dashboard 汇总：仅统计已选中记录，未选时归零
- 环境安全：VITE_APP_ENV=development 时强制禁用云同步
