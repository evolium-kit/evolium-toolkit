# @evolium-kit/toolkit/pages

Páginas prontas a usar, e o Theme Studio.

Uma página **compõe** componentes e layouts existentes e consome dados através de
resources do kernel. Nunca injecta `HttpClient` directamente, e nunca define
componentes atómicos próprios.

---

## Parte 1 — Usar

### Páginas disponíveis

| Página          | Classe                  | Rota              | Estado         |
| --------------- | ----------------------- | ----------------- | -------------- |
| Theme Studio    | `EvoThemeStudioPage`    | `/_evo/theme`     | **disponível** |
| Login           | `EvoLoginPage`          | `/auth/login`     | planeada       |
| Registo         | `EvoRegisterPage`       | `/auth/registar`  | planeada       |
| Recuperar senha | `EvoForgotPasswordPage` | `/auth/recuperar` | planeada       |
| Dashboard       | `EvoDashboardPage`      | `/painel`         | planeada       |
| Não encontrado  | `EvoNotFoundPage`       | `**`              | planeada       |

As páginas planeadas dependem do kernel de serviços e dos layouts, ainda por
implementar.

### Registar as rotas

```ts
// app.routes.ts
export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('@evolium-kit/toolkit/pages').then((m) => m.EvoLoginPage),
  },
  {
    path: 'auth/registar',
    loadComponent: () => import('@evolium-kit/toolkit/pages').then((m) => m.EvoRegisterPage),
  },
  {
    path: 'painel',
    canActivate: [evoAuthGuard],
    loadComponent: () => import('@evolium-kit/toolkit/pages').then((m) => m.EvoDashboardPage),
  },
];
```

### Adaptar textos e destinos

Cada página pronta aceita inputs de configuração, para não ser preciso um fork
só para mudar uma frase:

```ts
{
  path: 'auth/login',
  loadComponent: () => import('@evolium-kit/toolkit/pages').then((m) => m.EvoLoginPage),
  data: {
    copy: {
      title: 'Bem-vindo de volta',
      submit: 'Entrar na conta',
      forgotLink: 'Esqueceste-te da senha?',
    },
    redirectTo: '/painel',
  },
}
```

### Theme Studio

```ts
import { provideEvoThemeStudio } from '@evolium-kit/toolkit/pages';

// app.config.ts — ANTES do provideRouter (ver theme/README.md)
...(isDevMode() ? [provideEvoThemeStudio({ path: '_evo/theme' })] : []),
```

Interface em três zonas, com ambos os painéis laterais colapsáveis:

```
┌──────────────────────────────────────────────────────────────────────┐
│ [☰] Evolium Theme Studio   [ 🔍 pesquisar componente…  ]   [☀/🌙] [⇩] │
├───────────────┬──────────────────────────────────┬───────────────────┤
│ COMPONENTES   │                                  │ PROPRIEDADES      │
│ ▸ Básicos     │        ┌──────────────┐          │ Variante  [solid▾]│
│   Button   ●  │        │   Preview    │          │ Cor de fundo      │
│   Input       │        └──────────────┘          │ [■] #2563eb       │
│ ▸ Superfícies │   default/hover/focus/disabled   │ Raio  [───●──] 6px│
│   Card        │                                  │ ─────────────────│
│               │   [ Global ○ ── ● Variante ]     │ [Repor][Exportar] │
└───────────────┴──────────────────────────────────┴───────────────────┘
```

O selector **Global ⇄ Variante** no centro é o que decide o alcance da edição:
em _Global_ escreve em `:root` e afecta todas as instâncias da aplicação; em
_Variante_ escreve só no selector da variante escolhida. O botão _Variante_ só
fica activo depois de escolher uma.

O painel direito é **gerado a partir dos metadados** de cada componente
(`<nome>.tokens.ts`), nunca escrito à mão — um componente novo aparece no Studio
assim que registar os seus metadados com `provideEvoComponents()` ou
`provideEvoComponentMeta()`.

Detalhes que valem a pena saber:

- A pesquisa filtra por nome, `id` e **tags** dos metadados.
- Um token por definir mostra a etiqueta `HERDADO` e o valor de que herda,
  resolvido do store ou, em último recurso, da folha de estilos estática.
