# GiuliCorp

Aplicación Angular que muestra ventas, sucursales y clientes con datos reales de la base
`sistema_facturacion` (XAMPP / MariaDB), con login y permisos por rol.

## Contenido del paquete

```
empresa/
├─ src/                 Código fuente Angular
│  └─ app/
│     ├─ home/          Panel de control
│     ├─ ventas/        Tabla y gráficos de ventas (total por mes + IVA)
│     ├─ sucursales/    Tarjetas de sucursales (CRUD para admin/dev)
│     ├─ clientes/      Listado de clientes (CRUD para admin/dev)
│     ├─ login/         Inicio de sesión
│     ├─ perfil/        Datos de la cuenta y cambio de contraseña
│     ├─ usuarios/      Gestión de usuarios (admin/dev)
│     ├─ auditoria/     Registro de acciones (admin/dev)
│     ├─ dev/           Sesiones y configuración técnica (solo dev)
│     ├─ models/        Interfaces TypeScript
│     ├─ services/      Servicios HTTP
│     └─ core/          Configuración de la API y autenticación
├─ PHPs/                Endpoints PHP (auth, usuarios, CRUD, auditoría, dev)
├─ database/            Scripts para crear la base y migrar usuarios
├─ public/              Archivos públicos
├─ angular.json
├─ package.json
└─ INSTALACION.md
```

> `node_modules`, `.angular` y `dist` no se incluyen: se regeneran con `npm install` y
> `npm run build`.

## Requisitos

- Node.js 20 o superior (probado con Node 24) y npm.
- XAMPP con **Apache** y **MySQL** iniciados.
- MariaDB 10.2 o superior (el script usa CTE recursivos).

## 1. Crear la base de datos

1. Abrir el panel de XAMPP e iniciar **MySQL**.
2. Ejecutar `database\crear_bd.bat` (doble clic) o, desde consola:

```powershell
cd database
C:\xampp\mysql\bin\mysql.exe -u root < crear_bd_sistema_facturacion.sql
```

El script crea la base `sistema_facturacion` y carga datos de prueba:
10 sucursales, 20 clientes, 10 items, 3650 facturas de 2026 y sus detalles.

3. Ejecutar la migración de usuarios (no borra datos existentes):

```powershell
C:\xampp\mysql\bin\mysql.exe -u root < database\migracion_usuarios.sql
```

Crea las tablas `rol`, `usuario`, `sesion`, `auditoria`, `intento_login` y `configuracion`,
y carga los usuarios iniciales.

### Usuarios iniciales

| Email | Contraseña | Rol |
|---|---|---|
| `dev@giulicorp.com` | `Dev1234!` | dev |
| `admin@giulicorp.com` | `Admin1234!` | admin |
| `empleado@giulicorp.com` | `Empleado1234!` | empleado (Sucursal Centro) |
| `empleado2@giulicorp.com` | `Empleado1234!` | empleado (Sucursal Norte) |

> Cambiar las contraseñas desde **Mi perfil** después del primer ingreso.

## 2. Publicar los endpoints PHP

Copiar **todo** el contenido de `PHPs\` a la carpeta pública de Apache, respetando las
subcarpetas:

```powershell
Copy-Item .\PHPs\* C:\xampp\htdocs\ -Recurse -Force
```

Verificar que respondan:

- http://localhost/auth/login.php (POST)
- http://localhost/Get_Clientes.php (requiere token)
- http://localhost/Get_Sucursales.php (requiere token)
- http://localhost/Get_Facturas.php (requiere token)
- http://localhost/Get_Ventas.php (requiere token)

Si Apache usa otro host o puerto, ajustar `src/app/core/api.config.ts`:

```ts
export const API_BASE_URL = 'http://localhost';
```

## 3. Instalar dependencias y ejecutar

```powershell
npm install
npm start -- --port 4300
```

Abrir http://localhost:4300

> Se usa el puerto 4300 porque el 4200 puede estar ocupado por otro proyecto.
> También se puede ejecutar `npm start` y aceptar otro puerto.

## 4. Compilar y probar

```powershell
npm run build
npm test -- --watch=false
```

## Roles y permisos

| Rol | Alcance |
|---|---|
| **empleado** | Solo consulta. Ve ventas, facturas, clientes y la sucursal que tiene asignada. |
| **admin** | CRUD de clientes, sucursales y facturas; gestión de usuarios empleado; auditoría. |
| **dev** | Todo lo del admin + gestión de roles, sesiones activas, auditoría completa y configuración técnica. |

El backend valida el token y el rol en **cada** endpoint. Angular solo oculta opciones de la
interfaz; una petición directa sin permiso responde `403`.

## Notas

- El IVA se calcula como impuesto: `importe * 1.21` por cada factura.
- Las sucursales se identifican por el nombre de su ciudad (Santa Fe, Rafaela, etc.).
- La sección Ventas permite alternar entre gráfico de líneas, barras y barras apiladas.
- La sesión se guarda en `localStorage` bajo la clave `giulicorp.auth` y expira a las 8 horas.
- El token se guarda hasheado (SHA-256) en la tabla `sesion`; nunca en texto plano.
- Los intentos de login se limitan a 5 fallos por email + IP cada 15 minutos.
- La tabla `cliente` no tiene sucursal propia: un empleado ve los clientes que tienen
  facturas en su sucursal.
