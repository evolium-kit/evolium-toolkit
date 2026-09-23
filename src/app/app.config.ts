import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { provideEvoComponents } from '@evolium-kit/toolkit/components';
import { provideEvoThemeStudio } from '@evolium-kit/toolkit/pages';
import {
  authPlugin,
  evoDispatchInterceptor,
  provideEvoServices,
  withBaseUrl,
  withPlugin,
} from '@evolium-kit/toolkit/services';
import {
  provideEvoTheme,
  withDarkMode,
  withPersistence,
  withTokens,
} from '@evolium-kit/toolkit/theme';

import { routes } from './app.routes';
import { demoApiInterceptor } from './demo-api.interceptor';
import { facturasPlugin } from './facturas.plugin';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    // ATENÇÃO à ordem: o Studio regista a sua rota pelo multi-provider ROUTES,
    // que é recolhido por ordem de declaração. Depois de provideRouter(), um
    // wildcard da aplicação apanharia /_evo/theme primeiro.
    ...(isDevMode() ? [provideEvoThemeStudio()] : []),
    // withComponentInputBinding é obrigatório para as páginas da toolkit:
    // é o que liga o `data` das rotas aos `input()` dos componentes.
    provideRouter(routes, withComponentInputBinding()),

    provideClientHydration(withEventReplay()),

    // A ORDEM IMPORTA. O evoDispatchInterceptor tem de vir primeiro: é ele que
    // acrescenta o Bearer e o resto da cadeia dos plugins. O mock responde sem
    // chamar next(), pelo que tudo o que estiver depois dele nunca corre —
    // pô-lo à frente faria os pedidos saírem sem autenticação.
    provideHttpClient(withFetch(), withInterceptors([evoDispatchInterceptor, demoApiInterceptor])),

    provideEvoServices(
      withBaseUrl('/demo-api'),
      withPlugin(authPlugin()),
      // Plugin escrito fora da toolkit: regista-se sem alterar o kernel.
      withPlugin(facturasPlugin()),
    ),

    provideEvoTheme(
      withTokens({
        light: { 'color-primary': '#2563eb' },
        dark: { 'color-primary': '#60a5fa' },
      }),
      withDarkMode({ initial: 'system' }),
      withPersistence(),
    ),

    // Sem isto o Theme Studio abre vazio.
    provideEvoComponents(),
  ],
};