- O ponto **•** ao lado de um componente na lista assinala alterações por gravar.
- O estado dos painéis fica em `localStorage`, por browser. É preferência de
  interface e **não** faz parte do tema, por isso não entra no ficheiro exportado.

### A interface do Studio é imune ao tema que edita

O Studio tem tokens próprios (`--st-*`) com valores fixos, e os seus botões não
são `EvoButton`. A razão é prática: o Studio é construído com os mesmos
componentes que edita, e sem este isolamento bastaria pôr o primário igual ao
fundo para a ferramenta desaparecer — sem forma de reverter a não ser limpar o
`localStorage` à mão. Só o palco central mostra o tema a sério.

Quem acrescentar interface ao Studio deve usar `--st-*` e as classes `.st__*`,
nunca `--evo-*` nem componentes da toolkit.

---

## Parte 2 — Acrescentar uma página

### Ordem de preferência, sem excepção

1. Componente já existente em `@evolium-kit/toolkit/components` → usar.
2. Primitiva do `@angular/cdk` → usar.
3. Falta mesmo um componente → **parar e criá-lo primeiro** em `/components`.
   Não escrever componentes atómicos dentro de uma página.

### Gerador

```bash
ng g @evolium-kit/toolkit:page <nome> --layout auth --dry-run
ng g @evolium-kit/toolkit:page <nome> --layout auth
```

### Ficheiros

```
pages/src/lib/<nome>/
├── evo-<nome>.page.ts
├── <nome>.page.html
├── <nome>.page.css
├── evo-<nome>.page.spec.ts
└── index.ts
```

### Contrato

- Classe `Evo<Nome>Page`, `OnPush`, standalone.
- Montada dentro de um shell de `@evolium-kit/toolkit/layouts`.
- **Dados só via resources:** `inject(EvoAuth)` ou
  `inject(EvoResourceRegistry).get('<nome>')`. Zero `HttpClient` numa página.
- Formulários reactivos **tipados**, com `NonNullableFormBuilder`:

```ts
private readonly fb = inject(NonNullableFormBuilder);

protected readonly form = this.fb.group({
  email: this.fb.control('', [Validators.required, Validators.email]),
  password: this.fb.control('', [Validators.required, Validators.minLength(8)]),
});
```

- Textos configuráveis por `EvoPageCopy`, com omissões em português de Angola.

### Os quatro estados — critério de aceitação

Uma página que não trate os quatro **não está pronta**:

```html
@switch (estado()) { @case ('loading') { <evo-spinner aria-label="A carregar" /> } @case ('empty') {
<evo-empty-state [title]="copy.emptyTitle" /> } @case ('error') {
<evo-alert tone="danger" role="alert">
  {{ erro()?.message }}
  <button evoButton variant="ghost" (click)="recarregar()">Tentar de novo</button>
</evo-alert>
} @default {
<!-- conteúdo -->
} }
```

Uma página sem estado de erro visível é uma página que falha em silêncio.

### Acessibilidade

- Exactamente um `<h1>` por página.
- Cada input com `<label for>` real — `placeholder` não é label.
- Erros de validação ligados por `aria-describedby`, com `aria-invalid` no campo.
- Na submissão com erros, o foco move-se para o primeiro campo inválido.
- Mensagens de erro do servidor num `role="alert"`.

### SSR

Dados iniciais por `resource()` / `httpResource()`, para aproveitar o transfer
cache da hidratação e evitar um segundo pedido no cliente. Nada de `window` fora
de `afterNextRender()`.

Uma página com dados dinâmicos precisa de `RenderMode.Server` (ou
`getPrerenderParams`) em `app.routes.server.ts` — o `'**' → Prerender` por
omissão do CLI falha assim que houver parâmetros de rota.

### Testes

- os quatro estados renderizam o que devem;
- validação do formulário e estado desactivado do botão de submissão;
- caminho feliz chama o método certo do resource (com resource em mock);
- um erro do resource mostra a mensagem e mantém o formulário preenchido.

### Antes de dar por concluído

```bash
npm run build:lib && npm run test:lib
npx prettier --write projects/toolkit/pages
```

E acrescentar a página à tabela da secção "Usar", com a rota e o resource que consome.
