@echo off
cd /d "%~dp0"
docker compose version >nul 2>&1
if errorlevel 1 goto missing
docker compose -f automations/n8n/compose.yaml up -d
if errorlevel 1 goto failed
echo.
echo Abre http://localhost:5678 en esta computadora.
echo Solo desarrollo local. No conecta tu numero de WhatsApp.
pause
exit /b 0
:missing
echo Falta Docker Desktop o no esta iniciado.
echo Sigue docs/N8N-WHATSAPP.md. No se instalara nada automaticamente.
pause
exit /b 1
:failed
echo n8n no pudo iniciar. Conserva el mensaje anterior para revisar el error.
pause
exit /b 1
