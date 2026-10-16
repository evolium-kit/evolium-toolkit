import { EvoCrudHookContext, EvoCrudHooks } from './crud.types';

/** Nomes dos hooks (tudo menos `name`). */
export type EvoCrudHookName = Exclude<keyof EvoCrudHooks, 'name'>;

/** Detalhe do evento `crud:hook-error`, emitido quando um hook de notificação falha. */
export interface EvoCrudHookError {
  readonly hook: EvoCrudHookName;
  readonly name: string;
  readonly path: string;
  readonly error: unknown;
}

type QualquerHook = (ctx: EvoCrudHookContext, ...args: never[]) => unknown;

function hookDe<T, D>(hooks: EvoCrudHooks<T, D>, nome: EvoCrudHookName): QualquerHook | undefined {
  const fn = hooks[nome] as QualquerHook | undefined;
  return fn ? fn.bind(hooks) : undefined;
}

/**
 * Corre os hooks de uma operação. Interno: é o mesmo para o resource e para o
 * controller, que partilham a lista já resolvida (globais + locais).
 */
export class CrudHookRunner<T, D> {
  constructor(
    private readonly hooks: readonly EvoCrudHooks<T, D>[],
    private readonly ctx: EvoCrudHookContext,
    private readonly reportar: (erro: EvoCrudHookError) => void,
  ) {}

  /** `true` se algum hook implementa `nome`. */
  has(nome: EvoCrudHookName): boolean {
    return this.hooks.some((h) => !!h[nome]);
  }

  /** Transformador: cada hook pode substituir o valor; `undefined` mantém-no. */
  async transform<V>(nome: EvoCrudHookName, inicial: V): Promise<V> {
    let valor = inicial;
    for (const h of this.hooks) {
      const fn = hookDe(h, nome) as ((c: EvoCrudHookContext, v: V) => unknown) | undefined;
      if (!fn) continue;
      const resultado = await fn(this.ctx, valor);
      if (resultado !== undefined) valor = resultado as V;
    }
    return valor;
  }

  /**
   * Cancelável: o primeiro `false` pára tudo. Devolve `'handled'` se algum hook
   * o disse (e nenhum cancelou), senão `true`.
   */
  async decide(nome: EvoCrudHookName, ...args: unknown[]): Promise<boolean | 'handled'> {
    let decisao: boolean | 'handled' = true;
    for (const h of this.hooks) {
      const fn = hookDe(h, nome) as ((c: EvoCrudHookContext, ...a: unknown[]) => unknown) | undefined;
      if (!fn) continue;
      const resultado = await fn(this.ctx, ...args);
      if (resultado === false) return false;
      if (resultado === 'handled') decisao = 'handled';
    }
    return decisao;
  }

  /** Notificação: correm todos; um que falhe é reportado e não pára os outros. */
  async notify(nome: EvoCrudHookName, ...args: unknown[]): Promise<void> {
    for (const h of this.hooks) {
      const fn = hookDe(h, nome) as ((c: EvoCrudHookContext, ...a: unknown[]) => unknown) | undefined;
      if (!fn) continue;
      try {
        await fn(this.ctx, ...args);
      } catch (error) {
        this.reportar({ hook: nome, name: h.name, path: this.ctx.path, error });
      }
    }
  }
}
