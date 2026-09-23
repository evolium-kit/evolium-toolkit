import { endpoint } from '../../kernel/http/endpoint';
import { toSession } from './auth.mappers';
import { EvoCredentials, EvoRegisterPayload, EvoSession, EvoSessionDto } from './auth.models';

/**
 * Endpoints de autenticação.
 *
 * Tudo o que acontece **antes** de haver sessão é `anonymous`. O `refresh` em
 * especial: se levasse o interceptor de auth, um 401 na renovação dispararia
 * outra renovação, e assim indefinidamente.
 */
export const authEndpoints = {
  login: endpoint<EvoCredentials, EvoSession>({
    method: 'POST',
    path: '/auth/login',
    anonymous: true,
    mapResponse: (dto) => toSession(dto as EvoSessionDto),
  }),

  register: endpoint<EvoRegisterPayload, EvoSession>({
    method: 'POST',
    path: '/auth/register',
    anonymous: true,
    mapResponse: (dto) => toSession(dto as EvoSessionDto),
  }),

  recoverPassword: endpoint<{ email: string }, void>({
    method: 'POST',
    path: '/auth/password/recover',
    anonymous: true,
  }),

  resetPassword: endpoint<{ token: string; password: string }, void>({
    method: 'POST',
    path: '/auth/password/reset',
    anonymous: true,
  }),

  refreshToken: endpoint<void, EvoSession>({
    method: 'POST',
    path: '/auth/refresh',
    anonymous: true,
    mapResponse: (dto) => toSession(dto as EvoSessionDto),
  }),

  logout: endpoint<void, void>({
    method: 'POST',
    path: '/auth/logout',
  }),
} as const;
