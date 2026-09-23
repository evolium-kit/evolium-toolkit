import { isPlatformServer } from '@angular/common';
import { DOCUMENT, PLATFORM_ID, REQUEST, RESPONSE_INIT, inject } from '@angular/core';
import { EvoStorage } from './types';

/**
 * Armazenamento em memória. É o default do kernel.
 *
 * Deliberadamente escolhido como omissão por ser o único que nunca rebenta no
 * servidor. Quem quiser persistência real escolhe-a explicitamente.
 */
export function memoryStorage(): EvoStorage {
  const mapa = new Map<string, string>();
  return {
    get: (chave) => mapa.get(chave) ?? null,
    set: (chave, valor) => void mapa.set(chave, valor),
    remove: (chave) => void mapa.delete(chave),
  };
}

export interface EvoLocalStorageOptions {
  readonly prefix?: string;
}

/**
 * `localStorage`, com degradação silenciosa.
 *
 * **Atenção em SSR:** o servidor não vê nada do que aqui está guardado, pelo
 * que renderiza sempre como se não houvesse sessão. Numa aplicação com SSR e
 * autenticação, isso significa um piscar de "não autenticado" na hidratação.
 * Para sessões, preferir `cookieStorage()`.
 */
export function localStorageAdapter(options: EvoLocalStorageOptions = {}): EvoStorage {
  const prefixo = options.prefix ?? 'evo_';
  const isServer = isPlatformServer(inject(PLATFORM_ID));
  const janela = inject(DOCUMENT).defaultView;

  const armazem = (): Storage | null => {
    if (isServer || !janela) return null;
    try {
      const s = janela.localStorage;
      // O mero acesso lança em alguns browsers; setItem lança com quota zero.
      s.setItem('__evo_probe__', '1');
      s.removeItem('__evo_probe__');
      return s;
    } catch {
      return null;
    }
  };

  return {
    get: (chave) => armazem()?.getItem(prefixo + chave) ?? null,
    set: (chave, valor) => {
      try {
        armazem()?.setItem(prefixo + chave, valor);
      } catch {
        /* quota excedida: o valor vive apenas nesta sessão */
      }
    },
    remove: (chave) => armazem()?.removeItem(prefixo + chave),
  };
}

export interface EvoCookieStorageOptions {
  readonly prefix?: string;
  readonly sameSite?: 'Lax' | 'Strict' | 'None';
  readonly secure?: boolean;
  readonly path?: string;
}

/**
 * Cookies, legíveis dos dois lados.
 *
 * É a única estratégia que o servidor consegue ler durante o SSR, através de
 * `inject(REQUEST)`, e por isso a recomendada para tudo o que decida o que a
 * primeira renderização mostra.
 *
 * Tem de ser chamada dentro de um contexto de injecção.
 */
export function cookieStorage(options: EvoCookieStorageOptions = {}): EvoStorage {
  const prefixo = options.prefix ?? 'evo_';
  const caminho = options.path ?? '/';
  const sameSite = options.sameSite ?? 'Lax';
  const isServer = isPlatformServer(inject(PLATFORM_ID));

  if (isServer) {
    const pedido = inject(REQUEST, { optional: true });
    const resposta = inject(RESPONSE_INIT, { optional: true });
    const cookies = parseCookies(pedido?.headers.get('cookie') ?? '');

    return {
      get: (chave) => cookies[prefixo + chave] ?? null,
      set: (chave, valor, opcoes) => {
        if (!resposta) return;
        const cabecalhos = (resposta.headers ??= new Headers()) as Headers;
        cabecalhos.append(
          'Set-Cookie',
          [
            `${prefixo}${chave}=${encodeURIComponent(valor)}`,
            `Path=${caminho}`,
            `SameSite=${sameSite}`,
            options.secure === false ? '' : 'Secure',
            opcoes?.maxAgeSeconds ? `Max-Age=${opcoes.maxAgeSeconds}` : '',
          ]
            .filter(Boolean)
            .join('; '),
        );
      },
      remove: (chave) => {
        if (!resposta) return;
        const cabecalhos = (resposta.headers ??= new Headers()) as Headers;
        cabecalhos.append('Set-Cookie', `${prefixo}${chave}=; Path=${caminho}; Max-Age=0`);
      },
    };
  }

  const doc = inject(DOCUMENT);

  return {
    get: (chave) => parseCookies(doc.cookie)[prefixo + chave] ?? null,
    set: (chave, valor, opcoes) => {
      const idade = opcoes?.maxAgeSeconds ? `; Max-Age=${opcoes.maxAgeSeconds}` : '';
      doc.cookie =
        `${prefixo}${chave}=${encodeURIComponent(valor)}` +
        `; Path=${caminho}; SameSite=${sameSite}${idade}`;
    },
    remove: (chave) => {
      doc.cookie = `${prefixo}${chave}=; Path=${caminho}; Max-Age=0`;
    },
  };
}

function parseCookies(cabecalho: string): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const parte of cabecalho.split(';')) {
    const igual = parte.indexOf('=');
    if (igual < 0) continue;
    const chave = parte.slice(0, igual).trim();
    if (!chave) continue;
    try {
      saida[chave] = decodeURIComponent(parte.slice(igual + 1).trim());
    } catch {
      saida[chave] = parte.slice(igual + 1).trim();
    }
  }
  return saida;
}
