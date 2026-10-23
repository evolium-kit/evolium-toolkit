import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { hasModifierKey } from '@angular/cdk/keycodes';
import { TemplateRef } from '@angular/core';
import { EvoDrawerBaseConfig, EvoDrawerCloseReason } from './drawer.types';

/**
 * Peça interna partilhada pelo `<evo-drawer>` e pelo `EvoDrawerService`: abre
 * o `Dialog` do CDK com as opções da toolkit e encaminha Escape, clique no
 * fundo e × pelo `beforeClose`.
 *
 * O `disableClose` do CDK fica sempre ligado — é a única forma de o Escape e
 * o fundo passarem pelo `beforeClose`, que pode ser assíncrono (o
 * `closePredicate` do CDK só aceita uma resposta síncrona).
 */
export interface EvoDrawerOverlay<R> {
  readonly dialogRef: DialogRef<R, unknown>;
  /** Fecho pedido pelo utilizador: passa pelo `beforeClose`. Resolve `true` se fechou. */
  pedirFecho(reason: EvoDrawerCloseReason): Promise<boolean>;
  /** Fecho sem perguntar (acções, `close()` programático). */
  fechar(result: R | undefined, reason: EvoDrawerCloseReason): void;
}

export interface EvoDrawerOverlayOptions<R> {
  readonly base: EvoDrawerBaseConfig;
  /** Opções do CDK a juntar (aria, autoFocus, injector, data…). */
  readonly dialog: DialogConfig<unknown, DialogRef<R, unknown>>;
  /** Custom properties `--evo-*` aplicadas ao fundo e ao painel. */
  readonly tokens: Readonly<Record<string, string>>;
  /** Corre uma vez, depois de o drawer fechar por qualquer motivo. */
  readonly aoFechar: (result: R | undefined, reason: EvoDrawerCloseReason) => void;
}

export function abrirEvoDrawer<R>(
  dialog: Dialog,
  conteudo: ComponentType<unknown> | TemplateRef<unknown>,
  opcoes: EvoDrawerOverlayOptions<R>,
): EvoDrawerOverlay<R> {
  const { base } = opcoes;

  const dialogRef = dialog.open<R, unknown, unknown>(conteudo, {
    role: 'dialog',
    ariaModal: true,
    hasBackdrop: base.backdrop !== false,
    ariaLabel: base.ariaLabel || null,
    panelClass: 'evo-drawer-pane',
    backdropClass: 'evo-drawer-backdrop',
    maxWidth: '100vw',
    maxHeight: '100dvh',
    ...opcoes.dialog,
    disableClose: true,
  } as DialogConfig<unknown, DialogRef<R, unknown>>);

  const overlay = dialogRef.overlayRef;
  overlay.overlayElement.setAttribute('data-evo-position', base.position ?? 'right');
  overlay.overlayElement.setAttribute('data-evo-size', base.size ?? 'md');
  for (const alvo of [overlay.hostElement, overlay.backdropElement]) {
    if (!alvo) continue;
    for (const [nome, valor] of Object.entries(opcoes.tokens)) alvo.style.setProperty(nome, valor);
  }

  // Sem razão registada, quem fechou foi o próprio CDK: a navegação do
  // histórico (closeOnNavigation) ou a destruição do Dialog.
  let razao: EvoDrawerCloseReason = 'navigation';
  let aPerguntar = false;

  const fechar = (result: R | undefined, reason: EvoDrawerCloseReason): void => {
    razao = reason;
    dialogRef.close(result);
  };

  const pedirFecho = async (reason: EvoDrawerCloseReason): Promise<boolean> => {
    if (aPerguntar) return false;
    aPerguntar = true;
    try {
      const pode = base.beforeClose ? await base.beforeClose(reason) : true;
      if (pode) fechar(undefined, reason);
      return pode;
    } finally {
      aPerguntar = false;
    }
  };

  const subs = [
    dialogRef.backdropClick.subscribe(() => {
      if (base.closeOnBackdrop !== false) void pedirFecho('backdrop');
    }),
    // O CDK entrega o teclado só ao overlay de cima: com dois drawers
    // abertos, o Escape fecha apenas o último.
    dialogRef.keydownEvents.subscribe((evento) => {
      if (evento.key === 'Escape' && !hasModifierKey(evento) && base.closeOnEscape !== false) {
        evento.preventDefault();
        void pedirFecho('escape');
      }
    }),
  ];

  dialogRef.closed.subscribe((result) => {
    subs.forEach((s) => s.unsubscribe());
    opcoes.aoFechar(result, razao);
  });

  return { dialogRef, pedirFecho, fechar };
}

/**
 * Os `--evo-*` declarados em linha no elemento e nos seus ancestrais — o que
 * `[evoTokens]` escreve —, com o mais próximo a ganhar. O drawer é desenhado
 * no fim do `<body>`, fora da árvore de quem o declara; copiar estes valores
 * para ele repõe a herança que o CSS lhe daria se estivesse no sítio.
 */
export function tokensEmLinha(elemento: Element | null): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (let el = elemento; el; el = el.parentElement) {
    const estilo = (el as HTMLElement).style;
    if (!estilo) continue;
    for (let i = 0; i < estilo.length; i++) {
      const nome = estilo[i];
      if (nome.startsWith('--evo-') && !(nome in tokens)) {
        tokens[nome] = estilo.getPropertyValue(nome).trim();
      }
    }
  }
  return tokens;
}
