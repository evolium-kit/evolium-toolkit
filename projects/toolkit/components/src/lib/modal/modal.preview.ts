import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { EvoButton } from '../button/evo-button';
import { EvoModal } from './evo-modal';
import { EvoModalPanel } from './evo-modal-panel';
import { EvoModalService } from './modal.service';

/**
 * Pré-visualização para o Theme Studio, desenhada num iframe.
 *
 * Os painéis estáticos mostram os estados lado a lado sem abrir nada; os
 * botões abrem um modal a sério, para ver o fundo, a animação e o foco.
 */
@Component({
  selector: 'evo-modal-preview',
  imports: [EvoModalPanel, EvoModal, EvoButton],
  template: `
    <div class="pv__row" style="align-items: flex-start; flex-wrap: wrap">
      <div class="pv__estado">
        <evo-modal-panel heading="Editar empresa" [size]="size() ?? 'sm'">
          <p style="margin: 0">Conteúdo livre: formulários, tabelas, o que for.</p>
          <div slot="footer">
            <button evoButton variant="ghost">Cancelar</button>
            <button evoButton>Gravar</button>
          </div>
        </evo-modal-panel>
        <span>Com título e rodapé</span>
      </div>

      @for (tom of tons; track tom) {
        <div class="pv__estado">
          <evo-modal-panel [tone]="tom" heading="Título" size="sm">
            <p style="margin: 0">Mensagem do alerta.</p>
            <div slot="footer"><button evoButton>OK</button></div>
          </evo-modal-panel>
          <span>tone="{{ tom }}"</span>
        </div>
      }

      <div class="pv__estado">
        <evo-modal-panel tone="success" heading="Verificado" size="sm" [showClose]="false">
          <svg
            slot="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          >
            <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
            <path d="m8.5 12 2.5 2.5 4.5-5" />
          </svg>
          <p style="margin: 0">Ícone próprio em slot="icon", sem ×.</p>
        </evo-modal-panel>
        <span>Ícone próprio</span>
      </div>
    </div>

    <div class="pv__row">
      <button evoButton (click)="aberto.set(true)">Abrir &lt;evo-modal&gt;</button>
      <button evoButton variant="outline" (click)="confirmar()">confirm()</button>
      <button evoButton variant="outline" (click)="modals.success('Pagamento aceite.')">
        success()
      </button>
    </div>

    <evo-modal [(open)]="aberto" heading="Modal declarativo" [size]="size() ?? 'md'">
      <p style="margin: 0">Escape, clique no fundo ou × fecham. O foco volta ao botão.</p>
      <div slot="footer">
        <button evoButton (click)="aberto.set(false)">Fechar</button>
      </div>
    </evo-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoModalPreview {
  readonly size = input<string | null>(null);

  protected readonly modals = inject(EvoModalService);
  protected readonly aberto = signal(false);
  protected readonly tons = ['success', 'danger', 'warning', 'info', 'question'];

  protected confirmar(): void {
    void this.modals.confirm({ message: 'Eliminar a factura FT 2026/14?', tone: 'danger' });
  }
}
