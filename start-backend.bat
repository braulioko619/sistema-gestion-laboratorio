@echo off
chcp 65001 > nul
cd /d "%~dp0backend"

:: Matar procesos node anteriores que usen puerto 3001
echo Limpiando procesos anteriores en puerto 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak > nul

echo =====================================================
echo  Backend iniciando en http://localhost:3001
echo =====================================================
node src/server.js
echo.
echo El servidor se detuvo.
cmd /k
