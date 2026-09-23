/**
 * Tipos partilhados pelos componentes.
 *
 * O `(string & {})` em cada union é deliberado: mantém o autocompletar das
 * variantes conhecidas, mas aceita variantes que o **projecto** definiu no seu
 * próprio CSS, sem precisar de alterar a toolkit.
 */

/* eslint-disable @typescript-eslint/ban-types */

/** Variante visual de um componente. Corresponde a `data-evo-variant`. */
export type EvoVariant = 'solid' | 'ghost' | 'outline' | 'danger' | (string & {});

/** Tamanho de um componente. Corresponde a `data-evo-size`. */
export type EvoSize = 'sm' | 'md' | 'lg' | (string & {});

/** Papel semântico, usado por badges, alertas e afins. */
export type EvoTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | (string & {});
