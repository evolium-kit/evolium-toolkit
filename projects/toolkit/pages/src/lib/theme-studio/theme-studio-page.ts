import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { EVO_COMPONENT_META, EvoComponentMeta, EvoTokenMeta } from '@evolium-kit/toolkit/core';
import { EvoThemeExporter, EvoThemeStore } from '@evolium-kit/toolkit/theme';
import { EvoComponentPreview } from './component-preview';

/** Onde a edição é escrita. */
export type EvoEditScope = 'global' | 'variant';

interface Categoria {
  readonly nome: string;
  readonly componentes: readonly EvoComponentMeta[];
}

const PREF_KEY = 'evo.studio.ui.v1';

@Component({
  selector: 'evo-theme-studio-page',
  imports: [EvoComponentPreview],
  templateUrl: './theme-studio-page.html',
  styleUrl: './theme-studio-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'evo-studio' },
})
export class EvoThemeStudioPage {
  protected readonly theme = inject(EvoThemeStore);
  private readonly exporter = inject(EvoThemeExporter);
  private readonly doc = inject(DOCUMENT);
  private readonly meta = inject(EVO_COMPONENT_META, { optional: true }) ?? [];

  /**
   * Valores que vêm da folha de estilos estática e não do `EvoThemeStore`.
   *
   * Os tokens estruturais — raio, espaçamento, tipografia — são declarados em
   * `evolium-theme.css`, por isso o store não os conhece e os controlos
   * apareceriam vazios. São lidos uma vez do documento, depois do primeiro
   * render, e servem apenas de último recurso na resolução do valor a mostrar.
   */
  private readonly valoresCss = signal<Readonly<Record<string, string>>>({});

  // ------------------------------------------------------------------ painéis
  // Começam expandidos para que o render do servidor e o do cliente coincidam;
  // a preferência guardada só é lida depois da hidratação.
  protected readonly esquerdaAberta = signal(true);
  protected readonly direitaAberta = signal(true);

  // ----------------------------------------------------------------- pesquisa
  protected readonly pesquisa = signal('');

