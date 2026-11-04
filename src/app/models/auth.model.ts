export type Rol = 'empleado' | 'admin' | 'dev';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  idSucursal: number | null;
  sucursal: string | null;
  permisos: string[];
  debeCambiarPassword: boolean;
}

export interface SesionGuardada {
  token: string;
  expiraEn: string;
  usuario: UsuarioSesion;
}

export interface LoginResponse {
  token: string;
  expiraEn: string;
  usuario: UsuarioSesion;
}

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  idSucursal: number | null;
  sucursal: string | null;
  activo: boolean;
  ultimoLogin: string | null;
  creadoEn: string;
}

export interface AuditoriaItem {
  id: number;
  accion: string;
  entidad: string | null;
  entidadId: number | null;
  detalle: Record<string, unknown> | null;
  ip: string | null;
  creadoEn: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  rol: Rol | null;
}

export interface AuditoriaRespuesta {
  items: AuditoriaItem[];
  total: number;
  limite: number;
  offset: number;
}

export interface SesionActiva {
  id: string;
  idCorta: string;
  expiraEn: string;
  creadaEn: string;
  ip: string | null;
  userAgent: string | null;
  idUsuario: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
}

export interface ConfiguracionItem {
  clave: string;
  valor: string;
  actualizadoEn: string;
}

export interface UsuarioPayload {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  rol: Rol;
  idSucursal: number | null;
  activo?: boolean;
}
