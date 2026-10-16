# crud-kit

## 1. Visão geral

O `crud-kit` é uma pequena biblioteca interna que elimina o boilerplate repetitivo de
implementar um CRUD completo (listar, criar, editar, apagar) para uma entidade,
integrando automaticamente com `data-tabela-generica` e `AlertModalService`.

**O que ele resolve:** hoje, cada entidade nova exige repetir manualmente: uma query de
listagem, três mutations (salvar/atualizar/apagar) com invalidação de cache, abertura de
modal com o formulário certo, mapeamento de `salvo`/`cancelado` para as mutations, e um
fluxo de confirmação antes de apagar. O `crud-kit` empacota tudo isso em duas funções:
`createCrudResource` (dados) e `createCrudController` (dados + UI de abrir formulário/apagar).

**O que ele NÃO faz:**
- Não gera `FormGroup` nem sabe quais campos existem em uma entidade — a montagem do
  formulário (com `form-input-field`, `field-select-v2`, etc.) continua 100% manual, no
  componente de formulário de cada entidade.
- Não faz validação de nenhum tipo — validação é responsabilidade do `FormGroup` de cada
  formulário.
- Não decide layout/estilo — só transporta o objeto de dado inteiro de um lado para o
  outro (dado inicial → dto de saída).

## 2. Instalação / Pré-requisitos

O `crud-kit` assume que o projeto já tem, no `app.config.ts`:

```ts
provideAngularQuery(new QueryClient()),
provideHttpClient(/* ... */),
```

E que `AlertModalService` (providedIn: 'root') está disponível normalmente via `inject()`
— nenhuma configuração adicional é necessária.

## 3. API — `createCrudResource`

```ts
function createCrudResource<TEntity extends Record<string, any>, TDto = Partial<TEntity>>(
  config: CrudResourceConfig<TEntity, TDto>,
): {
  list: /* resultado de injectQuery — lista da entidade */;
  salvar: /* resultado de injectMutation — cria (POST) */;
  atualizar: /* resultado de injectMutation — atualiza (PUT), aceita { id, dto } */;
  apagar: /* resultado de injectMutation — apaga (DELETE), aceita apenas o id */;
  pegarUm: (id: ID) => TEntity | undefined;
  pegarUmQuery: (idSignal: () => ID | null | undefined) => { data: Signal<TEntity | null>; isLoading: Signal<boolean> };
  urls: CrudUrls;
  idKey: keyof TEntity;
}
```

Não é um `@Injectable` — usa `inject()` internamente, então só pode ser chamada dentro de
um contexto de injeção (campo de classe de componente/serviço, ou construtor).

### Opções de `CrudResourceConfig`

| Campo      | Tipo                                    | Default    | Descrição                                                                 |
|------------|------------------------------------------|------------|----------------------------------------------------------------------------|
| `resource` | `string`                                  | —          | Caminho base do recurso, ex: `'/usuarios'`. Usado para derivar URLs e queryKey. |
| `idKey`    | `keyof TEntity`                           | `'id'`     | Chave usada como identificador único da entidade.                          |
| `urls`     | `Partial<CrudUrls>`                       | derivado de `resource` | Permite sobrescrever qualquer URL individualmente (merge raso). |
| `strategy` | `'cache-only' \| 'fetch-on-miss'`         | `'cache-only'` | Estratégia de busca usada por `pegarUmQuery` (ver seção 6).           |
| `resposta` | `string \| CrudListAdapter<TEntity>`      | auto-detecção  | Como extrair o array de entidades (e meta) da resposta bruta da API (ver seção 6.1). |
| `plugins`  | `CrudKitPlugin<TEntity, TDto>[]`          | `[]`       | Plugins locais deste recurso, somados aos globais (ver seção 10).          |

### Objeto retornado

