import { EvoCrudId, EvoCrudListAdapter, EvoCrudListMeta } from './crud.types';

/** Lê `'a.b.c'` de um valor qualquer, sem lançar se um nível faltar. */
function lerCaminho(origem: unknown, caminho: string): unknown {
  let actual: unknown = origem;
  for (const chave of caminho.split('.')) {
    if (typeof actual !== 'object' || actual === null) return undefined;
    actual = (actual as Readonly<Record<string, unknown>>)[chave];
  }
  return actual;
}

function metaDe(valor: unknown): EvoCrudListMeta | null {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
    ? (valor as EvoCrudListMeta)
    : null;
}

/**
 * Adaptador por caminho: `crudAdapterByPath('result.rows', 'result.pagination')`.
 * É o que `response: 'result.rows'` usa por dentro.
 */
export function crudAdapterByPath<T>(itemsPath: string, metaPath?: string): EvoCrudListAdapter<T> {
  return (raw) => {
    const items = lerCaminho(raw, itemsPath);
    if (!Array.isArray(items)) return null;
    return { items: items as T[], meta: metaPath ? metaDe(lerCaminho(raw, metaPath)) : null };
  };
}

const CANDIDATOS = ['data', 'items', 'results', 'data.data', 'data.items'] as const;

/**
 * Adaptador por omissão: reconhece um array puro, `.data`, `.items`,
 * `.results`, `.data.data` e `.data.items`, com o meta em `.meta`. Devolve
 * `null` quando não reconhece nada — o resource assume lista vazia e emite
 * `crud:unrecognized-response` no barramento de eventos.
 */
export function crudAutoAdapter<T>(): EvoCrudListAdapter<T> {
  return (raw) => {
    if (Array.isArray(raw)) return { items: raw as T[], meta: null };
    for (const caminho of CANDIDATOS) {
      const valor = lerCaminho(raw, caminho);
      if (Array.isArray(valor)) return { items: valor as T[], meta: metaDe(lerCaminho(raw, 'meta')) };
    }
    return null;
  };
}

/**
 * Compara ids por texto. Os parâmetros de rota chegam sempre como string e as
 * APIs devolvem muitas vezes números — com `===`, `'5'` nunca encontrava `5`.
 */
export function sameCrudId(a: unknown, b: unknown): boolean {
  return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
}

/** Lê o id de um item pelo campo dado. */
export function crudIdOf<T>(item: T, idKey: keyof T): EvoCrudId {
  const valor: unknown = item[idKey];
  return typeof valor === 'number' ? valor : String(valor);
}
