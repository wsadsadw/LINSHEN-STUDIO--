@echo off
title 构建发布包 - 摄影工作室官网
cd /d "%~dp0"

echo.
echo   ============================================
echo       构建发布包（生成 dist 文件夹）
echo   ============================================
echo.

node -v >nul 2>nul
if errorlevel 1 goto NONODE

if not exist "node_modules" goto NODEPS

echo   正在构建，几秒钟 ...
echo.

call npm run build
if errorlevel 1 goto FAIL

echo.
echo   ============================================
echo       构建完成
echo   ============================================
echo.
echo   产物就在 dist 文件夹里。
echo   接下来把 dist 文件夹整个拖到托管服务上就行了。
echo.
echo   已经帮你把 dist 文件夹打开。
echo.

start "" explorer "dist"

echo   按任意键关闭本窗口。
pause >nul
exit /b 0

:NONODE
echo   [错误] 没找到 Node.js。
echo   请先安装： https://nodejs.org/
echo.
pause
exit /b 1

:NODEPS
echo   [错误] 依赖还没安装。
echo   请先双击「启动网站.bat」跑一次，它会自动装好依赖。
echo.
pause
exit /b 1

:FAIL
echo.
echo   [错误] 构建失败。
echo   通常是因为改文件时标点改错了（引号没成对、逗号丢了）。
echo   请把上面的报错内容发给开发者。
echo.
pause
exit /b 1
