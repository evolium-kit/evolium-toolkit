import { LocationStrategy } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { EvoThemeStore } from '@evolium-kit/toolkit/theme';
import { CANAL_PREVIEW, MensagemEstado, ehMensagemDoCanal } from '../../preview/preview-protocol';

/**
 * Palco de pré-visualização: um `<iframe>` com a rota `<studio>/preview`.
 *
 * O iframe carrega **uma vez**; trocar de componente, variante ou tamanho, e
 * cada edição de token, chegam-lhe por `postMessage` — sem recarregar a app.
 * O componente a mostrar vem do campo `preview` dos metadados, por isso não há
 * aqui nenhuma lista de componentes.
 */
@Component({
  selector: 'evo-studio-preview-frame',
  template: `
    <iframe
      #frame
      class="pf__frame"
      [src]="src"
      [title]="'Pré-visualização: ' + label()"
      [style.block-size.px]="altura()"
    ></iframe>
  `,
  styleUrl: './preview-frame.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'evo-studio-preview-frame' },
})
export class EvoStudioPreviewFrame {
  readonly componentId = input.required<string>();
  readonly label = input('');
  readonly variant = input<string | null>(null);
  readonly size = input<string | null>(null);

  private readonly theme = inject(EvoThemeStore);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');

  /**
   * Relativo à rota do Studio, e não construído a partir da configuração:
   * funciona igual com `provideEvoThemeStudio({ path })` e com
   * `evoThemeStudioRoutes()` registado à mão. O `prepareExternalUrl`
   * acrescenta o `<base href>`.
   */
  protected readonly src = (() => {
    const router = inject(Router);
    const arvore = router.createUrlTree(['preview'], { relativeTo: inject(ActivatedRoute) });
    const url = inject(LocationStrategy).prepareExternalUrl(router.serializeUrl(arvore));
    // O URL é da própria aplicação, construído pelo Router — não vem do utilizador.
    return inject(DomSanitizer).bypassSecurityTrustResourceUrl(url);
  })();

  /** Até o iframe dizer a sua altura, a mínima do CSS. */
  protected readonly altura = signal<number | null>(null);

  /** Incrementa a cada `pronto`: um iframe recarregado recebe o estado outra vez. */
  private readonly ligacao = signal(0);

  constructor() {
    afterNextRender(() => {
      const janela = this.doc.defaultView;
      if (!janela) return;

      const aoReceber = (evento: MessageEvent) => {
        const iframe = this.frame().nativeElement.contentWindow;
        if (!ehMensagemDoCanal(evento, iframe, janela)) return;
        if (evento.data.tipo === 'pronto') this.ligacao.update((n) => n + 1);
        if (evento.data.tipo === 'altura') this.altura.set(evento.data.altura);
      };
      janela.addEventListener('message', aoReceber);
      this.destroyRef.onDestroy(() => janela.removeEventListener('message', aoReceber));
    });

    effect(() => {
      if (this.ligacao() === 0) return;
      const mensagem: MensagemEstado = {
        canal: CANAL_PREVIEW,
        tipo: 'estado',
        id: this.componentId(),
        variante: this.variant(),
        tamanho: this.size(),
        tema: {
          tokens: this.theme.tokens(),
          darkTokens: this.theme.darkTokens(),
          variants: this.theme.variants(),
          scheme: this.theme.scheme(),
        },
      };
      // Só a própria origem pode ler a mensagem, nunca '*'.
      const origem = this.doc.defaultView?.location.origin;
      if (origem) this.frame().nativeElement.contentWindow?.postMessage(mensagem, origem);
    });
  }
}
