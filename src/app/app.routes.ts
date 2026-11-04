import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Ventas } from './ventas/ventas';
import { Facturas } from './facturas/facturas';
import { Sucursales } from './sucursales/sucursales';
import { Clientes } from './clientes/clientes';
import { Login } from './login/login';
import { SinAcceso } from './shared/sin-acceso/sin-acceso';
import { Perfil } from './perfil/perfil';
import { Usuarios } from './usuarios/usuarios';
import { Auditoria } from './auditoria/auditoria';
import { DevPanel } from './dev/dev-panel';
import { authGuard, roleGuard, maintenanceGuard, passwordChangeGuard } from './core/auth';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: 'home',
    component: Home,
    canActivate: [authGuard, maintenanceGuard, passwordChangeGuard],
  },
  {
    path: 'ventas',
    component: Ventas,
    canActivate: [authGuard, maintenanceGuard, passwordChangeGuard],
  },
  {
    path: 'facturas',
    component: Facturas,
    canActivate: [authGuard, maintenanceGuard, passwordChangeGuard],
  },
  {
    path: 'sucursales',
    component: Sucursales,
    canActivate: [authGuard, maintenanceGuard, passwordChangeGuard],
  },
  {
    path: 'clientes',
    component: Clientes,
    canActivate: [authGuard, maintenanceGuard, passwordChangeGuard],
  },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  {
    path: 'usuarios',
    component: Usuarios,
    canActivate: [authGuard, roleGuard(['admin', 'dev']), maintenanceGuard, passwordChangeGuard],
  },
  {
    path: 'auditoria',
    component: Auditoria,
    canActivate: [authGuard, roleGuard(['admin', 'dev']), maintenanceGuard, passwordChangeGuard],
  },
  {
    path: 'dev',
    component: DevPanel,
    canActivate: [authGuard, roleGuard(['dev'])],
  },
  { path: 'sin-acceso', component: SinAcceso, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
