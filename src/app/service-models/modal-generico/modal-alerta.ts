import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalGenericoComponent } from './modal-generico';

/**
 * EXEMPLO 3: Modal de Alerta
 * Caso de uso: Mostrar mensagens simples (sucesso, erro, aviso, etc)
 */

@Component({
  selector: 'app-modal-alerta',
  template: `<app-modal-generico
    [isAberto]="isAberto()"
    [titulo]="titulo()"
    tamanho="pequeno"
    (aoFechar)="aoFechar.emit()"
  >
    <div class="space-y-4">
      <!-- Ícone e Mensagem -->
      <div class="flex gap-4">
        <div [ngClass]="obterClasesIcone()" class="shrink-0 text-2xl">
          {{ obterIcone() }}
        </div>
        <div class="flex-1">
          <p class="text-gray-700 leading-relaxed">{{ mensagem() }}</p>
        </div>
      </div>

      <!-- Botão de Ação -->
      <div class="flex justify-end pt-4">
        <button
          (click)="aoFechar.emit()"
          [ngClass]="{
            'bg-[#DC2626] hover:bg-[#BB1F1F]': tipo() === 'erro',
            'bg-yellow-600 hover:bg-yellow-700': tipo() === 'aviso',
            'bg-green-600 hover:bg-green-700': tipo() === 'sucesso',
            'bg-blue-600 hover:bg-blue-700': tipo() === 'info'
          }"
          class="px-6 py-2 text-white rounded-lg font-semibold transition-colors"
        >
          {{ textoBotao() }}
        </button>
      </div>
    </div>
  </app-modal-generico>`,
  standalone: true,
  imports: [CommonModule, ModalGenericoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalAlertaComponent {
  isAberto = input<boolean>(false);
  titulo = input<string>('Alerta');
  mensagem = input<string>('');
  tipo = input<'erro' | 'aviso' | 'sucesso' | 'info'>('info');
  textoBotao = input<string>('OK');

  aoFechar = output<void>();

  obterIcone(): string {
    switch (this.tipo()) {
      case 'erro':
        return '❌';
      case 'aviso':
        return '⚠️';
      case 'sucesso':
        return '✅';
      default:
        return 'ℹ️';
    }
  }

  obterClasesIcone(): string {
    switch (this.tipo()) {
      case 'erro':
        return 'text-red-600';
      case 'aviso':
        return 'text-yellow-600';
      case 'sucesso':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  }
}
