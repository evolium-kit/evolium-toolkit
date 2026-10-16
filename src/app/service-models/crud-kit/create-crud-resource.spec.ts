import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { createCrudResource } from './create-crud-resource';
import type { CrudKitPlugin } from './crud-kit-plugin.types';

interface Fruta extends Record<string, any> {
  id: number;
  nome: string;
}

/** Deixa correr os microtasks pendentes — a mutation só emite o pedido depois de um `await`. */
function assentar(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function montar(plugin: CrudKitPlugin<Fruta, Partial<Fruta>>) {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideAngularQuery(new QueryClient())],
  });

  const http = TestBed.inject(HttpTestingController);
  const recurso = TestBed.runInInjectionContext(() =>
    createCrudResource<Fruta>({ resource: '/frutas', listaAtiva: false, plugins: [plugin] }),
  );

  return { http, recurso };
}

describe('createCrudResource — quando os hooks `depoisDeX` correm', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('só anuncia o sucesso de salvar depois de a mutation deixar de estar pendente', async () => {
    let pendenteNoHook: boolean | null = null;

    const { http, recurso } = montar({
      nome: 'espia',
      depoisDeSalvar: () => {
        pendenteNoHook = recurso.salvar.isPending();
      },
    });

    const salvo = recurso.salvarEConcluir({ nome: 'Manga' });
    await assentar();
    http.expectOne('/frutas').flush({ id: 1, nome: 'Manga' });
    await salvo;

    // Era isto que falhava: o hook corria dentro do `mutationFn`, com o overlay de
    // carregamento ainda no ecrã por cima da mensagem de sucesso.
    expect(pendenteNoHook).toBe(false);
  });

  it('corre `antesDeNotificar` antes do hook — é onde o formulário fecha', async () => {
    const ordem: string[] = [];

    const { http, recurso } = montar({
      nome: 'espia',
      depoisDeAtualizar: () => {
        ordem.push('hook');
      },
    });

    const atualizado = recurso.atualizarEConcluir(1, { nome: 'Manga' }, () => ordem.push('fechar-formulario'));
    await assentar();
    http.expectOne('/frutas/1').flush({ id: 1, nome: 'Manga' });
    await atualizado;

    expect(ordem).toEqual(['fechar-formulario', 'hook']);
  });

  it('não anuncia nada quando um plugin cancela o DELETE', async () => {
    let anunciou = false;

    const { recurso } = montar({
      nome: 'espia',
      antesDeApagar: () => false,
      depoisDeApagar: () => {
        anunciou = true;
      },
    });

    await recurso.apagarEConcluir(1);

    expect(anunciou).toBe(false);
  });

  it('anuncia o apagar quando o DELETE acontece mesmo', async () => {
    let anunciou = false;

    const { http, recurso } = montar({
      nome: 'espia',
      depoisDeApagar: () => {
        anunciou = true;
      },
    });

    const apagado = recurso.apagarEConcluir(1);
    await assentar();
    http.expectOne('/frutas/1').flush({});
    await apagado;

    expect(anunciou).toBe(true);
  });
});
