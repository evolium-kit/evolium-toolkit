import { Dialog } from '@angular/cdk/dialog';
import { Location, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  Injector,
  PLATFORM_ID,
  Signal,
  TemplateRef,
  Type,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { normalizeTokenName } from '@evolium-kit/toolkit/core';
import { EVO_DRAWER_INTERNO, EvoDrawerContainer, EvoDrawerInterno } from './evo-drawer-container';
import { abrirEvoDrawer } from './drawer-overlay';
import { EVO_DRAWER_DATA, EvoDrawerRef } from './drawer-ref';
import { EvoDrawerConfig, EvoDrawerContent, EvoDrawerEvents } from './drawer.types';

/** Abre o drawer de um fragmento registado. Recebe o serviço; o fragmento é posto sozinho. */
export type EvoDrawerFragmentOpener = (drawers: EvoDrawerService) => unknown;

export interface EvoDrawersOptions {
  /**
   * Drawers que reabrem quando a página carrega (ou se navega) com o
   * `#fragmento` correspondente na URL.
   */
  readonly fragments?: Readonly<Record<string, EvoDrawerFragmentOpener>>;
}

export const EVO_DRAWER_FRAGMENTS = new InjectionToken<
  readonly Readonly<Record<string, EvoDrawerFragmentOpener>>[]
>('EVO_DRAWER_FRAGMENTS');

/**
 * Regista fragmentos da URL que abrem drawers, e arranca o `EvoDrawerService`
 * com a aplicação para os detectar logo no primeiro carregamento.
 *
 * ```ts
 * provideEvoDrawers({
 *   fragments: {
 *     'novo-motorista': (d) => d.open(FormMotorista, { title: 'Novo motorista' }),
 *   },
 * })
 * ```
 *
 * Só é preciso para os fragmentos: o serviço funciona sem isto.
 */
export function provideEvoDrawers(opcoes: EvoDrawersOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: EVO_DRAWER_FRAGMENTS, useValue: opcoes.fragments ?? {}, multi: true },
    provideEnvironmentInitializer(() => void inject(EvoDrawerService)),
  ]);
}

type QualquerRef = EvoDrawerRef<unknown, EvoDrawerEvents>;

/**
 * Abre drawers a partir de código: um componente/template com dados e
 * eventos, ou só título/mensagem/acções.
 *
 * ```ts
 * const drawers = inject(EvoDrawerService);
 *
 * const ref = drawers.open(FormMotorista, { title: 'Novo motorista', data: { mode: 'create' } });
 * const motorista = await ref.closed;
 * ```
 *
 * No servidor não abre nada: devolve uma referência já fechada (`closed`
 * resolve `undefined`).
 */
@Injectable({ providedIn: 'root' })
export class EvoDrawerService {
  private readonly dialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly router = inject(Router, { optional: true });
  private readonly location = inject(Location, { optional: true });
  private readonly fragmentos: Readonly<Record<string, EvoDrawerFragmentOpener>> = Object.assign(
    {},
    ...(inject(EVO_DRAWER_FRAGMENTS, { optional: true }) ?? []),
  );

  private readonly abertos = signal<readonly QualquerRef[]>([]);
  private contador = 0;
  /** Fragmento do registo a ser aberto agora, para `open()` o associar. */
  private fragmentoEmAbertura: string | null = null;

  /** Os drawers abertos, do mais antigo para o mais recente. */
  readonly openDrawers: Signal<readonly QualquerRef[]> = this.abertos.asReadonly();

  constructor() {
    const router = this.router;
    if (!this.browser || !router) return;

    router.events.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((evento) => {
      if (evento instanceof NavigationEnd) this.sincronizarComUrl();
    });
    if (router.navigated) this.sincronizarComUrl();
  }

  /** Abre um drawer só com título/mensagem/acções, sem conteúdo próprio. */
  open<R = unknown, E extends object = EvoDrawerEvents>(
    config: EvoDrawerConfig<never, R, E>,
  ): EvoDrawerRef<R, E>;
  /**
   * Abre um componente standalone ou um `TemplateRef` dentro de um drawer.
   * O componente lê os dados com `inject(EVO_DRAWER_DATA)` e a referência com
   * `injectDrawerRef()`; o template recebe `let-data` e `let-ref="ref"`.
   */
  open<D = unknown, R = unknown, E extends object = EvoDrawerEvents>(
    conteudo: EvoDrawerContent,
    config?: EvoDrawerConfig<D, R, E>,
  ): EvoDrawerRef<R, E>;
  open(
    conteudoOuConfig: EvoDrawerContent | EvoDrawerConfig,
    config?: EvoDrawerConfig,
  ): QualquerRef {
    const semConteudo =
      typeof conteudoOuConfig === 'object' && !(conteudoOuConfig instanceof TemplateRef);
    return semConteudo
      ? this.abrir(null, conteudoOuConfig as EvoDrawerConfig)
      : this.abrir(conteudoOuConfig as Type<unknown> | TemplateRef<unknown>, config ?? {});
  }

