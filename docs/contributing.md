# Contribuir para a toolkit

Para quem vai alterar o código da `@evolium-kit/toolkit` em si — acrescentar
um componente, um plugin, uma página — e não só consumi-la num projecto.

Se só precisas de instalar e usar a toolkit, este documento não é para ti; vê
antes [`INSTALL.md`](../INSTALL.md) e
[`getting-started.md`](getting-started.md).

## Preparar o ambiente

```bash
git clone https://github.com/evolium-kit/evolium-toolkit.git
cd evolium-toolkit
npm ci
```

Dois terminais, em paralelo:

```bash
npm run watch:lib   # reconstrói a library sempre que um ficheiro muda
npm start           # serve o playground em http://localhost:4200
```

O `tsconfig.json` aponta `@evolium-kit/toolkit/*` para `dist/toolkit/*` —
por isso é preciso pelo menos um build antes do primeiro `ng serve`, mesmo
com o `watch:lib` já a correr.

> **Depois de alterar a library, reinicia o `ng serve`.** O Vite mantém as
> dependências em cache e não detecta sozinho um `dist/toolkit` reconstruído.
> Isto já causou confusão real durante o desenvolvimento — uma alteração que
> parecia não fazer nada, e afinal só precisava do reinício.

### Rotas do playground

| Rota          | O quê                               |
| ------------- | ----------------------------------- |
| `/`           | playground de componentes e do tema |
| `/auth/login` | página de login da toolkit          |
| `/painel`     | dashboard, atrás do `evoAuthGuard`  |
| `/_evo/theme` | Theme Studio                        |

Credenciais da API de demonstração (mock, sem backend real):
`ana@evolium.ao` / `1234`.

## O playground não é opcional

