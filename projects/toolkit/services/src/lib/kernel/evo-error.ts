/** Categorias estáveis de erro, independentes do backend. */
export type EvoErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'conflict'
  | 'server'
  | 'unknown';

/**
 * Erro normalizado da toolkit.
 *
 * Nenhum `HttpErrorResponse` cru chega ao consumidor: todos os plugins lançam
 * através de `ctx.toError(e)`, para que a aplicação possa reagir a `kind` em
 * vez de a códigos HTTP espalhados pelo código.
 */
export class EvoError extends Error {
  readonly kind: EvoErrorKind;
  readonly status?: number;
  /** Erros por campo, para ligar directamente a um formulário. */
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
  /** Resposta original, para diagnóstico. Nunca mostrar ao utilizador final. */
  override readonly cause?: unknown;

  constructor(
    kind: EvoErrorKind,
    message: string,
    options: {
      status?: number;
      fieldErrors?: Readonly<Record<string, readonly string[]>>;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'EvoError';
    this.kind = kind;
    this.status = options.status;
    this.fieldErrors = options.fieldErrors;
    this.cause = options.cause;
  }
}

/** Mapeia um código HTTP para uma categoria. */
export function kindFromStatus(status: number): EvoErrorKind {
  if (status === 0) return 'network';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}
