import { computed, DestroyRef, effect, inject, Injector } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { Subscription, take } from 'rxjs';
import { ModalDataService } from '../../components/alert-modal/modal-data.service';
import { ModalEventsService } from '../../components/alert-modal/modal-events.service';
import { CrudFormErrosService } from './crud-form-erros.service';

/**
 * Ponte entre um formulário de entidade e o `crud-kit`.
 *
 * Permite que o mesmo componente de formulário funcione tanto dentro de um
 * modal/drawer aberto por `createCrudController` (via `ModalDataService`/`ModalEventsService`)
 * quanto numa rota isolada (via `@Input`/`@Output` normais do Angular) — por isso os dois
 * serviços são injetados com `{ optional: true }`.
 *
 * Também transporta os erros devolvidos pela API na criação/edição: `ligarErros(form)`
 * aplica-os aos campos correspondentes e `erroGeral` guarda o que não coube em campo
 * nenhum, para o formulário mostrar num banner sem fechar o modal.
 *
 * Padrão obrigatório para quem consome o bridge, ver README da crud-kit.
 */
export function useCrudFormBridge<TEntity>() {
  const modalData = inject(ModalDataService, { optional: true });
  const modalEvents = inject(ModalEventsService, { optional: true });
  const erros = inject(CrudFormErrosService);
  const injector = inject(Injector);
  const destroyRef = inject(DestroyRef);

  const dadoInicialModal = computed(() => modalData?.obterDados<TEntity>() ?? null);

  function emitirSalvo(dto: any): void {
    modalEvents?.emitir('salvo', dto);
  }

  function emitirCancelado(): void {
    modalEvents?.emitir('cancelado');
  }

  /**
   * Liga os erros da API ao `FormGroup`: cada mensagem é injetada como erro `apiErro` do
   * campo respetivo (lido pelo `ValidacaoService.getErro`) e o campo é marcado como
   * `touched` para a mensagem aparecer de imediato.
   *
   * A mensagem sai do campo assim que o utilizador lhe mexe — ela era sobre o valor que
   * a API recusou. Sair do campo é também o que apaga o registo no serviço, senão o
   * banner do formulário continuava a mandar corrigir campos que já não acusam nada.
   *
   * `aoAplicar` recebe os campos que ficaram com erro — os assistentes multi-passo usam-no
   * para saltar de volta ao passo onde esses campos são visíveis (o submit costuma
   * acontecer no passo de confirmação, longe dos inputs).
   *
   * Chamar no construtor do formulário: `this.bridge.ligarErros(this.form)`.
   */
  function ligarErros(form: FormGroup, aoAplicar?: (campos: string[]) => void): void {
    /** Uma escuta por campo com erro, largada quando o utilizador o corrige. */
    const escutas = new Map<string, Subscription>();

    function largarEscutas(): void {
      escutas.forEach((escuta) => escuta.unsubscribe());
      escutas.clear();
    }

    /** Tira só o `apiErro`, para não levar com ele os erros dos validators do campo. */
    function retirarApiErro(control: AbstractControl): void {
      if (!control.errors?.['apiErro']) return;

      const { apiErro, ...restantes } = control.errors;
      control.setErrors(Object.keys(restantes).length ? restantes : null);
    }

    function esperarCorrecao(campo: string, control: AbstractControl): void {
      escutas.get(campo)?.unsubscribe();

      const escuta = control.valueChanges.pipe(take(1)).subscribe(() => {
        escutas.delete(campo);
        retirarApiErro(control);
        erros.limparCampo(campo);
      });

      escutas.set(campo, escuta);
    }

    effect(
      () => {
        const campos = erros.errosCampos();

        // Sem erros pendentes (envio novo, formulário reaberto) não há nada a vigiar.
        if (!Object.keys(campos).length) {
          largarEscutas();
          return;
        }

        const aplicados: string[] = [];
        const naoAplicados: string[] = [];

        Object.entries(campos).forEach(([campo, mensagem]) => {
          const control = form.get(campo);
          if (!control) {
            naoAplicados.push(mensagem);
            return;
          }

          control.setErrors({ ...(control.errors ?? {}), apiErro: mensagem });
          control.markAsTouched();
          aplicados.push(campo);
          esperarCorrecao(campo, control);
        });

        erros.reportarNaoAplicados(naoAplicados);
        if (aplicados.length) aoAplicar?.(aplicados);
      },
      { injector },
    );

    destroyRef.onDestroy(() => largarEscutas());
  }

  return {
    dadoInicialModal,
    emitirSalvo,
    emitirCancelado,
    ligarErros,
    erroGeral: erros.erroGeral,
    limparErros: () => erros.limpar(),
  };
}
