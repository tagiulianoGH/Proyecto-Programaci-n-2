import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { VentaService } from '../services';

type TipoGrafico = 'lineas' | 'barras' | 'apiladas';

interface SucursalResumen {
  idSucursal: number;
  nombre: string;
  color: string;
}

interface ValorMatriz {
  total: number;
  cantidad: number;
}

interface FilaMatriz {
  mes: number;
  nombreMes: string;
  valores: ValorMatriz[];
  totalMes: number;
}

interface PuntoLinea {
  cx: number;
  cy: number;
  valor: number;
  texto: string;
}

interface SerieLinea extends SucursalResumen {
  puntos: string;
  circulos: PuntoLinea[];
}

interface Barra {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  valor: number;
  texto: string;
}

interface BarraApilada {
  segmentos: Barra[];
}

interface EtiquetaMes {
  nombre: string;
  x: number;
}

interface TickEje {
  valor: number;
  y: number;
}

/* Geometría compartida por los tres gráficos (viewBox 800 x 400). */
const ANCHO = 800;
const ALTO = 400;
const MARGEN_SUPERIOR = 25;
const MARGEN_DERECHO = 30;
const MARGEN_INFERIOR = 40;
const MARGEN_IZQUIERDO = 55;
const AREA_ANCHO = ANCHO - MARGEN_IZQUIERDO - MARGEN_DERECHO;
const AREA_ALTO = ALTO - MARGEN_SUPERIOR - MARGEN_INFERIOR;

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/* Paleta tomada del diseño de referencia. */
const COLORES = [
  '#4e79a7',
  '#f28e2b',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#b07aa1',
  '#edc948',
  '#ff9da7',
  '#9c755f',
  '#bab0ac',
];

const TITULOS_GRAFICO: Record<TipoGrafico, string> = {
  lineas: 'Gráfico de Líneas',
  barras: 'Gráfico de Barras',
  apiladas: 'Gráfico de Barras Apiladas',
};

@Component({
  selector: 'app-ventas',
  imports: [CurrencyPipe],
  templateUrl: './ventas.html',
  styleUrl: './ventas.css',
})
export class Ventas implements OnInit {
  private readonly ventaService = inject(VentaService);

  readonly ventas = this.ventaService.ventas;
  readonly cargando = signal(true);
  readonly tipoGrafico = signal<TipoGrafico>('lineas');

  readonly tituloGrafico = computed(() => TITULOS_GRAFICO[this.tipoGrafico()]);

  /** Facturas y total vendido (con IVA) de todo el período. */
  readonly resumen = computed(() => {
    const ventas = this.ventas();
    return {
      facturas: ventas.reduce((total, venta) => total + venta.cantidadFacturas, 0),
      totalConIva: ventas.reduce((total, venta) => total + venta.totalConIva, 0),
    };
  });

  /** Sucursales con ventas, identificadas por el nombre de su ciudad. */
  readonly sucursales = computed<SucursalResumen[]>(() => {
    const mapa = new Map<number, string>();
    for (const venta of this.ventas()) {
      mapa.set(venta.idSucursal, venta.sucursal);
    }

    return [...mapa.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([idSucursal, nombre], indice) => ({
        idSucursal,
        nombre,
        color: COLORES[indice % COLORES.length],
      }));
  });

  /** Matriz de 12 meses por sucursal con el total vendido (con IVA). */
  readonly filas = computed<FilaMatriz[]>(() => {
    const ventas = this.ventas();
    const sucursales = this.sucursales();

    return MESES.map((nombreMes, indice) => {
      const mes = indice + 1;
      const valores = sucursales.map((sucursal) => {
        const venta = ventas.find((v) => v.mes === mes && v.idSucursal === sucursal.idSucursal);
        return {
          total: venta?.totalConIva ?? 0,
          cantidad: venta?.cantidadFacturas ?? 0,
        };
      });

      return {
        mes,
        nombreMes,
        valores,
        totalMes: valores.reduce((total, valor) => total + valor.total, 0),
      };
    });
  });

  readonly totalesPorSucursal = computed<number[]>(() => {
    const filas = this.filas();
    return this.sucursales().map((_, indice) =>
      filas.reduce((total, fila) => total + fila.valores[indice].total, 0)
    );
  });

  readonly granTotal = computed(() =>
    this.filas().reduce((total, fila) => total + fila.totalMes, 0)
  );

  /** Máximo total vendido por una sucursal en un mes (escala de líneas y barras). */
  readonly maxVentaSucursal = computed(() =>
    Math.max(1, ...this.filas().flatMap((fila) => fila.valores.map((valor) => valor.total)))
  );

  /** Máximo total vendido en un mes (escala de barras apiladas). */
  readonly maxTotalMes = computed(() =>
    Math.max(1, ...this.filas().map((fila) => fila.totalMes))
  );

