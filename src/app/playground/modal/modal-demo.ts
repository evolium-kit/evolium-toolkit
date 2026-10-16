import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EvoButton,
  EvoCard,
  EvoModal,
  EvoModalBeforeCloseFn,
  EvoModalService,
  EvoTextField,
} from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import { FormMotorista, FormMotoristaDados, FormMotoristaEventos, Motorista } from './form-motorista';

/**
 * `<evo-modal>` declarativo e `EvoModalService`.
 *
 * Nada aparece aberto ao carregar: cada botão descreve o modal que abre.
 */
@Component({
  selector: 'app-modal-demo',
  imports: [EvoCard, EvoButton, EvoModal, EvoTextField, EvoTokensDirective, ReactiveFormsModule],
  templateUrl: './modal-demo.html',
  styleUrl: '../shared/demo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalDemo {
  protected readonly modals = inject(EvoModalService);
  protected readonly resultado = signal('—');

  // ------------------------------------------------------- declarativos

  protected readonly empresaAberta = signal(false);
  protected readonly topoAberto = signal(false);
  protected readonly cheioAberto = signal(false);
  protected readonly iconeAberto = signal(false);
  protected readonly subarvoreAberta = signal(false);

  protected readonly empresa = inject(NonNullableFormBuilder).group({
    nome: ['Evolium, Lda', Validators.required],
    nif: ['5417000000'],
  });

  /** Com alterações por gravar, Escape/fundo/× perguntam antes de fechar. */
  protected readonly perguntarSeSai: EvoModalBeforeCloseFn = () =>
    !this.empresa.dirty ||
    this.modals.confirm({
      title: 'Sair sem gravar?',
      message: 'As alterações perdem-se.',
      tone: 'danger',
      confirmLabel: 'Sair',
    });

  protected gravarEmpresa(): void {
    this.empresa.markAsPristine();
    this.empresaAberta.set(false);
  }

  // ------------------------------------------------------------ serviço

  private readonly detalheFactura = viewChild.required<TemplateRef<unknown>>('detalheFactura');

  protected async eliminar(): Promise<void> {
    const sim = await this.modals.confirm({
      message: 'Eliminar a factura FT 2026/14?',
      tone: 'danger',
      confirmLabel: 'Eliminar',
    });
    this.resultado.set(`confirm(): ${sim}`);
  }

  protected async pedirMotivo(): Promise<void> {
    const motivo = await this.modals.prompt({
      title: 'Anular factura',
      label: 'Motivo',
      required: true,
    });
    this.resultado.set(`prompt(): ${JSON.stringify(motivo)}`);
  }

  private tentativas = 0;

  /** A primeira tentativa falha: o modal fica aberto e mostra o erro. */
  protected async submeterComFalha(): Promise<void> {
    this.tentativas = 0;
    const ref = this.modals.open<string>({
      title: 'Submeter a declaração?',
      message: 'Depois de submetida não pode ser alterada.\nA 1.ª tentativa falha de propósito.',
      actions: [
        { label: 'Cancelar', variant: 'ghost', value: 'cancelado' },
        {
          label: 'Submeter',
          handler: async () => {
            await new Promise((r) => setTimeout(r, 800));
            if (this.tentativas++ === 0) throw new Error('Sem ligação ao servidor. Tente de novo.');
            return 'submetido';
          },
        },
      ],
    });
    this.resultado.set(`acção: ${await ref.closed}`);
  }

  protected async registarMotorista(): Promise<void> {
    const ref = this.modals.open<FormMotoristaDados, Motorista, FormMotoristaEventos>(
      FormMotorista,
      {
        title: 'Registar motorista',
        data: { mode: 'create' },
        position: 'top',
        fragment: 'registar-motorista',
        on: { rascunho: (r) => this.resultado.set(`rascunho: ${JSON.stringify(r)}`) },
      },
    );
    const m = await ref.closed;
    this.resultado.set(`open(): ${JSON.stringify(m)} (${ref.closeReason})`);
  }

  protected abrirTemplate(): void {
    const ref = this.modals.open(this.detalheFactura(), {
      title: 'Factura',
      size: 'sm',
      data: { numero: 'FT 2026/14', total: '125 000,00' },
      tokens: { 'modal-bg': '#fffbeb', 'modal-border-color': '#b45309', 'modal-radius': '4px' },
    });
    void ref.closed.then((r) => this.resultado.set(`template: ${String(r)}`));
  }
}
