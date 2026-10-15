import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
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
import { EVO_TEXT_FIELD_MESSAGES, EvoErrorMessage } from '../text-field/text-field.messages';
import { EVO_SELECT_MESSAGES } from './select.messages';
import { EvoSelectItem } from './select-item';
import {
  EvoSelectOption,
  EvoSelectOptionContext,
  EvoSelectOptionDef,
  EvoSelectSearchFn,
  evoSelectDefaultSearch,
} from './select-option';

/**
 * Função que decide a mensagem de erro a partir do controlo. Devolve `null`
 * (ou `''`) para não mostrar erro. Recebe `null` se não houver formulário.
 */
export type EvoSelectErrorFn = (control: AbstractControl | null) => string | null;

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

/**
 * Contador de módulo, e não `crypto.randomUUID()`: não depende de APIs do
 * browser nem de contexto seguro, e corre igual no servidor.
 */
let proximoId = 0;

/**
 * Lista de escolha (simples ou múltipla) com pesquisa, ícones, grupos e
 * template por opção, numa só tag.
 *
 * Compõe o `EvoField` (disposição, etiqueta) e o aspecto do `EvoInput` (o
 * gatilho usa a classe `evo-input`), por isso herda `--evo-input-*` e
 * `--evo-field-*`. O painel é um overlay do CDK desenhado como popover
 * **inline**: fica na top layer (não é cortado por `overflow: hidden`), mas
 * continua dentro do `evo-select` no DOM, e por isso herda `[evoTokens]`.
 *
 * ```html
 * <evo-select formControlName="pais" label="País" [options]="paises" searchable />
 * ```
 *
 * Implementa `ControlValueAccessor` pelo `NgControl`, para ler o estado do
 * controlo e mostrar o erro sem configuração. Ver README.md desta pasta.
 */
