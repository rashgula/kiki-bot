@echo off
title KIKI Discord Bot - Gothic Purple Edition v2.2
color 05
cls

echo ================================================================
echo      🔮  KIKI - Gothic Purple Discord Bot (Bitzxier Replica)
echo      800+ Commands ^| Anti-Nuke ^| Moderation ^| Tickets ^| Utility
echo      Auto-Restore Engine: ACTIVE (Zero setup needed on restart)
echo ================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js v18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [SETUP] Installing npm dependencies...
    npm install
)

:loop
echo [STARTING] Booting up KIKI...
echo.

node index.js

echo.
echo ================================================================
echo [NOTICE] Bot process ended.
echo Restarting automatically in 5 seconds (Press Ctrl+C to stop)...
echo ================================================================
timeout /t 5 >nul
goto loop
