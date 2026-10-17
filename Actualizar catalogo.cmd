@echo off
cd /d "%~dp0"
set "AUREA_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%AUREA_NODE%" set "AUREA_NODE=node"
"%AUREA_NODE%" scripts/import-excel.cjs admin/catalogo.xlsx --apply
if errorlevel 1 goto error
"%AUREA_NODE%" scripts/build.cjs
if errorlevel 1 goto error
"%AUREA_NODE%" scripts/check-release.cjs
if errorlevel 1 goto error
echo Catalogo local actualizado. Revisa la web local antes de publicarlo.
pause
exit /b 0
:error
echo No se completo la actualizacion. Revisa el error anterior.
pause
exit /b 1
