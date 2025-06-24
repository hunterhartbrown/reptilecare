@echo off
echo.
echo ========================================
echo   PVC 50 Gallon Enclosure Generator
echo ========================================
echo.

REM Check if Blender is installed and in PATH
where blender >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Blender not found in PATH
    echo.
    echo Please install Blender and add it to your PATH, or run:
    echo   "C:\Program Files\Blender Foundation\Blender 3.x\blender.exe" --background --python pvc_50gal_optimized.py
    echo.
    pause
    exit /b 1
)

echo Running Blender model generation...
echo.

REM Run Blender in background mode with our script
blender --background --python pvc_50gal_optimized.py

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ Model generation completed successfully!
    echo 📁 Check the ..\models\ directory for pvc_50gal_optimized.glb
) else (
    echo ❌ Model generation failed with error code %ERRORLEVEL%
)

echo.
pause 