import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

type Estado =
  | { readonly tipo: 'sem-docs' | 'a-carregar' | 'erro' }
  | { readonly tipo: 'pronto'; readonly html: string };

/**
 * Documentação de um componente, a partir do campo `docs` dos metadados — nos
 * componentes da toolkit, o `README.md` da pasta, convertido em HTML no build.
 *
 * O HTML passa pelo sanitizador do Angular (`[innerHTML]`).
 */
@Component({
  selector: 'evo-studio-component-docs',
  template: `
    @switch (estado().tipo) {
      @case ('pronto') {
        <article class="cd__corpo" [innerHTML]="html()"></article>
      }
      @case ('a-carregar') {
        <p class="cd__vazio">A carregar a documentação…</p>
      }
      @case ('erro') {
        <p class="cd__vazio">Não foi possível carregar a documentação.</p>
      }
      @default {
        <p class="cd__vazio">
          Sem documentação. Um <code>README.md</code> na pasta do componente aparece aqui.
        </p>
      }
    }
  `,
  styleUrl: './component-docs.css',
  // O HTML injectado não recebe os atributos do encapsulamento; os estilos
  // ficam todos debaixo de .evo-studio-component-docs para não vazarem.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'evo-studio-component-docs' },
})
export class EvoStudioComponentDocs {
  readonly component = input.required<EvoComponentMeta>();

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly estado = signal<Estado>({ tipo: 'a-carregar' });

  protected readonly html = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'pronto' ? estado.html : '';
  });

  constructor() {
    // Só no browser, como a pré-visualização: o servidor e o primeiro render
    // do cliente mostram ambos "a carregar", e a hidratação coincide.
    effect(() => {
      const componente = this.component();
      if (this.isBrowser) untracked(() => void this.carregar(componente));
    });
  }

  private async carregar(componente: EvoComponentMeta): Promise<void> {
    if (!componente.docs) {
      this.estado.set({ tipo: 'sem-docs' });
      return;
    }
    this.estado.set({ tipo: 'a-carregar' });
    try {
      const html = await componente.docs();
      if (this.component() === componente) this.estado.set({ tipo: 'pronto', html });
    } catch (erro) {
      console.error(`[evo] documentação de "${componente.id}":`, erro);
      if (this.component() === componente) this.estado.set({ tipo: 'erro' });
    }
  }
}