Uma alteração à toolkit só está terminada depois de exercitada no playground.
Foi lá — não nos testes unitários — que apareceram os bugs mais sérios da
toolkit até agora: um interceptor que não chegava a pedidos de outros
plugins, um `ng add` que falhava só no pacote instalado, folhas de estilo que
não eram importáveis fora do workspace de desenvolvimento. Ver
[`architecture.md`](architecture.md#o-playground-não-é-decorativo) para o
detalhe de cada um.

## Onde cada tipo de contribuição vive

| Queres acrescentar... | Segue o guia                                                       | Gerador (neste repositório)       |
| --------------------- | ------------------------------------------------------------------ | --------------------------------- |
| Um componente de UI   | [`components/README.md`](../projects/toolkit/components/README.md) | `npm run new:component -- <nome>` |
| Um layout/shell       | [`layouts/README.md`](../projects/toolkit/layouts/README.md)       | `npm run new:layout -- <nome>`    |
| Uma página            | [`pages/README.md`](../projects/toolkit/pages/README.md)           | `npm run new:page -- <nome>`      |
| Um plugin de serviço  | [`plugins.md`](plugins.md)                                         | `npm run new:plugin -- <nome>`    |
| Um token de tema      | [`theming.md`](theming.md)                                         | —                                 |

Cada README de módulo tem uma secção **Parte 2** com o checklist exacto.
Usar sempre o gerador em primeiro lugar: os esqueletos já nascem conformes às
regras de CSS, de a11y e de SSR — escrever à mão é mais fácil de fazer mal.

### Geradores internos: `npm run new:*`

Os geradores publicados (`ng g @evolium-kit/toolkit:ui-component`, `:layout`,
`:page`, `:resource-plugin`) são para **projectos consumidores** e não
funcionam tal e qual dentro deste repositório:

- o Angular CLI procura a collection em `node_modules`, onde a toolkit não
  está — o `paths` do `tsconfig.json` só serve ao compilador, não aos
  schematics. Daí o `Collection "@evolium-kit/toolkit" cannot be resolved`;
- escrevem por omissão em `src/app/…`, que aqui é o playground;
- não sabem que o resultado tem de entrar no `public-api.ts` do entry point;
- o `resource-plugin` importa de `@evolium-kit/toolkit/services`, o que dentro
  de `/services` seria o entry point a importar-se a si próprio.

`tools/new.mjs` corre **os mesmos geradores** a partir do `dist` e adapta o
resultado à lib. Os geradores publicados não são alterados — são o contrato
com os consumidores; tudo o que é específico da lib vive no script.

```bash
npm run new:<tipo> -- <nome> --dry-run   # ver o que vai ser criado e registado
npm run new:<tipo> -- <nome> [opções do gerador]
```

| Tipo        | Cria em                            | Regista                                                     | Adapta                                                        | Opções do gerador                                                           |
| ----------- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `component` | `components/src/lib/<nome>/`       | `public-api.ts` + `EVO_BUILTIN_COMPONENT_META`              | —                                                             | `--category`, `--variants`, `--skip-tests`                                  |
| `layout`    | `layouts/src/lib/<nome>-shell/`    | `public-api.ts`                                             | —                                                             | `--slots`, `--skip-tests`                                                   |
| `page`      | `pages/src/lib/<nome>/`            | `public-api.ts` (a seguir à última página, antes do Studio) | `XPage` → `EvoXPage`, `app-x` → `evo-x-page`                  | `--layout=blank\|dashboard\|auth`, `--resource`, `--skip-tests`             |
| `plugin`    | `services/src/lib/plugins/<nome>/` | `public-api.ts`, no bloco "Plugins built-in"                | imports relativos ao kernel; nomes públicos com prefixo `Evo` | `--depends-on`, `--endpoints=list,get,create,update,remove`, `--skip-tests` |

Regras que o script aplica, e porquê:

- **Nomes em kebab-case, sem sufixo.** `new:layout -- side` gera
  `EvoSideShell`; `side-shell` é recusado para não dar `EvoSideShellShell`.
  O mesmo para `-page`. O nome de um plugin vai no **plural** (`facturas`),
  porque o gerador deriva dele o singular do modelo (`EvoFactura`).
- **`--path` e `--project` são recusados**: o destino é sempre dentro da lib.
- **Os templates são sempre recompilados** antes de gerar, para nunca se gerar
  a partir de um `dist` desactualizado.
- **Imports do próprio entry point passam a relativos.** O script lê as
  declarações `export` do entry point e troca cada
  `import … from '@evolium-kit/toolkit/services'` pelo caminho do ficheiro que
  declara o símbolo (`../../kernel/types`, `../auth/auth.plugin`, …) — também o
  alvo do `declare module`. Não há caminhos do kernel escritos à mão no script.
- **Os nomes públicos de um plugin levam `Evo`**, como os do `auth`
  (`EvoAuth`, `EvoAuthApi`, `EvoSession`): vão todos parar ao mesmo
  `public-api.ts`, e um `toDto` genérico colidiria logo no segundo plugin.
- **Nada no kernel é tocado.** O plugin novo fica registado só no
  `public-api.ts`; quem o usa continua a declará-lo com `withPlugin()`.

No fim, o script corre o prettier nos ficheiros que criou e alterou, e diz o
que falta: implementar, documentar na secção "Usar" do README, exercitar no
playground, e a bateria de verificação abaixo.

## Antes de qualquer commit

```bash
npm run build:lib          # library + schematics
npm run test:lib           # componentes, tema, kernel
npm run test:schematics    # geradores, em Node
node tools/verify-dist.mjs # o artefacto está completo e publicável?
npx prettier --check .
```

Antes de um PR que mexa em algo estrutural (providers, `exports`, o `ng add`,
qualquer coisa em `tools/`):

```bash
node tools/verify-install.mjs
```

É lento (empacota o pacote a sério, cria um projecto Angular novo, corre
`ng add` e `ng build`), mas é o único teste que exercita a toolkit como um
consumidor real a vive. Já apanhou dois bugs que nenhum outro teste via.

## Regras de código, sem excepção

- **Zoneless.** Nunca `zone.js`, `provideZoneChangeDetection`, `NgZone`.
- **100% standalone.** Zero `NgModule`.
- **Signals primeiro.** `signal`, `computed`, `linkedSignal`. RxJS só onde a
  API do Angular o exige (interceptors HTTP).
- **`ChangeDetectionStrategy.OnPush`** em todos os componentes.
- **`input()` / `output()` / `model()`** — nunca os decoradores
  `@Input`/`@Output`.
- **Control flow novo** (`@if`, `@for`, `@switch`) — nunca `*ngIf`/`*ngFor`.
- **SSR-safe sempre.** Nunca `window`, `document`, `localStorage` fora de
  `isPlatformBrowser(inject(PLATFORM_ID))` ou `afterNextRender()`.
- **As duas regras de ouro do CSS** — ver
  [`theming.md`](theming.md#as-duas-regras-de-ouro-para-quem-escreve-componentes).
- **Dependências só para baixo entre entry points** — ver
  [`architecture.md`](architecture.md#a-regra-que-nunca-se-quebra-dependências-só-para-baixo).

## Publicar uma versão nova

A publicação é feita **apenas** pelo GitHub Actions — nunca `npm publish` a
partir de uma máquina local.

1. Actualizar a versão em `projects/toolkit/package.json`.
2. Documentar a alteração em `CHANGELOG.md`, seguindo Keep a Changelog.
3. Criar e enviar a tag:

   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

O workflow `.github/workflows/release.yml` confirma que a tag corresponde à
versão do pacote, corre `test:lib`, `test:schematics` e `verify-install.mjs`,
e só então publica no GitHub Packages. Se algum destes passos falhar, nada é
publicado.

Para testar o resultado sem publicar nada, corre o workflow manualmente pela
aba **Actions** do GitHub, com a opção `dryRun` activa — faz tudo, incluindo
`npm publish --dry-run`, sem tocar no registry.

## Estrutura do repositório

```
projects/toolkit/    a library publicada — o que interessa ao consumidor final
  core/ theme/ components/ layouts/ pages/ services/
  schematics/         ng add e os geradores
  styles/             folhas de CSS importáveis
src/                  o playground — nunca publicado, sempre exercitado
tools/                verify-dist.mjs, verify-install.mjs, copy-schematic-assets.mjs
docs/                 este documento e os outros guias conceptuais
.github/workflows/    ci.yml (em cada PR) e release.yml (em cada tag)
```

## Ver também

- [`architecture.md`](architecture.md) — o porquê por trás das regras acima
- [`theming.md`](theming.md) · [`plugins.md`](plugins.md) — os dois modelos
  mais fáceis de quebrar sem dar por isso
