import { NgComponentOutlet, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  Type,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  reflectComponentType,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EVO_COMPONENT_META, EvoComponentMeta } from '@evolium-kit/toolkit/core';
import { EvoThemeStore } from '@evolium-kit/toolkit/theme';
import { CANAL_PREVIEW, MensagemPreview, ehMensagemDoCanal } from './preview-protocol';

type Carregamento =
  | { readonly estado: 'a-carregar' | 'sem-preview' | 'erro' | 'desconhecido' }
  | {
      readonly estado: 'pronto';
      readonly tipo: Type<unknown>;
      /** Nomes públicos dos inputs que o componente declara. */
      readonly inputs: ReadonlySet<string>;
    };

/**
 * Página que o Studio abre dentro do `<iframe>` de pré-visualização.
 *
 * É a própria aplicação, numa rota à parte (`<path>/preview`), por isso a
 * pré-visualização usa as mesmas folhas de estilo e providers que o resto da
 * app — e fica isolada da interface do Studio: nem o CSS do Studio chega aos
 * componentes, nem as media queries dos componentes respondem à largura da
 * janela do Studio em vez da do palco.
 *
 * Recebe do Studio, por `postMessage`, o componente a mostrar e o estado do
 * tema, que aplica ao seu próprio `EvoThemeStore` com `adopt()`. Aberta fora
 * de um iframe (`<path>/preview?id=button`), mostra o componente com o tema
 * gravado.
 */
@Component({
  selector: 'evo-theme-studio-preview-page',
  imports: [NgComponentOutlet],
  template: `
    @switch (carregamento().estado) {
      @case ('pronto') {
        <ng-container *ngComponentOutlet="tipo(); inputs: inputs()" />
      }
      @case ('sem-preview') {
        <p class="pv__vazio">
          <code>{{ id() }}</code> não tem pré-visualização. Cria
          <code>{{ id() }}.preview.ts</code> e aponta-lhe o campo <code>preview</code> dos
          metadados.
        </p>
      }
      @case ('erro') {
        <p class="pv__vazio">
          Não foi possível carregar a pré-visualização de <code>{{ id() }}</code
          >.
        </p>
      }
      @case ('desconhecido') {
        @if (id()) {
          <p class="pv__vazio">
            Nenhum componente registado com o id <code>{{ id() }}</code
            >.
          </p>
        }
      }
    }
  `,
  styleUrl: './theme-studio-preview-page.css',
  // Os estilos de layout (.pv__row, .pv__stack…) servem os templates dos
  // ficheiros <nome>.preview.ts, que o encapsulamento deste componente não alcança.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'evo-pv' },
})
export class EvoThemeStudioPreviewPage {
  private readonly theme = inject(EvoThemeStore);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly meta = inject(EVO_COMPONENT_META, { optional: true }) ?? [];
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly id = signal(this.query.get('id') ?? '');
  private readonly variante = signal(this.query.get('variant'));
  private readonly tamanho = signal(this.query.get('size'));

  private readonly componente = computed<EvoComponentMeta | null>(
    () => this.meta.find((m) => m.id === this.id()) ?? null,
  );

  protected readonly carregamento = signal<Carregamento>({ estado: 'desconhecido' });

  protected readonly tipo = computed(() => {
    const c = this.carregamento();
    return c.estado === 'pronto' ? c.tipo : null;
  });

  /**
   * Só os inputs que o componente declara: o `setInput()` de um input
   * inexistente dá erro NG0303 em desenvolvimento.
   */
  protected readonly inputs = computed<Record<string, unknown>>(() => {
    const c = this.carregamento();
    if (c.estado !== 'pronto') return {};
    const valores: Record<string, unknown> = { variant: this.variante(), size: this.tamanho() };
    return Object.fromEntries(Object.entries(valores).filter(([nome]) => c.inputs.has(nome)));
  });

  constructor() {
    // Carregar só no browser: o servidor renderiza vazio e o cliente também,
    // no primeiro render, por isso a hidratação coincide.
    effect(() => {
      const componente = this.componente();
      if (this.isBrowser) untracked(() => void this.carregar(componente));
    });

    afterNextRender(() => this.ligarAoStudio());
  }

  private async carregar(componente: EvoComponentMeta | null): Promise<void> {
    if (!componente) {
      this.carregamento.set({ estado: 'desconhecido' });
      return;
    }
    if (!componente.preview) {
      this.carregamento.set({ estado: 'sem-preview' });
      return;
    }

    this.carregamento.set({ estado: 'a-carregar' });
    try {
      const tipo = await componente.preview();
      // Entretanto o Studio pode ter pedido outro componente.
      if (this.componente() !== componente) return;
      const inputs = new Set(reflectComponentType(tipo)?.inputs.map((i) => i.templateName) ?? []);
      this.carregamento.set({ estado: 'pronto', tipo, inputs });
    } catch (erro) {
      console.error(`[evo] pré-visualização de "${componente.id}":`, erro);
      if (this.componente() === componente) this.carregamento.set({ estado: 'erro' });
    }
  }

  private ligarAoStudio(): void {
    const janela = this.doc.defaultView;
    // Fora de um iframe não há Studio a quem falar.
    if (!janela || janela.parent === janela) return;
    const studio = janela.parent;

    const enviar = (mensagem: MensagemPreview) =>
      studio.postMessage(mensagem, janela.location.origin);

    const aoReceber = (evento: MessageEvent) => {
      if (!ehMensagemDoCanal(evento, studio, janela) || evento.data.tipo !== 'estado') return;
      const { id, variante, tamanho, tema } = evento.data;
      this.theme.adopt(tema);
      this.id.set(id);
      this.variante.set(variante);
      this.tamanho.set(tamanho);
    };
    janela.addEventListener('message', aoReceber);

    // Altura do conteúdo, para o Studio dimensionar o iframe sem scroll interno.
    // Mede-se o host, não o <html>: se o CSS da app der `min-height: 100vh` ao
    // body, a altura do documento acompanharia a do iframe e nunca encolheria.
    const host = this.host.nativeElement;
    let ultima = -1;
    const medir = new ResizeObserver(() => {
      const altura = Math.ceil(host.getBoundingClientRect().bottom + janela.scrollY);
      if (altura === ultima) return;
      ultima = altura;
      enviar({ canal: CANAL_PREVIEW, tipo: 'altura', altura });
    });
    medir.observe(host);

    this.destroyRef.onDestroy(() => {
      janela.removeEventListener('message', aoReceber);
      medir.disconnect();
    });

    enviar({ canal: CANAL_PREVIEW, tipo: 'pronto' });
  }
}
