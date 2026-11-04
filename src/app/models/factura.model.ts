export type EstadoFactura = 'Pendiente' | 'Activo' | 'Atrasado';

export interface Factura {
  nroFactura: number;
  fechaFactura: string;
  idCliente: number;
  idSucursal: number;
  importe: number;
  iva: number;
  estado: EstadoFactura;
}

/** Fila del listado paginado de facturas con datos de cliente y sucursal. */
export interface FacturaListadoItem extends Factura {
  clienteNombre: string;
  clienteApellido: string;
  clienteDni: number;
  sucursalNombre: string;
  sucursalCiudad: string;
}

export interface FacturaListado {
  items: FacturaListadoItem[];
  total: number;
  limite: number;
  offset: number;
}

export interface FacturaFiltros {
  limite?: number;
  offset?: number;
  q?: string;
  estado?: EstadoFactura | '';
  idSucursal?: number | null;
  desde?: string;
  hasta?: string;
}

export interface FacturaPayload {
  fechaFactura: string;
  idCliente: number;
  idSucursal: number;
  importe: number;
  estado: EstadoFactura;
  nroFactura?: number;
}
