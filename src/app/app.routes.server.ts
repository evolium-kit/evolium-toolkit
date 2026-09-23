import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Nota: não declarar aqui uma entrada para '_evo/theme'. O Theme Studio só
  // regista a sua rota em desenvolvimento, e o build de produção rejeita uma
  // rota de servidor que não exista na configuração do Router.
  // Só faz sentido acrescentá-la se o Studio for activado em produção com
  // provideEvoThemeStudio({ onlyInDevMode: false }).
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
