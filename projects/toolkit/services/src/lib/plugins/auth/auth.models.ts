/* ------------------------------------------------------------------ domínio */

export interface EvoUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly roles: readonly string[];
}

export interface EvoSession {
  readonly accessToken: string;
  /** Instante de expiração em milissegundos desde a época. */
  readonly expiresAt: number;
  readonly user: EvoUser;
}

export interface EvoCredentials {
  readonly email: string;
  readonly password: string;
}

export interface EvoRegisterPayload {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

/* ---------------------------------------------------------------- wire (DTO) */

/**
 * Formato da API, deliberadamente em `snake_case`.
 *
 * Existe para que os mappers tenham trabalho real: é a forma de garantir que a
 * convenção do backend nunca escapa para o domínio, e que mudá-la é uma
 * alteração de uma linha num mapper em vez de uma busca por toda a aplicação.
 */
export interface EvoSessionDto {
  readonly access_token: string;
  /** Segundos de validade, contados a partir da resposta. */
  readonly expires_in: number;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly full_name: string;
    readonly roles?: readonly string[];
  };
}