| Campo          | Descrição                                                                              |
|----------------|-------------------------------------------------------------------------------------------|
| `list`         | Resultado de `injectQuery` para `GET urls.pegarTodos()`, `queryKey: [resource, 'list']`. `list.data()` é sempre `TEntity[]` puro, já desembrulhado pelo adaptador de resposta. |
| `listMeta`     | `Signal<CrudListMeta \| null>` — meta (paginação, etc.) extraído da última resposta de `list`, se houver (ver seção 6.1). |
| `salvar`       | `injectMutation` para `POST urls.salvar()`. `mutate(dto)`. **Não corre `depoisDeSalvar`** — ver abaixo. |
| `atualizar`    | `injectMutation` para `PUT urls.atualizar(id)`. `mutate({ id, dto })`. **Não corre `depoisDeAtualizar`.** |
| `apagar`       | `injectMutation` para `DELETE urls.apagar(id)`. `mutate(id)`. Resolve `false` quando um plugin cancelou o DELETE. **Não corre `depoisDeApagar`.** |
| `salvarEConcluir`    | `(dto, antesDeNotificar?)` — salva e corre `depoisDeSalvar` **depois** da mutation assentar. É o que se usa. |
| `atualizarEConcluir` | `(id, dto, antesDeNotificar?)` — idem para `depoisDeAtualizar`.                       |
| `apagarEConcluir`    | `(id, antesDeNotificar?)` — idem para `depoisDeApagar`; não anuncia nada se um plugin cancelou o DELETE. |
| `pegarUm`      | Busca síncrona no cache de `list.data()`, sem requisição.                                  |
| `pegarUmQuery` | Busca reativa de um único item, respeitando `strategy` (ver seção 6).                      |
| `urls`         | URLs resolvidas (defaults + overrides).                                                    |
| `idKey`        | Chave de identificador resolvida.                                                          |
| `plugins`      | Lista resolvida de plugins (globais + locais, ver seção 10) já aplicados a este recurso.  |

Todas as três mutations invalidam `queryKey: [resource]` (prefixo, cobrindo `list` e
queries individuais) em `onSuccess`.

> **Chame sempre `salvarEConcluir`/`atualizarEConcluir`/`apagarEConcluir`, não as mutations
> diretamente.** Os hooks `depoisDeX` não podem correr dentro do `mutationFn`: aí a mutation
> ainda está `pending` (no TanStack v5 o estado só passa a `success` depois de
> `onSuccess`/`onSettled` resolverem — e o `onSuccess` daqui espera pela revalidação da
> lista). Uma mensagem de sucesso disparada nesse ponto aparece por baixo do overlay de
> carregamento e com a listagem ainda por actualizar. O parâmetro `antesDeNotificar` corre
> entre a mutation e o hook — é onde o `createCrudController` fecha o formulário, para a
> mensagem surgir sobre a listagem.

### Exemplo mínimo

```ts
export class MinhaListaComponent {
  usuarios = createCrudResource<Usuario>({ resource: '/usuarios' });
}
```

```html
<data-tabela-generica [data]="usuarios.list.data() ?? []" [carregando]="usuarios.list.isLoading()" ... />
```

### 3.1. Adaptando o formato de resposta da API

Cada endpoint do backend pode envelopar a listagem de um jeito diferente — array puro,
`{ data: [...] }`, `{ items: [...] }`, `{ result: { rows: [...] } }`, etc. Não existe um
formato único no projeto. Por isso `createCrudResource` sempre desembrulha a resposta
bruta antes de expor `list.data()` — quem consome o `crud-kit` nunca vê o envelope, só o
`TEntity[]` puro.

A opção `resposta` controla como esse desembrulho acontece:

| Valor de `resposta` | Comportamento |
|----------------------|---------------|
| omitido (default)    | Auto-detecção: tenta array puro, depois `.data`, `.items`, `.results`, `.data.data`, `.data.items`, nessa ordem. Se nenhum for um array, emite `console.warn` e usa `[]`. |
| `string`             | Shorthand de caminho de acesso, ex: `'data'` ou `'result.rows'`. Usa `criarAdaptadorPorCaminho`. |
| `CrudListAdapter<TEntity>` (função) | Adaptador completo — recebe o corpo bruto (`unknown`) e devolve `{ items, meta? }`. Único lugar onde o cast de `unknown` para `TEntity[]` deve acontecer. |

**Caso auto-detectado** (`{ data: [...], meta: {...} }` — não precisa configurar nada):

```ts
usuarios = createCrudResource<Usuario>({ resource: '/usuarios' });
// API devolve { data: [...], meta: { total: 42 } } → list.data() já é Usuario[]
```

**Caso com string** (caminho aninhado customizado, ex: `{ result: { rows: [...] } }`):

