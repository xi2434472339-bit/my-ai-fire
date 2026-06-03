# 变更日志

## [Unreleased]

### Added (2026-06-04)

- 本地开发云同步禁用机制：VITE_ENABLE_CLOUD_SYNC=false 时所有 push/pull/poll 禁用
- VITE_APP_ENV=development 安全守卫：开发环境强制禁止云同步
- SyncStatus 本地测试模式提示（紫色标签）

### Fix (2026-06-04)

- 状态筛选 × 按钮与下拉箭头分离，改用 flex 水平布局避免重叠
- settleSelected / settleRecord 补全 selectedIds 清空逻辑
- Dashboard 右上角汇总改为仅统计选中记录，未选中时显示 0
- 客户搜索添加 ChevronDown 下拉箭头指示，清空按钮统一样式

### Added (2026-06-03)

- 筛选框增加清空按钮：每个筛选项有内容时右侧显示 × 清空按钮
- 批量操作后自动取消选中

### Doc

- README 更新为 CloudBase 说明，增加本地/正式环境变量说明
- 纠正已结账不可逆的错误结论
