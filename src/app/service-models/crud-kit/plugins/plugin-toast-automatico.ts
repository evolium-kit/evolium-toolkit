import { inject } from '@angular/core';
import { AlertModalService } from '../../../components/alert-modal/alert-modal.service';
import { CrudFormErrosService } from '../crud-form-erros.service';
import type { CrudKitPlugin } from '../crud-kit-plugin.types';

/**
 * Mostra um modal de sucesso/erro automaticamente depois de salvar/apagar, ou quando
 * uma mutation falha — sem precisar repetir esse código em cada componente.
 *
 * Precisa de ser criado dentro de um contexto de injeção: como plugin local, passar a
 * instância diretamente (`plugins: [pluginToastAutomatico()]`); como plugin global, tem
 * de ser registado via fábrica (`provideCrudKitPlugins(() => pluginToastAutomatico())`).
 */
export function pluginToastAutomatico<TEntity extends Record<string, any> = any, TDto = Partial<TEntity>>(
  mensagens?: { salvar?: string; atualizar?: string; apagar?: string },
): CrudKitPlugin<TEntity, TDto> {
  const alert = inject(AlertModalService);
  const formErros = inject(CrudFormErrosService);

  return {
    nome: 'toast-automatico',
    depoisDeSalvar: () => {
      alert.modal({ mensagem: mensagens?.salvar ?? 'Registo guardado com sucesso', icon: 'success' });
    },
    depoisDeAtualizar: () => {
      alert.modal({ mensagem: mensagens?.atualizar ?? 'Registo atualizado com sucesso', icon: 'success' });
    },
    depoisDeApagar: () => {
      alert.modal({ mensagem: mensagens?.apagar ?? 'Registo apagado com sucesso', icon: 'success' });
    },
    aoOcorrerErro: (_ctx, erro, operacao) => {
      // Com o formulário aberto, o erro de criar/editar é mostrado dentro do próprio
      // formulário (campo a campo, ou no banner) — abrir um modal por cima só atrapalha.
      if (operacao !== 'apagar' && formErros.formularioAberto()) return;

      const msg = erro instanceof Error ? erro.message : 'tente novamente';
      alert.modal({ mensagem: `Erro ao ${operacao}: ${msg}`, icon: 'error' });
    },
  };
}
