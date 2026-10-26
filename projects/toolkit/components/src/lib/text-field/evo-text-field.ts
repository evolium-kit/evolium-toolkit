import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlValueAccessor, NgControl, Validators } from '@angular/forms';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  ConnectedOverlayPositionChange,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { EvoSize } from '../component-types';
import { EvoField } from '../input/evo-input';
import { EvoSelectItem } from '../select/select-item';
import {
  EvoSelectOption,
  EvoSelectOptionDef,
  EvoSelectSearchFn,
  evoSelectDefaultSearch,
} from '../select/select-option';
import { EVO_TEXT_FIELD_MESSAGES, EvoErrorMessage } from './text-field.messages';

/* eslint-disable @typescript-eslint/ban-types */

/**
 * Tipo do campo. `textarea` troca o `<input>` por um `<textarea>`;
 * `autoComplete` junta ao `<input>` um painel de sugestões (ver `options`).
 */
export type EvoTextFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'number'
  | 'textarea'
  | 'autoComplete'
  | (string & {});

/**
 * Função que decide a mensagem de erro a partir do controlo. Devolve `null`
 * (ou `''`) para não mostrar erro. Recebe `null` se não houver formulário.
 */
export type EvoTextFieldErrorFn = (control: AbstractControl | null) => string | null;

/** Uma opção visível no painel, com a sua posição em `options`. */
interface Linha<V, D> {
  readonly opcao: EvoSelectOption<V, D>;
  readonly indice: number;
}

interface Grupo<V, D> {
  readonly chave: string;
  readonly nome: string | null;
  readonly id: string;
  readonly linhas: Linha<V, D>[];
}

/** Abre por baixo; se não couber, por cima. */
const POSICOES: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

const EH_IMAGEM = /^(https?:\/\/|data:image|\/|\.\/|\.\.\/)|\.(png|jpe?g|svg|gif|webp|avif)$/i;

/** `null`, `undefined` e `''` querem dizer "sem escolha". */
const semValor = (valor: unknown): boolean => valor == null || valor === '';

/**
 * Contador de módulo, e não `crypto.randomUUID()`: não depende de APIs do
 * browser nem de contexto seguro, e corre igual no servidor.
 */
let proximoId = 0;

/**
 * Campo de texto completo numa só tag: etiqueta, controlo, ícones, ajuda, erro
 * e contador.
 *
 * Compõe o `EvoField` (disposição, etiqueta) e o aspecto do `EvoInput` (a
 * caixa usa a classe `evo-input`), por isso herda os tokens `--evo-input-*` e
 * `--evo-field-*`. Só os `--evo-text-field-*` são próprios.
 *
 * ```html
 * <evo-text-field formControlName="email" label="Email" type="email" autocomplete="email" />
 * ```
 *
 * Com `type="autoComplete"` o próprio `<input>` é o combobox: escrever filtra
 * as `options` num painel por baixo (o mesmo desenho do `evo-select`), e o
 * foco nunca sai do campo. É a alternativa ao `searchable` do `evo-select`,
 * que tem um botão como gatilho e a pesquisa dentro do painel.
 *
 * ```html
 * <evo-text-field formControlName="pais" label="País" type="autoComplete" [options]="paises" />
 * ```
 *
 * Implementa `ControlValueAccessor` pelo `NgControl` (e não por
 * `NG_VALUE_ACCESSOR`), para poder ler o estado do controlo e mostrar o erro
 * sem configuração. Ver README.md desta pasta.
 *
 * `V` e `D` só contam no `autoComplete` (o tipo do `value` e do `data` das
 * opções); sem opções, `V` é `string`.
 */
