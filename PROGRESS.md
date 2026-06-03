# 进度记录

## 2026-06-04

### L2 严重 Bug：删除数据后同步复活

- [x] 定位根因：sanitizeRecord() 丢掉 deletedAt
- [x] 修复：sanitizeRecord 增加 deletedAt 字段
- [x] tsc --noEmit 零错误

### L1+L2：多项 UI 和逻辑修复

- [x] 状态筛选 × 按钮与下拉箭头分离
- [x] settleSelected/settleRecord 补全 selectedIds 清除
- [x] Dashboard 右上角汇总仅统计选中记录
- [x] 客户搜索 ChevronDown + 统一样式

### L2：本地开发禁用云同步

- [x] tcb.ts 增加 VITE_ENABLE_CLOUD_SYNC + VITE_APP_ENV 安全守卫
- [x] SyncStatus 本地测试模式紫色标签

## 2026-06-03

- [x] 筛选框清空按钮
- [x] 批量操作后自动取消选中

## 待办

- [ ] 手动 git commit
- [ ] 补充种子数据
- [ ] 清理死代码（firebase.ts）
- [ ] 添加单元测试
