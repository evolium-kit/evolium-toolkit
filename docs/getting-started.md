# Primeiros passos

Este guia assume que já instalaste a toolkit — se ainda não instalaste, segue
primeiro o [`INSTALL.md`](../INSTALL.md). Aqui o objectivo é dares os
primeiros passos reais: um botão, uma página, um recurso ligado à tua API.

## O essencial em cinco minutos

### 1. Um componente

```ts
import { Component } from '@angular/core';
import { EvoButton, EvoCard, EvoBadge } from '@evolium-kit/toolkit/components';

@Component({
  selector: 'app-exemplo',
  imports: [EvoButton, EvoCard, EvoBadge],
  template: `
    <evo-card>
      <h2 slot="title">Facturas</h2>
      <evo-badge tone="success">Paga</evo-badge>
      <button evoButton (click)="guardar()">Guardar</button>
    </evo-card>
  `,
})
export class Exemplo {
  guardar() {}
}
```

Todos os componentes seguem esta forma: importas a classe, usas o selector
como um elemento HTML normal, e o aspecto vem do tema activo — nunca precisas
de escrever CSS de cor, espaçamento ou tipografia à volta deles.

### 2. Uma variante, sem alterar a toolkit

```html
<button evoButton>Normal</button>
<button evoButton variant="ghost">Ghost</button>
<button evoButton variant="danger" size="sm">Eliminar</button>
```

### 3. Personalizar só uma instância

```html
<button evoButton [evoTokens]="{ 'button-bg': '#0d9488' }">Só este é verde</button>
```

Nada mais no projecto muda. Ver [`theming.md`](theming.md) para perceberes
_porque_ isto funciona sem `!important` nem `::ng-deep`.

### 4. Um layout

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EvoDashboardShell, EvoNavItem } from '@evolium-kit/toolkit/layouts';

@Component({
  selector: 'app-root',
  imports: [EvoDashboardShell, RouterOutlet],
  template: `
    <evo-dashboard-shell [nav]="nav">
      <span slot="brand">A Minha App</span>
      <router-outlet />
    </evo-dashboard-shell>
  `,
})
export class App {
  protected readonly nav: readonly EvoNavItem[] = [
    { label: 'Início', route: '/', icon: 'home' },
    { label: 'Facturas', route: '/facturas' },
  ];
}
```

### 5. Um recurso ligado à tua API

```bash
ng g @evolium-kit/toolkit:resource-plugin facturas
```

Isto gera um plugin completo — modelos, mappers, endpoints, e os testes — em
`src/app/resources/facturas/`. Regista-o:

```ts
// app.config.ts
import { provideEvoServices, withBaseUrl, withPlugin, authPlugin } from '@evolium-kit/toolkit/services';
import { facturasPlugin } from './resources/facturas/facturas.plugin';

provideEvoServices(
  withBaseUrl('/api'),
  withPlugin(authPlugin()),
  withPlugin(facturasPlugin()),
),
```

E consome-o em qualquer componente:

```ts
import { inject } from '@angular/core';
import { EvoResourceRegistry } from '@evolium-kit/toolkit/services';

export class FacturasPage {
  private readonly registry = inject(EvoResourceRegistry);
  protected readonly facturas = this.registry.get('facturas');

  constructor() {
    void this.facturas.carregar();
  }
}
```

Ver [`plugins.md`](plugins.md) para o modelo completo, incluindo porque a
autenticação em si é só mais um plugin — sem tratamento especial no kernel.

## As páginas prontas

A toolkit já traz login, registo e recuperação de senha:

```ts
// app.routes.ts
import { evoAuthRoutes } from '@evolium-kit/toolkit/pages';

export const routes: Routes = [
  ...evoAuthRoutes({ redirectTo: '/painel' }),
  { path: 'painel', canActivate: [evoAuthGuard], loadComponent: () => import('./painel/painel') },
];
```

Isto regista `/auth/login`, `/auth/registar` e `/auth/recuperar`, já ligadas
ao plugin de autenticação. Ver
[`pages/README.md`](../projects/toolkit/pages/README.md) para as opções de
cada página (textos, para onde redireccionar, etc.).

## O Theme Studio

Em desenvolvimento, abre `/_evo/theme` no browser. É uma interface visual
para experimentar tokens de tema em tempo real, sem escrever CSS — e para
exportar o resultado como um ficheiro `evolium-theme.css` que commitas no
projecto. Ver [`theming.md`](theming.md#theme-studio).

## Passo seguinte

- Precisas de mudar a paleta de cores? → [`theming.md`](theming.md)
- Vais criar um recurso novo que fale com a API? → [`plugins.md`](plugins.md)
- Queres perceber porque a toolkit está organizada em seis entry points e o
  que podes e não podes importar de onde? → [`architecture.md`](architecture.md)
- Vais contribuir um componente, uma página ou um plugin de volta para a
  toolkit? → [`contributing.md`](contributing.md)