```ts
usuarios = createCrudResource<Usuario>({ resource: '/usuarios', resposta: 'result.rows' });
```

**Caso com função customizada** (formato que a auto-detecção não cobre):

```ts
usuarios = createCrudResource<Usuario>({
  resource: '/usuarios',
  resposta: (raw: any) => ({
    items: raw.payload.rows as Usuario[],
    meta: raw.payload.pagination,
  }),
});
```

> **Nota:** `listMeta` fica disponível no retorno de `createCrudResource`, mas **ainda não
> está conectado a nenhuma paginação server-side nem à `data-tabela-generica`** — hoje é
> apenas exposto para uso futuro. Isso é uma decisão pendente, não uma limitação técnica
> (ver seção 8).

## 4. API — `createCrudController`

```ts
function createCrudController<TEntity extends Record<string, any>, TDto = Partial<TEntity>>(
  config: CrudControllerConfig<TEntity, TDto>,
): {
  resource: ReturnType<typeof createCrudResource<TEntity, TDto>>;
  abrirCriar: () => void;
  abrirEditar: (item: TEntity) => void;
  apagar: (item: TEntity) => void;
}
```

`CrudControllerConfig` é um superset de `CrudResourceConfig` (mesmos campos, mais os abaixo).

### Opções adicionais de `CrudControllerConfig`

| Campo             | Tipo                                                      | Default                       | Descrição |
|-------------------|-------------------------------------------------------------|--------------------------------|-----------|
| `formComponent`   | `Type<any>`                                                  | —                              | Componente standalone usado como formulário de criar/editar. Deve consumir `useCrudFormBridge`. |
| `titulos`         | `{ criar?: string; editar?: string }`                        | `undefined`                    | Títulos exibidos no header do modal/drawer. |
| `display`         | `{ criar?: DisplayMode \| DisplayModeConfig; editar?: ... }`  | `{ mode: 'modal' }` para ambos | Onde cada ação é exibida — independente por ação. |
| `confirmarApagar` | `boolean \| ((item: TEntity) => string)`                     | `true`                          | `true`: confirma com mensagem genérica. `false`: apaga direto. função: mensagem customizada. |

`DisplayMode` é `'modal' | 'drawer' | 'route'`. Quando `mode === 'route'`,
`DisplayModeConfig.routePath` é **obrigatório** — recebe o id (`undefined` na criação) e
retorna o path da rota; se estiver ausente, `abrirCriar`/`abrirEditar` lançam um erro em
tempo de execução.

### Objeto retornado

| Campo         | Descrição                                                                     |
|---------------|-----------------------------------------------------------------------------|
| `resource`    | O mesmo objeto retornado por `createCrudResource` (dados/queries/mutations). |
| `abrirCriar`  | Abre o formulário de criação (modal/drawer/rota, conforme `display.criar`).  |
| `abrirEditar` | Abre o formulário de edição com o item selecionado.                          |
| `apagar`      | Apaga o item, respeitando `confirmarApagar`.                                 |

### Exemplo mínimo

```ts
export const usuarioCrud = () =>
  createCrudController<Usuario, UsuarioDto>({
    resource: '/usuarios',
    formComponent: UsuarioFormComponent,
    titulos: { criar: 'Novo usuário', editar: 'Editar usuário' },
    display: { criar: 'modal', editar: 'modal' },
  });
```

```ts
export class UsuariosListComponent {
  crud = usuarioCrud();
}
```

```html
<button (click)="crud.abrirCriar()">Novo usuário</button>
<data-tabela-generica [data]="crud.resource.list.data() ?? []">
  <ng-template dataTabelaGenericaActions let-item>
    <button (click)="crud.abrirEditar(item)">Editar</button>
    <button (click)="crud.apagar(item)">Apagar</button>
  </ng-template>
</data-tabela-generica>
```

## 5. API — `useCrudFormBridge`

```ts
function useCrudFormBridge<TEntity>(): {
  dadoInicialModal: Signal<TEntity | null>;
  emitirSalvo: (dto: any) => void;
  emitirCancelado: () => void;
}
```

Injeta `ModalDataService` e `ModalEventsService` com `{ optional: true }` — por isso
funciona tanto dentro de um modal/drawer aberto por `createCrudController` quanto numa
rota isolada, onde esses serviços não existem no contexto de injeção (nesse caso os
métodos `emitir*` viram no-op silencioso).

