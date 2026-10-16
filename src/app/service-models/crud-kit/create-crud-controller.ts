import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { AlertModalService } from '../../components/alert-modal/alert-modal.service';
import { createCrudResource } from './create-crud-resource';
import { CrudFormErrosService } from './crud-form-erros.service';
import { CrudControllerConfig, DisplayModeConfig, ID } from './crud-kit.types';
import type { CrudPluginContext } from './crud-kit-plugin.types';
import { correrHookCancelavel, correrHookNotificacao } from './crud-kit-plugin-runner';

const MENSAGEM_CONFIRMAR_APAGAR_PADRAO = 'Tem certeza que deseja apagar este registro? Esta ação não pode ser desfeita.';

/**
 * Cria um controller CRUD completo: dados (via `createCrudResource`) + abertura de
 * formulário de criar/editar (modal, drawer ou rota) + apagar com confirmação.
 *
 * Assim como `createCrudResource`, usa `inject()` internamente e só pode ser chamada
 * dentro de um contexto de injeção.
 */
export function createCrudController<TEntity extends Record<string, any>, TDto = Partial<TEntity>>(
  config: CrudControllerConfig<TEntity, TDto>,
) {
  const alert = inject(AlertModalService);
  const router = inject(Router);
  const formErros = inject(CrudFormErrosService);

  const resource = createCrudResource<TEntity, TDto>(config);
  // Reaproveita os plugins já resolvidos (globais + locais) pelo resource, em vez de
  // injetar CRUD_KIT_GLOBAL_PLUGINS outra vez.
  const plugins = resource.plugins;
  const queryClient = inject(QueryClient);
  const pluginCtx: CrudPluginContext<TEntity> = { recurso: config.resource, queryClient };

  const modalId = `crud-form-${config.resource}`;

  function resolveMode(action: 'criar' | 'editar'): DisplayModeConfig {
    const raw = config.display?.[action];
    if (!raw) return { mode: 'modal' };
    return typeof raw === 'string' ? { mode: raw } : raw;
  }

  async function abrirFormulario(action: 'criar' | 'editar', item?: TEntity): Promise<void> {
    const prosseguir = await correrHookCancelavel(plugins, 'antesDeAbrirFormulario', pluginCtx, action, item);
    if (!prosseguir) return;

    const displayCfg = resolveMode(action);

    if (displayCfg.mode === 'route') {
      if (!displayCfg.routePath) {
        throw new Error(
          `createCrudController: display.${action}.routePath é obrigatório quando mode === 'route' (resource: ${config.resource}).`,
        );
      }
      router.navigate([displayCfg.routePath(item ? (item[resource.idKey] as ID) : undefined)]);
      return;
    }

    formErros.abrirFormulario();

    function fecharFormulario(): void {
      alert.fechar(modalId);
      formErros.fecharFormulario();
      void correrHookNotificacao(plugins, 'depoisDeFecharFormulario', pluginCtx, action);
    }

    void alert
      .open({
        id: modalId,
        titulo: action === 'criar' ? config.titulos?.criar : config.titulos?.editar,
        template: config.formComponent,
        data: item ?? null,
        kind: displayCfg.mode,
        semBotoes: true,
        temHeader: true,
        tamanho: config.display?.tamanhoModal || 'xgrande',
        on: {
          salvo: async (dto: TDto) => {
            formErros.limpar();

            try {
              // `...EConcluir` fecha o formulário (e só depois anuncia o sucesso) quando o
              // pedido e a revalidação da lista já terminaram — ver `createCrudResource`.
              if (item) {
                await resource.atualizarEConcluir(item[resource.idKey] as ID, dto, fecharFormulario);
              } else {
                await resource.salvarEConcluir(dto, fecharFormulario);
              }
            } catch (erro) {
              // O modal fica aberto: o formulário mostra o erro no campo que o disparou e,
              // quando não há campo correspondente, no banner do próprio formulário.
              formErros.registarErro(erro);
            }
          },
          cancelado: () => fecharFormulario(),
        },
      })
      // O modal também pode ser fechado pelo "X"/backdrop, sem passar por `fecharFormulario`.
      .then(() => formErros.fecharFormulario());
  }

  function abrirCriar(): void {
    void abrirFormulario('criar');
  }

  function abrirEditar(item: TEntity): void {
    void abrirFormulario('editar', item);
  }

  /** O erro já é anunciado pelo hook `aoOcorrerErro`; aqui só evitamos a rejeição solta. */
  function apagarItem(id: ID): void {
    void resource.apagarEConcluir(id).catch(() => undefined);
  }

  function apagar(item: TEntity): void {
    const shouldConfirm = config.confirmarApagar ?? true;
    const id = item[resource.idKey] as ID;

    if (shouldConfirm === false) {
      apagarItem(id);
      return;
    }

    const mensagem = typeof shouldConfirm === 'function' ? shouldConfirm(item) : MENSAGEM_CONFIRMAR_APAGAR_PADRAO;

    alert.modal({
      titulo: 'Confirmar exclusão',
      mensagem,
      icon: 'question',
      botoes: [
        { label: 'Cancelar', variant: 'secondary', closeOnClick: true },
        { label: 'Apagar', variant: 'danger', closeOnClick: true, onClick: () => apagarItem(id) },
      ],
    });
  }

  return { resource, abrirCriar, abrirEditar, apagar };
}