@Component({
  selector: 'evo-select',
  imports: [EvoField, CdkOverlayOrigin, CdkConnectedOverlay, EvoSelectItem, NgTemplateOutlet],
  template: `
    <evo-field>
      @if (label()) {
        <label class="evo-select__label" [id]="labelId" (click)="focar()">
          {{ label() }}
          @if (obrigatorio()) {
            <span class="evo-select__required" aria-hidden="true">*</span>
          } @else if (optional()) {
            <span class="evo-select__optional">{{ mensagens.optional }}</span>
          }
        </label>
      }

      <div
        class="evo-input evo-select__box"
        cdkOverlayOrigin
        #origem="cdkOverlayOrigin"
        [attr.data-evo-size]="size()"
        [attr.data-evo-invalid]="invalido() ? '' : null"
        (click)="aoClicarCaixa($event)"
      >
        <div
          #gatilho
          class="evo-select__trigger"
          role="combobox"
          aria-haspopup="listbox"
          [id]="id"
          [attr.tabindex]="inactivo() ? -1 : 0"
          [attr.aria-labelledby]="label() ? labelId + ' ' + id : null"
          [attr.aria-expanded]="aberto()"
          [attr.aria-controls]="aberto() ? listaId : null"
          [attr.aria-activedescendant]="aberto() && !searchable() ? activoId() : null"
          [attr.aria-disabled]="inactivo() ? 'true' : null"
          [attr.aria-invalid]="invalido() ? 'true' : null"
          [attr.aria-required]="obrigatorio() ? 'true' : null"
          [attr.aria-describedby]="descritoPor()"
          [attr.aria-busy]="loading() ? 'true' : null"
          (keydown)="aoTeclarGatilho($event)"
          (blur)="aoSairGatilho()"
        >
          @if (resumo()) {
            @let unica = seleccionadas()[0];
            @if (!multiple() && unica && unica.icon) {
              @if (eImagem(unica.icon)) {
                <img
                  class="evo-select__icon"
                  [class]="unica.iconClass ?? ''"
                  [src]="unica.icon"
                  alt=""
                />
              } @else {
                <span class="evo-select__icon" [class]="unica.iconClass ?? ''" aria-hidden="true">{{
                  unica.icon
                }}</span>
              }
            }
            <span class="evo-select__value">{{ resumo() }}</span>
          } @else {
            <span class="evo-select__placeholder">{{
              placeholder() || mensagens.placeholder
            }}</span>
          }
        </div>

        @if (loading()) {
          <span class="evo-select__spinner" aria-hidden="true"></span>
        }

        @if (mostraLimpar()) {
          <button
            type="button"
            class="evo-select__action evo-select__clear"
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

        <svg
          class="evo-select__caret"
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
      </div>

      <!-- Sempre no DOM: uma região aria-live só anuncia mudanças se já existir. -->
      <span
        class="evo-select__message"
        [id]="mensagemId"
        [attr.data-evo-tone]="mensagemErro() ? 'error' : null"
        aria-live="polite"
        >{{ mensagemErro() || hint() }}</span
      >
    </evo-field>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origem"
      [cdkConnectedOverlayOpen]="aberto()"
      [cdkConnectedOverlayPositions]="posicoes"
      [cdkConnectedOverlayMatchWidth]="true"
      [cdkConnectedOverlayUsePopover]="'inline'"
      [cdkConnectedOverlayDisableClose]="true"
      (overlayOutsideClick)="aoClicarFora($event)"
      (positionChange)="aoPosicionar($event)"
      (detach)="fechar(false)"
    >
      <div
        class="evo-select__panel"
        [attr.data-evo-side]="lado()"
        [attr.data-evo-size]="size()"
        [attr.data-evo-multiple]="multiple() ? '' : null"
      >
        @if (searchable()) {
          <div class="evo-select__search">
            <input
              #pesquisa
              class="evo-input evo-select__search-input"
              type="text"
              role="combobox"
              autocomplete="off"
              aria-autocomplete="list"
              aria-expanded="true"
              [attr.data-evo-size]="size()"
              [attr.aria-controls]="listaId"
              [attr.aria-activedescendant]="activoId()"
              [attr.aria-label]="mensagens.searchLabel"
              [placeholder]="mensagens.searchPlaceholder"
              [value]="termo()"
              (input)="aoPesquisar($event)"
              (keydown)="aoTeclarPainel($event, true)"
            />
          </div>
        }

        <div
          class="evo-select__list"
          role="listbox"
          [id]="listaId"
          [attr.aria-labelledby]="label() ? labelId : null"
          [attr.aria-multiselectable]="multiple() ? 'true' : null"
          [attr.aria-busy]="loading() ? 'true' : null"
          (mousedown)="$event.preventDefault()"
        >
          @if (mostraTodas()) {
            <div
              class="evo-select__option evo-select__option--all"
              role="option"
              [id]="id + '-todas'"
              [evoSelectItem]="-1"
              [evoSelectItemLabel]="mensagens.selectAll"
              [attr.aria-selected]="todasSeleccionadas()"
              (click)="alternarTodas()"
              (pointerenter)="activar(-1)"
            >
              <span class="evo-select__text">
                <span class="evo-select__option-label">{{ mensagens.selectAll }}</span>
              </span>
              <ng-container [ngTemplateOutlet]="visto" />
            </div>
          }

          @for (grupo of grupos(); track grupo.chave) {
            <div
              class="evo-select__group"
              [attr.role]="grupo.nome ? 'group' : 'presentation'"
              [attr.aria-labelledby]="grupo.nome ? grupo.id : null"
            >
              @if (grupo.nome) {
                <div class="evo-select__group-label" role="presentation" [id]="grupo.id">
                  {{ grupo.nome }}
                </div>
              }
              @for (linha of grupo.linhas; track linha.indice) {
                @let opcao = linha.opcao;
                @let marcada = estaSeleccionada(opcao);
                <div
                  class="evo-select__option"
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
                          class="evo-select__icon"
                          [class]="opcao.iconClass ?? ''"
                          [src]="opcao.icon"
                          alt=""
                        />
                      } @else {
                        <span
                          class="evo-select__icon"
                          [class]="opcao.iconClass ?? ''"
                          aria-hidden="true"
                          >{{ opcao.icon }}</span
                        >
                      }
                    }
                    <span class="evo-select__text">
                      <span class="evo-select__option-label">{{ opcao.label }}</span>
                      @if (opcao.sublabel) {
                        <span class="evo-select__sublabel">{{ opcao.sublabel }}</span>
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
          <div class="evo-select__empty" role="status">
            {{ loading() ? mensagens.loading : mensagens.noResults }}
          </div>
        }
      </div>
    </ng-template>

    <ng-template #visto>
      <svg
        class="evo-select__check"
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
  styleUrl: './select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'evo-select',
    '[attr.data-evo-size]': 'size()',
    '[attr.data-evo-open]': 'aberto() ? "" : null',
    '[attr.data-evo-multiple]': 'multiple() ? "" : null',
    '[attr.data-evo-invalid]': 'invalido() ? "" : null',
    '[attr.data-evo-disabled]': 'inactivo() ? "" : null',
    '[attr.data-evo-loading]': 'loading() ? "" : null',
    '[attr.data-evo-hide-label]': 'hideLabel() ? "" : null',
  },
})
export class EvoSelect<V = unknown, D = unknown, T extends V | V[] | null = V | V[] | null>
  implements ControlValueAccessor, AfterViewInit
{
  /**
   * Valor: o `value` da opção escolhida (ou `null`), ou um array com
   * `multiple`. Suporta `[(value)]`, para usar sem formulários; o tipo vem do
   * signal ligado (`signal<string | null>`, `signal<number[]>`, …).
   */
  readonly value = model<T>(null as T);
  readonly options = input<readonly EvoSelectOption<V, D>[]>([]);

  readonly label = input('');
  /** Esconde a etiqueta visualmente, mantendo-a para leitores de ecrã. */
  readonly hideLabel = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  /**
   * Erro manual. Tem prioridade sobre o erro automático do controlo. Texto
   * fixo, ou função que recebe o controlo e devolve a mensagem (ou `null`).
   */
  readonly error = input<string | null | undefined | EvoSelectErrorFn>(null);
  /** Mensagens por chave de erro, só para este campo. */
  readonly errorMessages = input<Readonly<Record<string, EvoErrorMessage>> | null>(null);

  /** Texto sem nada escolhido. Por omissão, o de `provideEvoSelectMessages()`. */
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

  /** Escolha múltipla: o valor passa a ser um array e o painel não fecha ao escolher. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Caixa de pesquisa no topo do painel, fixa enquanto a lista faz scroll. */
  readonly searchable = input(false, { transform: booleanAttribute });
  /** Botão × para apagar a escolha. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Opções a carregar: indicador no gatilho e `aria-busy`. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Com `multiple`: linha "Seleccionar todos" (sobre as opções visíveis). */
  readonly selectAll = input(false, { transform: booleanAttribute });
  /**
   * Com `multiple`: acima deste número de escolhas, o gatilho mostra
   * "N seleccionados" em vez dos nomes. Sem valor, mostra sempre os nomes.
   */
  readonly maxLabels = input<number | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v == null || v === '' ? undefined : numberAttribute(v)),
  });
  /** Igualdade entre valores. Por omissão `Object.is`; para objectos, comparar pelo id. */
  readonly compareWith = input<(a: V, b: V) => boolean>(Object.is);
  /**
   * Filtro da pesquisa. Por omissão procura no `label` e no `sublabel`, sem
   * distinguir acentos. `null` desliga o filtro local — para pesquisa no
   * servidor, com `(searchChange)`.
   */
  readonly searchFn = input<EvoSelectSearchFn | null>(evoSelectDefaultSearch);

  /** O texto da pesquisa, a cada tecla (e `''` ao fechar, se havia texto). */
  readonly searchChange = output<string>();
  /** `true` ao abrir o painel, `false` ao fechar. */
  readonly openedChange = output<boolean>();

  protected readonly id = `evo-select-${proximoId++}`;
  protected readonly labelId = `${this.id}-label`;
  protected readonly listaId = `${this.id}-lista`;
  protected readonly mensagemId = `${this.id}-mensagem`;
  protected readonly posicoes = POSICOES;
  protected readonly mensagens = inject(EVO_SELECT_MESSAGES);
  private readonly mensagensErro = inject(EVO_TEXT_FIELD_MESSAGES);

  private readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly gatilho = viewChild.required<ElementRef<HTMLElement>>('gatilho');
  private readonly pesquisa = viewChild<ElementRef<HTMLInputElement>>('pesquisa');
  private readonly itens = viewChildren(EvoSelectItem);

  private readonly defOpcao = contentChild(EvoSelectOptionDef);
  /** `#optionTemplate`, a forma do `field-select-v2` — aceite para migrar sem alterações. */
  private readonly tplLegado =
    contentChild<TemplateRef<EvoSelectOptionContext<V, D>>>('optionTemplate');
  protected readonly templateOpcao = computed(
    () => this.defOpcao()?.template ?? this.tplLegado() ?? null,
  );

  protected readonly aberto = signal(false);
  protected readonly termo = signal('');
  protected readonly lado = signal<'top' | 'bottom'>('bottom');
  protected readonly activoId = signal<string | null>(null);

  /** O estado do controlo não é um signal: isto muda a cada evento dele. */
  private readonly versaoControlo = signal(0);
  private readonly desactivadoPeloForm = signal(false);

  private readonly teclas = new ActiveDescendantKeyManager(this.itens, this.injector)
    .withWrap()
    .withHomeAndEnd()
    .withTypeAhead()
    .withPageUpDown();

  protected readonly inactivo = computed(() => this.disabled() || this.desactivadoPeloForm());

  /** Os valores escolhidos, sempre como array. */
  private readonly valores = computed<V[]>(() => {
    const v = this.value();
    if (this.multiple()) return Array.isArray(v) ? (v as V[]) : [];
    return v == null ? [] : [v as V];
  });

  protected readonly seleccionadas = computed(() =>
    this.options().filter((o) => this.estaSeleccionada(o)),
  );

  /** O texto do gatilho. Um valor sem opção correspondente mostra-se tal como é, se for simples. */
  protected readonly resumo = computed(() => {
    const iguais = this.compareWith();
    const rotulos = this.valores()
      .map((v) => {
        const opcao = this.options().find((o) => iguais(o.value, v));
        if (opcao) return opcao.label;
        return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
      })
      .filter(Boolean);
    const max = this.maxLabels();
    if (this.multiple() && max !== undefined && rotulos.length > max) {
      return this.mensagens.selectedCount(rotulos.length);
    }
    return rotulos.join(', ');
  });

  protected readonly filtradas = computed<Linha<V, D>[]>(() => {
    const linhas = this.options().map((opcao, indice) => ({ opcao, indice }));
    const termo = this.termo().trim();
    const filtro = this.searchFn();
    if (!this.searchable() || !termo || !filtro) return linhas;
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

  private readonly escolhiveis = computed(() =>
    this.filtradas()
      .map((l) => l.opcao)
      .filter((o) => !o.disabled),
  );

  protected readonly mostraTodas = computed(
    () => this.multiple() && this.selectAll() && this.escolhiveis().length > 0,
  );

  protected readonly todasSeleccionadas = computed(() =>
    this.escolhiveis().every((o) => this.estaSeleccionada(o)),
  );

  protected readonly mostraLimpar = computed(
    () => this.clearable() && this.valores().length > 0 && !this.inactivo(),
  );

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

    const mensagem = this.errorMessages()?.[chave] ?? this.mensagensErro.errors[chave];
    if (mensagem === undefined) return this.mensagensErro.fallbackError;
    return typeof mensagem === 'function' ? mensagem(detalhe) : mensagem;
  });

  protected readonly invalido = computed(() => !!this.mensagemErro());

  protected readonly descritoPor = computed(() =>
    this.mensagemErro() || this.hint() ? this.mensagemId : null,
  );

  private aoMudarForm: (valor: unknown) => void = () => {};
  private aoTocarForm: () => void = () => {};

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
    this.teclas.change
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.activoId.set(this.teclas.activeItem?.elemento.id ?? null));
    this.destroyRef.onDestroy(() => this.teclas.destroy());
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

  protected estaSeleccionada(opcao: EvoSelectOption<V, D>): boolean {
    const iguais = this.compareWith();
    return this.valores().some((v) => iguais(opcao.value, v));
  }

  protected eImagem(icone: string): boolean {
    return EH_IMAGEM.test(icone);
  }

  // ------------------------------------------------------- abrir e fechar

  protected abrir(): void {
    if (this.aberto() || this.inactivo()) return;
    this.aberto.set(true);
    this.openedChange.emit(true);
    // Os itens só existem depois de o painel ser desenhado.
    afterNextRender(
      () => {
        this.manterDestaque(() => this.destacarInicial());
        const caixa = this.pesquisa()?.nativeElement;
        if (caixa) {
          caixa.focus();
          // O texto pode já ter a primeira letra, escrita no gatilho.
          caixa.setSelectionRange(caixa.value.length, caixa.value.length);
        }
      },
      { injector: this.injector },
    );
  }

  /** Fecha o painel. `devolverFoco` traz o foco de volta ao gatilho (teclado, escolha). */
  fechar(devolverFoco = true): void {
    if (!this.aberto()) return;
    this.aberto.set(false);
    this.teclas.setActiveItem(-1);
    this.activoId.set(null);
    if (this.termo()) {
      this.termo.set('');
      this.searchChange.emit('');
    }
    this.aoTocarForm();
    this.openedChange.emit(false);
    if (devolverFoco) this.focar();
  }

  protected alternar(): void {
    if (this.aberto()) this.fechar();
    else this.abrir();
  }

  /** Foca o gatilho (um clique na etiqueta faz o mesmo que num `<select>`). */
  focar(): void {
    this.gatilho().nativeElement.focus();
  }

  /** Destaca a primeira opção escolhida, ou a primeira disponível. */
  private destacarInicial(): void {
    const itens = this.itens();
    const opcoes = this.options();
    const escolhido = itens.find(
      (i) => i.indice() >= 0 && this.estaSeleccionada(opcoes[i.indice()]),
    );
    if (escolhido && !escolhido.disabled) this.teclas.setActiveItem(escolhido);
    else this.teclas.setFirstItemActive();
  }

  protected activar(indice: number): void {
    const item = this.itens().find((i) => i.indice() === indice);
    if (item && !item.disabled) this.teclas.setActiveItem(item);
  }

  // ------------------------------------------------------------- escolher

  protected escolher(opcao: EvoSelectOption<V, D>): void {
    if (opcao.disabled || this.inactivo()) return;

    if (!this.multiple()) {
      this.emitir(opcao.value);
      this.fechar();
      return;
    }

    const iguais = this.compareWith();
    const actuais = this.valores();
    const seguinte = actuais.some((v) => iguais(opcao.value, v))
      ? actuais.filter((v) => !iguais(opcao.value, v))
      : [...actuais, opcao.value];
    this.emitir(seguinte);
  }

  /** "Seleccionar todos": marca as opções visíveis, ou desmarca-as se já estiverem todas. */
  protected alternarTodas(): void {
    const iguais = this.compareWith();
    const visiveis = this.escolhiveis().map((o) => o.value);
    const actuais = this.valores();
    const seguinte = this.todasSeleccionadas()
      ? actuais.filter((v) => !visiveis.some((x) => iguais(x, v)))
      : [...actuais, ...visiveis.filter((x) => !actuais.some((v) => iguais(x, v)))];
    this.emitir(seguinte);
  }

  protected limpar(): void {
    this.emitir(this.multiple() ? [] : null);
    this.focar();
  }

  private emitir(valor: V | V[] | null): void {
    this.value.set(valor as T);
    this.aoMudarForm(valor);
  }

  // --------------------------------------------------------------- eventos

  /** Um clique em qualquer ponto da caixa (menos no ×) abre ou fecha. */
  protected aoClicarCaixa(evento: MouseEvent): void {
    if ((evento.target as HTMLElement).closest('button') || this.inactivo()) return;
    this.focar();
    this.alternar();
  }

  /** O clique na própria caixa já é tratado por `aoClicarCaixa`. */
  protected aoClicarFora(evento: MouseEvent): void {
    const caixa = this.gatilho().nativeElement.parentElement;
    if (caixa?.contains(evento.target as Node)) return;
    this.fechar(false);
  }

  protected aoPosicionar(evento: ConnectedOverlayPositionChange): void {
    this.lado.set(evento.connectionPair.originY === 'top' ? 'top' : 'bottom');
  }

  /** Sem o painel aberto, sair do gatilho conta como `touched`; aberto, conta ao fechar. */
  protected aoSairGatilho(): void {
    if (!this.aberto()) this.aoTocarForm();
  }

  protected aoPesquisar(evento: Event): void {
    this.pesquisar((evento.target as HTMLInputElement).value);
  }

  private pesquisar(termo: string): void {
    this.termo.set(termo);
    this.searchChange.emit(termo);
    afterNextRender(() => this.manterDestaque(() => this.teclas.setFirstItemActive()), {
      injector: this.injector,
    });
  }

  /**
   * Depois de a lista mudar, só mexe no destaque se ele se perdeu (nenhum, ou
   * uma linha que o filtro tirou). Uma seta carregada antes do render conta.
   */
  private manterDestaque(repor: () => void): void {
    const activo = this.teclas.activeItem;
    if (!activo || !this.itens().includes(activo)) repor();
  }

  /** Uma letra (sem Ctrl/Alt/Meta) — não Espaço, que abre e escolhe. */
  private eLetra(evento: KeyboardEvent): boolean {
    return (
      evento.key.length === 1 &&
      evento.key !== ' ' &&
      !evento.ctrlKey &&
      !evento.altKey &&
      !evento.metaKey
    );
  }

  protected aoTeclarGatilho(evento: KeyboardEvent): void {
    if (this.inactivo()) return;
    // Com pesquisa, escrever no gatilho abre o painel e começa a pesquisa: as
    // letras não se perdem enquanto o foco ainda não chegou à caixa.
    if (this.searchable() && this.eLetra(evento)) {
      evento.preventDefault();
      this.abrir();
      this.pesquisar(this.termo() + evento.key);
      return;
    }
    if (this.aberto()) {
      this.aoTeclarPainel(evento, false);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'].includes(evento.key)) {
      evento.preventDefault();
      this.abrir();
    }
  }

  /**
   * Teclado com o painel aberto. O foco está no gatilho ou na pesquisa
   * (`naPesquisa`); na pesquisa, Espaço, Home/End e letras pertencem ao texto.
   */
  protected aoTeclarPainel(evento: KeyboardEvent, naPesquisa: boolean): void {
    switch (evento.key) {
      case 'Escape':
        evento.preventDefault();
        this.fechar();
        return;
      case 'Tab':
        this.fechar(false);
        return;
      case 'Enter':
        evento.preventDefault();
        this.escolherActivo();
        return;
      case ' ':
        if (naPesquisa) return;
        evento.preventDefault();
        this.escolherActivo();
        return;
      case 'ArrowUp':
        if (evento.altKey) {
          evento.preventDefault();
          this.fechar();
          return;
        }
        break;
      case 'Home':
      case 'End':
        if (naPesquisa) return;
        break;
    }
    if (naPesquisa && this.eLetra(evento)) return;
    this.teclas.onKeydown(evento);
  }

  private escolherActivo(): void {
    const item = this.teclas.activeItem;
    if (!item) return;
    const indice = item.indice();
    if (indice === -1) this.alternarTodas();
    else this.escolher(this.options()[indice]);
  }

  // ------------------------------------------------- ControlValueAccessor

  writeValue(valor: unknown): void {
    if (this.multiple()) {
      this.value.set((Array.isArray(valor) ? valor.filter((v) => v != null) : []) as T);
    } else {
      this.value.set((valor === undefined ? null : valor) as T);
    }
  }

  registerOnChange(fn: (valor: unknown) => void): void {
    this.aoMudarForm = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocarForm = fn;
  }

  setDisabledState(desactivado: boolean): void {
    this.desactivadoPeloForm.set(desactivado);
    if (desactivado) this.fechar(false);
  }
}