  readonly ticks = computed<TickEje[]>(() => {
    const max = this.tipoGrafico() === 'apiladas' ? this.maxTotalMes() : this.maxVentaSucursal();

    return Array.from({ length: 6 }, (_, indice) => {
      const valor = (max / 5) * indice;
      return {
        valor,
        y: MARGEN_SUPERIOR + AREA_ALTO - (valor / max) * AREA_ALTO,
      };
    });
  });

  readonly etiquetasMeses = computed<EtiquetaMes[]>(() => {
    const grupo = AREA_ANCHO / MESES.length;

    return MESES.map((nombre, indice) => ({
      nombre,
      x:
        this.tipoGrafico() === 'lineas'
          ? MARGEN_IZQUIERDO + (indice / (MESES.length - 1)) * AREA_ANCHO
          : MARGEN_IZQUIERDO + indice * grupo + grupo / 2,
    }));
  });

  /** Una polilínea por sucursal con el total vendido en cada mes. */
  readonly seriesLineas = computed<SerieLinea[]>(() => {
    const filas = this.filas();
    const max = this.maxVentaSucursal();

    return this.sucursales().map((sucursal, indiceSucursal) => {
      const circulos = filas.map((fila, indiceMes) => {
        const valor = fila.valores[indiceSucursal].total;
        return {
          cx: MARGEN_IZQUIERDO + (indiceMes / (filas.length - 1)) * AREA_ANCHO,
          cy: MARGEN_SUPERIOR + AREA_ALTO - (valor / max) * AREA_ALTO,
          valor,
          texto: `${sucursal.nombre} - ${fila.nombreMes}`,
        };
      });

      return {
        ...sucursal,
        puntos: circulos.map((punto) => `${punto.cx.toFixed(2)},${punto.cy.toFixed(2)}`).join(' '),
        circulos,
      };
    });
  });

  /** Barras agrupadas: una barra por sucursal dentro de cada mes. */
  readonly barrasAgrupadas = computed<Barra[]>(() => {
    const filas = this.filas();
    const sucursales = this.sucursales();
    const max = this.maxVentaSucursal();
    const grupo = AREA_ANCHO / filas.length;
    const anchoBarra = grupo / Math.max(sucursales.length, 1);
    const barras: Barra[] = [];

    filas.forEach((fila, indiceMes) => {
      fila.valores.forEach((valor, indiceSucursal) => {
        const altura = (valor.total / max) * AREA_ALTO;
        barras.push({
          x: MARGEN_IZQUIERDO + indiceMes * grupo + indiceSucursal * anchoBarra,
          y: MARGEN_SUPERIOR + AREA_ALTO - altura,
          width: Math.max(anchoBarra - 1, 0),
          height: altura,
          color: sucursales[indiceSucursal].color,
          valor: valor.total,
          texto: `${sucursales[indiceSucursal].nombre} - ${fila.nombreMes}`,
        });
      });
    });

    return barras;
  });

  /** Barras apiladas: total del mes segmentado por sucursal. */
  readonly barrasApiladas = computed<BarraApilada[]>(() => {
    const filas = this.filas();
    const sucursales = this.sucursales();
    const max = this.maxTotalMes();
    const grupo = AREA_ANCHO / filas.length;
    const anchoBarra = grupo * 0.7;
    const separacion = grupo * 0.3;

    return filas.map((fila, indiceMes) => {
      let acumulado = 0;

      const segmentos = fila.valores.map((valor, indiceSucursal) => {
        const altura = (valor.total / max) * AREA_ALTO;
        const segmento: Barra = {
          x: MARGEN_IZQUIERDO + indiceMes * grupo + separacion / 2,
          y: MARGEN_SUPERIOR + AREA_ALTO - acumulado - altura,
          width: anchoBarra,
          height: altura,
          color: sucursales[indiceSucursal].color,
          valor: valor.total,
          texto: `${sucursales[indiceSucursal].nombre} - ${fila.nombreMes}`,
        };
        acumulado += altura;
        return segmento;
      });

      return { segmentos };
    });
  });

  ngOnInit(): void {
    this.ventaService.getVentasMensuales().subscribe({
      next: () => this.cargando.set(false),
      error: () => this.cargando.set(false),
    });
  }

  cambiarGrafico(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value as TipoGrafico;
    this.tipoGrafico.set(valor);
  }

  /** Formato compacto para las etiquetas del eje Y (ej: 500k, 1.2M). */
  formatearEje(valor: number): string {
    if (valor >= 950_000) {
      return `${(valor / 1_000_000).toFixed(1)}M`;
    }
    if (valor >= 1_000) {
      return `${Math.round(valor / 1_000)}k`;
    }
    return `${Math.round(valor)}`;
  }
}
