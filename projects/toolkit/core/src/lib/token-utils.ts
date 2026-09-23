import { EvoTokenRecord } from './theme.model';

/** Só identificadores de custom property. Tudo o resto é rejeitado. */
const CSS_IDENT = /^--[a-zA-Z0-9_-]+$/;

/**
 * Valores que conseguem escapar de dentro de um bloco `<style>` ou carregar
 * recursos externos. `DomSanitizer` NÃO protege `textContent` de um `<style>`,
 * por isso esta verificação é a única barreira entre o Theme Studio e um XSS.
 */
const UNSAFE_VALUE = /[<>{}\\]|@import|url\s*\(|expression\s*\(/i;

/**
 * Aceita a forma curta (`color-primary`) ou completa (`--evo-color-primary`)
 * e devolve sempre a completa.
 */
export function normalizeTokenName(name: string): string {
  return name.startsWith('--') ? name : `--evo-${name}`;
}

/** Normaliza as chaves de um mapa inteiro. */
export function normalizeTokens(record: Readonly<Record<string, string>>): EvoTokenRecord {
  const out: Record<string, string> = {};
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value === undefined) continue;
    out[normalizeTokenName(key)] = value;
  }
  return out;
}

/** Um nome é seguro se for um identificador de custom property válido. */
export function isSafeTokenName(name: string): boolean {
  return CSS_IDENT.test(name);
}

/** Um valor é seguro se não conseguir escapar do bloco `<style>`. */
export function isSafeTokenValue(value: string): boolean {
  return !UNSAFE_VALUE.test(value);
}

/**
 * Serializa um mapa de tokens como declarações CSS, descartando em silêncio
 * tudo o que não passe a validação. Descartar é deliberado: um token inválido
 * nunca deve impedir o resto do tema de ser aplicado.
 */
export function declarations(record: EvoTokenRecord): string {
  let out = '';
  for (const name of Object.keys(record)) {
    const value = record[name];
    if (value === undefined) continue;
    if (!isSafeTokenName(name) || !isSafeTokenValue(value)) continue;
    out += `${name}:${value};`;
  }
  return out;
}