**Padrão obrigatório para quem consome o bridge** — todo formulário de entidade deve
combinar o `@Input` direto com o bridge assim, sem exceção:

```ts
dado = computed(() => this.usuarioInicial() ?? this.bridge.dadoInicialModal());
```

E ao submeter, chamar **os dois emitters**, sem `if`:

```ts
this.bridge.emitirSalvo(dto);
this.salvo.emit(dto);
```

Isso garante que o mesmo componente de formulário funcione tanto dentro de um
modal/drawer (via `ModalDataService`/`ModalEventsService`) quanto numa rota isolada (via
`@Input`/`@Output` normais do Angular) — sem duplicar o componente.

### 5.1. Erros da API no formulário

Quando `POST`/`PUT` falham, o `createCrudController` **não fecha o modal**: regista o erro no
`CrudFormErrosService` e o formulário mostra-o onde interessa.

No componente de formulário, ligar o `FormGroup` uma vez no construtor:

```ts
readonly validacao = inject(ValidacaoService);
readonly erroGeral = this.bridge.erroGeral;

constructor() {
  this.bridge.ligarErros(this.form);
}
```

E nos campos usar o `ValidacaoService`, que já devolve tanto os erros de validação locais
como os da API:

```html
<crud-form-erro-banner class="px-6 pt-4" [mensagem]="erroGeral()" />

<form-input-field label="NIF*" formControlName="nif" [erro]="validacao.getErro(form, 'nif')" />
```

Como funciona:

1. `normalizarErroApi` extrai `{ errors: { campo: [msg] }, message }` da resposta (formato
   de validação do Laravel; também aceita corpo sem envelope ou texto simples).
2. Cada mensagem é aplicada ao campo respetivo como erro `apiErro` + `markAsTouched()`, e o
   `ValidacaoService.getErro` mostra-a (mensagens de erro em `string` são usadas tal e qual).
   O erro desaparece assim que o utilizador voltar a mexer no campo.
3. **Fallback:** mensagens sem campo correspondente no `FormGroup` (ou erros sem `errors`)
   vão para `erroGeral`, mostrado pelo `<crud-form-erro-banner>` dentro do modal — que
   continua aberto, com os dados preenchidos.
4. O `pluginToastAutomatico` não abre o modal de erro de criar/editar enquanto o formulário
   estiver aberto (só o faz no apagar, ou quando o formulário está numa rota isolada).

## 6. Estratégias de fetch (`cache-only` vs `fetch-on-miss`)

`pegarUmQuery(idSignal)` resolve um único registro de duas formas:

- **`cache-only`** (default): nunca faz requisição extra — só procura o item dentro de
  `list.data()`. Ideal quando o usuário sempre chega no formulário de edição vindo da
  listagem (o cache já está quente). Se o item não estiver no cache, `data` fica `null`
  para sempre — **nenhum GET individual é disparado**.
- **`fetch-on-miss`**: se o item não estiver no cache do `list` **e** o `list` já tiver
  terminado de carregar, dispara um `GET urls.pegarUm(id)` isolado. Necessário quando o
  usuário pode acessar a rota de edição diretamente (ex: link direto, refresh de página),
  sem passar pela listagem primeiro.

Exemplo de uso numa página de edição (fluxo Rota) — via `useCrudPageState` (seção 10):

```ts
private readonly resource = createCrudResource<Usuario, UsuarioDto>({
  resource: '/usuarios',
  strategy: 'fetch-on-miss',
});

readonly page = useCrudPageState(this.resource);
```

```html
@if (page.isLoading()) {
  <p>Carregando...</p>
} @else if (page.naoEncontrado()) {
  <p>Usuário não encontrado.</p>
} @else {
  <app-usuario-form [usuarioInicial]="page.dado()" ... />
}
```

## 7. Guia passo a passo: CRUD de Usuário do zero

Exemplo completo em [`example-usuario/`](./example-usuario), entidade `Usuario` (`nome:
string`, `idade: number`, `perfil: 'admin' | 'padrao'`).

### 7.1. Fluxo Modal

