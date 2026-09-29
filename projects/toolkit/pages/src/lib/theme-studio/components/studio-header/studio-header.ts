import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { EVO_THEME_PERSISTENCE } from '@evolium-kit/toolkit/core';
import { EvoThemeExporter, EvoThemeStore } from '@evolium-kit/toolkit/theme';

/** Estado do botão Guardar. `ok` e `erro` são transitórios. */
type EstadoGravacao = 'parado' | 'a-guardar' | 'ok' | 'erro';

/** Quanto tempo a confirmação «Guardado» fica visível. */
const DURACAO_CONFIRMACAO_MS = 2000;

/**
 * Barra do topo do Theme Studio: painéis, pesquisa, esquema, guardar e exportar.
 *
 * Componente interno do Studio — não é exportado. Tal como o resto da
 * interface da ferramenta, usa `--st-*` e botões próprios, nunca `EvoButton`,
 * para não ficar ilegível por causa do tema que está a ser editado.
 */
@Component({
  selector: 'evo-studio-header',
  templateUrl: './studio-header.html',
  styleUrls: ['../../studio-comum.css', './studio-header.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'aoTeclar($event)' },
})
export class EvoStudioHeader {
  protected readonly theme = inject(EvoThemeStore);
  private readonly exporter = inject(EvoThemeExporter);
  private readonly persistencia = inject(EVO_THEME_PERSISTENCE, { optional: true });

  readonly pesquisa = model('');
  readonly esquerdaAberta = input.required<boolean>();
  readonly direitaAberta = input.required<boolean>();

  readonly alternarEsquerda = output();
  readonly alternarDireita = output();

  private readonly campoPesquisa = viewChild.required<ElementRef<HTMLInputElement>>('campo');

  // ------------------------------------------------------------- gravação
  protected readonly estado = signal<EstadoGravacao>('parado');

  /** Sem adapter, `persist()` não faz nada — melhor dizê-lo do que fingir. */
  protected readonly semPersistencia = this.persistencia === null;

  protected readonly podeGuardar = computed(
    () => !this.semPersistencia && this.theme.dirty() && this.estado() !== 'a-guardar',
  );

  protected readonly rotuloGuardar = computed(() => {
    switch (this.estado()) {
      case 'a-guardar':
        return 'A guardar…';
      case 'ok':
        return 'Guardado';
      default:
        return 'Guardar';
    }
  });

  protected readonly dicaGuardar = computed(() =>
    this.semPersistencia
      ? 'Sem persistência configurada em provideEvoTheme(): usa Exportar'
      : this.theme.dirty()
        ? 'Guardar alterações (Ctrl+S)'
        : 'Sem alterações por gravar',
  );

  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
  }

  protected async guardar(): Promise<void> {
    if (!this.podeGuardar()) return;

    clearTimeout(this.temporizador);
    this.estado.set('a-guardar');
    try {
      await this.theme.persist();
      this.estado.set('ok');
      this.temporizador = setTimeout(() => this.estado.set('parado'), DURACAO_CONFIRMACAO_MS);
    } catch {
      // Fica visível até à próxima tentativa: um erro que desaparece sozinho
      // é um erro que passa despercebido.
      this.estado.set('erro');
    }
  }

  protected exportar(): void {
    this.exporter.downloadAll(this.theme.snapshot());
  }

  protected actualizarPesquisa(evento: Event): void {
    this.pesquisa.set((evento.target as HTMLInputElement).value);
  }

  /** Ctrl/⌘+S guarda; Ctrl/⌘+K vai para a pesquisa. */
  protected aoTeclar(evento: KeyboardEvent): void {
    if (!(evento.ctrlKey || evento.metaKey) || evento.altKey || evento.shiftKey) return;

    const tecla = evento.key.toLowerCase();
    if (tecla === 's') {
      // Sempre, mesmo sem nada para gravar: o diálogo «Guardar página» do
      // browser nunca é o que se quer dentro do Studio.
      evento.preventDefault();
      void this.guardar();
    } else if (tecla === 'k') {
      evento.preventDefault();
      const campo = this.campoPesquisa().nativeElement;
      campo.focus();
      campo.select();
    }
  }
}
