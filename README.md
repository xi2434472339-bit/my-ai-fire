# 戈瓦记账本

## 本地运行

```bash
npm install
npm run dev
```

本地开发默认禁用云端同步，数据仅保存在浏览器 localStorage。

---

## 云端多人同步（重要）

要实现「你改别人能看到，别人改你也能看到」，需要配置 **CloudBase**（免费）。

### 前置条件

正式部署时需设置以下环境变量：

```env
VITE_APP_ENV=production
VITE_ENABLE_CLOUD_SYNC=true
VITE_TCB_ENV_ID=你的CloudBase环境ID
VITE_LEDGER_ID=sales-ledger-main
```

本地开发时建议保持默认：

```env
VITE_APP_ENV=development
VITE_ENABLE_CLOUD_SYNC=false
VITE_TCB_ENV_ID=
```

### 1. 创建 CloudBase 环境

1. 打开 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 创建环境 → 开通云数据库
3. 复制环境 ID

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入 CloudBase 配置：

```bash
cp .env.example .env
```

正式部署时还需设置 `.env.production`。

### 3. 部署到 Netlify 时添加环境变量

Netlify 后台 → Site settings → Environment variables，添加所有 `VITE_*` 环境变量，然后重新部署。

### 部署到 Vercel

在 Vercel 项目的 Settings → Environment Variables 中，为 Production 添加：

```env
VITE_APP_ENV=production
VITE_ENABLE_CLOUD_SYNC=true
VITE_TCB_ENV_ID=你的CloudBase环境ID
VITE_LEDGER_ID=sales-ledger-main
VITE_ACCESS_PASSWORD=你的访问密码
```

保存后必须重新部署。项目根目录的本地 `.env` 只供 `npm run dev` 使用，不会自动成为 Vercel 的生产环境变量。

### 4. 验证同步

- 页面左上角显示 **「云端已同步」** 即成功
- 本地开发时显示 **「本地测试模式」**，不会连接云端
- 用两台电脑打开同一网址，一方新增记录，另一方几秒内自动更新

---

## 永久部署

双击 `deploy.bat` 或 `deploy-vercel.bat`，详见脚本说明。

---

## 数据说明

| 模式 | 数据位置 |
|------|----------|
| 已配置 CloudBase（production） | 云端 CloudBase，所有人共享同一份数据 |
| 本地开发（development） | 仅保存在各自浏览器（互不同步） |
| VITE_ENABLE_CLOUD_SYNC=false | 强制本地模式，不连接云端 |