- [`usuario.types.ts`](./example-usuario/usuario.types.ts) — `Usuario` e `UsuarioDto`.
- [`usuario-form.component.ts`](./example-usuario/usuario-form.component.ts) +
  [`.html`](./example-usuario/usuario-form.component.html) — `form-input-field` (nome,
  idade) e `field-select-v2` (perfil), usando `useCrudFormBridge` conforme o padrão da
  seção 5.
- [`usuario.controller.ts`](./example-usuario/usuario.controller.ts):

  ```ts
  export const usuarioCrud = () =>
    createCrudController<Usuario, UsuarioDto>({
      resource: '/usuarios',
      formComponent: UsuarioFormComponent,
      titulos: { criar: 'Novo usuário', editar: 'Editar usuário' },
      display: { criar: 'modal', editar: 'modal' },
    });
  ```

- [`usuarios-list.component.ts`](./example-usuario/usuarios-list.component.ts) +
  [`.html`](./example-usuario/usuarios-list.component.html) — `data-tabela-generica` com
  `DataTabelaGenericaActionsDirective` para os botões Editar/Apagar, consumindo
  `crud.resource.list.data()`, `crud.abrirCriar()`, `crud.abrirEditar(item)`,
  `crud.apagar(item)`.

### 7.2. Fluxo Rota separada

- [`usuario-page.component.ts`](./example-usuario/usuario-page.component.ts) +
  [`.html`](./example-usuario/usuario-page.component.html) — usa `useCrudPageState`
  (seção 10, que por sua vez usa `pegarUmQuery` internamente), com os três estados de UI:
  loading (`page.isLoading()`), não encontrado (`page.naoEncontrado()`), e formulário
  carregado (`page.dado()`). `page.mode()` decide `salvar` vs `atualizar` em `onSalvo`.
- [`usuario.routes.ts`](./example-usuario/usuario.routes.ts) — configuração de rotas:

  ```ts
  export const UsuarioRoutes: Routes = [
    { path: '', loadComponent: () => import('./usuarios-list.component').then((c) => c.UsuariosListComponent) },
    { path: 'novo', loadComponent: () => import('./usuario-page.component').then((c) => c.UsuarioPageComponent) },
    { path: ':id/editar', loadComponent: () => import('./usuario-page.component').then((c) => c.UsuarioPageComponent) },
  ];
  ```

- O mesmo `UsuarioFormComponent` é reaproveitado sem nenhuma alteração — usando
  `[usuarioInicial]` e `(salvo)`/`(cancelado)` como `@Input`/`@Output` normais.

## 8. Notas de implementação

Antes de implementar `createCrudController`, o código real de `AlertModalService` e da
interface `AlertButton` foi inspecionado para confirmar as duas suposições do prompt
original:

1. **`AlertButton` suporta `onClick`?** Sim —
   [`alert-modal.types.ts`](../../components/alert-modal/alert-modal.types.ts) define
   `AlertButton.onClick?: () => void | Promise<void>`, e
   [`alert-modal.component.ts`](../../components/alert-modal/alert-modal.component.ts)
   (`clicarBotao`) já chama `botao.onClick?.()` antes de resolver o modal. Isso **divergiu
   para melhor** da suposição do prompt (que previa precisar do mecanismo
   `on: { confirmado: ... }` + `ModalEventsService.emitir('confirmado')` como fallback):
   `apagar()` usa diretamente `alert.modal({ botoes: [{ label: 'Apagar', onClick: () =>
   resource.apagar.mutate(id) }] })`, sem nenhum template de confirmação customizado.
2. **`AlertOptions.kind` aceita `'drawer'` de fato?** Sim —
   `kind?: 'modal' | 'drawer'` existe literalmente em `AlertOptions` e é usado sem
   nenhuma tradução adicional. `abrirFormulario` passa `kind: displayCfg.mode` direto.
   (Existe também um `DrawerService` totalmente separado no projeto, mas ele não foi
   usado aqui — o `crud-kit` segue a mesma via do `AlertModalService` para os dois casos,
   como pedido no prompt original.)

**Limitação conhecida:** com `strategy: 'cache-only'` (default), acessar a rota de edição
diretamente sem passar pela listagem primeiro deixa `pegarUmQuery` retornando `data:
null` para sempre — a UI cai no estado "não encontrado" mesmo que o registro exista no
servidor. Use `strategy: 'fetch-on-miss'` sempre que a entidade tiver uma rota de edição
acessível diretamente (ver seção 6).

