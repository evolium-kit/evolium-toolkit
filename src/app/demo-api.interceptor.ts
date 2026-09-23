import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';

/**
 * API falsa do playground.
 *
 * Existe para que a Fase 4 seja demonstrável sem backend. Corre **antes** do
 * `evoDispatchInterceptor` e responde só a `/demo-api/*`; tudo o resto segue
 * para a rede normalmente.
 *
 * Credenciais: `ana@evolium.ao` / `1234`.
 */
export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/demo-api/')) return next(req);

  const caminho = req.url.slice(req.url.indexOf('/demo-api/') + '/demo-api'.length);
  const corpo = req.body as Record<string, unknown> | null;

  const responder = <T>(dados: T, atraso = 400): Observable<HttpResponse<T>> =>
    of(new HttpResponse({ status: 200, body: dados })).pipe(delay(atraso));

  const falhar = (status: number, message: string, extra: object = {}) =>
    throwError(
      () =>
        new HttpErrorResponse({
          status,
          statusText: 'Erro',
          error: { message, ...extra },
          url: req.url,
        }),
    ).pipe(delay(400));

  switch (`${req.method} ${caminho}`) {
    case 'POST /auth/login': {
      if (corpo?.['email'] !== 'ana@evolium.ao' || corpo?.['password'] !== '1234') {
        return falhar(401, 'Credenciais inválidas.');
      }
      return responder(sessao());
    }

    case 'POST /auth/register': {
      if (typeof corpo?.['password'] === 'string' && corpo['password'].length < 8) {
        return falhar(422, 'Dados inválidos.', {
          errors: { password: ['A senha precisa de pelo menos 8 caracteres.'] },
        });
      }
      return responder(sessao(String(corpo?.['name'] ?? 'Novo utilizador')));
    }

    case 'POST /auth/password/recover':
      return responder(null);

    case 'POST /auth/refresh':
      // Sem sessão no servidor falso, a renovação falha — que é o caminho
      // normal de "sessão terminada", não um erro a mostrar.
      return falhar(401, 'Sessão expirada.');

    case 'POST /auth/logout':
      return responder(null, 150);

    case 'GET /facturas': {
      // Exige Bearer: prova que o interceptor do plugin correu.
      if (!req.headers.has('Authorization')) {
        return falhar(401, 'Não autenticado.');
      }
      return responder([
        { id: 'FT-001', cliente: 'Cliente A', total_kwanza: 125000, estado: 'paga' },
        { id: 'FT-002', cliente: 'Cliente B', total_kwanza: 48250, estado: 'pendente' },
        { id: 'FT-003', cliente: 'Cliente C', total_kwanza: 310000, estado: 'vencida' },
      ]);
    }

    default:
      return falhar(404, `Endpoint de demonstração não encontrado: ${caminho}`);
  }
};

function sessao(nome = 'Ana Silva'): unknown {
  return {
    access_token: `demo-${Math.random().toString(36).slice(2, 10)}`,
    expires_in: 3600,
    user: {
      id: 'u1',
      email: 'ana@evolium.ao',
      full_name: nome,
      roles: ['admin', 'gestor'],
    },
  };
}
