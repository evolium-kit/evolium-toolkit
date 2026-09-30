import { InjectionToken, Provider, Type } from '@angular/core';

/**
 * Tipo de controlo que o Theme Studio desenha para um token.
 * Acrescentar um tipo aqui obriga a tratá-lo no painel de propriedades.
 */
export type EvoTokenControlType = 'color' | 'length' | 'select' | 'number' | 'shadow' | 'font';

/** Descrição de um token editável de um componente. */
export interface EvoTokenMeta {
  /** Forma curta, sem o prefixo `--evo-`. Por exemplo `button-bg`. */
  readonly name: string;
  /** Etiqueta mostrada no painel de propriedades. */
  readonly label: string;
  readonly type: EvoTokenControlType;
  /**
   * Token semântico usado quando este não está definido, mostrado no Studio
   * como "herda de". Corresponde ao fallback do `var()` no CSS do componente.
   */
  readonly fallback?: string;
  /** Para `length` e `number`. */
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;
  /** Para `select`. */
  readonly options?: readonly string[];
  /** Explicação curta mostrada em tooltip. */
  readonly hint?: string;
}

/**
 * Descrição completa de um componente para o Theme Studio.
 *
 * O Studio gera a lista da esquerda, a pesquisa e o painel de propriedades a
 * partir destes metadados — nenhum painel é escrito à mão, e um componente novo
 * aparece no Studio assim que se regista aqui.
 */
export interface EvoComponentMeta {
  /** Prefixo dos tokens e do selector. `button` -> `.evo-button`, `--evo-button-*`. */
  readonly id: string;
  readonly label: string;
  /** Agrupamento na lista da esquerda. Por exemplo `Básicos`, `Superfícies`. */
  readonly category: string;
  /** Termos extra para a barra de pesquisa. */
  readonly tags?: readonly string[];
  readonly variants?: readonly string[];
  readonly sizes?: readonly string[];
  readonly tokens: readonly EvoTokenMeta[];
  /**
   * Componente de pré-visualização, carregado só quando seleccionado.
   *
   * O Studio desenha-o num `<iframe>`, isolado da interface do Studio. Se o
   * componente declarar os inputs `variant` e/ou `size` (`string | null`),
   * recebe neles a variante e o tamanho escolhidos; os que não declarar são
   * simplesmente omitidos.
   *
   * Nos componentes da toolkit é preenchido pelo registo gerado a partir do
   * `<nome>.preview.ts` — ver `tools/generate-component-registry.mjs`.
   */
  readonly preview?: () => Promise<Type<unknown>>;
  /**
   * Documentação do componente, em HTML, carregada só quando seleccionado.
   *
   * Nos componentes da toolkit é o `README.md` da pasta, convertido no build.
   * O Studio passa-a pelo sanitizador do Angular antes de a mostrar.
   */
  readonly docs?: () => Promise<string>;
}

export const EVO_COMPONENT_META = new InjectionToken<readonly EvoComponentMeta[]>(
  'EVO_COMPONENT_META',
);

/**
 * Regista componentes no Theme Studio.
 *
 * ```ts
 * provideEvoComponentMeta(buttonMeta, cardMeta)
 * ```
 */
export function provideEvoComponentMeta(...meta: readonly EvoComponentMeta[]): Provider[] {
  return meta.map((value) => ({ provide: EVO_COMPONENT_META, useValue: value, multi: true }));
}