**Pergunta em aberto — paginação server-side:** ao testar `createCrudResource` contra
`/dispositivos`, a resposta real trouxe um `meta` com `current_page`/`last_page`/`total`,
o que sugere que aquele endpoint pagina no servidor. Este ajuste (adaptador de resposta)
**não implementa paginação server-side** — ele só desembrulha o array da página atual e
expõe esse `meta` cru via `listMeta`, sem ligá-lo a nenhum controle de página nem à
`data-tabela-generica` (que hoje pagina apenas sobre o array já carregado em memória). Se
a paginação do servidor for confirmada como necessária, isso é uma camada separada, fora
do escopo deste ajuste.

**Decisões tomadas ao implementar o sistema de plugins** (seção 10), depois de inspecionar
o código real:

1. **Não existe modo `'visualizar'`** — `DisplayModeConfig`/`abrirFormulario` só conhecem
   `'criar'` e `'editar'`. O hook `antesDeAbrirFormulario` usa só esses dois.
2. **`abrirFormulario` não era `async`** — foi convertida para `async` (necessário para
   `await` o hook cancelável `antesDeAbrirFormulario`). `abrirCriar`/`abrirEditar`
   continuam síncronas do ponto de vista de quem chama (`void abrirFormulario(...)`).
3. **`createCrudController` não re-injeta `CRUD_KIT_GLOBAL_PLUGINS`** — reaproveita
   `resource.plugins` (já resolvido por `createCrudResource`), evitando resolver a mesma
   lista duas vezes.
4. **`resource.apagar` continua a chamar `alert.modal({ botoes: [...] })` diretamente**
   (ver decisão 1 da seção 8) — `antesDeApagar` corre **dentro** da mutation `apagar`,
   depois da confirmação nativa já ter passado, e `depoisDeApagar` corre no
   `apagarEConcluir`, já com a mutation assente; não há duplicação de confirmação entre o
   crud-kit e um plugin.

**Decisão tomada ao implementar `useCrudPageState`** (seção 11): o prompt original pedia
para corrigir `usuario-form.component.ts` para reagir via `effect()` a mudanças no dado,
em vez de um `patchValue` fixo na construção. Ao inspecionar o ficheiro real, esse
`effect()` **já existia** (implementado desde a criação do exemplo) — nenhuma mudança foi
necessária ali. Só `usuario-page.component.ts`/`.html` foram migrados para usar
`useCrudPageState` em vez da leitura manual de `id`/`mode`.

## 9. Checklist de uso para uma nova entidade

1. Crie `<entidade>.types.ts` com a interface da entidade e do DTO.
2. Crie o form component com `useCrudFormBridge` (padrão da seção 5), usando os campos
   reais da entidade.
3. Crie `<entidade>.controller.ts` com `createCrudController`.
4. Use `crud.resource.list.data()` / `crud.resource.list.isLoading()` na
   `data-tabela-generica`.
5. Ligue `crud.abrirCriar()`, `crud.abrirEditar(item)` e `crud.apagar(item)` nos botões
   correspondentes.
6. (Opcional, fluxo Rota) Se a entidade tiver uma rota de edição acessível diretamente,
   use `createCrudResource` com `strategy: 'fetch-on-miss'` + `useCrudPageState` (seção
   11) na página, e reaproveite o mesmo form component via `@Input`/`@Output`. Garanta
   que o form component aplica o dado recebido via `effect()` (seção 11.1), não só na
   construção — necessário para repopular corretamente quando o dado chega assíncrono.

## 10. Sistema de Plugins

Hooks opcionais que interceptam/estendem o comportamento do `crud-kit` sem tocar na API
pública existente. **Sem nenhum plugin configurado, nada muda** — é 100% aditivo.

Dois níveis, que se somam (globais correm primeiro):

- **Global** — registado uma vez em `app.config.ts`, aplica-se a todos os recursos.
- **Local** — passado em `config.plugins` de um `createCrudResource`/`createCrudController`
  específico, aplica-se só a esse recurso.

### Global

