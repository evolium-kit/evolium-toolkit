import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { CrudFormErrosService, MENSAGEM_CAMPOS_INVALIDOS } from './crud-form-erros.service';
import { useCrudFormBridge } from './use-crud-form-bridge';

/** Corpo de validação do Laravel, como chega quando já vem desembrulhado. */
function erroDeValidacao(campos: Record<string, string[]>) {
  return { errors: campos };
}

/** O mesmo erro dentro do envelope HTTP, que é o que as mutations atiram. */
function erroHttpDeValidacao(campos: Record<string, string[]>) {
  return new HttpErrorResponse({
    status: 422,
    statusText: 'Unprocessable Content',
    error: { message: 'The given data was invalid.', errors: campos },
  });
}

function montar() {
  const form = new FormGroup({
    nif: new FormControl('123', Validators.required),
    email: new FormControl('a@a.pt'),
  });

  const erros = TestBed.inject(CrudFormErrosService);
  TestBed.runInInjectionContext(() => useCrudFormBridge().ligarErros(form));

  return { form, erros };
}

describe('useCrudFormBridge().ligarErros', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('aplica ao campo a mensagem que a API devolveu', () => {
    const { form, erros } = montar();

    erros.registarErro(erroHttpDeValidacao({ nif: ['NIF já registado.'] }));
    TestBed.tick();

    const nif = form.get('nif')!;
    expect(nif.errors?.['apiErro']).toBe('NIF já registado.');
    // Marcado como tocado, senão a mensagem só apareceria depois de mexer no campo.
    expect(nif.touched).toBe(true);
  });

  it('mexer no campo apaga a mensagem da API e o banner que apontava para ele', () => {
    const { form, erros } = montar();

    erros.registarErro(erroDeValidacao({ nif: ['NIF já registado.'] }));
    TestBed.tick();
    expect(erros.erroGeral()).toBeTruthy();

    form.get('nif')!.setValue('5419011735');
    TestBed.tick();

    expect(form.get('nif')!.errors).toBeNull();
    expect(erros.errosCampos()['nif']).toBeUndefined();
    expect(erros.erroGeral()).toBeNull();
  });

  it('mantém o erro dos outros campos enquanto só um foi corrigido', () => {
    const { form, erros } = montar();

    erros.registarErro(erroDeValidacao({ nif: ['NIF já registado.'], email: ['Email já usado.'] }));
    TestBed.tick();

    form.get('nif')!.setValue('5419011735');
    TestBed.tick();

    expect(form.get('email')!.errors?.['apiErro']).toBe('Email já usado.');
    // Ainda há campo assinalado: o banner continua a fazer sentido.
    expect(erros.erroGeral()).toBeTruthy();
  });

  it('não leva com o erro do validator ao retirar o da API', () => {
    const { form, erros } = montar();

    erros.registarErro(erroDeValidacao({ nif: ['NIF já registado.'] }));
    TestBed.tick();

    form.get('nif')!.setValue('');
    TestBed.tick();

    expect(form.get('nif')!.errors).toEqual({ required: true });
  });

  it('mensagem geral da API não desaparece a escrever — não é isso que a resolve', () => {
    const { form, erros } = montar();

    erros.registarErro({ message: 'Serviço de faturação indisponível.' });
    TestBed.tick();

    form.get('nif')!.setValue('5419011735');
    TestBed.tick();

    expect(erros.erroGeral()).toBe('Serviço de faturação indisponível.');
  });

  it('campo que não existe no formulário passa a mensagem para o banner', () => {
    const { erros } = montar();

    erros.registarErro(erroDeValidacao({ setor: ['Setor inválido.'] }));
    TestBed.tick();

    expect(erros.erroGeral()).toContain('Setor inválido.');
  });
});

describe('CrudFormErrosService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('sem mensagem própria, o banner manda corrigir os campos assinalados', () => {
    const erros = TestBed.inject(CrudFormErrosService);

    erros.registarErro(erroDeValidacao({ nif: ['NIF já registado.'] }));

    expect(erros.erroGeral()).toBe(MENSAGEM_CAMPOS_INVALIDOS);
  });

  it('limparCampo de um campo que não tem erro não mexe no banner', () => {
    const erros = TestBed.inject(CrudFormErrosService);

    erros.registarErro(erroDeValidacao({ nif: ['NIF já registado.'] }));
    erros.limparCampo('email');

    expect(erros.errosCampos()['nif']).toBe('NIF já registado.');
    expect(erros.erroGeral()).toBe(MENSAGEM_CAMPOS_INVALIDOS);
  });
});
