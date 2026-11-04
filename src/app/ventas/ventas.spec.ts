import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VentaMensual } from '../models';
import { VentaService } from '../services';
import { Ventas } from './ventas';

const VENTAS: VentaMensual[] = [
  {
    anio: 2026,
    mes: 1,
    idSucursal: 1,
    sucursal: 'Santa Fe',
    cantidadFacturas: 65,
    totalConIva: 1_000_000,
  },
  {
    anio: 2026,
    mes: 1,
    idSucursal: 2,
    sucursal: 'Rafaela',
    cantidadFacturas: 48,
    totalConIva: 2_000_000,
  },
];

class VentaServiceStub {
  readonly ventas = signal<VentaMensual[]>(VENTAS);

  getVentasMensuales() {
    return of(VENTAS);
  }
}

describe('Ventas', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ventas],
      providers: [{ provide: VentaService, useClass: VentaServiceStub }],
    }).compileComponents();
  });

  function crearComponente() {
    const fixture = TestBed.createComponent(Ventas);
    fixture.detectChanges();
    return fixture;
  }

  function cambiarGrafico(fixture: ReturnType<typeof crearComponente>, tipo: string) {
    const select = fixture.nativeElement.querySelector('#tipo-grafico') as HTMLSelectElement;
    select.value = tipo;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('muestra las sucursales por nombre de ciudad', () => {
    const fixture = crearComponente();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Santa Fe');
    expect(texto).toContain('Rafaela');
    expect(texto).not.toContain('Sucursal Norte');
  });

  it('no muestra IVA desglosado ni promedios', () => {
    const fixture = crearComponente();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).not.toContain('IVA recaudado');
    expect(texto).not.toContain('Total neto');
    expect(texto).not.toContain('Promedio');
  });

  it('dibuja el gráfico de líneas con un punto por sucursal y mes', () => {
    const fixture = crearComponente();

    expect(fixture.nativeElement.querySelectorAll('polyline').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('circle').length).toBe(24);
  });

  it('dibuja barras agrupadas al cambiar el tipo de gráfico', () => {
    const fixture = crearComponente();
    cambiarGrafico(fixture, 'barras');

    expect(fixture.nativeElement.querySelectorAll('rect').length).toBe(24);
    expect(fixture.nativeElement.querySelectorAll('circle').length).toBe(0);
  });

  it('dibuja barras apiladas al cambiar el tipo de gráfico', () => {
    const fixture = crearComponente();
    cambiarGrafico(fixture, 'apiladas');

    expect(fixture.nativeElement.querySelectorAll('rect').length).toBe(24);
  });
});
