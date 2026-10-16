import { Injectable } from '@angular/core';

/**
 * Serviço que permite que componentes renderizados em modais disparem eventos
 *
 * Uso no componente template:
 * ```typescript
 * export class MeuComponenteModal {
 *   private modalEvents = inject(ModalEventsService);
 *
 *   executarAcao() {
 *     this.modalEvents.emitir('finalisou', { resultado: 'sucesso' });
 *   }
 * }
 * ```
 *
 * Uso ao abrir o modal:
 * ```typescript
 * this.alertService.modal({
 *   template: MeuComponenteModal,
 *   on: {
 *     finalisou(eventData) {
 *       console.log('Modal finalizou:', eventData);
 *     }
 *   }
 * });
 * ```
 */
@Injectable()
export class ModalEventsService {
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Registra um listener para um evento
   */
  on<T = any>(eventName: string, callback: (eventData: T) => void): void {
    console.log(`Registrando listener para evento '${eventName}'`, callback);
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
  }

  /**
   * Remove um listener de um evento
   */
  off(eventName: string, callback: Function): void {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emite um evento com dados opcionais
   */
  emitir<T = any>(eventName: string, eventData?: T): void {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`Erro ao executar listener para evento '${eventName}':`, error);
        }
      });
    }
  }

  /**
   * Limpa todos os listeners (chamado automaticamente ao fechar o modal)
   */
  limpar(): void {
    this.listeners.clear();
  }

  /**
   * Registra múltiplos listeners de uma vez
   */
  registrarMultiplos(events: Record<string, Function>): void {
    Object.entries(events).forEach(([eventName, callback]) => {
       this.on(eventName, callback as (eventData?: any) => void);
    });
  }
}
