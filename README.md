# GiuliCorp

Sistema de gestión comercial con Angular 22 (standalone) y PHP 8 + MySQL (XAMPP).
Incluye ventas, sucursales, clientes, usuarios, auditoría y un panel técnico para el rol dev.

## Requisitos

- Node.js 20+ y npm
- XAMPP con Apache y MySQL iniciados
- PHP 8.1+

## Puesta en marcha

1. Crear la base y cargar los datos de prueba:

   ```powershell
   C:\xampp\mysql\bin\mysql.exe -u root < database\crear_bd_sistema_facturacion.sql
   ```

2. Ejecutar la migración de usuarios (idempotente, no borra datos):

   ```powershell
   C:\xampp\mysql\bin\mysql.exe -u root < database\migracion_usuarios.sql
   ```

3. Publicar los endpoints PHP en Apache:

   ```powershell
   Copy-Item .\PHPs\* C:\xampp\htdocs\ -Recurse -Force
   ```

4. Levantar Angular:

   ```powershell
   npm install
   npm start -- --port 4300
   ```

5. Abrir <http://localhost:4300>.

La URL de la API se configura en `src/app/core/api.config.ts` (`http://localhost`).

## Usuarios iniciales

| Email | Contraseña | Rol |
|---|---|---|
| `dev@giulicorp.com` | `Dev1234!` | dev |
| `admin@giulicorp.com` | `Admin1234!` | admin |
| `empleado@giulicorp.com` | `Empleado1234!` | empleado (Sucursal Centro) |
| `empleado2@giulicorp.com` | `Empleado1234!` | empleado (Sucursal Norte) |

Cambiar las contraseñas desde **Mi perfil** después del primer ingreso.

## Roles

| Rol | Permisos |
|---|---|
| **empleado** | Solo lectura. Ve únicamente los datos de su sucursal asignada y puede cambiar su contraseña. |
| **admin** | CRUD de clientes, sucursales y facturas; gestión de usuarios empleado; auditoría. |
| **dev** | Todo lo del admin + gestión de roles, sesiones activas, auditoría completa y configuración técnica. |

El backend valida el token y el rol en cada endpoint: una petición sin permiso responde `403`
aunque se intente saltear la interfaz.

## Seguridad

- Token opaco de 64 caracteres guardado en `localStorage` (`giulicorp.auth`).
- En la base se almacena solo el SHA-256 del token, en la tabla `sesion`; expira a las 8 horas.
- Contraseñas con `password_hash` / `password_verify` (bcrypt).
- Límite de 5 intentos fallidos por email + IP cada 15 minutos.
- Todas las acciones sensibles quedan registradas en `auditoria`.

## Comandos útiles

```powershell
npm start -- --port 4300   # servidor de desarrollo
npm run build              # build de producción en dist/
npm test                   # tests unitarios
```

## Estructura

```
src/app/
├─ core/auth/     Servicio de sesión, guards, interceptor y permisos
├─ login/         Inicio de sesión
├─ home/          Panel de control
├─ ventas/        Ventas mensuales con IVA
├─ sucursales/    Sucursales (CRUD admin/dev)
├─ clientes/      Clientes (CRUD admin/dev)
├─ usuarios/      Gestión de usuarios (admin/dev)
├─ auditoria/     Registro de acciones (admin/dev)
├─ dev/           Sesiones y configuración técnica (dev)
├─ perfil/        Datos de cuenta y cambio de contraseña
├─ models/        Interfaces TypeScript
└─ services/      Servicios HTTP
PHPs/             Endpoints PHP (auth, usuarios, CRUD, auditoría, dev)
database/         Scripts de creación y migración
```

Ver `INSTALACION.md` para el detalle de la puesta en marcha.
