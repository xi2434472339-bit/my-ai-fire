# 进度记录

## 2026-06-03

### L1：筛选框增加清空按钮

- [x] 每个筛选项有内容时右侧显示 × 清空按钮
- [x] 搜索框、客户搜索、状态、开始日期、结束日期各一个 × 按钮

### L1：批量操作后自动取消选中

- [x] 批量结账后自动清空 selectedIds
- [x] 单条结账后如果该条被选中，从 selectedIds 中移除

## 2026-06-04

### L1+L2：多项 UI 和逻辑修复

- [x] 状态筛选 × 按钮与下拉箭头分离，改为 flex 布局
- [x] settleSelected / settleRecord 确认写入 selectedIds 清空逻辑
- [x] Dashboard 右上角汇总改为仅统计选中记录
- [x] 客户搜索添加 ChevronDown 箭头，清空按钮统一样式
- [x] 校正已结账不可逆的误解（编辑即可改回）

### L2：本地开发禁用云同步

- [x] tcb.ts 增加 VITE_ENABLE_CLOUD_SYNC + VITE_APP_ENV 安全守卫
- [x] SyncStatus 增加本地测试模式紫色标签
- [x] .env.example 更新环境变量说明
- [x] README 更新为 CloudBase + 本地/正式配置说明

## 待办

- [ ] 手动执行 git commit
- [ ] 补充种子数据（SEED_RECORDS）
- [ ] 清理死代码（src/lib/firebase.ts）
- [ ] 添加单元测试