@Component({
  selector: 'evo-text-field',
  imports: [EvoField, CdkOverlayOrigin, CdkConnectedOverlay, EvoSelectItem, NgTemplateOutlet],
  template: `
    <evo-field>
      @if (label()) {
        <label class="evo-text-field__label" [id]="labelId" [for]="id">
          {{ label() }}
          @if (obrigatorio()) {
            <span class="evo-text-field__required" aria-hidden="true">*</span>
          } @else if (optional()) {
            <span class="evo-text-field__optional">{{ mensagens.optional }}</span>
          }
        </label>
      }

      <div
        #caixa
        class="evo-input evo-text-field__box"
        cdkOverlayOrigin
        #origem="cdkOverlayOrigin"
        [attr.data-evo-size]="size()"
        [attr.data-evo-invalid]="invalido() ? '' : null"
        (click)="focarSeFora($event)"
      >
        <span class="evo-text-field__prefix"><ng-content select="[slot=prefix]" /></span>

        @if (type() === 'textarea') {
          <textarea
            #controlo
            class="evo-text-field__control"
            [id]="id"
            [value]="texto()"
            [rows]="rows()"
            [style.min-block-size]="autoResize() ? rows() + 'lh' : null"
            [attr.data-evo-auto-resize]="autoResize() ? '' : null"
            [disabled]="inactivo()"
            [readOnly]="readonly()"
            [placeholder]="placeholder()"
            [attr.autocomplete]="autocomplete() || null"
            [attr.inputmode]="inputmode() || null"
            [attr.maxlength]="maxlength() ?? null"
            [attr.aria-invalid]="invalido() ? 'true' : null"
            [attr.aria-required]="obrigatorio() ? 'true' : null"
            [attr.aria-describedby]="descritoPor()"
            (input)="aoEscrever($event)"
            (blur)="aoSair()"
          ></textarea>
        } @else {
          <input
            #controlo
            class="evo-text-field__control"
            [id]="id"
            [type]="tipoNativo()"
            [value]="texto()"
            [disabled]="inactivo()"
            [readOnly]="readonly()"
            [placeholder]="placeholder()"
            [attr.role]="autoCompletar() ? 'combobox' : null"
            [attr.aria-autocomplete]="autoCompletar() ? 'list' : null"
            [attr.aria-expanded]="autoCompletar() ? painelVisivel() : null"
            [attr.aria-controls]="autoCompletar() && painelVisivel() ? listaId : null"
            [attr.aria-activedescendant]="autoCompletar() && painelVisivel() ? activoId() : null"
            [attr.aria-busy]="autoCompletar() && loading() ? 'true' : null"
            [attr.autocomplete]="autoCompletar() ? 'off' : autocomplete() || null"
            [attr.inputmode]="inputmode() || null"
            [attr.maxlength]="maxlength() ?? null"
            [attr.aria-invalid]="invalido() ? 'true' : null"
            [attr.aria-required]="obrigatorio() ? 'true' : null"
            [attr.aria-describedby]="descritoPor()"
            (input)="aoEscrever($event)"
            (keydown)="aoTeclar($event)"
            (mousedown)="aoPremirCampo()"
            (focus)="aoFocar()"
            (blur)="aoSair()"
          />
        }

        @if (mostraLimpar()) {
          <button
            type="button"
            class="evo-text-field__action evo-text-field__clear"
            [attr.aria-label]="mensagens.clear"
            [attr.aria-controls]="id"
            (click)="limpar()"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        }

        @if (type() === 'password') {
          <button
            type="button"
            class="evo-text-field__action evo-text-field__toggle"
            [attr.aria-label]="senhaVisivel() ? mensagens.hidePassword : mensagens.showPassword"
            [attr.aria-pressed]="senhaVisivel()"
            [attr.aria-controls]="id"
            [disabled]="inactivo()"
            (click)="alternarSenha()"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              @if (senhaVisivel()) {
                <path
                  d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a10 10 0 0 0 5.4-1.6"
                />
              } @else {
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              }
            </svg>
          </button>
        }

        @if (autoCompletar()) {
          @if (loading()) {
            <span class="evo-text-field__spinner" aria-hidden="true"></span>
          }

          <!-- Fora da ordem do Tab (como no Joy UI): o teclado abre com ↓ e fecha com Esc. -->
          <button
            type="button"
            class="evo-text-field__action evo-text-field__caret"
            tabindex="-1"
            [attr.aria-label]="aberto() ? mensagens.closeOptions : mensagens.openOptions"
            [attr.aria-expanded]="painelVisivel()"
            [attr.aria-controls]="painelVisivel() ? listaId : null"
            [disabled]="inactivo() || readonly()"
            (mousedown)="$event.preventDefault()"
            (click)="alternarPainel()"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        }

        <span class="evo-text-field__suffix"><ng-content select="[slot=suffix]" /></span>
      </div>

      <div class="evo-text-field__footer">
        <!-- Sempre no DOM: uma região aria-live só anuncia mudanças se já existir. -->
        <span
          class="evo-text-field__message"
          [id]="mensagemId"
          [attr.data-evo-tone]="mensagemErro() ? 'error' : null"
          aria-live="polite"
          >{{ mensagemErro() || hint() }}</span
        >
        @if (showCount()) {
          <span class="evo-text-field__counter" [id]="contadorId">
            {{ texto().length }}{{ maxlength() ? ' / ' + maxlength() : '' }}
          </span>
        }
      </div>
    </evo-field>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origem"
      [cdkConnectedOverlayOpen]="painelVisivel()"
      [cdkConnectedOverlayPositions]="posicoes"
      [cdkConnectedOverlayMatchWidth]="true"
      [cdkConnectedOverlayUsePopover]="'inline'"
      [cdkConnectedOverlayDisableClose]="true"
      (overlayOutsideClick)="aoClicarFora($event)"
      (positionChange)="aoPosicionar($event)"
      (detach)="aoSoltar()"
    >
      <div
        class="evo-text-field__panel"
        [attr.data-evo-side]="lado()"
        [attr.data-evo-size]="size()"
      >
        <div
          class="evo-text-field__list"
          role="listbox"
          [id]="listaId"
          [attr.aria-labelledby]="label() ? labelId : null"
          [attr.aria-busy]="loading() ? 'true' : null"
          (mousedown)="$event.preventDefault()"
        >
          @for (grupo of grupos(); track grupo.chave) {
            <div
              class="evo-text-field__group"
              [attr.role]="grupo.nome ? 'group' : 'presentation'"
              [attr.aria-labelledby]="grupo.nome ? grupo.id : null"
            >
              @if (grupo.nome) {
                <div class="evo-text-field__group-label" role="presentation" [id]="grupo.id">
                  {{ grupo.nome }}
                </div>
              }
              @for (linha of grupo.linhas; track linha.indice) {
                @let opcao = linha.opcao;
                @let marcada = estaEscolhida(opcao);
                <div
                  class="evo-text-field__option"
                  role="option"
                  [id]="id + '-opcao-' + linha.indice"
                  [evoSelectItem]="linha.indice"
                  [evoSelectItemLabel]="opcao.label"
                  [evoSelectItemDisabled]="!!opcao.disabled"
                  [attr.aria-selected]="marcada"
                  [attr.aria-disabled]="opcao.disabled ? 'true' : null"
                  (click)="escolher(opcao)"
                  (pointerenter)="activar(linha.indice)"
                >
                  @if (templateOpcao(); as tpl) {
                    <ng-container
                      [ngTemplateOutlet]="tpl"
                      [ngTemplateOutletContext]="{ $implicit: opcao, selected: marcada }"
                    />
                  } @else {
                    @if (opcao.icon) {
                      @if (eImagem(opcao.icon)) {
                        <img
                          class="evo-text-field__icon"
                          [class]="opcao.iconClass ?? ''"
                          [src]="opcao.icon"
                          alt=""
                        />
                      } @else {
                        <span
                          class="evo-text-field__icon"
                          [class]="opcao.iconClass ?? ''"
                          aria-hidden="true"
                          >{{ opcao.icon }}</span
                        >
                      }
                    }
                    <span class="evo-text-field__text">
                      <span class="evo-text-field__option-label">{{ opcao.label }}</span>
                      @if (opcao.sublabel) {
                        <span class="evo-text-field__sublabel">{{ opcao.sublabel }}</span>
                      }
                    </span>
                    <ng-container [ngTemplateOutlet]="visto" />
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (vazio()) {
          <div class="evo-text-field__empty" role="status">
            {{ loading() ? mensagens.loading : mensagens.noResults }}
          </div>
        }
      </div>
    </ng-template>

    <ng-template #visto>
      <svg
        class="evo-text-field__check"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12.5 10 17.5 19 7" />
      </svg>
    </ng-template>
  `,
  styleUrl: './text-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-text-field',
    '[attr.data-evo-size]': 'size()',
    '[attr.data-evo-open]': 'painelVisivel() ? "" : null',
    '[attr.data-evo-invalid]': 'invalido() ? "" : null',
    '[attr.data-evo-disabled]': 'inactivo() ? "" : null',
    '[attr.data-evo-readonly]': 'readonly() ? "" : null',
    '[attr.data-evo-loading]': 'autoCompletar() && loading() ? "" : null',
    '[attr.data-evo-hide-label]': 'hideLabel() ? "" : null',
  },
})
export class EvoTextField<V = string, D = unknown> implements ControlValueAccessor, AfterViewInit {
  /**
   * Valor. Suporta `[(value)]`, para usar sem formulários.
   *
   * Com `type="autoComplete"` é o `value` da opção escolhida (ou `null`), como
   * no `evo-select`; com `freeSolo`, o texto escrito.
   */
  readonly value = model<V>('' as V);

