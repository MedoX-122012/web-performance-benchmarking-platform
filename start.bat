@echo off
title Web Performance Benchmarker - Install & Run
echo ============================================
echo   Web Performance Benchmarker
echo ============================================
echo.

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm not found.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

echo [1/2] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/2] Starting servers...
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3001
echo.
echo Press Ctrl+C to stop.
echo ============================================
echo.

call npm run dev
