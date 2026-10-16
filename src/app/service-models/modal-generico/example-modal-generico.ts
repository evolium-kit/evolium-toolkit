import { Component, signal } from '@angular/core';
import { ModalGenericoComponent } from '../modal-generico/modal-generico';
import { CommonModule } from '@angular/common';

/**
 * EXEMPLO DE USO DO MODAL GENÉRICO
 *
 * Exemplo 1: Modal Simples
 * ========================
 * <app-modal-generico
 *   [isAberto]="mostrarModal()"
 *   titulo="Confirmar Ação"
 *   (aoFechar)="mostrarModal.set(false)"
 * >
 *   <p>Deseja realmente continuar?</p>
 *   <div class="mt-6 flex gap-4 justify-end">
 *     <button (click)="aoFechar()" class="px-4 py-2 border border-gray-300 rounded">
 *       Cancelar
 *     </button>
 *     <button class="px-4 py-2 bg-[#DC2626] text-white rounded">
 *       Confirmar
 *     </button>
 *   </div>
 * </app-modal-generico>
 *
 * Exemplo 2: Modal Grande
 * =======================
 * <app-modal-generico
 *   [isAberto]="mostrarDetalhes()"
 *   titulo="Detalhes da Empresa"
 *   tamanho="grande"
 *   (aoFechar)="mostrarDetalhes.set(false)"
 * >
 *   <!-- Conteúdo complexo aqui -->
 * </app-modal-generico>
 *
 * Exemplo 3: Modal sem Título
 * ===========================
 * <app-modal-generico
 *   [isAberto]="carregando()"
 *   tamanho="pequeno"
 * >
 *   <div class="flex flex-col items-center gap-4">
 *     <div class="animate-spin">⏳</div>
 *     <p>Carregando...</p>
 *   </div>
 * </app-modal-generico>
 */

@Component({
  selector: 'app-example-modal-generico',
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-4">Exemplo de Modal Genérico</h1>

      <!-- Botão para abrir modal -->
      <button
        (click)="abrirModal()"
        class="px-6 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#BB1F1F]"
      >
        Abrir Modal
      </button>

      <!-- Modal Genérico -->
      <app-modal-generico
        [isAberto]="modalAberto()"
        titulo="Exemplo de Modal"
        tamanho="medio"
        (aoFechar)="fecharModal()"
      >
        <div class="space-y-4">
          <p class="text-gray-700">
            Este é um exemplo de modal reutilizável que pode ser usado em qualquer componente.
          </p>

          <div class="bg-blue-50 border border-blue-200 rounded p-4">
            <p class="text-sm text-gray-700">
              O conteúdo é injetado via ng-content, tornando este modal completamente flexível!
            </p>
          </div>

          <div class="flex gap-4 justify-end pt-4">
            <button
              (click)="fecharModal()"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              (click)="confirmar()"
              class="px-4 py-2 bg-[#DC2626] text-white rounded-lg hover:bg-[#BB1F1F]"
            >
              Confirmar
            </button>
          </div>
        </div>
      </app-modal-generico>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ModalGenericoComponent],
})
export class ExampleModalGenericoComponent {
  modalAberto = signal(false);

  abrirModal() {
    this.modalAberto.set(true);
  }

  fecharModal() {
    this.modalAberto.set(false);
  }

  confirmar() {
    alert('Ação confirmada!');
    this.fecharModal();
  }
}
