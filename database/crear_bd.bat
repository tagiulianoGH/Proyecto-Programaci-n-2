@echo off
setlocal
chcp 65001 >nul

rem ===========================================================================
rem  Ejecuta crear_bd_sistema_facturacion.sql usando el MySQL de XAMPP.
rem  Uso: doble clic, o desde consola:  crear_bd.bat
rem ===========================================================================

set "MYSQL=C:\xampp\mysql\bin\mysql.exe"
set "SQL=%~dp0crear_bd_sistema_facturacion.sql"

if not exist "%MYSQL%" (
    echo [ERROR] No se encontro mysql.exe en "%MYSQL%".
    echo         Verifica que XAMPP este instalado en C:\xampp.
    goto :error
)

if not exist "%SQL%" (
    echo [ERROR] No se encontro el script "%SQL%".
    goto :error
)

echo Ejecutando "%SQL%" ...
echo.

"%MYSQL%" -u root --default-character-set=utf8mb4 < "%SQL%"

if errorlevel 1 (
    echo.
    echo [ERROR] Fallo la ejecucion del script.
    echo         Verifica que MySQL este iniciado desde el panel de XAMPP.
    goto :error
)

echo.
echo [OK] Base de datos creada y rellenada correctamente.
goto :eof

:error
echo.
pause
endlocal
exit /b 1
