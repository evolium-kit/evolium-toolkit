import { InjectionToken, Provider } from '@angular/core';

/**
 * Mensagem para uma chave de erro de validação. Uma função recebe o valor do
 * erro (ex.: `{ requiredLength: 8, actualLength: 3 }` para `minlength`).
 */
export type EvoErrorMessage = string | ((detalhe: unknown) => string);

/** Textos do `EvoTextField`, sobreponíveis por `provideEvoTextFieldMessages()`. */
export interface EvoTextFieldMessages {
  /** Mensagem por chave de erro (`required`, `email`, `minlength`, …). */
  readonly errors: Readonly<Record<string, EvoErrorMessage>>;
  /** Para uma chave de erro sem mensagem própria. */
  readonly fallbackError: string;
  readonly optional: string;
  readonly showPassword: string;
  readonly hidePassword: string;
  readonly clear: string;
  /** `type="autoComplete"`: botão da seta quando o painel está fechado. */
  readonly openOptions: string;
  /** `type="autoComplete"`: botão da seta quando o painel está aberto. */
  readonly closeOptions: string;
  /** `type="autoComplete"`: o texto não corresponde a nenhuma opção. */
  readonly noResults: string;
  /** `type="autoComplete"`: opções a carregar. */
  readonly loading: string;
}

/** As mensagens por omissão, em português. */
export const EVO_TEXT_FIELD_DEFAULT_MESSAGES: EvoTextFieldMessages = {
  errors: {
    required: 'Campo obrigatório.',
    email: 'Email inválido.',
    minlength: (d) => `Mínimo de ${(d as { requiredLength: number }).requiredLength} caracteres.`,
    maxlength: (d) => `Máximo de ${(d as { requiredLength: number }).requiredLength} caracteres.`,
    min: (d) => `O valor mínimo é ${(d as { min: number }).min}.`,
    max: (d) => `O valor máximo é ${(d as { max: number }).max}.`,
    pattern: 'Formato inválido.',
  },
  fallbackError: 'Valor inválido.',
  optional: '(opcional)',
  showPassword: 'Mostrar senha',
  hidePassword: 'Ocultar senha',
  clear: 'Limpar',
  openOptions: 'Abrir opções',
  closeOptions: 'Fechar opções',
  noResults: 'Nenhuma opção encontrada',
  loading: 'A carregar…',
};

export const EVO_TEXT_FIELD_MESSAGES = new InjectionToken<EvoTextFieldMessages>(
  'EVO_TEXT_FIELD_MESSAGES',
  { providedIn: 'root', factory: () => EVO_TEXT_FIELD_DEFAULT_MESSAGES },
);

/** O que se pode sobrepor: tudo opcional, e `errors` junta-se às omissões. */
export type EvoTextFieldMessagesOverride = Partial<Omit<EvoTextFieldMessages, 'errors'>> & {
  readonly errors?: Readonly<Record<string, EvoErrorMessage>>;
};

/**
 * Sobrepõe as mensagens de todos os `evo-text-field` da aplicação (ou de uma
 * rota/componente, se usado nos seus `providers`).
 *
 * ```ts
 * provideEvoTextFieldMessages({
 *   errors: { nifInvalido: 'NIF inválido.' },
 *   optional: '(facultativo)',
 * })
 * ```
 */
export function provideEvoTextFieldMessages(mensagens: EvoTextFieldMessagesOverride): Provider {
  return {
    provide: EVO_TEXT_FIELD_MESSAGES,
    useValue: {
      ...EVO_TEXT_FIELD_DEFAULT_MESSAGES,
      ...mensagens,
      errors: { ...EVO_TEXT_FIELD_DEFAULT_MESSAGES.errors, ...mensagens.errors },
    } satisfies EvoTextFieldMessages,
  };
}
