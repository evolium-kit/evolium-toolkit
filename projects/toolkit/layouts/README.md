# @evolium-kit/toolkit/layouts

Shells de aplicação. Um layout define a moldura — barra de topo, navegação,
áreas de conteúdo — e nada sabe sobre as páginas que o preenchem.

O acoplamento é sempre por `ng-content`, nunca por `@Input` com dados de negócio.
Uma página não sabe em que shell está montada, e um shell não sabe que página
está lá dentro.

---

## Parte 1 — Usar

### Layouts disponíveis

| Layout              | Selector              | Para                                                   |
| ------------------- | --------------------- | ------------------------------------------------------ |
| `EvoAuthShell`      | `evo-auth-shell`      | login, registo, recuperação de senha — cartão centrado |
| `EvoDashboardShell` | `evo-dashboard-shell` | aplicação autenticada — sidebar + topbar               |
| `EvoBlankShell`     | `evo-blank-shell`     | páginas públicas, landings, erros                      |

### Exemplo: shell de dashboard

```ts
import { Component, signal } from '@angular/core';
import { EvoDashboardShell, EvoNavItem } from '@evolium-kit/toolkit/layouts';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [EvoDashboardShell, RouterOutlet],
  template: `
    <evo-dashboard-shell [nav]="nav()" [collapsible]="true">
      <span slot="brand">Evolium</span>

      <div slot="topbar-end">
        <button evoButton variant="ghost" (click)="sair()">Sair</button>
      </div>

      <router-outlet />

      <footer slot="footer">© 2026 Evolium</footer>
    </evo-dashboard-shell>
  `,
})
export class App {
  protected readonly nav = signal<readonly EvoNavItem[]>([
    { label: 'Início', route: '/painel', icon: 'home' },
    {
      label: 'Facturação',
      icon: 'receipt',
      children: [
        { label: 'Facturas', route: '/facturas' },
        { label: 'Clientes', route: '/clientes' },
      ],
    },
    { label: 'Definições', route: '/definicoes', icon: 'settings', roles: ['admin'] },
  ]);
}
```

Itens com `roles` só aparecem se o utilizador autenticado tiver um desses papéis.
A filtragem é feita pelo shell, lendo o resource `auth` quando existe.

### Exemplo: shell de autenticação

```ts
@Component({
  imports: [EvoAuthShell],
  template: `
    <evo-auth-shell>
      <h1 slot="title">Entrar</h1>
      <p slot="subtitle">Acede à tua conta Evolium.</p>
      <form>…</form>
      <a slot="footer" routerLink="/registar">Criar conta</a>
    </evo-auth-shell>
  `,
})
export class LoginPage {}
```

---

## Parte 2 — Criar ou modificar um layout

### Gerador

```bash
ng g @evolium-kit/toolkit:layout <nome> --dry-run
ng g @evolium-kit/toolkit:layout <nome>
```

### Ficheiros

```
layouts/src/lib/<nome>/
├── evo-<nome>-shell.ts
├── <nome>-shell.html
├── <nome>-shell.css
├── evo-<nome>-shell.spec.ts
└── index.ts
```

### Contrato

- Classe `Evo<Nome>Shell`, selector `evo-<nome>-shell`, `OnPush`.
- **Slots por `ng-content` com selector de atributo**, nunca inputs de conteúdo:

```html
<header class="evo-shell__topbar">
  <ng-content select="[slot=brand]" />
  <ng-content select="[slot=topbar-end]" />
</header>

<main class="evo-shell__content">
  <ng-content />
  <!-- slot por omissão, sempre o último -->
</main>

<footer><ng-content select="[slot=footer]" /></footer>
```

- Inputs só para **configuração**, nunca para dados de negócio: `nav`,
  `collapsible`, `sidebarState`. Nada de `user` ou `facturas`.
- Estado de colapso exposto por `model()`, para permitir two-way binding e
  controlo externo.
- Zero medidas literais no CSS: `var(--evo-shell-sidebar-width, 16rem)`,
  `var(--evo-space-md)`.

### Responsividade

Cada shell declara os seus pontos de corte em CSS, nunca por `matchMedia` em TS
(que não funciona no servidor e força uma segunda renderização):

| Largura     | Comportamento esperado               |
| ----------- | ------------------------------------ |
| ≥ 1280px    | sidebar expandida                    |
| 1024–1280px | sidebar colapsada em ícones          |
| < 1024px    | sidebar em overlay, aberta por botão |

Para o overlay, usar `Overlay` + `FocusTrap` do CDK. Nunca implementar focus trap
ou scroll lock à mão.

### Acessibilidade

- `<header>`, `<nav>`, `<main>`, `<footer>` — landmarks reais, não `<div>`.
- Um `<main>` por página, com `id` alvo de um link "saltar para o conteúdo".
- O botão de colapso tem `aria-expanded` e `aria-controls`.
- Navegação por teclado na sidebar com setas, via `ListKeyManager` do CDK.
- Em overlay: foco preso, Escape fecha, e o foco regressa ao botão que abriu.

### SSR

O shell renderiza no servidor no estado **expandido** por omissão. A preferência
de colapso guardada em `localStorage` só é lida em `afterNextRender()` — ler
antes disso causa divergência de hidratação.

### Testes

- cada slot recebe e projecta conteúdo;
- `nav` filtra por `roles`;
- o toggle de colapso emite pelo `model()`;
- em viewport estreito, o overlay prende o foco e fecha com Escape.

### Antes de dar por concluído

```bash
npm run build:lib && npm run test:lib
npx prettier --write projects/toolkit/layouts
```

E acrescentar o layout à tabela e aos exemplos da secção "Usar".
