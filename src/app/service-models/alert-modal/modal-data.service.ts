import { Injectable, signal } from '@angular/core';

/**
 * Serviço que fornece contexto de dados para componentes renderizados dentro de modais
 *
 * Uso:
 * - No modal service, providenciar esse serviço com os dados
 * - No componente template, injetar esse serviço para acessar os dados
 *
 * Exemplo:
 * export class MeuComponente {
 *   private modalData = inject(ModalDataService);
 *   data = this.modalData.obterDados();
 * }
 */
@Injectable()
export class ModalDataService {
  private dadosInterno = signal<unknown>(null);

  /**
   * Define os dados do modal
   */
  definirDados(dados: unknown): void {
    this.dadosInterno.set(dados);
  }

  /**
   * Obtém os dados como um signal
   */
  obterDados<T = unknown>(): T | null {
    return this.dadosInterno() as T | null;
  }

  /**
   * Obtém o signal bruto dos dados
   */
  obterDadosSignal() {
    return this.dadosInterno;
  }

  /**
   * Limpa os dados
   */
  limpar(): void {
    this.dadosInterno.set(null);
  }
}
