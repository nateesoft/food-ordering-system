@echo off
echo ========================================
echo   Food Ordering System - Deploy Script
echo   for Windows 7 (Static Export)
echo ========================================
echo.

echo [1/3] Building project...
call npm run build

if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Creating deployment package...
cd out
powershell -command "Compress-Archive -Path * -DestinationPath ../food-ordering-system-deploy.zip -Force"
cd ..

echo.
echo [3/3] Deployment package created!
echo.
echo ========================================
echo   Package: food-ordering-system-deploy.zip
echo   Size:
dir food-ordering-system-deploy.zip | findstr "food-ordering-system-deploy.zip"
echo ========================================
echo.
echo Next steps:
echo 1. Upload food-ordering-system-deploy.zip to Windows 7 server
echo 2. Extract to C:\inetpub\wwwroot\food-ordering-system\
echo 3. Setup IIS Site (see DEPLOYMENT-WINDOWS7.md)
echo.
pause