  /** Fecha o drawer com este `id` ou `fragment`. Devolve `false` se não houver. */
  close(idOuFragmento: string): boolean {
    const ref = this.abertos().find((r) => r.id === idOuFragmento || r.fragment === idOuFragmento);
    ref?._fecharComo(undefined, 'programmatic');
    return !!ref;
  }

  /** Fecha todos os drawers abertos pelo serviço. */
  closeAll(): void {
    for (const ref of [...this.abertos()].reverse()) ref._fecharComo(undefined, 'programmatic');
  }

  // ---------------------------------------------------------------- interno

  private abrir(
    conteudo: Type<unknown> | TemplateRef<unknown> | null,
    config: EvoDrawerConfig<unknown, unknown, EvoDrawerEvents>,
  ): QualquerRef {
    const id = config.id ?? `evo-drawer-s${this.contador++}`;
    const existente = this.abertos().find((r) => r.id === id);
    if (existente) return existente;

    const fragment = (config.fragment ?? this.fragmentoEmAbertura)?.trim() || null;
    const ref: QualquerRef = new EvoDrawerRef(id, this.router ? fragment : null);

    if (!this.browser) {
      ref._terminar(undefined, 'programmatic');
      return ref;
    }

    const acoes = config.actions ?? [];
    const interno: EvoDrawerInterno = {
      conteudo,
      config,
      ref,
      titleId: `${id}-title`,
      descriptionId: `${id}-description`,
      acoes,
    };

    for (const [nome, fn] of Object.entries(config.on ?? {})) {
      if (fn) ref.on(nome, fn as (payload: unknown) => void);
    }

    let empurrado = false;
    const overlay = abrirEvoDrawer<unknown>(this.dialog, EvoDrawerContainer, {
      base: config,
      dialog: {
        id,
        injector: config.injector ?? this.injector,
        providers: [
          { provide: EVO_DRAWER_INTERNO, useValue: interno },
          { provide: EVO_DRAWER_DATA, useValue: config.data },
          { provide: EvoDrawerRef, useValue: ref },
        ],
        ariaLabelledBy: config.title && !config.ariaLabel ? interno.titleId : null,
        ariaDescribedBy: config.description ? interno.descriptionId : null,
      },
      tokens: tokensDe(config.tokens),
      aoFechar: (result, reason) => {
        ref._terminar(result, reason);
        this.abertos.update((lista) => lista.filter((r) => r !== ref));
        if (ref.fragment && reason !== 'navigation') this.retirarFragmento(ref.fragment, empurrado);
      },
    });
    ref._ligar(overlay);
    this.abertos.update((lista) => [...lista, ref]);

    if (ref.fragment) empurrado = this.porFragmento(ref.fragment);
    return ref;
  }

  private fragmentoActual(): string | null {
    return this.router ? (this.router.parseUrl(this.router.url).fragment ?? null) : null;
  }

  /** Fecha os drawers cujo fragmento saiu da URL e abre o do fragmento novo. */
  private sincronizarComUrl(): void {
    const actual = this.fragmentoActual();
    for (const ref of this.abertos()) {
      if (ref.fragment && ref.fragment !== actual) ref._fecharComo(undefined, 'navigation');
    }

    const abrir = actual ? this.fragmentos[actual] : undefined;
    if (!actual || !abrir || this.abertos().some((r) => r.fragment === actual)) return;

    this.fragmentoEmAbertura = actual;
    try {
      abrir(this);
    } finally {
      this.fragmentoEmAbertura = null;
    }
  }

  /** Põe o fragmento na URL, numa entrada nova do histórico. Devolve se o fez. */
  private porFragmento(fragment: string): boolean {
    if (!this.router || this.fragmentoActual() === fragment) return false;
    const arvore = this.router.parseUrl(this.router.url);
    arvore.fragment = fragment;
    void this.router.navigateByUrl(arvore);
    return true;
  }

  /**
   * Tira o fragmento da URL. Se foi o drawer que o pôs, volta atrás no
   * histórico, para o botão Voltar não reabrir o drawer que acabou de fechar.
   */
  private retirarFragmento(fragment: string, empurrado: boolean): void {
    if (!this.router || this.fragmentoActual() !== fragment) return;
    if (empurrado && this.location) {
      this.location.back();
      return;
    }
    const arvore = this.router.parseUrl(this.router.url);
    arvore.fragment = null;
    void this.router.navigateByUrl(arvore, { replaceUrl: true });
  }
}

function tokensDe(tokens: EvoDrawerConfig['tokens']): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const [nome, valor] of Object.entries(tokens ?? {})) {
    if (valor !== null && valor !== undefined) resultado[normalizeTokenName(nome)] = String(valor);
  }
  return resultado;
}
