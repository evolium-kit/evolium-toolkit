import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalGenericoComponent } from './modal-generico';

/**
 * EXEMPLO 2: Modal de Confirmação
 * Caso de uso: Confirmar ações (deletar, cancelar, etc)
 */

@Component({
  selector: 'app-modal-confirmacao',
  template: `<app-modal-generico
    [isAberto]="isAberto()"
    [titulo]="titulo()"
    tamanho="pequeno"
    (aoFechar)="aoFechar.emit()"
  >
    <div class="space-y-6">
      <p class="text-gray-700">{{ mensagem() }}</p>

      <div class="flex gap-3 justify-end">
        <button
          (click)="aoFechar.emit()"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
        >
          {{ textoBtnCancelar() }}
        </button>
        <button
          (click)="aoConfirmar.emit()"
          [ngClass]="{
            'bg-[#DC2626] hover:bg-[#BB1F1F]': tipo() === 'perigo',
            'bg-blue-600 hover:bg-blue-700': tipo() === 'info',
            'bg-green-600 hover:bg-green-700': tipo() === 'sucesso'
          }"
          class="px-4 py-2 text-white rounded-lg font-semibold transition-colors"
        >
          {{ textoBtnConfirmar() }}
        </button>
      </div>
    </div>
  </app-modal-generico>`,
  standalone: true,
  imports: [CommonModule, ModalGenericoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalConfirmacaoComponent {
  isAberto = input<boolean>(false);
  titulo = input<string>('Confirmar');
  mensagem = input<string>('');
  tipo = input<'perigo' | 'info' | 'sucesso'>('info');
  textoBtnConfirmar = input<string>('Confirmar');
  textoBtnCancelar = input<string>('Cancelar');

  aoConfirmar = output<void>();
  aoFechar = output<void>();
}