  protected readonly categorias = computed<readonly Categoria[]>(() => {
    const termo = this.pesquisa().trim().toLowerCase();

    const correspondem = this.meta.filter((componente) => {
      if (!termo) return true;
      const alvos = [componente.label, componente.id, ...(componente.tags ?? [])];
      return alvos.some((alvo) => alvo.toLowerCase().includes(termo));
    });

    const porCategoria = new Map<string, EvoComponentMeta[]>();
    for (const componente of correspondem) {
      const lista = porCategoria.get(componente.category) ?? [];
      lista.push(componente);
      porCategoria.set(componente.category, lista);
    }

    return [...porCategoria.entries()]
      .map(([nome, componentes]) => ({ nome, componentes }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  });

  protected readonly semResultados = computed(() => this.categorias().length === 0);

  // ------------------------------------------------------------- selecção
  private readonly idSeleccionado = signal<string | null>(null);

  protected readonly seleccionado = computed<EvoComponentMeta | null>(() => {
    const id = this.idSeleccionado();
    if (id) {
      const encontrado = this.meta.find((componente) => componente.id === id);
      if (encontrado) return encontrado;
    }
    // Sem selecção explícita, mostra o primeiro resultado da pesquisa.
    return this.categorias()[0]?.componentes[0] ?? null;
  });

  protected readonly variante = signal<string | null>(null);
  protected readonly tamanho = signal<string | null>(null);
  protected readonly escopo = signal<EvoEditScope>('global');

  /** Chave da variante no store, por exemplo `button.danger`. */
  protected readonly chaveVariante = computed(() => {
    const componente = this.seleccionado();
    const variante = this.variante();
    return componente && variante ? `${componente.id}.${variante}` : null;
  });

  /** Editar por variante só faz sentido com uma variante escolhida. */
  protected readonly podeEditarVariante = computed(() => this.chaveVariante() !== null);

  protected readonly escopoEfectivo = computed<EvoEditScope>(() =>
    this.escopo() === 'variant' && this.podeEditarVariante() ? 'variant' : 'global',
  );

  constructor() {
    afterNextRender(() => {
      this.lerPreferencias();
      this.lerValoresCss();
    });
  }

  /** Lê do documento os tokens que a folha estática declara. Só no browser. */
  private lerValoresCss(): void {
    const estilo = this.doc.defaultView?.getComputedStyle(this.doc.documentElement);
    if (!estilo) return;

    const lidos: Record<string, string> = {};
    for (const componente of this.meta) {
      for (const token of componente.tokens) {
        for (const nome of [token.name, token.fallback]) {
          if (!nome) continue;
          const chave = nome.startsWith('--') ? nome : `--evo-${nome}`;
          if (lidos[chave] !== undefined) continue;
          const valor = estilo.getPropertyValue(chave).trim();
          if (valor) lidos[chave] = valor;
        }
      }
    }
    this.valoresCss.set(lidos);
  }

  // ------------------------------------------------------------------ acções

  protected seleccionar(componente: EvoComponentMeta): void {
    this.idSeleccionado.set(componente.id);
    this.variante.set(null);
    this.tamanho.set(null);
    this.escopo.set('global');
  }

  protected estaSeleccionado(componente: EvoComponentMeta): boolean {
    return this.seleccionado()?.id === componente.id;
  }

  /** `true` se algum token deste componente tiver sido alterado. */
  protected temAlteracoes(componente: EvoComponentMeta): boolean {
    const activos = this.theme.activeTokens();
    const variantes = this.theme.variants();
    const prefixo = `--evo-${componente.id}-`;

    const noGlobal = Object.keys(activos).some((nome) => nome.startsWith(prefixo));
    const emVariante = Object.keys(variantes).some((chave) =>
      chave.startsWith(`${componente.id}.`),
    );
    return noGlobal || emVariante;
  }

  protected actualizarPesquisa(evento: Event): void {
    this.pesquisa.set((evento.target as HTMLInputElement).value);
  }

  protected escolherVariante(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.variante.set(valor || null);
    if (!valor) this.escopo.set('global');
  }

  protected escolherTamanho(evento: Event): void {
    this.tamanho.set((evento.target as HTMLSelectElement).value || null);
  }

  protected definirEscopo(escopo: EvoEditScope): void {
    this.escopo.set(escopo);
  }

  // -------------------------------------------------------------- tokens

  /**
   * Valor a mostrar no controlo.
   *
   * Resolvido só a partir do estado do store, nunca por `getComputedStyle`:
   * além de não funcionar no servidor, forçaria um reflow a cada render.
   */
  protected valorDe(token: EvoTokenMeta): string {
    const chave = this.chaveVariante();

    if (this.escopoEfectivo() === 'variant' && chave) {
      const proprio = this.theme.tokenValue(token.name, chave);
      if (proprio !== undefined) return proprio;
    }

    const global = this.theme.tokenValue(token.name);
    if (global !== undefined) return global;

    // Não definido: mostra o valor de que herda, seja do store…
    if (token.fallback) {
      const herdado = this.theme.tokenValue(token.fallback);
      if (herdado !== undefined) return herdado;
    }

    // …seja da folha de estilos estática.
    const css = this.valoresCss();
    const chaveToken = token.name.startsWith('--') ? token.name : `--evo-${token.name}`;
    if (css[chaveToken] !== undefined) return css[chaveToken];

    if (token.fallback) {
      const chaveFallback = token.fallback.startsWith('--')
        ? token.fallback
        : `--evo-${token.fallback}`;
      if (css[chaveFallback] !== undefined) return css[chaveFallback];
    }

    return '';
  }

  /**
   * Valor para o `<input type="color">`, que só aceita `#rrggbb`.
   * Um token por definir mostraria preto; preferimos um cinzento neutro.
   */
  protected valorCor(token: EvoTokenMeta): string {
    const valor = this.valorDe(token).trim();
    return /^#[0-9a-f]{6}$/i.test(valor) ? valor : '#808080';
  }

  /** `true` quando o token não está definido e mostra um valor herdado. */
  protected estaHerdado(token: EvoTokenMeta): boolean {
    const chave = this.chaveVariante();
    if (this.escopoEfectivo() === 'variant' && chave) {
      return this.theme.tokenValue(token.name, chave) === undefined;
    }
    return this.theme.tokenValue(token.name) === undefined;
  }

  /** Valor numérico para os controlos de comprimento. */
  protected numeroDe(token: EvoTokenMeta): number {
    const valor = Number.parseFloat(this.valorDe(token));
    return Number.isFinite(valor) ? valor : (token.min ?? 0);
  }

  protected definirToken(token: EvoTokenMeta, valorBruto: string): void {
    const valor =
      token.type === 'length' && valorBruto !== '' && !/[a-z%]/i.test(valorBruto)
        ? `${valorBruto}${token.unit ?? 'px'}`
        : valorBruto;

    const componente = this.seleccionado();
    const chave = this.chaveVariante();

    if (this.escopoEfectivo() === 'variant' && componente && chave) {
      const variante = chave.slice(componente.id.length + 1);
      this.theme.setVariantToken(componente.id, variante, token.name, valor);
    } else {
      this.theme.setToken(token.name, valor);
    }
  }

  protected aoEditar(token: EvoTokenMeta, evento: Event): void {
    this.definirToken(token, (evento.target as HTMLInputElement | HTMLSelectElement).value);
  }

  // ------------------------------------------------------------ persistência

  protected async guardar(): Promise<void> {
    await this.theme.persist();
  }

  protected exportar(): void {
    this.exporter.downloadAll(this.theme.snapshot());
  }

  protected async repor(): Promise<void> {
    await this.theme.clearPersisted();
  }

  // ----------------------------------------------------------- preferências

  protected alternarEsquerda(): void {
    this.esquerdaAberta.update((aberta) => !aberta);
    this.gravarPreferencias();
  }

  protected alternarDireita(): void {
    this.direitaAberta.update((aberta) => !aberta);
    this.gravarPreferencias();
  }

  /**
   * Estado dos painéis. É preferência de interface, por utilizador e por
   * browser — não faz parte do tema e por isso não vai para a persistência
   * do `EvoThemeStore`.
   */
  private lerPreferencias(): void {
    try {
      const bruto = localStorage.getItem(PREF_KEY);
      if (!bruto) return;
      const prefs = JSON.parse(bruto) as { esquerda?: boolean; direita?: boolean };
      if (typeof prefs.esquerda === 'boolean') this.esquerdaAberta.set(prefs.esquerda);
      if (typeof prefs.direita === 'boolean') this.direitaAberta.set(prefs.direita);
    } catch {
      // Modo privado, storage cheio ou bloqueado: o Studio abre com os painéis abertos.
    }
  }

  private gravarPreferencias(): void {
    try {
      localStorage.setItem(
        PREF_KEY,
        JSON.stringify({ esquerda: this.esquerdaAberta(), direita: this.direitaAberta() }),
      );
    } catch {
      /* ver acima */
    }
  }
}
