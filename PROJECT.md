# 销售台账 - 项目概述

## 项目目标

多人协作的销售记账 Web 应用。记录销售订单（客户、日期、类型、数量、单价、金额、USDT 折算），支持已结/未结状态追踪、实时云端多人同步、Excel 导入导出、本地离线模式。目标用户为小型销售团队内部使用。

## 技术栈

- React 18 + TypeScript (strict)
- Vite 6
- TailwindCSS 3 + 自定义色板 + 暗色模式
- Zustand 5 (状态管理) + persist 中间件 (localStorage持久化)
- 腾讯云 CloudBase (云端 Firestore 兼容数据库)
- xlsx (Excel 导入导出)
- date-fns (日期处理)
- lucide-react (图标)

## 功能模块

1. **密码门禁** - 基于环境变量 VITE_ACCESS_PASSWORD，sessionStorage 缓存认证状态
2. **仪表盘** - 未结汇总框 + 底部四栏统计（总金额/已结/未结/折合USD）
3. **记录表格** - 多列可排序、行内操作（一键结账/编辑/删除）、复选框批量选择
4. **新增/编辑表单** - 模态弹窗，客户/类型 datalist 自动补全，实时计算金额/USD
5. **筛选器** - 关键词搜索、客户筛选、状态筛选、日期范围、汇率设置，每项有独立清空按钮
6. **工具栏** - 批量结账/删除、Excel 导出/导入、暗色模式切换、回收站入口
7. **回收站** - 30 天软删除保留，支持恢复和永久删除
8. **云端同步** - 5 秒轮询 CloudBase，基于 updatedAt 时间戳判断远程变更
9. **错误边界** - 捕获渲染异常，提供清除缓存并刷新按钮

## 部署

- Netlify / Vercel (SPA 重定向)
- deploy.bat / deploy-vercel.bat

## 2026-06-04 功能补充

- 自动备份：打开网页时若距离上次备份超过 12 小时，会自动备份 records、removedRecords、exchangeRate、createdAt、recordCount；正式云同步环境写入 CloudBase backups 集合，本地/禁用云同步时写入 localStorage。
- 备份开关：首页提供“启用自动备份”复选框，默认开启，并通过 Zustand persist 保存。
- 备份保留：只保留最近 30 份备份，超出后删除最旧备份。
- 动态汇总：左上角 Dashboard 只统计当前勾选记录；底部 FooterSummary 统计当前表格筛选后的记录，不受勾选状态影响。
