import { HttpErrorResponse } from '@angular/common/http';
import { EvoError, kindFromStatus } from './evo-error';

/** Formatos de erro de validação que aparecem na prática. */
interface CorpoErro {
  message?: unknown;
  error?: unknown;
  detail?: unknown;
  errors?: unknown;
  fieldErrors?: unknown;
}

/**
 * Converte qualquer erro num `EvoError`.
 *
 * Só chega aqui o que o plugin não mapeou: um plugin com formato de erro
 * próprio implementa `mapError` e devolve `undefined` para o resto.
 */
export function defaultErrorMapper(erro: unknown): EvoError {
  if (erro instanceof EvoError) return erro;

  if (erro instanceof HttpErrorResponse) {
    const kind = kindFromStatus(erro.status);
    const corpo = (erro.error ?? {}) as CorpoErro;

    return new EvoError(kind, mensagemDe(corpo, erro), {
      status: erro.status,
      fieldErrors: camposDe(corpo),
      cause: erro,
    });
  }

  if (erro instanceof Error) {
    return new EvoError('unknown', erro.message, { cause: erro });
  }

  return new EvoError('unknown', 'Ocorreu um erro inesperado.', { cause: erro });
}

function mensagemDe(corpo: CorpoErro, resposta: HttpErrorResponse): string {
  for (const candidato of [corpo.message, corpo.error, corpo.detail]) {
    if (typeof candidato === 'string' && candidato.trim()) return candidato;
  }
  // `resposta.message` do Angular inclui a URL; para o utilizador final é ruído,
  // mas é melhor do que uma mensagem vazia e ajuda em desenvolvimento.
  return resposta.message || `Erro ${resposta.status}.`;
}

function camposDe(corpo: CorpoErro): Readonly<Record<string, readonly string[]>> | undefined {
  const bruto = corpo.fieldErrors ?? corpo.errors;
  if (!bruto || typeof bruto !== 'object') return undefined;

  const saida: Record<string, readonly string[]> = {};
  for (const [campo, valor] of Object.entries(bruto as Record<string, unknown>)) {
    if (typeof valor === 'string') saida[campo] = [valor];
    else if (Array.isArray(valor)) saida[campo] = valor.map(String);
  }

  return Object.keys(saida).length > 0 ? saida : undefined;
}
