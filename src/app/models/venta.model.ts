/**
 * Totales mensuales de ventas por sucursal.
 * El monto incluye el IVA (21 %) que se suma al importe de cada factura.
 */
export interface VentaMensual {
  anio: number;
  mes: number;
  idSucursal: number;
  /** Nombre de la ciudad de la sucursal (Santa Fe, Rafaela, ...). */
  sucursal: string;
  cantidadFacturas: number;
  /** Importe de las facturas del mes + 21 % de IVA. */
  totalConIva: number;
}
