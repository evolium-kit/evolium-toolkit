# @evolium-kit/toolkit

Toolkit Angular da Evolium: componentes temáveis, layouts, páginas prontas e um
kernel de serviços baseado em plugins.

Um projecto novo deixa de recomeçar do zero o login, o shell, os componentes de
UI e a autenticação.

```bash
npm i @evolium-kit/toolkit
ng add @evolium-kit/toolkit
```

---

## Entry points

Um único pacote, imports granulares. Só paga o que importar.

| Entry point                       | Conteúdo                                  | Documentação                                 |
| --------------------------------- | ----------------------------------------- | -------------------------------------------- |
| `@evolium-kit/toolkit/core`       | Tipos, tokens de DI, utilitários          | [core/README.md](core/README.md)             |
| `@evolium-kit/toolkit/theme`      | Design tokens, `ThemeStore`, persistência | [theme/README.md](theme/README.md)           |
| `@evolium-kit/toolkit/components` | Componentes de UI temáveis                | [components/README.md](components/README.md) |
| `@evolium-kit/toolkit/layouts`    | Shells de aplicação                       | [layouts/README.md](layouts/README.md)       |
| `@evolium-kit/toolkit/pages`      | Páginas prontas e Theme Studio            | [pages/README.md](pages/README.md)           |
| `@evolium-kit/toolkit/services`   | Kernel de plugins e plugins built-in      | [services/README.md](services/README.md)     |

Cada README tem duas metades: **Usar**, com exemplos copiáveis, e **Estender**,
com os requisitos exactos para acrescentar algo novo ao módulo.

## Arquitectura

As dependências só apontam para baixo. Nunca há import lateral nem para cima — é
isso que mantém o tree-shaking e evita ciclos entre entry points.

```
pages    ─────┐
layouts  ─────┼──> components ──> theme ──> core
services ─────┘                              ^
                  (services depende só de core)
```

## Exemplo mínimo

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    ...(isDevMode() ? [provideEvoThemeStudio()] : []), // antes do provideRouter
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([evoDispatchInterceptor])),
    provideEvoTheme(withDarkMode(), withPersistence()),
    provideEvoServices(withBaseUrl('/api'), withPlugin(authPlugin())),
  ],
};
```

```ts
// uma página
@Component({
  imports: [EvoAuthShell, EvoButton],
  template: `
    <evo-auth-shell>
      <h1 slot="title">Entrar</h1>
      <button evoButton [loading]="aEntrar()" (click)="entrar()">Entrar</button>
    </evo-auth-shell>
  `,
})
export class LoginPage {
  private readonly auth = inject(EvoAuth);
  protected readonly aEntrar = signal(false);
}
```

## Personalização

O mesmo componente pode ser re-estilizado em quatro alcances distintos, sem fork
e sem `::ng-deep`:

```html
<button evoButton>Padrão da toolkit</button>
<button evoButton variant="ghost">Variante nomeada</button>
<button evoButton [evoTokens]="{ 'button-bg': '#0d9488' }">Só esta instância</button>

<section [evoTokens]="{ 'color-primary': '#7c3aed' }">
  <button evoButton>Toda esta subárvore</button>
</section>
```

```css
/* src/styles.css — toda a aplicação */
:root {
  --evo-button-radius: 9999px;
}
```

O **Theme Studio** (`/_evo/theme` em dev) faz isto por interface gráfica, e
exporta um `evolium-theme.css` para committar no projecto.

## Requisitos

- Angular 21.2+
- `@angular/cdk` 21.2+ (peer)
- Node 20.19+ / 22.12+ / 24+

SSR, zoneless e standalone são suportados de origem — e é assim que a própria
toolkit é desenvolvida.

## Contribuir

Ver o README do módulo em causa. Regra transversal: **nada está pronto sem
entrada no README do seu módulo**, a par de build e testes verdes.

```bash
npm run build:lib
npm run test:lib
```
