import { Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EvoModalService } from '@evolium-kit/toolkit/components';
import { EvoError } from '@evolium-kit/toolkit/services';
import {
  EvoCrudController,
  EvoCrudControllerConfig,
  EvoCrudDisplay,
  EvoCrudMode,
} from './crud.types';
import { CrudFormErrors, CrudFormSession, EVO_CRUD_FORM_SESSION } from './form-errors';
import { crudResourceInternals, injectCrudResource } from './inject-crud-resource';

/** Mensagem de confirmação por omissão. */
export const EVO_CRUD_CONFIRM_REMOVE =
  'Tem a certeza de que quer apagar este registo? Esta acção não pode ser desfeita.';

let proximoId = 0;

/**
 * CRUD completo: o resource, mais abrir o formulário de criar/editar (em modal
 * ou numa rota) e apagar com confirmação.
 *
 * ```ts
 * readonly crud = injectCrudController<Usuario, UsuarioDto>({
 *   path: '/usuarios',
 *   form: UsuarioForm,
 *   titles: { create: 'Novo utilizador', update: 'Editar utilizador' },
 * });
 * ```
 *
 * Com o formulário em modal, um erro ao gravar **não** fecha o modal: os erros
 * de campo vão para os campos e o resto para o `formError` do
 * `injectCrudForm()`.
 */
export function injectCrudController<T extends object, D = Partial<T>>(
  config: EvoCrudControllerConfig<T, D>,
): EvoCrudController<T, D> {
  const modals = inject(EvoModalService);
  const router = inject(Router, { optional: true });
  const injector = inject(Injector);

  const display = (modo: EvoCrudMode): EvoCrudDisplay => {
    const bruto = config.display?.[modo];
    const resolvido: EvoCrudDisplay = !bruto
      ? { mode: 'modal' }
      : typeof bruto === 'string'
        ? { mode: bruto }
        : bruto;
    return { size: config.display?.size ?? 'xl', ...resolvido };
  };

  // Validado já, e não ao abrir: um erro lançado dentro de um handler assíncrono
  // ficava como rejeição solta, sem chegar a quem configurou mal.
  for (const modo of ['create', 'update'] as const) {
    const d = display(modo);
    if (d.mode === 'route' && !d.routePath) {
      throw new Error(
        `[evo] injectCrudController(): display.${modo}.routePath é obrigatório com mode 'route' (path: ${config.path}).`,
      );
    }
    if (d.mode === 'route' && !router) {
      throw new Error(`[evo] injectCrudController(): mode 'route' precisa do provideRouter().`);
    }
  }

  const resource = injectCrudResource<T, D>(config);
  const { runner, api } = crudResourceInternals(resource);

  async function abrir(modo: EvoCrudMode, item?: T): Promise<void> {
    if ((await runner.decide('beforeOpenForm', modo, item)) === false) return;

    const d = display(modo);
    if (d.mode === 'route') {
      await router?.navigateByUrl(d.routePath!(item ? resource.idOf(item) : undefined));
      return;
    }

    const erros = new CrudFormErrors();
    const sessao: CrudFormSession<T, D> = {
      mode: modo,
      item: item ?? null,
      errors: erros,
      submit: (dto) => void gravar(dto),
      cancel: () => ref.close(),
    };

    const ref = modals.open(config.form, {
      id: `evo-crud-form-${proximoId++}`,
      title: modo === 'create' ? config.titles?.create : config.titles?.update,
      size: d.size,
      data: item ?? null,
      injector: Injector.create({
        providers: [{ provide: EVO_CRUD_FORM_SESSION, useValue: sessao }],
        parent: injector,
      }),
    });

    async function gravar(dto: D): Promise<void> {
      erros.clear();
      // O modal fecha entre o fim do pedido e os hooks `after*`, para o aviso de
      // sucesso aparecer sobre a lista já actualizada, e não sobre o formulário.
      const opcoes = { beforeNotify: () => ref.close(), shownInForm: true };
      try {
        if (item) await resource.update(resource.idOf(item), dto, opcoes);
        else await resource.create(dto, opcoes);
      } catch (erro) {
        erros.register(erro instanceof EvoError ? erro : api.toError(erro));
      }
    }

    // `closed` resolve seja como for que fechou — gravar, cancelar, ×, fundo ou
    // Escape. No original só o cancelar corria o hook.
    await ref.closed;
    await runner.notify('afterCloseForm', modo);
  }

  async function apagar(item: T): Promise<void> {
    const confirmar = config.confirmRemove ?? true;
    if (confirmar !== false) {
      const mensagem = typeof confirmar === 'function' ? confirmar(item) : EVO_CRUD_CONFIRM_REMOVE;
      const ok = await modals.confirm({
        title: 'Confirmar remoção',
        message: mensagem,
        tone: 'danger',
        confirmLabel: 'Apagar',
      });
      if (!ok) return;
    }

    try {
      await resource.remove(resource.idOf(item));
    } catch (erro) {
      // Sem um hook `onError` (ex.: `crudToasts()`), a falha não podia ficar
      // calada — no original, sem plugin de avisos, ninguém sabia que falhou.
      if (!runner.has('onError')) {
        await modals.error(api.toError(erro).message, 'Não foi possível apagar');
      }
    }
  }

  return {
    resource,
    openCreate: () => void abrir('create'),
    openEdit: (item) => void abrir('update', item),
    remove: (item) => void apagar(item),
  };
}
