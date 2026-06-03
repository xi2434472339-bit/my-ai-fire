# 变更日志

## [Unreleased]

### Fixed (2026-06-04) - 严重 Bug：删除数据后同步复活

- 根因：sanitizeRecord() 在 pull 云端数据时丢弃了 deletedAt 字段
- 修复：sanitizeRecord 现在保留 deletedAt（r.deletedAt ? String(r.deletedAt) : undefined）
- 影响：修复前 pull 会全量替换 records 导致所有软删除标记丢失

### Added (2026-06-04)

- 本地开发云同步禁用机制：VITE_ENABLE_CLOUD_SYNC 控制 push/pull/poll
- VITE_APP_ENV=development 安全守卫：开发环境强制禁止云同步
- SyncStatus 本地测试模式紫色标签

### Fix (2026-06-04)

- 状态筛选 × 按钮与下拉箭头分离
- settleSelected/settleRecord 补全 selectedIds 清空
- Dashboard 右上角汇总仅统计选中记录
- 客户搜索添加 ChevronDown 箭头，统一样式

### Added (2026-06-03)

- 筛选框清空按钮
- 批量操作后自动取消选中

### Doc

- README 更新为 CloudBase + 环境变量说明
- 纠正已结账不可逆的错误结论
