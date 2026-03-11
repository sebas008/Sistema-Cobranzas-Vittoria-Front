import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { EspecialidadesPage } from './pages/especialidades/especialidades.page';
import { ProveedoresPage } from './pages/proveedores/proveedores.page';
import { MaterialesPage } from './pages/materiales/materiales.page';
import { ProyectosPage } from './pages/proyectos/proyectos.page';
import { UsuariosPage } from './pages/usuarios/usuarios.page';
import { RequerimientosPage } from './pages/requerimientos/requerimientos.page';
import { OrdenesCompraPage } from './pages/ordenes-compra/ordenes-compra.page';
import { ComprasPage } from './pages/compras/compras.page';
import { KardexPage } from './pages/kardex/kardex.page';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPage },
  { path: 'especialidades', component: EspecialidadesPage },
  { path: 'proveedores', component: ProveedoresPage },
  { path: 'materiales', component: MaterialesPage },
  { path: 'proyectos', component: ProyectosPage },
  { path: 'usuarios', component: UsuariosPage },
  { path: 'requerimientos', component: RequerimientosPage },
  { path: 'ordenes-compra', component: OrdenesCompraPage },
  { path: 'compras', component: ComprasPage },
  { path: 'kardex', component: KardexPage },
  { path: '**', redirectTo: 'dashboard' }
];
