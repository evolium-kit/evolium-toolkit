/**
 * Tipos partilhados pelas páginas.
 *
 * Toda a página da toolkit trata explicitamente os quatro estados abaixo. Uma
 * página sem estado de erro visível não está pronta — ver pages/README.md.
 */

/** Estado de carregamento de uma página ou secção. */
export type EvoLoadState = 'idle' | 'loading' | 'empty' | 'error' | 'ready';

/** Texto substituível numa página pronta, para tradução ou ajuste de marca. */
export type EvoPageCopy = Readonly<Record<string, string>>;
