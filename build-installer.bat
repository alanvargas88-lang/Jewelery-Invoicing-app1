@echo off
title Building Jewelry Invoice Pro Installer
echo ========================================
echo   Building Jewelry Invoice Pro
echo   Windows Installer
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/4] Copying app files to electron folder...
copy /Y index.html electron\index.html >nul
copy /Y styles.css electron\styles.css >nul
copy /Y app.js electron\app.js >nul
copy /Y price-data.js electron\price-data.js >nul
echo Files copied successfully.

echo.
echo [2/4] Installing dependencies...
cd electron
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Building Windows installer...
call npm run build:win
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build installer
    pause
    exit /b 1
)

echo.
echo [4/4] Done!
echo.
echo ========================================
echo   BUILD COMPLETE!
echo ========================================
echo.
echo Your installer is located in:
echo   electron\dist\
echo.
echo Files created:
echo   - Jewelry Invoice Pro Setup.exe (Installer)
echo   - Jewelry Invoice Pro.exe (Portable)
echo.
echo You can now run the installer to install
echo the app on your computer.
echo.
pause
