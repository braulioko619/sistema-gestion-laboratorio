@echo off
chcp 65001 > nul
set PROYECTO=%USERPROFILE%\Desktop\sistema-gestion-laboratorio

echo =====================================================
echo   SISTEMA DE GESTION DE LABORATORIO
echo =====================================================
echo.

echo [0/2] Cerrando sesiones anteriores de Node.js...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak > nul

echo [1/2] Iniciando Backend (puerto 3001)...
start "Backend - Laboratorio" cmd /k "%PROYECTO%\start-backend.bat"

echo     Esperando que el backend arranque...
timeout /t 6 /nobreak > nul

echo [2/2] Iniciando Frontend (puerto 3000)...
start "Frontend - Laboratorio" cmd /k "%PROYECTO%\start-frontend.bat"

echo.
echo =====================================================
echo   Espera ~60 segundos. El frontend dira:
echo   "Compiled successfully!"
echo   Luego abre: http://localhost:3000
echo.
echo   Usuario: admin@laboratorio.com
echo   Contrasena: Admin@123
echo =====================================================
echo.
timeout /t 70 /nobreak > nul
start http://localhost:3000
