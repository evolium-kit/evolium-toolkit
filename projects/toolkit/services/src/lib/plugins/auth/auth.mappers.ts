import { EvoSession, EvoSessionDto, EvoUser } from './auth.models';

export function toUser(dto: EvoSessionDto['user']): EvoUser {
  return {
    id: dto.id,
    email: dto.email,
    name: dto.full_name,
    roles: dto.roles ?? [],
  };
}

/**
 * Converte a resposta da API numa sessão de domínio.
 *
 * `expires_in` vem em segundos relativos; guardamos um instante absoluto, para
 * que verificar a validade não dependa de saber quando a resposta chegou.
 */
export function toSession(dto: EvoSessionDto, agora = Date.now()): EvoSession {
  return {
    accessToken: dto.access_token,
    expiresAt: agora + dto.expires_in * 1000,
    user: toUser(dto.user),
  };
}
