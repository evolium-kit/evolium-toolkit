# Graph Report - evolium-app-overview  (2026-10-27)

## Corpus Check
- 369 files · ~180,771 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 62 file(s) not represented in the graph (top: .css 35, .template 21, (none) 4)

## Summary
- 2577 nodes · 4999 edges · 146 communities (115 shown, 31 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Testes de Schematics
- Campos de Formulário
- Alert Modal Eventos
- Persistência do Tema
- Manifesto do Pacote
- Badge e Card
- Previews de Componentes
- Script de Publicação
- Schema ng-add
- Theme Studio Docs
- Metadados de Tokens
- Gerador AGENTS.md
- EvoTextField
- Modelos de Referência
- EvoSelect
- Coleção Schematics
- Schema Página
- Drawer e Modal Data
- Modelo de Tema
- Schema Resource Plugin
- Schema UI Component
- Event Bus e HTTP
- Tabela Genérica V2
- Plugin de Auth
- Dependências Raiz
- Tokens Data Table
- Select Interno
- Crud Form Erros
- AlertModalService
- Mensagens do Drawer
- Schema Layout
- Testes EvoMenu
- EvoModalService
- Public API Components
- Tipos de Componente
- Scripts npm
- EvoDataTable Classe
- Entradas de Menu
- Adaptadores Crud
- Crud Controller Kit
- Gerador new.mjs
- Drawer sobre CDK
- Container do Modal
- EvoModal Overlay
- Theme Store
- Select Field V2
- Pipeline de Release
- Barra e Itens de Menu
- Erros de Formulário Crud
- Extensões OAuth
- Kernel e Error Mapper
- Roteador CLAUDE.md
- Guia AGENTS Base
- Drawer Overlay
- Theme Studio Page
- Controller Crud
- Regras e Fluxos
- Menu na Public API
- Shells de Layout
- Testes de Geradores
- Input Field V2
- Drawer Service
- Testes TextField
- Persistência Studio
- Armadilhas e Roadmap
- Registo de Componentes
- Drawer Ref
- Providers Public API
- Utilitários de Tokens
- Modal Data Service
- Hooks do Crud Kit
- Dev Dependencies
- Painel do Modal
- Testes EvoSelect
- Tipos Crud
- Testes EvoModal
- EvoSwitch
- Plugin Crud
- Crud Hooks
- Plugin Facturas
- App SSR Config
- Crud Resource Kit
- Bugs Conhecidos
- Opções de Build
- Contrato de Componentes
- Preview Data Table
- Testes ModalService
- Cascata de Tema
- Dependências Toolkit
- Menu sobre CdkMenu
- Testes de Serviços
- ValidacaoService
- Docs Campos e Select
- Docs Tabela e Paginação
- EvoDrawerService
- Triggers de Menu
- Directiva evoTokens
- Crud Hook Runner
- Modais Alerta Confirmação
- Targets Angular
- Docs do Core
- Ordenação de Plugins
- Alert Modal Tipos
- Directivas Data Table
- Docs do Crud
- Storage Adapters
- angular.json
- ModalDemo
- Skills Criar e Migrar
- EvoCrudResource
- Página de Registo
- Resource Registry e Guards
- EvoPagination
- Select Item
- EvoCrudForm
- Schema ai-context
- DrawerDemo
- ServicesDemo
- ThemeDemo
- AlertModalComponent
- Config Development
- Config Production
- Projecto Playground
- Drawer Componente
- Crud Toasts
- ng-package
- Página de Login
- Arquitectura e Migrações
- Docs do Theme
- Servidor Express
- SelectDemo
- Exemplo Modal Genérico
- Schematics Categorias
- Projecto Toolkit
- Mensagens Data Table
- Service Feature Kinds
- Theme Feature Kinds
- Painel
- EvoMenu Escape
- EvoCrudController
- Página 404
- Migrations
- Versão da Toolkit
- Responsivo Shell
- Inconsistência de Nomes
- Index HTML

## God Nodes (most connected - your core abstractions)
1. `EvoTextField` - 43 edges
2. `EvoSelect` - 36 edges
3. `EvoDataTable` - 32 edges
4. `vitest` - 29 edges
5. `EvoThemeSnapshot` - 29 edges
6. `EvoButton` - 27 edges
7. `EvoThemeStore` - 27 edges
8. `AlertModalService` - 25 edges
9. `components README` - 25 edges
10. `EvoError` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Regras de código: zoneless, standalone, signals, OnPush, SSR-safe` --semantically_similar_to--> `Regras invioláveis (7)`  [INFERRED] [semantically similar]
  docs/contributing.md → .claude/CLAUDE.md
- `Fluxo: cascata de tema em quatro níveis` --semantically_similar_to--> `Quatro níveis de override (instância, variante, subárvore, global)`  [INFERRED] [semantically similar]
  .claude/PROJECT_OVERVIEW.md → docs/theming.md
- `Fluxo: arranque do kernel de plugins` --semantically_similar_to--> `Ciclo de vida do plugin: setup() depois augment()`  [INFERRED] [semantically similar]
  .claude/PROJECT_OVERVIEW.md → docs/plugins.md
- `Playground (src/)` --semantically_similar_to--> `Playground não é decorativo`  [INFERRED] [semantically similar]
  .claude/PROJECT_OVERVIEW.md → docs/architecture.md
- `Testes Vitest+jsdom: keyCode, typeahead, texto do CSS` --semantically_similar_to--> `jsdom não resolve var() nem @layer`  [INFERRED] [semantically similar]
  .claude/skills/criar-recurso/reference/armadilhas.md → docs/architecture.md

## Import Cycles
- 3-file cycle: `projects/toolkit/services/src/lib/kernel/http/evo-http.ts -> projects/toolkit/services/src/lib/kernel/tokens.ts -> projects/toolkit/services/src/lib/kernel/types.ts -> projects/toolkit/services/src/lib/kernel/http/evo-http.ts`

## Hyperedges (group relationships)
- **Documentos de contexto lidos pelo roteador CLAUDE.md** — _claude_project_overview, _claude_roadmap, _claude_known_bugs, _claude_missing_info [EXTRACTED 1.00]
- **Pipeline de verificação partilhada por CI, release e publicar** — _github_workflows_ci, _github_workflows_release, tools_verify_dist, tools_verify_install, _claude_skills_publicar_skill_publicar_mjs [INFERRED 0.85]
- **Skills de criação/migração de recursos da toolkit** — _claude_skills_criar_recurso_skill, _claude_skills_migrar_recurso_skill, _claude_skills_criar_recurso_reference_armadilhas, _claude_skills_criar_recurso_reference_usabilidade_playwriter [EXTRACTED 1.00]
- **Componentes de overlay assentes no CDK com tokens copiados** — projects_toolkit_components_src_lib_modal_readme_evomodal, projects_toolkit_components_src_lib_drawer_readme_evodrawer, projects_toolkit_components_src_lib_menu_readme_evomenu, projects_toolkit_components_src_lib_select_readme_evoselect [INFERRED 0.85]
- **Campos de formulário compostos por EvoField + EvoInput** — projects_toolkit_components_src_lib_text_field_readme_evotextfield, projects_toolkit_components_src_lib_select_readme_evoselect, projects_toolkit_components_readme_evofield, projects_toolkit_components_readme_evoinput [EXTRACTED 1.00]
- **Cadeia crud: controller, resource, plugin do kernel** — projects_toolkit_crud_readme_injectcrudcontroller, projects_toolkit_crud_readme_injectcrudresource, projects_toolkit_crud_readme_crudplugin, projects_toolkit_services_readme_kernel_plugins [EXTRACTED 1.00]
- **Playground component demos** — src_app_playground_badge_badge_demo, src_app_playground_button_button_demo, src_app_playground_data_table_data_table_demo, src_app_playground_drawer_drawer_demo, src_app_playground_menu_menu_demo, src_app_playground_modal_modal_demo [EXTRACTED 1.00]
- **Auth pages on EvoAuthShell** — projects_toolkit_pages_src_lib_auth_login_page, projects_toolkit_pages_src_lib_auth_forgot_password_page, projects_toolkit_pages_src_lib_auth_register_page, evo_auth_shell [EXTRACTED 1.00]
- **Alert modal: serviço, dados injetados e eventos** — src_app_service_models_alert_modal_template_usage_alertmodalservice, src_app_service_models_alert_modal_template_usage_modaldataservice, src_app_service_models_alert_modal_template_usage_modaleventsservice [EXTRACTED 1.00]
- **Plugins do crud-kit** — src_app_service_models_crud_kit_readme_plugintoastautomatico, src_app_service_models_crud_kit_readme_pluginsoftdelete, src_app_service_models_crud_kit_readme_plugininvalidarrelacionados [EXTRACTED 1.00]
- **Família de modais genéricos** — src_app_service_models_modal_generico_readme_modalgenericocomponent, src_app_service_models_modal_generico_readme_modalconfirmacaocomponent, src_app_service_models_modal_generico_readme_modalalertacomponent [EXTRACTED 1.00]

## Communities (146 total, 31 thin omitted)

### Community 0 - "Testes de Schematics"
Cohesion: 0.06
Nodes (40): angularCollection, collection, BLOCO_CLAUDE_MD, CAMINHO_SKILL, FIM_BLOCO, INICIO_BLOCO, MARCA_GERADO, PREFIXO_INICIO (+32 more)

### Community 1 - "Campos de Formulário"
Cohesion: 0.08
Nodes (22): ControlValueAccessor integration, EvoAuthShell, EvoField, EvoFormField, EvoSelect, EvoInput, EvoAuthShell, DashboardShell template (+14 more)

### Community 2 - "Alert Modal Eventos"
Cohesion: 0.05
Nodes (33): Exemplo Prático: Modal com Eventos, Listeners de eventos do modal (on), ModalPagamentoExpressCounterComponent, PagamentoComponent, Alert Modal com Templates Dinâmicos, AlertModalService, AlertOptions, ModalDataService (+25 more)

### Community 3 - "Persistência do Tema"
Cohesion: 0.08
Nodes (10): EvoThemeSnapshot, ThemePersistence, FakePersistence, FakePersistence, EvoThemeExporter, EVO_HTTP_PERSISTENCE_CONFIG, EvoHttpPersistenceConfig, HttpThemePersistence (+2 more)

### Community 4 - "Manifesto do Pacote"
Cohesion: 0.05
Nodes (43): optional, optional, dependencies, tslib, description, exports, ./schematics/*, ./styles/* (+35 more)

### Community 5 - "Badge e Card"
Cohesion: 0.12
Nodes (10): EvoBadge, EvoCard, EvoTextField, EvoBadge, EvoCard, BadgeDemo, ButtonDemo, Playground (+2 more)

### Community 6 - "Previews de Componentes"
Cohesion: 0.07
Nodes (8): EvoBadgePreview, EvoButtonPreview, Anfitriao, EvoCardPreview, EvoFormField, EvoFormFieldPreview, EvoSwitchPreview, WrapperAuthBackGroundComponent

### Community 7 - "Script de Publicação"
Cohesion: 0.16
Nodes (33): acompanhar(), amarelo, CHANGELOG, confirmar(), correr(), correrPipeline(), enviar(), Falha (+25 more)

### Community 8 - "Schema ng-add"
Cohesion: 0.05
Nodes (36): default, type, x-prompt, default, type, x-prompt, default, type (+28 more)

### Community 9 - "Theme Studio Docs"
Cohesion: 0.10
Nodes (19): EvoStudioComponentDocs, EvoStudioHeader, EvoStudioPreviewFrame, EvoStudioPreviewFrame, CANAL_PREVIEW, ehMensagemDoCanal(), EstadoTema, MensagemAltura (+11 more)

### Community 10 - "Metadados de Tokens"
Cohesion: 0.09
Nodes (14): evoBadgeMeta, evoButtonMeta, evoCardMeta, evoFormFieldMeta, evoInputMeta, provideEvoComponents(), evoSwitchMeta, EVO_COMPONENT_META (+6 more)

### Community 11 - "Gerador AGENTS.md"
Cohesion: 0.13
Nodes (31): agruparTokens(), assinatura(), celula(), declaracoesDaFonte(), exportsDoDts(), fechar(), membrosDoCorpo(), metaDosTokens() (+23 more)

### Community 13 - "Modelos de Referência"
Cohesion: 0.10
Nodes (17): usuarioCrud(), field-select-v2, form-input-field, UsuarioFormComponent, UsuarioPageComponent, UsuarioRoutes, Usuario, UsuarioDto (+9 more)

### Community 15 - "Coleção Schematics"
Cohesion: 0.06
Nodes (32): aliases, description, factory, schema, aliases, description, factory, schema (+24 more)

### Community 16 - "Schema Página"
Cohesion: 0.06
Nodes (32): index, $source, $id, default, enum, type, x-prompt, $default (+24 more)

### Community 17 - "Drawer e Modal Data"
Cohesion: 0.09
Nodes (11): EvoDrawer, EvoButton, injectModalRef(), FormMotoristaDados, FormMotoristaDrawer, FormMotoristaEventos, Motorista, FormMotorista (+3 more)

### Community 18 - "Modelo de Tema"
Cohesion: 0.12
Nodes (18): EvoThemeDefaults, EvoVariantRecord, EVO_DARK_MODE_CONFIG, EVO_THEME_DEFAULTS, EVO_THEME_DEFAULTS_PATCH, EvoDarkModeConfig, EvoThemeDefaultsPatch, normalizeTokens() (+10 more)

### Community 19 - "Schema Resource Plugin"
Cohesion: 0.07
Nodes (30): index, $source, default, description, type, default, description, type (+22 more)

### Community 20 - "Schema UI Component"
Cohesion: 0.07
Nodes (29): default, description, type, index, $source, $id, $default, type (+21 more)

### Community 21 - "Event Bus e HTTP"
Cohesion: 0.15
Nodes (12): EvoEventBusService, EvoHttp, EvoResourceMap, EvoResourceName, EVO_BASE_URL, EVO_ERROR_MAPPER, EVO_PLUGIN_CONFIG_ENTRY, EVO_PLUGIN_ID (+4 more)

### Community 22 - "Tabela Genérica V2"
Cohesion: 0.09
Nodes (9): EvoDataTable, DataTabelaGenericaV2ActionsDirective, DataTabelaGenericaV2ColDirective, DataTabelaGenericaV2Component, DataTabelaGenericaV2FooterLeft, DataTabelaGenericaV2Header, DataTabelaGenericaV2HeaderLeft, DataTabelaGenericaV2HeaderRight (+1 more)

### Community 23 - "Plugin de Auth"
Cohesion: 0.14
Nodes (15): authEndpoints, authBearerInterceptor(), toSession(), toUser(), EvoCredentials, EvoRegisterPayload, EvoSession, EvoSessionDto (+7 more)

### Community 24 - "Dependências Raiz"
Cohesion: 0.07
Nodes (26): @angular/cdk, @angular/common, @angular/core, @angular/forms, @angular/router, rxjs, @tanstack/angular-query-experimental, tslib (+18 more)

### Community 25 - "Tokens Data Table"
Cohesion: 0.14
Nodes (19): evoDataTableMeta, EvoDataTableKey, EvoDataTablePage, EvoDataTablePaging, EvoDataTableQuery, EvoDataTableRowToggle, EvoDataTableSearchFn, EvoDataTableSort (+11 more)

### Community 26 - "Select Interno"
Cohesion: 0.12
Nodes (18): EvoSelectErrorFn, Grupo, Linha, POSICOES, evoNormalizeSearch(), evoSelectDefaultSearch(), EvoSelectOption, EvoSelectOptionContext (+10 more)

### Community 27 - "Crud Form Erros"
Cohesion: 0.10
Nodes (10): CrudFormErrosService, ErroApiNormalizado, MENSAGEM_CAMPOS_INVALIDOS, MENSAGEM_ERRO_PADRAO, normalizarErroApi(), montar(), useCrudFormBridge(), ligarErros() (+2 more)

### Community 28 - "AlertModalService"
Cohesion: 0.16
Nodes (3): AlertModalService, AlertOptions, AlertResult

### Community 29 - "Mensagens do Drawer"
Cohesion: 0.14
Nodes (15): EVO_DRAWER_DEFAULT_MESSAGES, EVO_DRAWER_MESSAGES, EvoDrawerMessages, provideEvoDrawerMessages(), EvoDrawerPreview, evoDrawerMeta, EvoDrawerBeforeCloseFn, EvoDrawerListeners (+7 more)

### Community 30 - "Schema Layout"
Cohesion: 0.08
Nodes (25): index, $source, $id, $default, type, x-prompt, description, type (+17 more)

### Community 31 - "Testes EvoMenu"
Cohesion: 0.12
Nodes (16): Anfitriao, AnfitriaoBarra, AnfitriaoContexto, AnfitriaoDados, AnfitriaoEmbutido, AnfitriaoGrupos, criar(), cssDoMenu() (+8 more)

### Community 32 - "EvoModalService"
Cohesion: 0.15
Nodes (6): EvoModalService, EvoModalAlertConfig, EvoModalConfig, EvoModalConfirmConfig, EvoModalPromptConfig, EvoTokenMap

### Community 33 - "Public API Components"
Cohesion: 0.09
Nodes (9): EvoPagination, EvoSwitch, APELIDOS, DataTableDemo, Motorista, MOTORISTAS, NOMES, PROVINCIAS (+1 more)

### Community 34 - "Tipos de Componente"
Cohesion: 0.13
Nodes (13): EvoSize, EvoTone, EvoField, EvoInputPreview, EvoPageItem, evoPageItems(), intervalo(), Anfitriao (+5 more)

### Community 35 - "Scripts npm"
Cohesion: 0.09
Nodes (23): scripts, build, build:lib, build:schematics, gen:agents, gen:registry, new:component, new:layout (+15 more)

### Community 37 - "Entradas de Menu"
Cohesion: 0.16
Nodes (14): painesComEscape, EvoMenuEntries, EvoMenuTarget, EVO_MENU_TRIGGER, EvoMenuAction, EvoMenuCheckboxEntry, EvoMenuEntry, EvoMenuGroupEntry (+6 more)

### Community 38 - "Adaptadores Crud"
Cohesion: 0.15
Nodes (20): CANDIDATOS, crudAdapterByPath(), crudAutoAdapter(), crudIdOf(), lerCaminho(), metaDe(), sameCrudId(), EvoCrudChange (+12 more)

### Community 39 - "Crud Controller Kit"
Cohesion: 0.15
Nodes (9): CrudFormErroBannerComponent, correrHookTransformador(), HookName, resolveCrudKitPlugins(), CRUD_KIT_GLOBAL_PLUGINS, CrudPluginContext, pluginInvalidarRelacionados(), pluginSoftDelete() (+1 more)

### Community 40 - "Gerador new.mjs"
Cohesion: 0.11
Nodes (21): acrescentarDepoisDoUltimo(), alterados, caminhoRelativo(), correr(), dryRun, exportLinha, falhar(), invalido (+13 more)

### Community 41 - "Drawer sobre CDK"
Cohesion: 0.12
Nodes (19): EvoButton, EvoDrawer README, Dialog do CDK, EvoDrawer, EvoDrawerRef, EvoDrawerService, Fragmento da URL (provideEvoDrawers), Migração a partir de app-drawer-overlay (+11 more)

### Community 42 - "Container do Modal"
Cohesion: 0.16
Nodes (14): EvoVariant, EVO_MODAL_INTERNO, EvoModalContainer, EvoModalInterno, EvoModalPrompt, EvoModalPromptData, mensagemDoErro(), EVO_MODAL_DATA (+6 more)

### Community 43 - "EvoModal Overlay"
Cohesion: 0.15
Nodes (8): EvoModal, abrirEvoModal(), EvoModalOverlay, EvoModalOverlayOptions, tokensEmLinha(), EvoModalRef, EvoModalBaseConfig, EvoModalCloseReason

### Community 44 - "Theme Store"
Cohesion: 0.13
Nodes (4): tokensDe(), EvoColorScheme, normalizeTokenName(), EvoThemeStore

### Community 45 - "Select Field V2"
Cohesion: 0.10
Nodes (4): ErroFnOuTexto, FormFieldSelectComponentV2, SelectOptionTemplateContext, SelectOptionV2

### Community 46 - "Pipeline de Release"
Cohesion: 0.11
Nodes (20): Licença UNLICENSED do pacote, environment: release por criar no GitHub, Skill /publicar, tools/publicar.mjs (npm run publicar), Workflow CI (ci.yml), Workflow Release (release.yml), Verificação tag corresponde à versão do pacote, AGENTS.md no pacote e schematic ai-context (+12 more)

### Community 47 - "Barra e Itens de Menu"
Cohesion: 0.17
Nodes (9): EvoMenuBar, EvoMenuCheckbox, EvoMenuGroup, EvoMenuItem, EvoMenuItemBase, EvoMenuRadio, EvoMenuSeparator, ITEM_HOST_INPUTS (+1 more)

### Community 48 - "Erros de Formulário Crud"
Cohesion: 0.17
Nodes (10): EvoCrudDisplay, EvoCrudMode, CrudFormErrors, CrudFormSession, EVO_CRUD_DEFAULT_ERROR, EVO_CRUD_FIELDS_ERROR, EVO_CRUD_FORM_SESSION, EVO_CRUD_CONFIRM_REMOVE (+2 more)

### Community 49 - "Extensões OAuth"
Cohesion: 0.11
Nodes (12): EvoAuthExtensions, oauthEndpoints, OAuthExtension, ../plugins/auth/auth.plugin, endpoint(), EvoClient, EvoEndpoint, EvoEndpointMap (+4 more)

### Community 50 - "Kernel e Error Mapper"
Cohesion: 0.18
Nodes (12): bootstrapEvoPlugins(), camposDe(), CorpoErro, defaultErrorMapper(), mensagemDe(), EvoError, EvoErrorKind, kindFromStatus() (+4 more)

### Community 51 - "Roteador CLAUDE.md"
Cohesion: 0.15
Nodes (13): CLAUDE.md (roteador do projecto), Verificação antes de terminar (build:lib, test:lib, test:schematics, verify-dist), PROJECT_OVERVIEW.md (mapa do código), Bugs já resolvidos (10), Testes Vitest+jsdom: keyCode, typeahead, texto do CSS, Ciclo services/pages resolvido com evoAuthRoutes() em /pages, jsdom não resolve var() nem @layer, Regras de código: zoneless, standalone, signals, OnPush, SSR-safe (+5 more)

### Community 52 - "Guia AGENTS Base"
Cohesion: 0.13
Nodes (15): AGENTS.base.md - guia para agentes de IA, Regras para quem usa a toolkit, layouts README, EvoAuthShell, EvoBlankShell, EvoDashboardShell, pages README, Páginas planeadas (Login, Registo, Recuperar, Dashboard, NotFound) (+7 more)

### Community 53 - "Drawer Overlay"
Cohesion: 0.15
Nodes (7): abrirEvoDrawer(), EvoDrawerOverlay, EvoDrawerOverlayOptions, EvoDrawerRef, EvoDrawerBaseConfig, EvoDrawerCloseReason, Anfitriao

### Community 55 - "Controller Crud"
Cohesion: 0.17
Nodes (18): createCrudController(), abrirCriar(), abrirEditar(), abrirFormulario(), fecharFormulario(), apagar(), apagarItem(), resolveMode() (+10 more)

### Community 56 - "Regras e Fluxos"
Cohesion: 0.14
Nodes (11): Regras invioláveis (7), Política de expiração de sessão (refreshSkewSeconds), Fluxo: autenticação (login, Bearer, refresh), Fluxo: arranque do kernel de plugins, Playground (src/), Gerador resource-plugin (facturas), Interface <Nome>Extensions vazia (declaration merging), Ciclo de vida do plugin: setup() depois augment() (+3 more)

### Community 57 - "Menu na Public API"
Cohesion: 0.11
Nodes (5): EvoMenu, EvoMenuBar, EvoMenuGroup, EvoModal, MenuDemo

### Community 58 - "Shells de Layout"
Cohesion: 0.15
Nodes (5): EvoBlankShell, EvoDashboardShell, EvoNavItem, EvoSidebarState, PainelShell

### Community 59 - "Testes de Geradores"
Cohesion: 0.12
Nodes (10): angularCollection, collection, ./painel.preview, destino, npmignore, origem, raiz, recolher() (+2 more)

### Community 60 - "Input Field V2"
Cohesion: 0.13
Nodes (4): ErroFnOuTexto, FormFieldInputComponentV2, LeftIconDirective, RightIconDirective

### Community 61 - "Drawer Service"
Cohesion: 0.18
Nodes (13): EVO_DRAWER_FRAGMENTS, EvoDrawerFragmentOpener, EvoDrawersOptions, QualquerRef, tokensDe(), EvoDrawerAction, EvoDrawerConfig, EvoDrawerContent (+5 more)

### Community 62 - "Testes TextField"
Cohesion: 0.15
Nodes (12): Anfitriao, AnfitriaoAuto, AnfitriaoForm, AnfitriaoFormAuto, PAISES, EVO_TEXT_FIELD_DEFAULT_MESSAGES, EVO_TEXT_FIELD_MESSAGES, EvoErrorMessage (+4 more)

### Community 63 - "Persistência Studio"
Cohesion: 0.16
Nodes (5): EVO_THEME_PERSISTENCE, EstadoGravacao, EvoStudioHeader, montar(), provideEvoTheme()

### Community 64 - "Armadilhas e Roadmap"
Cohesion: 0.18
Nodes (16): Componentes em falta (EvoCheckbox, EvoRadio, EvoTabs, EvoTooltip), Armadilhas ao construir componentes, Primitivas do CDK: declarar onde o CDK procura (hostDirectives, spike), Overlays no body: copiar tokens, Escape e Tab, ng serve guarda o dist em cache: reiniciar após build:lib, Entry point /crud (TanStack Query), EvoDataTable (sobre CdkTable), EvoDrawer e EvoDrawerService (+8 more)

### Community 65 - "Registo de Componentes"
Cohesion: 0.13
Nodes (15): ../${c.pasta}/${c.pasta}.preview, marked, ./${c.pasta}.docs, componentes, destino, entradas, escrever(), esperados (+7 more)

### Community 66 - "Drawer Ref"
Cohesion: 0.17
Nodes (13): EVO_DRAWER_DATA, injectDrawerRef(), provideEvoDrawers(), botoes(), checkerSemLayout, ComTemplate, dialogo(), esperar() (+5 more)

### Community 67 - "Providers Public API"
Cohesion: 0.13
Nodes (3): routes, demoApiInterceptor(), sessao()

### Community 68 - "Utilitários de Tokens"
Cohesion: 0.18
Nodes (10): EvoTokenRecord, declarations(), isSafeTokenName(), isSafeTokenValue(), buildThemeCss(), BuildThemeCssInput, cssAttributeValue(), empty (+2 more)

### Community 69 - "Modal Data Service"
Cohesion: 0.14
Nodes (3): ModalEntry, ModalDataService, ModalEventsService

### Community 70 - "Hooks do Crud Kit"
Cohesion: 0.14
Nodes (6): CrudKitPlugin, CrudMode, ID, CrudPageStateOptions, CrudResourceLike, useCrudPageState()

### Community 71 - "Dev Dependencies"
Cohesion: 0.12
Nodes (16): devDependencies, @angular/build, @angular/cli, @angular/compiler-cli, jsdom, marked, ng-packagr, postcss (+8 more)

### Community 72 - "Painel do Modal"
Cohesion: 0.23
Nodes (7): EvoModalPanel, EvoModalPreview, EvoModalBeforeCloseFn, EvoModalListeners, EvoModalPosition, EvoModalSize, EvoModalTone

### Community 73 - "Testes EvoSelect"
Cohesion: 0.17
Nodes (9): Anfitriao, AnfitriaoForm, AnfitriaoTemplate, FRUTAS, EVO_SELECT_DEFAULT_MESSAGES, EVO_SELECT_MESSAGES, EvoSelectMessages, provideEvoSelectMessages() (+1 more)

### Community 74 - "Tipos Crud"
Cohesion: 0.17
Nodes (12): EvoCrudControllerConfig, EvoCrudErrorDetails, EvoCrudId, EvoCrudOne, EvoCrudRemoveDecision, EvoCrudResourceConfig, EvoCrudStrategy, MaybePromise (+4 more)

### Community 75 - "Testes EvoModal"
Cohesion: 0.16
Nodes (9): Anfitriao, checkerSemLayout, esperar(), tecla(), EVO_MODAL_DEFAULT_MESSAGES, EVO_MODAL_MESSAGES, EvoModalMessages, provideEvoModalMessages() (+1 more)

### Community 76 - "EvoSwitch"
Cohesion: 0.16
Nodes (3): EvoSwitch, Anfitriao, AnfitriaoForm

### Community 77 - "Plugin Crud"
Cohesion: 0.14
Nodes (9): Alvo, endpoints, EvoCrud, EvoCrudApi, EvoCrudConfig, EvoCrudExtensions, @evolium-kit/toolkit/services, EvoResourceMap (+1 more)

### Community 79 - "Plugin Facturas"
Cohesion: 0.13
Nodes (9): endpoints, EstadoFactura, @evolium-kit/toolkit/services, EvoResourceMap, Factura, FacturaDto, Facturas, FacturasApi (+1 more)

### Community 80 - "App SSR Config"
Cohesion: 0.21
Nodes (7): @angular/platform-browser, @angular/ssr, App, appConfig, config, serverConfig, serverRoutes

### Community 81 - "Crud Resource Kit"
Cohesion: 0.20
Nodes (12): adaptadorAutoDetectar(), criarAdaptadorPorCaminho(), getByPath(), CrudControllerConfig, CrudListAdapter, CrudListMeta, CrudListResult, CrudResourceConfig (+4 more)

### Community 82 - "Bugs Conhecidos"
Cohesion: 0.16
Nodes (12): ng add não injecta withComponentInputBinding(), ng add falha: limitação de metadados abreviados do GitHub Packages, temSimbolo() falso positivo por substring, Token do GitHub Packages por programador, Não existe backend real (só mock demo-api.interceptor), Fluxo: instalação por ng add, Bug #10: ng add não registava o Theme Studio (corrigido 0.1.1), Fase 8: agentes Claude Code + MCP do GitHub (por fazer) (+4 more)

### Community 83 - "Opções de Build"
Cohesion: 0.14
Nodes (14): options, assets, browser, exclude, include, outputMode, security, server (+6 more)

### Community 84 - "Contrato de Componentes"
Cohesion: 0.15
Nodes (10): components README, Contrato do componente (OnPush, signals, data-evo-*), EvoBadge, EvoCard, Gerador npm run new:component, Como a personalização se resolve (cascata de 6 níveis), EvoSwitch README, ControlValueAccessor (+2 more)

### Community 85 - "Preview Data Table"
Cohesion: 0.18
Nodes (7): CLIENTES, EvoDataTablePreview, Factura, FACTURAS, EvoDataTableColumn, comparar(), vazio()

### Community 86 - "Testes ModalService"
Cohesion: 0.20
Nodes (11): provideEvoModals(), botoes(), checkerSemLayout, ComTemplate, dialogo(), esperar(), estabilizar(), FormPessoa (+3 more)

### Community 87 - "Cascata de Tema"
Cohesion: 0.21
Nodes (10): assertRouteReachable() nunca exercitado com wildcard, Paleta de cores sem validação de marca, Fluxo: cascata de tema em quatro níveis, buildThemeCss(): validação de tokens contra injecção de CSS, Quatro níveis de override (instância, variante, subárvore, global), Persistência runtime vs design-time (Exportar), Theme Studio (/_evo/theme), Três camadas de tokens (primitivo, semântico, componente) (+2 more)

### Community 88 - "Dependências Toolkit"
Cohesion: 0.15
Nodes (13): dependencies, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/platform-server (+5 more)

### Community 89 - "Menu sobre CdkMenu"
Cohesion: 0.17
Nodes (13): Preferir primitivas do Angular CDK, CdkTable, EvoMenu README, CdkMenu, EvoContextMenuTrigger, EvoMenu, EvoMenuBar, EvoMenuEntry (menu por dados) (+5 more)

### Community 90 - "Testes de Serviços"
Cohesion: 0.18
Nodes (8): evoDispatchInterceptor(), EvoResourceMap, Factura, FacturaDto, Facturas, FacturasApi, facturasEndpoints, ./resource-map

### Community 92 - "Docs Campos e Select"
Cohesion: 0.23
Nodes (10): EvoField, EvoInput, EvoSelect README, EvoSelect, EvoSelectOption, EvoTextField README, type=autoComplete (combobox com opções do evo-select), EvoTextField (+2 more)

### Community 93 - "Docs Tabela e Paginação"
Cohesion: 0.18
Nodes (10): EvoDataTable README, Acessibilidade da tabela (aria-sort, LiveAnnouncer), EvoDataTable, Directivas evoCell / evoRowActions / evoRowDetail, Tokens --evo-data-table-* (19), EvoPagination README, evoPageItems(), EvoPagination (+2 more)

### Community 95 - "Triggers de Menu"
Cohesion: 0.24
Nodes (3): EvoContextMenuTrigger, EvoMenuTrigger, EvoMenuTriggerBase

### Community 96 - "Directiva evoTokens"
Cohesion: 0.23
Nodes (5): EvoTokensDirective, Anfitriao, EvoTokenName, EvoTokenNames, EvoTokenValue

### Community 97 - "Crud Hook Runner"
Cohesion: 0.23
Nodes (6): CrudHookRunner, EvoCrudHookError, EvoCrudHookName, hookDe(), QualquerHook, EvoCrudHookContext

### Community 98 - "Modais Alerta Confirmação"
Cohesion: 0.18
Nodes (3): ModalAlertaComponent, ModalConfirmacaoComponent, ModalGenericoComponent

### Community 99 - "Targets Angular"
Cohesion: 0.20
Nodes (11): build, serve, test, builder, configurations, defaultConfiguration, architect, builder (+3 more)

### Community 100 - "Docs do Core"
Cohesion: 0.20
Nodes (9): Metadados .tokens.ts para o Theme Studio, core README, EvoComponentMeta / provideEvoComponentMeta, EvoTokenMap / EvoTokenNames (tipado), EvoTokensDirective ([evoTokens]), EvoThemeStudioPage / provideEvoThemeStudio, Selector Global vs Variante no Studio, Personalização em quatro alcances (+1 more)

### Community 101 - "Ordenação de Plugins"
Cohesion: 0.22
Nodes (4): EvoServiceFeature, sortPlugins(), EvoPlugin, vitest

### Community 102 - "Alert Modal Tipos"
Cohesion: 0.25
Nodes (5): IconConfig, AlertButton, AlertIcon, ModalReference, AlertModelTamanho

### Community 103 - "Directivas Data Table"
Cohesion: 0.24
Nodes (4): EvoDataTableCell, EvoDataTableRowActions, EvoDataTableRowContext, EvoDataTableRowDetail

### Community 104 - "Docs do Crud"
Cohesion: 0.20
Nodes (10): EvoDataTableSource, Três formas de dar os dados (data, source, paging server), crud README, crudPlugin, injectCrudController, injectCrudForm, injectCrudPage, injectCrudResource (+2 more)

### Community 105 - "Storage Adapters"
Cohesion: 0.22
Nodes (5): cookieStorage(), EvoCookieStorageOptions, EvoLocalStorageOptions, parseCookies(), EvoStorage

### Community 106 - "angular.json"
Cohesion: 0.22
Nodes (8): cli, analytics, packageManager, schematicCollections, newProjectRoot, projects, $schema, version

### Community 108 - "Skills Criar e Migrar"
Cohesion: 0.36
Nodes (8): Medir biblioteca de referência no Chrome (Playwriter), Tabela medido para decisão (manter, corrigir, acrescentar, deixar de fora), Skill /criar-recurso, Fases 0-7 de criação de um recurso, Três modos: migrar, novo, doc, Paragens obrigatórias antes de gerar código (Fase 2), Skill /migrar-recurso, Inquérito de tokens (componentes)

### Community 115 - "Schema ai-context"
Cohesion: 0.29
Nodes (6): $id, properties, required, $schema, title, type

### Community 120 - "Config Development"
Cohesion: 0.33
Nodes (6): development, buildTarget, extractLicenses, optimization, sourceMap, tsConfig

### Community 121 - "Config Production"
Cohesion: 0.33
Nodes (6): production, budgets, buildTarget, outputHashing, tsConfig, configurations

### Community 122 - "Projecto Playground"
Cohesion: 0.33
Nodes (6): prefix, projectType, root, schematics, sourceRoot, evolium-app-overview

### Community 124 - "Crud Toasts"
Cohesion: 0.33
Nodes (3): EvoCrudOperation, EvoCrudToastMessages, VERBO

### Community 125 - "ng-package"
Cohesion: 0.33
Nodes (5): assets, dest, lib, entryFile, $schema

### Community 127 - "Arquitectura e Migrações"
Cohesion: 0.33
Nodes (4): Entry points (core, theme, components, layouts, pages, services), Recursos migrados para a toolkit (registo), Comando /migrar-recurso, Por migrar (whapper-auth-background, Validacao.service)

### Community 128 - "Docs do Theme"
Cohesion: 0.40
Nodes (5): theme README, Duas estratégias de persistência (runtime e design-time), EvoThemeStore, provideEvoTheme (withTokens, withDarkMode, withPersistence), Tokens em três camadas (primitivos, semânticos, componente)

### Community 129 - "Servidor Express"
Cohesion: 0.33
Nodes (5): express, angularApp, app, browserDistFolder, reqHandler

### Community 132 - "Schematics Categorias"
Cohesion: 0.40
Nodes (5): layout, category, schematics, @evolium-kit/toolkit:page, @evolium-kit/toolkit:ui-component

### Community 133 - "Projecto Toolkit"
Cohesion: 0.40
Nodes (5): toolkit, prefix, projectType, root, sourceRoot

### Community 134 - "Mensagens Data Table"
Cohesion: 0.40
Nodes (3): EVO_DATA_TABLE_DEFAULT_MESSAGES, EVO_DATA_TABLE_MESSAGES, EvoDataTableMessages

### Community 135 - "Service Feature Kinds"
Cohesion: 0.40
Nodes (5): EvoServiceFeatureKind, BaseUrl, ErrorMapper, Plugin, Storage

### Community 136 - "Theme Feature Kinds"
Cohesion: 0.40
Nodes (5): EvoThemeFeatureKind, DarkMode, Persistence, Tokens, Variants

## Knowledge Gaps
- **599 isolated node(s):** `$schema`, `version`, `packageManager`, `schematicCollections`, `analytics` (+594 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1084 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `Ordenação de Plugins` to `Testes de Schematics`, `Previews de Componentes`, `Script de Publicação`, `Gerador AGENTS.md`, `Dependências Raiz`, `Tokens Data Table`, `Mensagens do Drawer`, `Testes EvoMenu`, `Tipos de Componente`, `Extensões OAuth`, `Kernel e Error Mapper`, `Testes de Geradores`, `Testes TextField`, `Persistência Studio`, `Drawer Ref`, `Utilitários de Tokens`, `Testes EvoSelect`, `Testes EvoModal`, `EvoSwitch`, `App SSR Config`, `Testes ModalService`, `Testes de Serviços`, `Directiva evoTokens`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `caminho()` connect `Pipeline de Release` to `Gerador AGENTS.md`, `Plugin Crud`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `EvoThemeStudioPage` connect `Theme Studio Page` to `Theme Studio Docs`, `Metadados de Tokens`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `packageManager` to the rest of the system?**
  _599 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes de Schematics` be split into smaller, more focused modules?**
  _Cohesion score 0.06174863387978142 - nodes in this community are weakly interconnected._
- **Should `Campos de Formulário` be split into smaller, more focused modules?**
  _Cohesion score 0.0782312925170068 - nodes in this community are weakly interconnected._
- **Should `Alert Modal Eventos` be split into smaller, more focused modules?**
  _Cohesion score 0.05319148936170213 - nodes in this community are weakly interconnected._