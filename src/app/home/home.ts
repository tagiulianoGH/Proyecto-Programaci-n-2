import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClienteService, SucursalService, VentaService } from '../services';
import { AuthService } from '../core/auth';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly sucursalService = inject(SucursalService);
  private readonly ventaService = inject(VentaService);
  protected readonly auth = inject(AuthService);

  readonly totalClientes = computed(() => this.clienteService.clientes().length);
  readonly totalSucursales = computed(() => this.sucursalService.sucursales().length);
  readonly totalFacturas = computed(() =>
    this.ventaService.ventas().reduce((total, venta) => total + venta.cantidadFacturas, 0)
  );

  ngOnInit(): void {
    this.clienteService.getClientes().subscribe();
    this.sucursalService.getSucursales().subscribe();
    this.ventaService.getVentasMensuales().subscribe();
  }
}
