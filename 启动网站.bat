@echo off
title 摄影工作室官网 - 本地预览
cd /d "%~dp0"

echo.
echo   ============================================
echo       摄影工作室官网  ·  本地预览
echo   ============================================
echo.

node -v >nul 2>nul
if errorlevel 1 goto NONODE

if exist "node_modules" goto RUN

echo   首次运行，正在安装依赖（需要联网，可能要几分钟）...
echo.
call npm install --no-audit --no-fund
if errorlevel 1 goto NODEPS
echo.
echo   依赖安装完成。
echo.

:RUN
echo   正在启动服务，几秒后会自动打开浏览器 ...
echo.
echo   地址： http://127.0.0.1:5273/
echo.
echo   【关闭这个黑窗口就会停止服务】
echo.
start "" /min powershell -NoProfile -Command "Start-Sleep -Seconds 5; Start-Process 'http://127.0.0.1:5273/'"
call npm run dev
echo.
echo   服务已停止。按任意键关闭窗口。
pause >nul
exit /b 0

:NONODE
echo   [错误] 没找到 Node.js
echo.
echo   请先安装： https://nodejs.org/
echo   装完重新双击本文件即可。
echo.
pause
exit /b 1

:NODEPS
echo.
echo   [错误] 依赖安装失败。
echo   请检查网络后重新双击本文件。
echo.
pause
exit /b 1
