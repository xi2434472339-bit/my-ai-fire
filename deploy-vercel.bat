@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==========================================
echo   戈瓦记账本 - 永久部署（Vercel）
echo ==========================================
echo.

call npm run build
if errorlevel 1 (
  echo 打包失败。
  pause
  exit /b 1
)

echo.
echo 首次使用需在浏览器中登录 Vercel（可用 GitHub 登录）
echo 登录成功后会自动部署，并显示永久网址
echo.

call npx vercel deploy --prod --yes

echo.
echo 部署完成！请复制上方显示的 Production 网址发给他人。
pause
