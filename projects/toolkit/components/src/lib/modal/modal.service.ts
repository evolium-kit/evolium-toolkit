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
import {
  EVO_MODAL_INTERNO,
  EvoModalContainer,
  EvoModalInterno,
  EvoModalPrompt,
  EvoModalPromptData,
} from './evo-modal-container';
import { abrirEvoModal } from './modal-overlay';
import { EVO_MODAL_DATA, EvoModalRef } from './modal-ref';
import { EVO_MODAL_MESSAGES } from './modal.messages';
import {
  EvoModalAction,
  EvoModalAlertConfig,
  EvoModalConfig,
  EvoModalConfirmConfig,
  EvoModalEvents,
  EvoModalPromptConfig,
} from './modal.types';

/** Abre o modal de um fragmento registado. Recebe o serviço; o fragmento é posto sozinho. */
export type EvoModalFragmentOpener = (modals: EvoModalService) => unknown;

export interface EvoModalsOptions {
  /**
   * Modais que reabrem quando a página carrega (ou se navega) com o
   * `#fragmento` correspondente na URL.
   */
  readonly fragments?: Readonly<Record<string, EvoModalFragmentOpener>>;
}

export const EVO_MODAL_FRAGMENTS = new InjectionToken<
  readonly Readonly<Record<string, EvoModalFragmentOpener>>[]
>('EVO_MODAL_FRAGMENTS');

/**
 * Regista fragmentos da URL que abrem modais, e arranca o `EvoModalService`
 * com a aplicação para os detectar logo no primeiro carregamento.
 *
 * ```ts
 * provideEvoModals({
 *   fragments: {
 *     'registar-motorista': (m) => m.open(FormMotorista, { title: 'Registar motorista' }),
 *   },
 * })
 * ```
 *
 * Só é preciso para os fragmentos: o serviço funciona sem isto.
 */
export function provideEvoModals(opcoes: EvoModalsOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: EVO_MODAL_FRAGMENTS, useValue: opcoes.fragments ?? {}, multi: true },
    provideEnvironmentInitializer(() => void inject(EvoModalService)),
  ]);
}

type QualquerRef = EvoModalRef<unknown, EvoModalEvents>;

/**
 * Abre modais a partir de código: alertas, confirmações, um campo de texto,
 * ou qualquer componente/template com dados e eventos.
 *
 * ```ts
 * const modals = inject(EvoModalService);
 *
 * await modals.success('Pagamento aceite.');
 * if (await modals.confirm({ message: 'Eliminar a factura?', tone: 'danger' })) { … }
 *
 * const ref = modals.open(FormMotorista, { title: 'Novo motorista', data: { mode: 'create' } });
 * const motorista = await ref.closed;
 * ```
 *
 * No servidor não abre nada: devolve uma referência já fechada (`closed`
 * resolve `undefined`, `confirm()` resolve `false`).
 */
@Injectable({ providedIn: 'root' })
export class EvoModalService {
  private readonly dialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private readonly mensagens = inject(EVO_MODAL_MESSAGES);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly router = inject(Router, { optional: true });
  private readonly location = inject(Location, { optional: true });
  private readonly fragmentos: Readonly<Record<string, EvoModalFragmentOpener>> = Object.assign(
    {},
    ...(inject(EVO_MODAL_FRAGMENTS, { optional: true }) ?? []),
  );

  private readonly abertos = signal<readonly QualquerRef[]>([]);
  private contador = 0;
  /** Fragmento do registo a ser aberto agora, para `open()` o associar. */
  private fragmentoEmAbertura: string | null = null;

  /** Os modais abertos, do mais antigo para o mais recente. */
  readonly openModals: Signal<readonly QualquerRef[]> = this.abertos.asReadonly();

  constructor() {
    const router = this.router;
    if (!this.browser || !router) return;

    router.events.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((evento) => {
      if (evento instanceof NavigationEnd) this.sincronizarComUrl();
    });
    if (router.navigated) this.sincronizarComUrl();
  }

  /** Abre um modal só com título/mensagem/acções, sem conteúdo próprio. */
  open<R = unknown, E extends object = EvoModalEvents>(
    config: EvoModalConfig<never, R, E>,
  ): EvoModalRef<R, E>;
  /**
   * Abre um componente standalone ou um `TemplateRef` dentro de um modal.
   * O componente lê os dados com `inject(EVO_MODAL_DATA)` e a referência com
   * `injectModalRef()`; o template recebe `let-data` e `let-ref="ref"`.
   */
  open<D = unknown, R = unknown, E extends object = EvoModalEvents>(
    conteudo: Type<unknown> | TemplateRef<unknown>,
    config?: EvoModalConfig<D, R, E>,
  ): EvoModalRef<R, E>;
  open(
    conteudoOuConfig: Type<unknown> | TemplateRef<unknown> | EvoModalConfig,
    config?: EvoModalConfig,
  ): QualquerRef {
    const semConteudo =
      typeof conteudoOuConfig === 'object' && !(conteudoOuConfig instanceof TemplateRef);
    return semConteudo
      ? this.abrir(null, conteudoOuConfig as EvoModalConfig)
      : this.abrir(conteudoOuConfig as Type<unknown> | TemplateRef<unknown>, config ?? {});
  }

  /** Mensagem com um botão. Resolve quando fechar. */
  async alert(config: EvoModalAlertConfig): Promise<void> {
    const ref = this.abrir(null, {
      ...config,
      actions: [
        {
          label: config.okLabel ?? this.mensagens.ok,
          variant: config.tone === 'danger' ? 'danger' : 'solid',
        },
      ],
    });
    await ref.closed;
  }

