import { EvoTokenRecord, EvoVariantRecord, declarations } from '@evolium-kit/toolkit/core';

export interface BuildThemeCssInput {
  readonly tokens: EvoTokenRecord;
  readonly darkTokens: EvoTokenRecord;
  readonly variants: EvoVariantRecord;
}

/** Remove o que possa fechar a string do selector de atributo. */
function cssAttributeValue(value: string): string {
  return value.replace(/["\\\n\r]/g, '');
}

/**
 * Gera o CSS do tema a partir do estado do `EvoThemeStore`.
 *
 * Função pura, deliberadamente separada do store: é o ponto onde se concentram
 * as garantias de segurança e de cascata, e é testável sem DOM nem TestBed.
 *
 * Tudo sai dentro de `@layer evo.overrides`, a camada mais forte da toolkit mas
 * ainda assim mais fraca do que qualquer CSS que o projecto escreva fora de
 * camada. É isto que permite ao tema exportado e committado ganhar ao runtime.
 */
export function buildThemeCss(input: BuildThemeCssInput): string {
  const parts: string[] = ['@layer evo.overrides {'];

  const light = declarations(input.tokens);
  const dark = declarations(input.darkTokens);

  if (light) {
    parts.push(`:root{${light}}`);
  }

  if (dark) {
    // Dois selectores para o mesmo bloco, por razões diferentes:
    // 1. escuro forçado explicitamente pelo utilizador;
    // 2. esquema `system` com o SO em escuro — o :not() deixa o claro forçado ganhar.
    parts.push(`:root[data-evo-scheme="dark"]{color-scheme:dark;${dark}}`);
    parts.push(
      '@media (prefers-color-scheme: dark){' +
        `:root:not([data-evo-scheme="light"]){color-scheme:dark;${dark}}}`,
    );
  }

  for (const key of Object.keys(input.variants)) {
    const separator = key.indexOf('.');
    if (separator <= 0) continue;

    const component = key.slice(0, separator);
    const variant = key.slice(separator + 1);
    const tokens = input.variants[key];
    if (!tokens) continue;

    const body = declarations(tokens);
    if (!variant || !body) continue;

    // ~= e não =, para permitir variantes compostas: data-evo-variant="ghost compact"
    parts.push(
      `.evo-${cssAttributeValue(component)}` +
        `[data-evo-variant~="${cssAttributeValue(variant)}"]{${body}}`,
    );
  }

  parts.push('}');
  return parts.join('');
}
