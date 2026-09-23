/**
 * Tipos partilhados pelos layouts.
 *
 * Um layout é um shell com slots por `ng-content`: não conhece as páginas que o
 * preenchem, e nenhuma página sabe em que shell está montada.
 */

/** Entrada de navegação, consumida pelos shells com menu lateral. */
export interface EvoNavItem {
  readonly label: string;
  /** Destino do `routerLink`. Ausente num item que só agrupa filhos. */
  readonly route?: string | readonly string[];
  /** Nome do ícone, resolvido pelo registo de ícones do projecto. */
  readonly icon?: string;
  /** Papéis autorizados. Vazio ou ausente significa visível para todos. */
  readonly roles?: readonly string[];
  readonly children?: readonly EvoNavItem[];
  /** Contador opcional (notificações, itens por tratar). */
  readonly badge?: number | string;
}

/** Estado de um painel lateral colapsável. */
export type EvoSidebarState = 'expanded' | 'collapsed' | 'hidden';
