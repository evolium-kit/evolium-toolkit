/* eslint-disable @typescript-eslint/ban-types */
import { Injector, TemplateRef, Type } from '@angular/core';
import { EvoTokenMap } from '@evolium-kit/toolkit/core';
import { EvoVariant } from '../component-types';
import type { EvoDrawerRef } from './drawer-ref';

/** Lado do ecrã de onde o painel entra. */
export type EvoDrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * Medida do painel no eixo em que desliza: largura em `left`/`right`, altura
 * em `top`/`bottom`. Além dos tamanhos nomeados aceita qualquer medida CSS
 * (`'32rem'`, `'40%'`, `'clamp(20rem, 50vw, 48rem)'`).
 */
export type EvoDrawerSize = 'sm' | 'md' | 'lg' | 'full' | (string & {});

/** Porque é que o drawer fechou (ou está a tentar fechar). */
export type EvoDrawerCloseReason =
  'escape' | 'backdrop' | 'close-button' | 'action' | 'programmatic' | 'navigation';

/**
 * Chamada antes de o **utilizador** fechar o drawer (Escape, fundo ou ×).
 * Devolver `false` (ou uma promessa de `false`) mantém-no aberto. As acções e
 * o `close()` programático não passam por aqui: são decisões explícitas.
 */
export type EvoDrawerBeforeCloseFn = (reason: EvoDrawerCloseReason) => boolean | Promise<boolean>;

/** Um botão do rodapé de um drawer aberto pelo `EvoDrawerService`. */
export interface EvoDrawerAction<R = unknown> {
  readonly label: string;
  /** Variante do `EvoButton`. Por omissão, `solid`. */
  readonly variant?: EvoVariant;
  /** Resultado com que o drawer fecha, se `handler` não devolver outro. */
  readonly value?: R;
  /**
   * Corre ao clicar. Enquanto a promessa não resolver, o botão mostra
   * `loading` e os outros ficam inactivos. Se rejeitar, o drawer fica aberto
   * e a mensagem do erro aparece por cima dos botões.
   */
  readonly handler?: (ref: EvoDrawerRef<R>) => R | void | Promise<R | void>;
  /** `false` para não fechar depois do clique. Por omissão, `true`. */
  readonly closes?: boolean;
  /** Inactivo enquanto devolver `true` (pode ler signals). */
  readonly disabled?: () => boolean;
  /** Recebe o foco ao abrir. Por omissão, o primeiro elemento do conteúdo. */
  readonly autofocus?: boolean;
}

/**
 * Mapa de eventos que o conteúdo de um drawer pode emitir (`ref.emit()`), por
 * omissão. Para eventos tipados, passar uma interface própria como `E`.
 */
export type EvoDrawerEvents = Record<string, unknown>;

/** Listeners para os eventos do conteúdo, por nome. */
export type EvoDrawerListeners<E extends object> = {
  readonly [K in keyof E]?: (payload: E[K]) => void;
};

/** Opções comuns ao `<evo-drawer>` e ao `EvoDrawerService`. */
export interface EvoDrawerBaseConfig {
  /** Título visível. Dá o nome acessível ao drawer. */
  readonly title?: string;
  /** Linha secundária do cabeçalho. */
  readonly description?: string;
  /** Nome acessível quando não há título visível. */
  readonly ariaLabel?: string;
  readonly position?: EvoDrawerPosition;
  readonly size?: EvoDrawerSize;
  /** Mostra o fundo escurecido. Por omissão, `true`. */
  readonly backdrop?: boolean;
  /** Clicar no fundo fecha. Por omissão, `true`. Sem efeito sem `backdrop`. */
  readonly closeOnBackdrop?: boolean;
  /** `Esc` fecha. Por omissão, `true`. */
  readonly closeOnEscape?: boolean;
  /** Mostra o botão × no canto. Por omissão, `true`. */
  readonly showClose?: boolean;
  readonly beforeClose?: EvoDrawerBeforeCloseFn;
}

/** Opções de `EvoDrawerService.open()`. */
export interface EvoDrawerConfig<
  D = unknown,
  R = unknown,
  E extends object = EvoDrawerEvents,
> extends EvoDrawerBaseConfig {
  /**
   * Identificador, para fechar com `close(id)`. Por omissão, gerado. Abrir um
   * segundo drawer com um `id` já aberto devolve o que já existe.
   */
  readonly id?: string;
  /** Texto simples no corpo, quando não há componente/template. */
  readonly message?: string;
  /** Dados para o conteúdo, lidos com `inject(EVO_DRAWER_DATA)`. */
  readonly data?: D;
  /** Botões do rodapé. Sem esta opção, não há rodapé. */
  readonly actions?: readonly EvoDrawerAction<R>[];
  /** Listeners para o que o conteúdo emitir com `ref.emit(nome, dados)`. */
  readonly on?: EvoDrawerListeners<E>;
  /**
   * Liga o drawer ao `#fragmento` da URL: ao abrir, o fragmento entra na
   * URL; se sair (botão Voltar, link), o drawer fecha; ao fechar, sai da
   * URL. Para o drawer reabrir ao recarregar a página, registar o
   * fragmento em `provideEvoDrawers({ fragments })`. Sem `Router`, é ignorado.
   */
  readonly fragment?: string;
  /**
   * Tokens aplicados só a este drawer, como um `[evoTokens]`. O drawer vive
   * no fim do `<body>`, por isso não herda os `[evoTokens]` de quem o abriu.
   */
  readonly tokens?: EvoTokenMap;
  /** Injector pai do conteúdo. Por omissão, o do serviço. */
  readonly injector?: Injector;
}

export type EvoDrawerContent = Type<unknown> | TemplateRef<unknown>;
