export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  situacionFiscal:
    | 'Responsable Inscripto'
    | 'Monotributista'
    | 'Exento'
    | 'Consumidor final'
    | 'No categorizado';
  dni: number;
}
