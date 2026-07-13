@echo off
chcp 65001 > nul
cd /d "%~dp0frontend"
set NODE_OPTIONS=--openssl-legacy-provider
set HOST=localhost
set DANGEROUSLY_DISABLE_HOST_CHECK=true
echo =====================================================
echo  Frontend iniciando en http://localhost:3000
echo  Espera el mensaje: "Compiled successfully!"
echo =====================================================
npm start
echo.
echo El servidor del frontend se detuvo.
cmd /k
