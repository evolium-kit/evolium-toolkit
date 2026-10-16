# @evolium-kit/toolkit/crud

CRUD de entidades sobre [TanStack Query](https://tanstack.com/query): listar,
criar, actualizar e apagar com cache e revalidação, formulários de
criar/editar em modal ou numa rota, confirmação antes de apagar, erros da
API ligados aos campos do formulário, e hooks para avisos, soft-delete e
invalidação de outras listas.

Os pedidos passam pelo kernel de `/services` (`crudPlugin()`), por isso levam
o `withBaseUrl()`, o Bearer do `authPlugin()` e os outros
`sharedInterceptors`, e falham sempre com `EvoError`.

```
injectCrudController ──► injectCrudResource ──► crudPlugin (kernel /services)
   │ abre o form            │ TanStack Query        │ baseUrl, Bearer, EvoError
   │ (EvoModalService        │ items/meta/loading    │ hooks globais
   │  ou Router)             │ create/update/remove  │
   ▼                         ▼
injectCrudForm           injectCrudPage
 (dentro do form)         (página de rota /:id)
```

| Função                   | Para quê                                                                       |
| ------------------------ | ------------------------------------------------------------------------------ |
| `injectCrudResource()`   | dados e escritas de uma entidade (lista, `one()`, `create`/`update`/`remove`)  |
| `injectCrudController()` | o resource + abrir o formulário (modal ou rota) + apagar com confirmação       |
| `injectCrudForm()`       | dentro do componente do formulário: modo, item inicial, erros da API, `submit` |
| `injectCrudPage()`       | numa página de rota `/:id/editar`: id, modo e o registo                        |

---

## Importar

`@tanstack/angular-query-experimental` é uma dependência opcional da toolkit:
só quem usa este entry point a instala.

```bash
npm i @tanstack/angular-query-experimental
```

```ts
// app.config.ts
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import {
  provideEvoServices,
  withBaseUrl,
  withPlugin,
  authPlugin,
} from '@evolium-kit/toolkit/services';
import { crudPlugin, crudToasts } from '@evolium-kit/toolkit/crud';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // só se algum formulário abrir numa rota
    provideTanStackQuery(new QueryClient()),
    provideEvoServices(
      withBaseUrl('/api'),
      withPlugin(authPlugin()),
      withPlugin(crudPlugin(), { hooks: [() => crudToasts()] }),
    ),
  ],
};
```

Sem `provideTanStackQuery()` ou sem `withPlugin(crudPlugin())`, a primeira
chamada a `injectCrudResource()` lança um erro que diz o que falta.

As funções `injectCrud*` chamam `inject()`: usá-las num campo de classe ou no
construtor.

---

## API

### `injectCrudResource<T, D>(config)` → `EvoCrudResource<T, D>`

`T` é a entidade, `D` o DTO de escrita (por omissão `Partial<T>`).

**Configuração (`EvoCrudResourceConfig`)**

| Opção      | Tipo                              | Omissão            | Descrição                                                                                                                                                         |
| ---------- | --------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`     | `string`                          | —                  | Caminho base (`'/usuarios'`). Dá os URLs por omissão e a `queryKey` (`[path, 'list']`).                                                                           |
| `idKey`    | `keyof T`                         | `'id'`             | Campo identificador.                                                                                                                                              |
| `urls`     | `Partial<EvoCrudUrls>`            | `path`, `path/:id` | Sobrepõe `list`, `one`, `create`, `update`, `remove` individualmente.                                                                                             |
| `strategy` | `'cache-only' \| 'fetch-on-miss'` | `'cache-only'`     | Como `one()` resolve um registo que não está na lista.                                                                                                            |
| `response` | `string \| EvoCrudListAdapter<T>` | auto               | Como desembrulhar a lista: auto (array, `.data`, `.items`, `.results`, `.data.data`, `.data.items`, meta em `.meta`), um caminho (`'result.rows'`) ou uma função. |
| `enabled`  | `boolean \| () => boolean`        | `true`             | Se a lista carrega sozinha. Aceita um signal.                                                                                                                     |
| `ssr`      | `boolean`                         | `false`            | Pedir também no render do servidor (sem transferência de estado, o pedido repetia-se no browser).                                                                 |
| `hooks`    | `readonly EvoCrudHooks<T, D>[]`   | `[]`               | Hooks só deste resource, depois dos globais.                                                                                                                      |

**O que devolve**

| Membro                               | Tipo                              | Descrição                                                        |
| ------------------------------------ | --------------------------------- | ---------------------------------------------------------------- |
| `items`                              | `Signal<readonly T[]>`            | Itens da lista, desembrulhados e passados pelo `afterList`.      |
| `meta`                               | `Signal<EvoCrudListMeta \| null>` | Meta da resposta (paginação, totais), mesmo vindo da cache.      |
| `loading`                            | `Signal<boolean>`                 | Primeiro carregamento.                                           |
| `fetching`                           | `Signal<boolean>`                 | Qualquer pedido da lista em curso, incluindo revalidações.       |
| `error`                              | `Signal<EvoError \| null>`        | Erro da lista.                                                   |
| `creating` / `updating` / `removing` | `Signal<boolean>`                 | Escrita em curso.                                                |
| `refresh()`                          | `Promise<void>`                   | Volta a pedir a lista.                                           |
| `create(dto, options?)`              | `Promise<T>`                      | `POST urls.create()`. Rejeita com `EvoError`.                    |
| `update(id, dto, options?)`          | `Promise<T>`                      | `PUT urls.update(id)`.                                           |
| `remove(id, options?)`               | `Promise<boolean>`                | `DELETE urls.remove(id)`; `false` se um `beforeRemove` cancelou. |
| `peek(id)`                           | `T \| undefined`                  | Procura na lista carregada, sem pedidos.                         |
| `one(() => id)`                      | `EvoCrudOne<T>`                   | `{ item, loading }`, reactivo ao id, segundo a `strategy`.       |
| `idOf(item)`                         | `EvoCrudId`                       | O id de um item pelo `idKey`.                                    |
| `path`, `idKey`, `urls`              | —                                 | A configuração resolvida.                                        |

Depois de cada escrita a lista revalida-se, e os hooks `after*` só correm com
o pedido **e** a revalidação terminados. Os ids comparam-se por texto: `'5'`
(da rota) encontra `5` (da API).

### `injectCrudController<T, D>(config)` → `EvoCrudController<T, D>`

Aceita tudo o que o `injectCrudResource()` aceita, mais:

| Opção           | Tipo                                                                | Omissão       | Descrição                                                                                                         |
| --------------- | ------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `form`          | `Type<unknown>`                                                     | —             | Componente standalone do formulário (usa `injectCrudForm()`).                                                     |
| `titles`        | `{ create?: string; update?: string }`                              | —             | Títulos do modal.                                                                                                 |
| `display`       | `{ create?, update?: 'modal' \| 'route' \| EvoCrudDisplay; size? }` | modal, `'xl'` | Onde abre cada formulário. `'route'` exige `routePath(id?)` e `provideRouter()` — validado ao criar o controller. |
| `confirmRemove` | `boolean \| (item: T) => string`                                    | `true`        | Confirmar antes de apagar; uma função dá a mensagem.                                                              |

| Membro           | Descrição                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `resource`       | O `EvoCrudResource` criado.                                                               |
| `openCreate()`   | Abre o formulário de criar.                                                               |
| `openEdit(item)` | Abre o formulário de editar com o item.                                                   |
| `remove(item)`   | Confirma (se configurado) e apaga. Uma falha é sempre mostrada, mesmo sem hook `onError`. |

Em modal, um erro ao gravar **não** fecha o formulário: os erros de campo vão
para os campos, o resto para o `formError`. Ao gravar com sucesso, o modal
fecha antes dos hooks `after*`, para o aviso aparecer sobre a lista.

### `injectCrudForm<T, D>()` → `EvoCrudForm<T, D>`

Dentro do componente do formulário. O mesmo componente serve no modal do
controller e numa rota isolada: fora do controller, `submit`/`cancel` não
fazem nada.

| Membro                       | Descrição                                                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inController`               | `true` quando aberto pelo controller.                                                                                                                                                                                                 |
| `mode`                       | `Signal<'create' \| 'update' \| null>`.                                                                                                                                                                                               |
| `initial`                    | `Signal<T \| null>` — o item a editar.                                                                                                                                                                                                |
| `formError`                  | `Signal<string \| null>` — a mensagem geral da API e o que não coube em nenhum campo.                                                                                                                                                 |
| `submit(dto)` / `cancel()`   | Entrega o DTO ao controller / fecha sem gravar.                                                                                                                                                                                       |
| `bindErrors(form, onApply?)` | Liga os erros de campo da API (`EvoError.fieldErrors`) ao `FormGroup`, como erro `apiError` com o texto — o `EvoTextField`/`EvoSelect` mostram-no tal como vem. Sai quando o utilizador mexe no campo. Chamar uma vez, no construtor. |
| `clearErrors()`              | Limpa os erros.                                                                                                                                                                                                                       |

### `injectCrudPage<T>(resource, options?)` → `EvoCrudPage<T>`

Numa página de rota. Lê o id da rota (`options.param`, por omissão `'id'`),
deriva o modo e resolve o registo pelo `one()` do resource.

| Membro     | Descrição                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| `id`       | `Signal<string \| null>`, reactivo (também de `/1/editar` para `/2/editar`). |
| `mode`     | `'create'` sem id, `'update'` com id.                                        |
| `item`     | `Signal<T \| null>`.                                                         |
| `loading`  | `Signal<boolean>`.                                                           |
| `notFound` | `true` só em `'update'`, depois de carregar e sem registo.                   |

### Hooks (`EvoCrudHooks<T, D>`)

Todos opcionais, síncronos ou assíncronos. Os globais correm antes dos locais.

| Hook                          | Tipo          | Recebe                                  | Efeito do retorno                                                   |
| ----------------------------- | ------------- | --------------------------------------- | ------------------------------------------------------------------- |
| `afterList`                   | transformador | `items`                                 | devolver um array substitui os itens                                |
| `beforeCreate`                | transformador | `dto`                                   | devolver substitui o DTO                                            |
| `beforeUpdate`                | transformador | `{ id, dto }`                           | devolver substitui a alteração                                      |
| `beforeRemove`                | cancelável    | `id`                                    | `false` cancela; `'handled'` diz que o hook já apagou à sua maneira |
| `beforeOpenForm`              | cancelável    | `mode`, `item?`                         | `false` impede abrir (só no controller)                             |
| `afterCreate` / `afterUpdate` | notificação   | o registo devolvido                     | —                                                                   |
| `afterRemove`                 | notificação   | `id`                                    | não corre se o `beforeRemove` cancelou                              |
| `afterCloseForm`              | notificação   | `mode`                                  | corre sempre que o formulário fecha, seja como for                  |
| `onError`                     | notificação   | `EvoError`, operação, `{ shownInForm }` | —                                                                   |

Cada hook recebe primeiro o contexto (`path`, `urls`, `queryClient`,
`request`). Uma notificação que falhe não pára as outras nem a operação:
emite `crud:hook-error` no barramento de eventos.

**Hooks prontos**

| Hook                              | Faz                                                                                                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crudToasts(messages?)`           | Aviso de sucesso em cada escrita e de erro (`EvoModalService`). Não repete um erro já mostrado no formulário. Usa `inject()`: global pela fábrica `() => crudToasts()`. |
| `crudSoftDelete(field = 'ativo')` | Troca o DELETE por `PATCH urls.update(id)` com `{ [field]: false }`.                                                                                                    |
| `crudInvalidate(...queryKeys)`    | Invalida outras `queryKey`s (painéis, contadores) depois de cada escrita.                                                                                               |

### Outros exports

`crudAutoAdapter()`, `crudAdapterByPath(items, meta?)`, `sameCrudId(a, b)`,
`crudIdOf(item, idKey)`, `EVO_CRUD_DEFAULT_ERROR`, `EVO_CRUD_FIELDS_ERROR`,
`EVO_CRUD_CONFIRM_REMOVE`, o token `EvoCrud` (a API do plugin) e a interface
de extensão `EvoCrudExtensions`.

---

## Exemplos

### Lista com modal de criar/editar

```ts
interface Usuario {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
}
type UsuarioDto = Omit<Usuario, 'id'>;

@Component({
  imports: [EvoDataTable, EvoDataTableRowActions, EvoButton],
  template: `
    <evo-data-table
      [columns]="colunas"
      [data]="crud.resource.items()"
      [loading]="crud.resource.loading()"
      [error]="crud.resource.error()?.message"
      (retry)="crud.resource.refresh()"
      searchable
    >
      <button evoButton slot="toolbar-end" (click)="crud.openCreate()">Novo</button>
      <ng-template evoRowActions [evoRowActionsOf]="crud.resource.items()" let-u>
        <button evoButton variant="ghost" size="sm" (click)="crud.openEdit(u)">Editar</button>
        <button evoButton variant="danger" size="sm" (click)="crud.remove(u)">Apagar</button>
      </ng-template>
    </evo-data-table>
  `,
})
export class UsuariosList {
  readonly crud = injectCrudController<Usuario, UsuarioDto>({
    path: '/usuarios',
    form: UsuarioForm,
    titles: { create: 'Novo utilizador', update: 'Editar utilizador' },
    confirmRemove: (u) => `Apagar ${u.nome}?`,
  });
  readonly colunas: EvoDataTableColumn<Usuario>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'email', label: 'Email' },
  ];
}
```

### O formulário

```ts
@Component({
  imports: [ReactiveFormsModule, EvoTextField, EvoButton],
  template: `
    <form [formGroup]="form" (ngSubmit)="gravar()">
      @if (crud.formError(); as erro) {
        <p role="alert">{{ erro }}</p>
      }
      <evo-text-field formControlName="nome" label="Nome" />
      <evo-text-field formControlName="email" label="Email" type="email" />
      <button evoButton variant="ghost" type="button" (click)="crud.cancel()">Cancelar</button>
      <button evoButton type="submit">Gravar</button>
    </form>
  `,
})
export class UsuarioForm {
  readonly crud = injectCrudForm<Usuario, UsuarioDto>();
  readonly form = inject(NonNullableFormBuilder).group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    ativo: true,
  });

  constructor() {
    const inicial = this.crud.initial();
    if (inicial) this.form.patchValue(inicial);
    this.crud.bindErrors(this.form); // erros 422 da API → nos campos
  }

  gravar() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.crud.submit(this.form.getRawValue());
  }
}
```

### Editar numa rota

```ts
readonly crud = injectCrudController<Usuario, UsuarioDto>({
  path: '/usuarios',
  form: UsuarioForm,
  display: {
    create: 'modal',
    update: { mode: 'route', routePath: (id) => `/usuarios/${id}/editar` },
  },
});
```

```ts
// usuario-page.ts — rota 'usuarios/:id/editar'
readonly usuarios = injectCrudResource<Usuario, UsuarioDto>({
  path: '/usuarios',
  strategy: 'fetch-on-miss', // recarregar a página directamente nesta rota também funciona
});
readonly page = injectCrudPage(this.usuarios);
```

```html
@if (page.loading()) { A carregar… } @else if (page.notFound()) { Utilizador não encontrado. } @else
{ <app-usuario-form [usuario]="page.item()" (saved)="gravar($event)" /> }
```

### Respostas noutros formatos, URLs e hooks locais

```ts
readonly facturas = injectCrudResource<Factura>({
  path: '/facturas',
  response: 'result.rows',                       // ou crudAdapterByPath('result.rows', 'result.pagination')
  urls: { update: (id) => `/facturas/${id}/editar` },
  hooks: [crudSoftDelete('activa'), crudInvalidate('/dashboard')],
});
```

### Um hook próprio

```ts
const auditoria = (): EvoCrudHooks => ({
  name: 'auditoria',
  afterRemove: (ctx, id) => console.info(`${ctx.path}/${id} apagado`),
  beforeOpenForm: (_ctx, mode) => mode === 'update' || podeCriar(),
});
```

---

## Configuração

| Opção de `withPlugin(crudPlugin(), { … })` | Tipo                              | Omissão | Descrição                                                                                                                 |
| ------------------------------------------ | --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `hooks`                                    | `readonly (() => EvoCrudHooks)[]` | `[]`    | Hooks globais, como **fábricas**: correm no `setup()` do plugin, em contexto de injecção, por isso podem usar `inject()`. |

---

## SSR e erros

- Por omissão, nem a lista nem o `one()` pedem nada no servidor (`ssr: false`):
  sem transferência de estado, o pedido repetia-se no browser.
- Todos os erros chegam como `EvoError` (`message`, `status`,
  `fieldErrors`), normalizados pelo kernel.
- Eventos no barramento de `/services`: `crud:hook-error` (um hook de
  notificação falhou) e `crud:unrecognized-response` (a lista não estava em
  nenhum formato conhecido; o resource assume lista vazia).
- Cada formulário aberto tem os seus próprios erros: dois formulários abertos
  ao mesmo tempo (um modal sobre outro) não os misturam.

---

## Migração a partir de `crud-kit`

| Antes (`service-models/crud-kit`)                        | Agora (`@evolium-kit/toolkit/crud`)                                  |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `createCrudResource()`                                   | `injectCrudResource()`                                               |
| `createCrudController()`                                 | `injectCrudController()`                                             |
| `useCrudFormBridge()` + `CrudFormErrosService` (`root`)  | `injectCrudForm()` (erros por formulário aberto)                     |
| `CrudFormErroBannerComponent`                            | `crud.formError()` no template do formulário                         |
| `useCrudPageState()`                                     | `injectCrudPage()`                                                   |
| `provideCrudKitPlugins()` / `CRUD_KIT_GLOBAL_PLUGINS`    | `withPlugin(crudPlugin(), { hooks })`                                |
| `CrudKitPlugin`                                          | `EvoCrudHooks`                                                       |
| `pluginToastAutomatico()`                                | `crudToasts()`                                                       |
| `pluginSoftDelete()`                                     | `crudSoftDelete()`                                                   |
| `pluginInvalidarRelacionados()`                          | `crudInvalidate()`                                                   |
| `criarAdaptadorPorCaminho()` / `adaptadorAutoDetectar()` | `crudAdapterByPath()` / `crudAutoAdapter()`                          |
| `MENSAGEM_ERRO_PADRAO` / `MENSAGEM_CAMPOS_INVALIDOS`     | `EVO_CRUD_DEFAULT_ERROR` / `EVO_CRUD_FIELDS_ERROR`                   |
| `HttpClient` directo                                     | kernel de `/services`: `baseUrl`, Bearer e `EvoError` sem configurar |

Corrigido em relação ao original: o soft-delete montava o URL à mão e
ignorava `baseUrl` e Bearer; o aviso de erro mostrava sempre "tente
novamente" (o `instanceof Error` falhava com o `HttpErrorResponse`); o hook
de fecho só corria ao cancelar; a invalidação de listas relacionadas não era
esperada; uma falha ao apagar sem plugin de avisos ficava calada; o meta da
lista perdia-se numa segunda instância servida pela cache; ids da rota
(`'5'`) não encontravam ids numéricos (`5`).

---

## Ficheiros

```
crud/
├── src/
│   ├── public-api.ts
│   └── lib/
│       ├── crud.types.ts              tipos públicos (config, resource, controller, hooks)
│       ├── crud.plugin.ts             crudPlugin(), EvoCrud, EvoCrudExtensions
│       ├── crud.adapters.ts           adaptadores da lista, sameCrudId, crudIdOf
│       ├── crud.hooks.ts              execução dos hooks (interno)
│       ├── inject-crud-resource.ts
│       ├── inject-crud-controller.ts
│       ├── inject-crud-form.ts
│       ├── inject-crud-page.ts
│       ├── form-errors.ts             erros por formulário aberto
│       └── hooks/                     crudToasts, crudSoftDelete, crudInvalidate
├── ng-package.json
└── README.md
```
