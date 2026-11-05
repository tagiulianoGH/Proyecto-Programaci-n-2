@echo off
setlocal enabledelayedexpansion

:: ================================================================
::  Instalador GiuliCorp - Windows + XAMPP
::  Ejecutar como administrador si se requiere copiar a C:\xampp\htdocs
:: ================================================================

set "XAMPP_DIR=C:\xampp"
set "HTDOCS_DIR=%XAMPP_DIR%\htdocs"
set "PROJECT_DIR=%~dp0"
set "DB_SCRIPTS_DIR=%PROJECT_DIR%database"
set "PHP_DIR=%PROJECT_DIR%PHPs"

echo.
echo ============================================
echo   Instalador GiuliCorp - Windows + XAMPP
echo ============================================
echo.

:: ----------------------------------------------------------------
:: 1. Verificar que XAMPP este instalado
:: ----------------------------------------------------------------
if not exist "%XAMPP_DIR%\mysql\bin\mysql.exe" (
    echo [!] ERROR: No se encontro XAMPP en %XAMPP_DIR%
    echo    Asegurate de tener XAMPP instalado en C:\xampp
    echo.
    pause
    exit /b 1
)

:: ----------------------------------------------------------------
:: 2. Iniciar servicios Apache y MySQL
:: ----------------------------------------------------------------
echo [1/6] Iniciando Apache y MySQL...
net start apache 2>nul
net start mysql 2>nul
timeout /t 3 >nul

:: ----------------------------------------------------------------
:: 3. Crear la base de datos (sistema_facturacion)
:: ----------------------------------------------------------------
echo [2/6] Creando base de datos sistema_facturacion...
"%XAMPP_DIR%\mysql\bin\mysql.exe" -u root < "%DB_SCRIPTS_DIR%\crear_bd_sistema_facturacion.sql"
if %errorlevel% neq 0 (
    echo [!] ERROR al crear la base de datos.
    echo.
    pause
    exit /b 1
)

:: ----------------------------------------------------------------
:: 4. Ejecutar migracion de usuarios
:: ----------------------------------------------------------------
echo [3/6] Ejecutando migracion de usuarios...
"%XAMPP_DIR%\mysql\bin\mysql.exe" -u root < "%DB_SCRIPTS_DIR%\migracion_usuarios.sql"
if %errorlevel% neq 0 (
    echo [!] ERROR al migrar usuarios.
    echo.
    pause
    exit /b 1
)

:: ----------------------------------------------------------------
:: 5. Copiar endpoints PHP a htdocs (Apache)
:: ----------------------------------------------------------------
echo [4/6] Copiando endpoints PHP a Apache htdocs...
if not exist "%HTDOCS_DIR%" mkdir "%HTDOCS_DIR%"
xcopy /E /I /Y "%PHP_DIR%\*" "%HTDOCS_DIR%\"
if %errorlevel% neq 0 (
    echo [!] ERROR al copiar archivos PHP.
    echo.
    pause
    exit /b 1
)

:: ----------------------------------------------------------------
:: 6. Instalar dependencias y levantar Angular
:: ----------------------------------------------------------------
echo [5/6] Instalando dependencias de Angular (npm install)...
cd /d "%PROJECT_DIR%"
npm install
if %errorlevel% neq 0 (
    echo [!] ERROR en npm install.
    echo.
    pause
    exit /b 1
)

echo [6/6] Levantando Angular en http://localhost:4300
npm start -- --port 4300

echo.
echo Instalacion completa. El proyecto esta corriendo.
pause