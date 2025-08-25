@echo off
echo ================================
echo BrandFlow Netlify Quick Deploy
echo ================================

echo.
echo [1/4] Installing dependencies...
call npm ci
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building for production...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/4] Testing build locally...
start http://localhost:4173
call npm run preview

echo.
echo [4/4] Build completed successfully!
echo.
echo ================================
echo Next Steps:
echo ================================
echo 1. Test the local preview at http://localhost:4173
echo 2. If everything works, deploy to Netlify:
echo    - Drag & Drop: Upload 'dist' folder to netlify.com
echo    - CLI: netlify deploy --prod --dir=dist
echo    - Git: Push to GitHub and connect to Netlify
echo.
echo Build artifacts are in: dist/
echo.
pause