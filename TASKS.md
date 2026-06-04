# 任务清单

## L1 小任务

- [x] 筛选框增加清空按钮
- [x] 批量操作后自动取消选中
- [x] 状态筛选 UI 按钮重叠修复
- [x] 客户搜索下拉样式统一美化

## L2 中任务

- [x] 自动备份最小可用版本（CloudBase backups / localStorage，保留最近 30 份）
- [x] 自动备份 P1：上次备份时间、立即备份、状态提示、backups 权限检测
- [x] 自动备份 P1：createdAtLocal 中国时间字段 + 数据变更 3 分钟防抖备份
- [x] 动态汇总拆分：Dashboard 统计勾选记录，FooterSummary 统计当前筛选结果

- [x] Dashboard 汇总仅统计选中记录
- [x] 本地开发禁用云同步机制
- [x] Bug 修复：sanitizeRecord 漏掉 deletedAt 导致删除复活
- [x] Bug 修复：push 全量覆盖导致旧数据覆盖删除 (merge-before-push)
- [x] P0 修复：record.updatedAt + removedRecords 支持删除/恢复/清空回收站同步
- [ ] 初始化 Git + 提交所有修改
- [ ] 补充种子数据
- [ ] 清理死代码（firebase.ts）

## L3 大任务

- [ ] 添加单元测试
