@echo off
chcp 65001 >nul 2>&1
title Ace-The-CET
echo.
echo   ========================================
echo          Ace-The-CET  Server
echo   ========================================
echo.

REM --- Kill old process on port 3456 ---
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":3456 "') do taskkill /PID %%a /F >nul 2>&1
ping -n 2 127.0.0.1 >nul

REM --- Find node.exe ---
if exist "%~dp0node\node.exe" goto :use_portable
where node >nul 2>&1
if %errorlevel%==0 goto :use_system
goto :no_node

:use_portable
echo   [*] Portable Node.js
echo   [*] Close this window to stop
echo.
"%~dp0node\node.exe" "%~dp0server\index.js"
goto :done

:use_system
echo   [*] System Node.js
echo   [*] Close this window to stop
echo.
node "%~dp0server\index.js"
goto :done

:no_node
echo   [!] Node.js not found
echo   [!] Put node.exe in node\ folder

:done
echo.
echo   [*] Server stopped
pause
