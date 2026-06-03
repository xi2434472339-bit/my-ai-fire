@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================
echo   销售台账 - 永久部署（Netlify）
echo ==========================================
echo.

echo [1/2] 正在打包...
call npm run build
if errorlevel 1 (
  echo 打包失败，请检查错误信息。
  pause
  exit /b 1
)

echo.
echo [2/2] 打包完成！
echo.
echo 接下来请按以下步骤操作（只需一次）：
echo.
echo   1. 浏览器会打开 Netlify 部署页面
echo   2. 把 dist 文件夹拖进网页里
echo   3. 等待几秒，会得到永久网址，例如：
echo      https://xxx.netlify.app
echo.
echo   以后更新：重新运行本脚本，再拖一次 dist 即可
echo.
echo ==========================================

start https://app.netlify.com/drop
explorer "%~dp0dist"

pause