```ts
// app.config.ts
import { provideCrudKitPlugins, pluginToastAutomatico, pluginInvalidarRelacionados } from './core/crud-kit';

providers: [
  // ...
  provideCrudKitPlugins(
    () => pluginToastAutomatico(),
    () => pluginInvalidarRelacionados('dashboard-stats'),
  ),
],
```

> Plugins globais são sempre **fábricas** (`() => plugin()`), nunca instâncias diretas —
> `app.config.ts` corre fora de qualquer contexto de injeção do Angular, e plugins que
> usam `inject()` internamente (ex: `pluginToastAutomatico` injeta `AlertModalService`)
> só podem ser construídos quando o Angular resolve o token, dentro de um contexto válido.

### Local

```ts
usuarios = createCrudResource<Usuario>({
  resource: '/usuarios',
  plugins: [pluginSoftDelete('ativo')], // instância direta — já está em contexto de injeção
});
```

### Hooks disponíveis

| Hook | Camada | Tipo | Quando corre |
|---|---|---|---|
| `depoisDeBuscarLista` | dados | transformador | Depois do adaptador `resposta` resolver o array da listagem. |
| `antesDeSalvar` | dados | transformador | Antes do POST de criação. |
| `depoisDeSalvar` | dados | notificação | No `salvarEConcluir`, com o POST e a revalidação da lista já terminados (`isPending()` a `false`). |
| `antesDeAtualizar` | dados | transformador | Antes do PUT de atualização. |
| `depoisDeAtualizar` | dados | notificação | No `atualizarEConcluir`, nas mesmas condições. |
| `antesDeApagar` | dados | cancelável | Antes do DELETE — devolver `false` cancela a chamada real. |
| `depoisDeApagar` | dados | notificação | No `apagarEConcluir`, nas mesmas condições. Não corre se `antesDeApagar` cancelou o DELETE. |
| `aoOcorrerErro` | dados | notificação | Quando salvar/atualizar/apagar falham. |
| `antesDeAbrirFormulario` | orquestração | cancelável | Antes de abrir o modal/drawer/rota — devolver `false` impede a abertura. |
| `depoisDeFecharFormulario` | orquestração | notificação | Depois do formulário fechar, tanto ao salvar como ao cancelar. |

Três formatos de hook:

- **Transformador**: cada plugin pode devolver um novo valor; `undefined` mantém o valor
  do plugin anterior. Correm em cadeia (globais → locais).
- **Cancelável**: qualquer plugin a devolver `false` interrompe a operação (os seguintes
  não correm).
- **Notificação**: correm todos, resultado ignorado; um erro num plugin é isolado
  (`console.error`) e não impede os restantes nem o fluxo principal.

### Plugins implementados

**`pluginToastAutomatico`** — mostra um modal de sucesso/erro automaticamente:

```ts
plugins: [pluginToastAutomatico({ salvar: 'Usuário criado!', apagar: 'Usuário removido!' })]
```

**`pluginSoftDelete`** — troca o DELETE real por um `PUT { ativo: false }`:

```ts
plugins: [pluginSoftDelete('ativo')]
```

**`pluginInvalidarRelacionados`** — invalida outras `queryKeys` (ex: dashboards) sempre
que o recurso muda:

```ts
plugins: [pluginInvalidarRelacionados('dashboard-stats', 'notificacoes')]
```

### Ideias para depois (não implementadas neste patch)

Mesma interface `CrudKitPlugin`, sem necessidade de nenhuma mudança estrutural:

- **Plugin de auditoria/logging** — envia `depoisDeSalvar`/`depoisDeAtualizar`/`depoisDeApagar`
  para um endpoint de log central.
- **Plugin de permissões (RBAC)** — cancela `antesDeAbrirFormulario`/`antesDeApagar`
  consoante o papel do utilizador autenticado.
- **Plugin de normalização de payload** — `trim()` em strings, remoção de campos
  `undefined`, antes de `antesDeSalvar`/`antesDeAtualizar`.

## 11. `useCrudPageState` — estado de página automático

Camada 4 do `crud-kit`. Elimina o boilerplate repetido em toda página de rota de
criar/editar: ler `id` da rota manualmente (`route.snapshot.paramMap.get('id')`), manter
um `signal<'criar' | 'atualizar'>` e atribuí-lo à mão, e derivar "não encontrado" à mão.
`useCrudPageState` empacota tudo isso num único objeto, reativo a mudanças de rota (não
só ao `snapshot` inicial).

