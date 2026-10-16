import { inject } from '@angular/core';
import { CRUD_KIT_GLOBAL_PLUGINS } from './crud-kit-plugin.token';
import type { CrudKitPlugin, CrudPluginContext } from './crud-kit-plugin.types';

type HookName = Exclude<keyof CrudKitPlugin<any, any>, 'nome'>;

/**
 * Junta os plugins globais (injetados via `CRUD_KIT_GLOBAL_PLUGINS`) com os locais
 * (passados em `config.plugins`). Globais correm primeiro em todos os hooks.
 *
 * Precisa de ser chamado dentro de um contexto de injeção — mesma regra de
 * `createCrudResource`.
 */
export function resolveCrudKitPlugins<TEntity extends Record<string, any>, TDto>(
  locais: CrudKitPlugin<TEntity, TDto>[] = [],
): CrudKitPlugin<TEntity, TDto>[] {
  const globais = (inject(CRUD_KIT_GLOBAL_PLUGINS, { optional: true }) ?? []) as CrudKitPlugin<TEntity, TDto>[];
  return [...globais, ...locais];
}

/** Transformador: cada plugin pode alterar o valor; `undefined` mantém o anterior. */
export async function correrHookTransformador<TEntity extends Record<string, any>, TDto, TValor>(
  plugins: CrudKitPlugin<TEntity, TDto>[],
  hook: HookName,
  valorInicial: TValor,
  ctx: CrudPluginContext<TEntity>,
): Promise<TValor> {
  let valor = valorInicial;
  for (const plugin of plugins) {
    const fn = plugin[hook] as ((c: CrudPluginContext<TEntity>, v: TValor) => any) | undefined;
    if (!fn) continue;
    const resultado = await fn(ctx, valor);
    if (resultado !== undefined) valor = resultado;
  }
  return valor;
}

/** Cancelável: qualquer plugin a devolver `false` interrompe a operação. */
export async function correrHookCancelavel<TEntity extends Record<string, any>, TDto>(
  plugins: CrudKitPlugin<TEntity, TDto>[],
  hook: HookName,
  ctx: CrudPluginContext<TEntity>,
  ...args: any[]
): Promise<boolean> {
  for (const plugin of plugins) {
    const fn = plugin[hook] as ((...a: any[]) => any) | undefined;
    if (!fn) continue;
    const resultado = await fn(ctx, ...args);
    if (resultado === false) return false;
  }
  return true;
}

/** Notificação: corre todos; um plugin com erro não impede os restantes nem o fluxo principal. */
export async function correrHookNotificacao<TEntity extends Record<string, any>, TDto>(
  plugins: CrudKitPlugin<TEntity, TDto>[],
  hook: HookName,
  ctx: CrudPluginContext<TEntity>,
  ...args: any[]
): Promise<void> {
  for (const plugin of plugins) {
    const fn = plugin[hook] as ((...a: any[]) => any) | undefined;
    if (!fn) continue;
    try {
      await fn(ctx, ...args);
    } catch (erro) {
      console.error(`[crud-kit] plugin "${plugin.nome}" falhou no hook "${String(hook)}":`, erro);
    }
  }
}
