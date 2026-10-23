import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  EvoButton,
  EvoCard,
  EvoDrawer,
  EvoDrawerBeforeCloseFn,
  EvoDrawerService,
  EvoTextField,
} from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import {
  FormMotoristaDrawer,
  FormMotoristaDados,
  FormMotoristaEventos,
  Motorista,
} from './form-motorista-drawer';

/**
 * `<evo-drawer>` declarativo e `EvoDrawerService`.
 *
 * Nada aparece aberto ao carregar: cada botão descreve o drawer que abre.
 */
@Component({
  selector: 'app-drawer-demo',
  imports: [EvoCard, EvoButton, EvoDrawer, EvoTextField, EvoTokensDirective, ReactiveFormsModule],
  templateUrl: './drawer-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerDemo {
  protected readonly drawers = inject(EvoDrawerService);
  protected readonly resultado = signal('—');

  // ------------------------------------------------------- declarativos

  protected readonly comandosAberto = signal(false);
  protected readonly detalheAberto = signal(false);
  protected readonly filtrosAberto = signal(false);
  protected readonly cheioAberto = signal(false);
  protected readonly subarvoreAberta = signal(false);

  protected readonly filtros = inject(NonNullableFormBuilder).group({ matricula: [''] });

  /** Com alterações por gravar, Escape/fundo/× perguntam antes de fechar. */
  protected readonly perguntarSeSai: EvoDrawerBeforeCloseFn = () =>
    !this.filtros.dirty || confirm('Perder as alterações dos filtros?');

  protected aplicarFiltros(): void {
    this.filtros.markAsPristine();
    this.filtrosAberto.set(false);
  }

  // ------------------------------------------------------------ serviço

  private readonly detalheFactura = viewChild.required<TemplateRef<unknown>>('detalheFactura');

  protected async registarMotorista(): Promise<void> {
    const ref = this.drawers.open<FormMotoristaDados, Motorista, FormMotoristaEventos>(
      FormMotoristaDrawer,
      {
        title: 'Registar motorista',
        data: { mode: 'create' },
        position: 'right',
        size: 'lg',
        fragment: 'novo-motorista-drawer',
        on: { rascunho: (r) => this.resultado.set(`rascunho: ${JSON.stringify(r)}`) },
      },
    );
    const m = await ref.closed;
    this.resultado.set(`open(): ${JSON.stringify(m)} (${ref.closeReason})`);
  }

  private tentativas = 0;

  /** A primeira tentativa falha: o drawer fica aberto e mostra o erro. */
  protected async exportarComFalha(): Promise<void> {
    this.tentativas = 0;
    const ref = this.drawers.open<string>({
      title: 'Exportar relatório',
      message: 'Gera um ficheiro com os dados do mês actual.\nA 1.ª tentativa falha de propósito.',
      actions: [
        { label: 'Cancelar', variant: 'ghost', value: 'cancelado' },
        {
          label: 'Exportar',
          handler: async () => {
            await new Promise((r) => setTimeout(r, 800));
            if (this.tentativas++ === 0) throw new Error('Sem ligação ao servidor. Tente de novo.');
            return 'exportado';
          },
        },
      ],
    });
    this.resultado.set(`acção: ${await ref.closed}`);
  }

  protected abrirTemplate(): void {
    const ref = this.drawers.open(this.detalheFactura(), {
      title: 'Factura',
      position: 'left',
      size: 'sm',
      data: { numero: 'FT 2026/14', total: '125 000,00' },
      tokens: { 'drawer-bg': '#fffbeb', 'drawer-border-color': '#b45309' },
    });
    void ref.closed.then((r) => this.resultado.set(`template: ${String(r)}`));
  }
}
