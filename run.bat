@echo off
title Web Performance Benchmarker
echo ============================================
echo   Web Performance Benchmarker
echo ============================================
echo.

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm not found. Install from https://nodejs.org
    pause
    exit /b 1
)

if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting in demo mode...
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:3001
echo   Health:    http://localhost:3001/api/health
echo.
echo Press Ctrl+C to stop.
echo ============================================
echo.

call npm run dev
