import { Routes } from '@angular/router';

/** Exemplo de configuração de rotas do fluxo Rota (ver README, seção "Guia passo a passo"). */
export const UsuarioRoutes: Routes = [
  { path: '', loadComponent: () => import('./usuarios-list.component').then((c) => c.UsuariosListComponent) },
  { path: 'novo', loadComponent: () => import('./usuario-page.component').then((c) => c.UsuarioPageComponent) },
  { path: ':id/editar', loadComponent: () => import('./usuario-page.component').then((c) => c.UsuarioPageComponent) },
];
