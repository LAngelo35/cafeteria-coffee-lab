import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  {
    path: 'inicio',
    title: 'Inicio · Origen & Crema Coffee Lab',
    loadComponent: () =>
      import('./features/inicio/inicio.component').then((m) => m.InicioComponent),
  },
  {
    path: 'servicios',
    title: 'Servicios · Origen & Crema Coffee Lab',
    loadComponent: () =>
      import('./features/servicios/servicios.component').then((m) => m.ServiciosComponent),
  },
  {
    path: 'especialidades',
    title: 'Especialidades · Origen & Crema Coffee Lab',
    loadComponent: () =>
      import('./features/especialidades/especialidades.component').then(
        (m) => m.EspecialidadesComponent,
      ),
  },
  {
    path: 'nosotros',
    title: 'Nosotros & Tienda · Origen & Crema Coffee Lab',
    loadComponent: () =>
      import('./features/nosotros/nosotros.component').then((m) => m.NosotrosComponent),
  },
  {
    path: 'precios',
    title: 'Carta & Precios · Origen & Crema Coffee Lab',
    loadComponent: () =>
      import('./features/precios/precios.component').then((m) => m.PreciosComponent),
  },
  {
    path: 'contactos',
    title: 'Contactos · Origen & Crema Coffee Lab',
    loadComponent: () =>
      import('./features/contactos/contactos.component').then((m) => m.ContactosComponent),
  },
  { path: '**', redirectTo: 'inicio' },
];