```ts
function useCrudPageState<TEntity extends Record<string, any>>(
  resource: CrudResourceLike<TEntity>, // shape mínimo: `pegarUmQuery` — o retorno de createCrudResource já serve
  options?: { paramName?: string }, // nome do parâmetro de rota do id. Default: 'id'.
): {
  id: Signal<string | null>;
  mode: Signal<CrudMode>; // 'criar' | 'atualizar'
  dado: Signal<TEntity | null>;
  isLoading: Signal<boolean>;
  naoEncontrado: Signal<boolean>; // só true em mode === 'atualizar'
}
```

| Campo | Descrição |
|---|---|
| `id` | Id lido do parâmetro de rota (`options.paramName`, default `'id'`), reativo via `toSignal(route.paramMap...)` — não só o `snapshot` inicial, então funciona também ao navegar entre duas instâncias da mesma rota (ex: `/usuarios/1/editar` → `/usuarios/2/editar`). |
| `mode` | `'criar'` quando não há `id` na rota, `'atualizar'` quando há. |
| `dado` | O mesmo `data` de `resource.pegarUmQuery(() => id())` — respeita `cache-only`/`fetch-on-miss` normalmente. |
| `isLoading` | O mesmo `isLoading` de `pegarUmQuery`. |
| `naoEncontrado` | `true` apenas quando `mode() === 'atualizar' && !isLoading() && !dado()`. Nunca `true` em `'criar'` — nesse modo simplesmente ainda não há dado, não é um erro. |

Precisa de `inject()` — só pode ser chamado num contexto de injeção (campo de classe de
componente, ou construtor), igual a `createCrudResource`.

### Exemplo completo (fluxo Rota)

```ts
export class UsuarioPageComponent {
  private readonly router = inject(Router);

  private readonly resource = createCrudResource<Usuario, UsuarioDto>({
    resource: '/usuarios',
    strategy: 'fetch-on-miss',
  });

  readonly page = useCrudPageState(this.resource);

  onSalvar(dto: UsuarioDto): void {
    // `...EConcluir` (não `mutate`) — é o que corre os hooks `depoisDeX` na altura certa.
    void (this.page.mode() === 'atualizar'
      ? this.resource.atualizarEConcluir(this.page.id()!, dto)
      : this.resource.salvarEConcluir(dto)
    ).catch(() => undefined);
  }
}
```

```html
@if (page.isLoading()) {
  <p>Carregando...</p>
} @else if (page.naoEncontrado()) {
  <p>Registo não encontrado.</p>
} @else {
  <app-usuario-form [usuarioInicial]="page.dado()" (salvo)="onSalvar($event)" />
}
```

Ver [`usuario-page.component.ts`](./example-usuario/usuario-page.component.ts) +
[`.html`](./example-usuario/usuario-page.component.html) para o exemplo real, já
migrado para este padrão.

### 11.1. `effect()` obrigatório no formulário — dado assíncrono (`fetch-on-miss`)

Com `strategy: 'fetch-on-miss'`, `page.dado()` pode chegar **depois** da construção do
componente de formulário (a query individual ainda está a resolver quando o form já foi
criado). Um `patchValue` que só corre uma vez (construtor/`ngOnInit`) perde essa
atualização — o formulário fica vazio mesmo depois do dado chegar.

Por isso, todo formulário de entidade **deve** aplicar o dado inicial dentro de um
`effect()`, reagindo a `this.dado` (o `computed` do padrão da seção 5), e não só na
construção:

```ts
constructor() {
  effect(() => {
    const dado = this.dado(); // usuarioInicial() ?? bridge.dadoInicialModal()
    if (dado) {
      this.form.patchValue(dado);
    }
  });
}
```

Isso funciona sem diferença de comportamento visível tanto para dado síncrono (fluxo
Modal, já vem do cache do `list`) quanto assíncrono (fluxo Rota com `fetch-on-miss`) — o
`effect()` simplesmente corre de novo quando `dado()` muda de valor, em qualquer um dos
dois casos.

> [`usuario-form.component.ts`](./example-usuario/usuario-form.component.ts) já segue
> este padrão — nenhuma mudança foi necessária nele ao implementar `useCrudPageState`.
