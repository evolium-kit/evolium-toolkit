import { Routes } from '@angular/router';
import { evoAuthRoutes } from '@evolium-kit/toolkit/pages';
import { evoAuthGuard } from '@evolium-kit/toolkit/services';

export const routes: Routes = [
  {
    path: '',
    title: 'Evolium Toolkit — playground',
    loadComponent: () => import('./playground/playground').then((m) => m.Playground),
  },

  // Login, registo e recuperação de senha, fornecidos pela toolkit.
  // Requerem withComponentInputBinding() no provideRouter.
  ...evoAuthRoutes({ redirectTo: '/painel' }),

  {
    path: 'painel',
    canActivate: [evoAuthGuard],
    loadComponent: () => import('./painel/painel-shell').then((m) => m.PainelShell),
    children: [
      {
        path: '',
        title: 'Facturação',
        loadComponent: () => import('./painel/painel').then((m) => m.Painel),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () => import('@evolium-kit/toolkit/pages').then((m) => m.EvoNotFoundPage),
  },
];