  readonly label = input('');
  /** Esconde a etiqueta visualmente, mantendo-a para leitores de ecrã. */
  readonly hideLabel = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  /**
   * Erro manual. Tem prioridade sobre o erro automático do controlo. Texto
   * fixo, ou função que recebe o controlo e devolve a mensagem (ou `null`).
   */
  readonly error = input<string | null | undefined | EvoTextFieldErrorFn>(null);
  /** Mensagens por chave de erro, só para este campo. */
  readonly errorMessages = input<Readonly<Record<string, EvoErrorMessage>> | null>(null);

  readonly type = input<EvoTextFieldType>('text');
  readonly placeholder = input('');
  readonly size = input<EvoSize>('md');
  /** Mostra "(opcional)" na etiqueta. Ignorado se o campo for obrigatório. */
  readonly optional = input(false, { transform: booleanAttribute });
  /**
   * Força obrigatório (`true`) ou não (`false`). Por omissão é lido do
   * controlo: `Validators.required` mostra o asterisco e `aria-required`.
   */
  readonly required = input<boolean | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v === undefined ? undefined : booleanAttribute(v)),
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });

  readonly autocomplete = input('');
  readonly inputmode = input('');
  readonly maxlength = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });

  /** Linhas do `textarea`. Com `autoResize`, é a altura mínima. */
  readonly rows = input(4, { transform: numberAttribute });
  /** `textarea` cresce com o conteúdo (`field-sizing: content`). */
  readonly autoResize = input(false, { transform: booleanAttribute });
  /** Mostra o número de caracteres (e o máximo, se houver `maxlength`). */
  readonly showCount = input(false, { transform: booleanAttribute });
  /** Botão × para apagar o valor. */
  readonly clearable = input(false, { transform: booleanAttribute });

  // ------------------------------------------------ type="autoComplete"

  /** Opções do painel. As mesmas do `evo-select`: `value`, `label`, `sublabel`, `icon`, `group`… */
  readonly options = input<readonly EvoSelectOption<V, D>[]>([]);
  /**
   * Aceita texto que não está na lista: o valor passa a ser o que se escreve (a
   * lista serve só de sugestão), e o painel não mostra "sem resultados".
   */
  readonly freeSolo = input(false, { transform: booleanAttribute });
  /** Opções a carregar: indicador na caixa e `aria-busy`. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Destaca a primeira opção a cada tecla, para o Enter a escolher. */
  readonly autoHighlight = input(false, { transform: booleanAttribute });
  /** Abre o painel ao receber o foco, e não só ao clicar ou escrever. */
  readonly openOnFocus = input(false, { transform: booleanAttribute });
  /** Igualdade entre valores. Por omissão `Object.is`; para objectos, comparar pelo id. */
  readonly compareWith = input<(a: V, b: V) => boolean>(Object.is);
  /**
   * Filtro do texto escrito. Por omissão procura no `label` e no `sublabel`,
   * sem distinguir acentos. `null` desliga o filtro local — para pesquisa no
   * servidor, com `(searchChange)`.
   */
  readonly searchFn = input<EvoSelectSearchFn | null>(evoSelectDefaultSearch);

  /** O texto, a cada tecla. */
  readonly searchChange = output<string>();
  /** `true` ao abrir o painel, `false` ao fechar. */
  readonly openedChange = output<boolean>();

  protected readonly id = `evo-text-field-${proximoId++}`;
  protected readonly labelId = `${this.id}-label`;
  protected readonly mensagemId = `${this.id}-mensagem`;
  protected readonly contadorId = `${this.id}-contador`;
  protected readonly listaId = `${this.id}-lista`;
  protected readonly posicoes = POSICOES;
  protected readonly mensagens = inject(EVO_TEXT_FIELD_MESSAGES);

  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly controlo =
    viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('controlo');
  private readonly caixa = viewChild<ElementRef<HTMLElement>>('caixa');
  private readonly itens = viewChildren(EvoSelectItem);

  private readonly defOpcao = contentChild(EvoSelectOptionDef);
  protected readonly templateOpcao = computed(() => this.defOpcao()?.template ?? null);

  /** O estado do controlo não é um signal: isto muda a cada evento dele. */
  private readonly versaoControlo = signal(0);
  private readonly desactivadoPeloForm = signal(false);
  protected readonly senhaVisivel = signal(false);

  protected readonly aberto = signal(false);
  protected readonly lado = signal<'top' | 'bottom'>('bottom');
  protected readonly activoId = signal<string | null>(null);

  /** Sem `typeahead` nem Home/End: as letras e o cursor pertencem ao texto. */
  private readonly teclas = new ActiveDescendantKeyManager(this.itens, this.injector)
    .withWrap()
    .withPageUpDown();

  protected readonly inactivo = computed(() => this.disabled() || this.desactivadoPeloForm());

  /** Aceita `autoComplete` e `autocomplete`: o atributo nativo é minúsculo, e é fácil trocá-los. */
  protected readonly autoCompletar = computed(() => this.type().toLowerCase() === 'autocomplete');

  protected readonly tipoNativo = computed(() => {
    if (this.autoCompletar()) return 'text';
    return this.type() === 'password' && this.senhaVisivel() ? 'text' : this.type();
  });

  /** A opção que corresponde ao `value` (só com `autoComplete`). */
  private readonly opcaoEscolhida = computed<EvoSelectOption<V, D> | null>(() => {
    if (!this.autoCompletar()) return null;
    const valor = this.value();
    if (semValor(valor)) return null;
    const iguais = this.compareWith();
    return this.options().find((o) => iguais(o.value, valor)) ?? null;
  });

  /**
   * O texto que o `value` pede: o `label` da opção escolhida, ou o próprio valor
   * se for simples (como o `evo-select`). Devolve uma `string`, por isso só
   * muda quando o texto muda — opções que chegam do servidor a meio da escrita
   * não o repõem.
   */
  private readonly textoDoValor = computed(() => {
    const valor = this.value();
    if (!this.autoCompletar()) return valor == null ? '' : String(valor);
    const escolhida = this.opcaoEscolhida();
    if (escolhida) return escolhida.label;
    return typeof valor === 'string' || typeof valor === 'number' ? String(valor) : '';
  });

  /**
   * O que o `<input>` mostra. Segue o `value`, e a escrita sobrepõe-se-lhe: no
   * `autoComplete` o texto a meio da escrita ainda não é um valor.
   */
  protected readonly texto = linkedSignal(() => this.textoDoValor());

  protected readonly obrigatorio = computed(() => {
    const forcado = this.required();
    if (forcado !== undefined) return forcado;
    this.versaoControlo();
    return this.ngControl?.control?.hasValidator(Validators.required) ?? false;
  });

  protected readonly mensagemErro = computed<string | null>(() => {
    const manual = this.error();
    this.versaoControlo();
    const controlo = this.ngControl?.control ?? null;

    if (typeof manual === 'function') return manual(controlo) || null;
    if (manual) return manual;
    if (!controlo?.touched || !controlo.errors) return null;

    const [chave, detalhe] = Object.entries(controlo.errors)[0];
    // Um erro que já traz a mensagem (ex.: vindo da API) usa-se tal como vem.
    if (typeof detalhe === 'string' && detalhe.trim()) return detalhe;

    const mensagem = this.errorMessages()?.[chave] ?? this.mensagens.errors[chave];
    if (mensagem === undefined) return this.mensagens.fallbackError;
    return typeof mensagem === 'function' ? mensagem(detalhe) : mensagem;
  });

  protected readonly invalido = computed(() => !!this.mensagemErro());

  protected readonly mostraLimpar = computed(
    () => this.clearable() && !!this.texto() && !this.inactivo() && !this.readonly(),
  );

  protected readonly descritoPor = computed(() => {
    const ids = [];
    if (this.mensagemErro() || this.hint()) ids.push(this.mensagemId);
    if (this.showCount()) ids.push(this.contadorId);
    return ids.length ? ids.join(' ') : null;
  });

  /**
   * As opções que o texto deixa passar. Com a escolha já feita e o texto igual
   * ao seu `label`, mostra todas: quem reabre quer trocar, não ver uma só.
   */
  protected readonly filtradas = computed<Linha<V, D>[]>(() => {
    const linhas = this.options().map((opcao, indice) => ({ opcao, indice }));
    const texto = this.texto();
    const termo = texto.trim();
    const filtro = this.searchFn();
    if (!termo || !filtro || texto === this.opcaoEscolhida()?.label) return linhas;
    return linhas.filter((l) => filtro(l.opcao as EvoSelectOption, termo));
  });

  /** Agrupadas por `group`, pela ordem em que cada grupo aparece. */
  protected readonly grupos = computed<Grupo<V, D>[]>(() => {
    const porNome = new Map<string | null, Grupo<V, D>>();
    for (const linha of this.filtradas()) {
      const nome = linha.opcao.group || null;
      let grupo = porNome.get(nome);
      if (!grupo) {
        grupo = {
          chave: nome ?? '',
          nome,
          id: `${this.id}-grupo-${porNome.size}`,
          linhas: [],
        };
        porNome.set(nome, grupo);
      }
      grupo.linhas.push(linha);
    }
    return [...porNome.values()];
  });

  protected readonly vazio = computed(() => this.filtradas().length === 0);

  /** Com `freeSolo` e nada que sugerir, não há painel: só o campo. */
  protected readonly painelVisivel = computed(
    () => this.aberto() && (!this.freeSolo() || !this.vazio() || this.loading()),
  );

  private aoMudarForm: (valor: unknown) => void = () => {};
  private aoTocarForm: () => void = () => {};

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
    this.teclas.change
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.activoId.set(this.teclas.activeItem?.elemento.id ?? null));
    this.destroyRef.onDestroy(() => this.teclas.destroy());
    // Desactivar (ou pôr só de leitura) com o painel aberto não passa por nenhum evento do
    // campo. É um efeito colateral (fecha e emite `openedChange`), não sincronização de signals.
    effect(() => {
      if (this.inactivo() || this.readonly()) untracked(() => this.fechar());
    });
  }

  /**
   * Só aqui o `ngControl.control` existe com `formControlName`: a directiva
   * cria-o no seu `ngOnChanges`, que corre depois do `ngOnInit` deste componente.
   */
  ngAfterViewInit(): void {
    const controlo = this.ngControl?.control;
    if (!controlo) return;
    controlo.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.versaoControlo.update((v) => v + 1));
    this.versaoControlo.update((v) => v + 1);
  }

  protected estaEscolhida(opcao: EvoSelectOption<V, D>): boolean {
    const valor = this.value();
    return !semValor(valor) && this.compareWith()(opcao.value, valor);
  }

  protected eImagem(icone: string): boolean {
    return EH_IMAGEM.test(icone);
  }

  protected aoEscrever(evento: Event): void {
    const bruto = (evento.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (this.autoCompletar()) {
      this.escreverAutoCompletar(bruto);
      return;
    }
    this.value.set(bruto as V);
    this.aoMudarForm(this.paraForm(bruto));
  }

  /** `touched` só ao sair do campo — o erro não aparece a meio da escrita. */
  protected aoSair(): void {
    if (this.autoCompletar()) {
      this.fechar();
      // Texto que não chegou a ser uma escolha volta ao que o valor diz.
      this.texto.set(this.textoDoValor());
    }
    this.aoTocarForm();
  }

  protected limpar(): void {
    if (this.autoCompletar()) {
      this.texto.set('');
      this.emitir((this.freeSolo() ? '' : null) as V);
      this.fechar();
      this.searchChange.emit('');
    } else {
      this.value.set('' as V);
      this.aoMudarForm(this.paraForm(''));
    }
    this.controlo()?.nativeElement.focus();
  }

  protected alternarSenha(): void {
    this.senhaVisivel.update((v) => !v);
  }

  /** Um clique na caixa (no padding ou num ícone) foca o campo. */
  protected focarSeFora(evento: MouseEvent): void {
    const alvo = evento.target as HTMLElement;
    if (alvo.closest('button, a, input, textarea')) return;
    this.controlo()?.nativeElement.focus();
    this.abrir();
  }

  /** `type="number"` entrega um número ao formulário, como o accessor nativo. */
  private paraForm(bruto: string): unknown {
    if (this.type() !== 'number') return bruto;
    return bruto === '' ? null : Number(bruto);
  }

  // ------------------------------------------------- type="autoComplete"

  private emitir(valor: V): void {
    this.value.set(valor);
    this.aoMudarForm(valor);
  }

  /**
   * Cada tecla. Apagar todo o texto limpa o valor logo (não espera pelo blur),
   * e não abre o painel — como o Autocomplete do Joy UI.
   */
  private escreverAutoCompletar(bruto: string): void {
    this.texto.set(bruto);
    this.searchChange.emit(bruto);
    if (this.freeSolo()) this.emitir(bruto as V);
    else if (bruto === '' && !semValor(this.value())) this.emitir(null as V);
    if (bruto === '') return;

    this.abrir();
    // Sem `autoHighlight`, nada fica destacado: o Enter só escolhe o que se destacou.
    afterNextRender(
      () =>
        this.autoHighlight() ? this.teclas.setFirstItemActive() : this.teclas.setActiveItem(-1),
      { injector: this.injector },
    );
  }

  /** `porSeta` destaca já a primeira (↓) ou a última (↑) opção, se não houver escolha. */
  protected abrir(porSeta: 'primeiro' | 'ultimo' | null = null): void {
    if (!this.autoCompletar() || this.aberto() || this.inactivo() || this.readonly()) return;
    this.aberto.set(true);
    this.openedChange.emit(true);
    // Os itens só existem depois de o painel ser desenhado.
    afterNextRender(() => this.manterDestaque(() => this.destacarInicial(porSeta)), {
      injector: this.injector,
    });
  }

  /** O foco não sai do campo, por isso fechar nunca o devolve. */
  protected fechar(): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    this.teclas.setActiveItem(-1);
    this.activoId.set(null);
    this.openedChange.emit(false);
  }

  protected alternarPainel(): void {
    // Decidido antes do foco: com `openOnFocus`, focar já abre.
    const abrirAgora = !this.aberto();
    this.controlo()?.nativeElement.focus();
    if (abrirAgora) this.abrir();
    else this.fechar();
  }

  /** Destaca a opção escolhida; sem escolha, a primeira/última se veio de uma seta. */
  private destacarInicial(porSeta: 'primeiro' | 'ultimo' | null): void {
    const opcoes = this.options();
    const escolhido = this.itens().find(
      (i) => i.indice() >= 0 && this.estaEscolhida(opcoes[i.indice()]),
    );
    if (escolhido && !escolhido.disabled) this.teclas.setActiveItem(escolhido);
    else if (porSeta === 'ultimo') this.teclas.setLastItemActive();
    else if (porSeta === 'primeiro' || this.autoHighlight()) this.teclas.setFirstItemActive();
  }

  /** Só mexe no destaque se ele se perdeu (nenhum, ou uma linha que o filtro tirou). */
  private manterDestaque(repor: () => void): void {
    const activo = this.teclas.activeItem;
    if (!activo || !this.itens().includes(activo)) repor();
  }

  protected activar(indice: number): void {
    const item = this.itens().find((i) => i.indice() === indice);
    if (item && !item.disabled) this.teclas.setActiveItem(item);
  }

  protected escolher(opcao: EvoSelectOption<V, D>): void {
    if (opcao.disabled || this.inactivo() || this.readonly()) return;
    // O texto é posto à mão: se a opção já era o valor, o `texto` não se repõe sozinho.
    this.texto.set(opcao.label);
    this.emitir(opcao.value);
    this.fechar();
  }

  /** Devolve `true` se havia uma opção destacada. */
  private escolherActiva(): boolean {
    const item = this.teclas.activeItem;
    if (!item) return false;
    this.escolher(this.options()[item.indice()]);
    return true;
  }

  /**
   * Como no `<input>` do Autocomplete: o rato abre se estava fechado, e fecha se
   * estava aberto sem texto (nada a filtrar).
   */
  protected aoPremirCampo(): void {
    if (!this.autoCompletar() || this.inactivo() || this.readonly()) return;
    if (!this.aberto()) this.abrir();
    else if (!this.texto()) this.fechar();
  }

  protected aoFocar(): void {
    if (this.openOnFocus()) this.abrir();
  }

  protected aoTeclar(evento: KeyboardEvent): void {
    if (!this.autoCompletar() || this.inactivo() || this.readonly()) return;
    switch (evento.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        if (!this.aberto()) {
          evento.preventDefault();
          this.abrir(evento.key === 'ArrowDown' ? 'primeiro' : 'ultimo');
          return;
        }
        if (evento.altKey && evento.key === 'ArrowUp') {
          evento.preventDefault();
          this.fechar();
          return;
        }
        break;
      case 'Escape':
        if (this.aberto()) {
          evento.preventDefault();
          this.fechar();
        }
        return;
      case 'Tab':
        this.fechar();
        return;
      case 'Enter':
        // Só trava o envio do formulário se o Enter fez alguma coisa.
        if (this.aberto() && (this.escolherActiva() || (this.freeSolo() && !!this.texto()))) {
          evento.preventDefault();
          this.fechar();
        }
        return;
      default:
        if (!this.aberto()) return;
    }
    this.teclas.onKeydown(evento);
  }

  /** O clique na própria caixa já é tratado pelo campo e pelos botões. */
  protected aoClicarFora(evento: MouseEvent): void {
    if (this.caixa()?.nativeElement.contains(evento.target as Node)) return;
    this.fechar();
  }

  protected aoPosicionar(evento: ConnectedOverlayPositionChange): void {
    this.lado.set(evento.connectionPair.originY === 'top' ? 'top' : 'bottom');
  }

  /** O overlay soltou-se por si (e não porque o painel fechou aqui). */
  protected aoSoltar(): void {
    if (this.painelVisivel()) this.fechar();
  }

  // ------------------------------------------------- ControlValueAccessor

  writeValue(valor: unknown): void {
    if (this.autoCompletar()) {
      this.value.set((valor === undefined ? null : valor) as V);
    } else {
      this.value.set((valor == null ? '' : String(valor)) as V);
    }
    // Um `reset()` para o mesmo valor não mexe no `value`, mas apaga o texto escrito.
    this.texto.set(this.textoDoValor());
  }

  registerOnChange(fn: (valor: unknown) => void): void {
    this.aoMudarForm = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocarForm = fn;
  }

  setDisabledState(desactivado: boolean): void {
    this.desactivadoPeloForm.set(desactivado);
    if (desactivado) this.fechar();
  }
}
