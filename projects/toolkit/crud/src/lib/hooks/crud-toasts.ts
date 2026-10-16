import { inject } from '@angular/core';
import { EvoModalService } from '@evolium-kit/toolkit/components';
import { EvoCrudHooks, EvoCrudOperation } from '../crud.types';

/** Textos do `crudToasts()`. */
export interface EvoCrudToastMessages {
  readonly create?: string;
  readonly update?: string;
  readonly remove?: string;
}

const VERBO: Readonly<Record<EvoCrudOperation, string>> = {
  create: 'guardar',
  update: 'actualizar',
  remove: 'apagar',
};

/**
 * Avisa sucesso e erro de cada escrita com o `EvoModalService`.
 *
 * Chama `inject()`: como hook local, `hooks: [crudToasts()]` num campo de
 * classe; como global, pela fábrica `withPlugin(crudPlugin(), { hooks: [() => crudToasts()] })`.
 *
 * Um erro de criar/editar com o formulário aberto não abre aviso — já está a
 * ser mostrado no próprio formulário.
 */
export function crudToasts(messages: EvoCrudToastMessages = {}): EvoCrudHooks {
  const modals = inject(EvoModalService);

  return {
    name: 'crud-toasts',
    afterCreate: () => void modals.success(messages.create ?? 'Registo guardado com sucesso.'),
    afterUpdate: () => void modals.success(messages.update ?? 'Registo actualizado com sucesso.'),
    afterRemove: () => void modals.success(messages.remove ?? 'Registo apagado com sucesso.'),
    onError: (_ctx, error, operation, { shownInForm }) => {
      if (shownInForm) return;
      // `error` é sempre um EvoError: no original, `instanceof Error` falhava
      // com o HttpErrorResponse e a mensagem era sempre "tente novamente".
      void modals.error(error.message, `Não foi possível ${VERBO[operation]}`);
    },
  };
}
