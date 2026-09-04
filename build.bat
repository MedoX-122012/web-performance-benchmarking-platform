@echo off
title Web Performance Benchmarker - Build
echo ============================================
echo   Building for Production
echo ============================================
echo.

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm not found.
    pause
    exit /b 1
)

echo [1/2] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)

echo.
echo [2/2] Build complete!
echo Output: dist/
echo.
echo To serve: npx serve dist
echo ============================================
pause