  success(message: string, title = this.mensagens.successTitle): Promise<void> {
    return this.alert({ tone: 'success', title, message });
  }

  error(message: string, title = this.mensagens.errorTitle): Promise<void> {
    return this.alert({ tone: 'danger', title, message });
  }

  warning(message: string, title = this.mensagens.warningTitle): Promise<void> {
    return this.alert({ tone: 'warning', title, message });
  }

  info(message: string, title = this.mensagens.infoTitle): Promise<void> {
    return this.alert({ tone: 'info', title, message });
  }

  /**
   * Pergunta sim/não. Resolve `true` só se o utilizador confirmar; Escape,
   * fundo, × e Cancelar dão `false`. Com `tone: 'danger'`, o botão de
   * confirmar é `danger` e o foco começa em Cancelar.
   */
  async confirm(config: EvoModalConfirmConfig | string): Promise<boolean> {
    const c: EvoModalConfirmConfig = typeof config === 'string' ? { message: config } : config;
    const perigo = c.tone === 'danger';
    const ref = this.abrir(null, {
      tone: 'question',
      title: this.mensagens.confirmTitle,
      ...c,
      actions: [
        {
          label: c.cancelLabel ?? this.mensagens.cancel,
          variant: 'ghost',
          value: false,
          autofocus: perigo,
        },
        {
          label: c.confirmLabel ?? this.mensagens.confirm,
          variant: perigo ? 'danger' : 'solid',
          value: true,
          autofocus: !perigo,
        },
      ] satisfies EvoModalAction<boolean>[],
    });
    return (await ref.closed) === true;
  }

  /** Pede um texto. Resolve com o texto, ou `null` se cancelar. Enter confirma. */
  async prompt(config: EvoModalPromptConfig): Promise<string | null> {
    const valor = signal(config.value ?? '');
    const required = config.required ?? false;
    const ref = this.abrir(EvoModalPrompt, {
      ...config,
      data: {
        valor,
        label: config.label ?? '',
        placeholder: config.placeholder ?? '',
        required,
      } satisfies EvoModalPromptData,
      actions: [
        { label: config.cancelLabel ?? this.mensagens.cancel, variant: 'ghost', value: null },
        {
          label: config.confirmLabel ?? this.mensagens.confirm,
          handler: () => valor(),
          disabled: required ? () => !valor().trim() : undefined,
        },
      ] satisfies EvoModalAction<string | null>[],
    });
    return ((await ref.closed) as string | null | undefined) ?? null;
  }

  /** Fecha o modal com este `id` ou `fragment`. Devolve `false` se não houver. */
  close(idOuFragmento: string): boolean {
    const ref = this.abertos().find((r) => r.id === idOuFragmento || r.fragment === idOuFragmento);
    ref?._fecharComo(undefined, 'programmatic');
    return !!ref;
  }

  /** Fecha todos os modais abertos pelo serviço. */
  closeAll(): void {
    for (const ref of [...this.abertos()].reverse()) ref._fecharComo(undefined, 'programmatic');
  }

  // ---------------------------------------------------------------- interno

  private abrir(
    conteudo: Type<unknown> | TemplateRef<unknown> | null,
    config: EvoModalConfig<unknown, unknown, EvoModalEvents>,
  ): QualquerRef {
    const id = config.id ?? `evo-modal-s${this.contador++}`;
    const existente = this.abertos().find((r) => r.id === id);
    if (existente) return existente;

    const fragment = (config.fragment ?? this.fragmentoEmAbertura)?.trim() || null;
    const ref: QualquerRef = new EvoModalRef(id, this.router ? fragment : null);

    if (!this.browser) {
      ref._terminar(undefined, 'programmatic');
      return ref;
    }

    const acoes = config.actions ?? (conteudo ? [] : [{ label: this.mensagens.ok }]);
    const comFoco = acoes.findIndex((a) => a.autofocus);
    const interno: EvoModalInterno = {
      conteudo,
      config,
      ref,
      titleId: `${id}-title`,
      messageId: `${id}-message`,
      acoes,
      // Com conteúdo próprio, o foco vai para o primeiro campo dele (o CDK
      // escolhe); só com mensagem, para o último botão (a acção principal).
      foco: comFoco >= 0 ? comFoco : conteudo ? -1 : acoes.length - 1,
    };

    for (const [nome, fn] of Object.entries(config.on ?? {})) {
      if (fn) ref.on(nome, fn as (payload: unknown) => void);
    }

    let empurrado = false;
    const overlay = abrirEvoModal<unknown>(this.dialog, EvoModalContainer, {
      base: config,
      dialog: {
        id,
        injector: config.injector ?? this.injector,
        providers: [
          { provide: EVO_MODAL_INTERNO, useValue: interno },
          { provide: EVO_MODAL_DATA, useValue: config.data },
          { provide: EvoModalRef, useValue: ref },
        ],
        ariaLabelledBy: config.title && !config.ariaLabel ? interno.titleId : null,
        ariaDescribedBy: config.message ? interno.messageId : null,
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

  /** Fecha os modais cujo fragmento saiu da URL e abre o do fragmento novo. */
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
   * Tira o fragmento da URL. Se foi o modal que o pôs, volta atrás no
   * histórico, para o botão Voltar não reabrir o modal que acabou de fechar.
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

function tokensDe(tokens: EvoModalConfig['tokens']): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const [nome, valor] of Object.entries(tokens ?? {})) {
    if (valor !== null && valor !== undefined) resultado[normalizeTokenName(nome)] = String(valor);
  }
  return resultado;
}
