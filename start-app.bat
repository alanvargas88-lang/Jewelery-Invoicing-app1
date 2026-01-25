@echo off
title Jewelry Invoice Pro
echo ========================================
echo    Jewelry Invoice Pro - Starting...
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    echo After installing, run this file again.
    pause
    exit /b 1
)

:: Check if http-server is installed, if not install it
where http-server >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing http-server...
    npm install -g http-server
)

echo Starting server on http://localhost:3000
echo.
echo The app will open in your browser automatically.
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.

:: Start browser after a short delay
start "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"

:: Start the server
http-server -p 3000 -c-1
