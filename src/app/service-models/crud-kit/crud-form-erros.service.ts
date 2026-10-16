import { HttpErrorResponse } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';

/** Mensagem usada quando a API falha sem devolver nada aproveitável. */
export const MENSAGEM_ERRO_PADRAO = 'Não foi possível guardar. Verifique os dados e tente novamente.';

/** Mensagem do banner quando o detalhe já está junto de cada campo. */
export const MENSAGEM_CAMPOS_INVALIDOS = 'Corrija os campos assinalados e tente novamente.';

export interface ErroApiNormalizado {
  /** Mensagens por campo, no formato `{ nome_do_campo: mensagem }`. */
  campos: Record<string, string>;
  /** Mensagem geral do erro, quando existe. */
  mensagem: string | null;
}

/**
 * Normaliza o erro devolvido pela API para o formato usado pelos formulários.
 *
 * Cobre o formato de validação do Laravel (`{ message, errors: { campo: [msg] } }`), o
 * mesmo formato sem envelope HTTP e, em último caso, a mensagem do próprio `Error`.
 */
export function normalizarErroApi(erro: unknown): ErroApiNormalizado {
  const corpoBruto: unknown = erro instanceof HttpErrorResponse ? erro.error : erro;
  const corpo = (typeof corpoBruto === 'object' && corpoBruto !== null ? corpoBruto : {}) as {
    errors?: Record<string, string | string[]>;
    message?: string;
    mensagem?: string;
  };

  const campos: Record<string, string> = {};

  if (corpo.errors && typeof corpo.errors === 'object') {
    Object.entries(corpo.errors).forEach(([campo, valor]) => {
      const mensagem = Array.isArray(valor) ? valor[0] : valor;
      if (typeof mensagem === 'string' && mensagem.trim()) campos[campo] = mensagem;
    });
  }

  // Ordem de preferência: mensagem do corpo → corpo em texto simples → mensagem do
  // próprio erro (ex: `HttpErrorResponse.message`, que descreve o estado HTTP).
  const mensagem =
    corpo.mensagem ??
    corpo.message ??
    (typeof corpoBruto === 'string' && corpoBruto.trim() ? corpoBruto : null) ??
    (erro as { message?: string } | null)?.message ??
    null;

  return { campos, mensagem };
}

/**
 * Canal entre as mutations do crud-kit e o formulário aberto no modal.
 *
 * Quando criar/editar falha, o `createCrudController` mantém o modal aberto e regista aqui
 * o erro; o formulário (via `useCrudFormBridge().ligarErros`) aplica as mensagens aos
 * campos correspondentes e mostra no banner o que não coube em nenhum campo.
 */
@Injectable({ providedIn: 'root' })
export class CrudFormErrosService {
  private readonly _errosCampos = signal<Record<string, string>>({});
  private readonly _mensagemBase = signal<string | null>(null);
  private readonly _naoAplicados = signal<string[]>([]);
  private readonly _formularioAberto = signal(false);
  /** `true` quando o banner só existe para apontar aos campos assinalados. */
  private readonly _bannerDeCampos = signal(false);

  readonly errosCampos = this._errosCampos.asReadonly();

  /**
   * Mensagem do banner: a da API (ou uma genérica) mais o que não coube em campo nenhum.
   * Há sempre algo para mostrar enquanto existir erro — o utilizador pode estar num passo
   * do assistente onde os campos com erro nem sequer estão no ecrã.
   */
  readonly erroGeral = computed<string | null>(() => {
    const partes = [this._mensagemBase(), ...this._naoAplicados()].filter(Boolean);
    return partes.length ? partes.join(' ') : null;
  });

  /** `true` enquanto um formulário de criar/editar do crud-kit está aberto. */
  readonly formularioAberto = this._formularioAberto.asReadonly();

  abrirFormulario(): void {
    this.limpar();
    this._formularioAberto.set(true);
  }

  fecharFormulario(): void {
    this.limpar();
    this._formularioAberto.set(false);
  }

  limpar(): void {
    this._errosCampos.set({});
    this._mensagemBase.set(null);
    this._naoAplicados.set([]);
    this._bannerDeCampos.set(false);
  }

  registarErro(erro: unknown): void {
    const { campos, mensagem } = normalizarErroApi(erro);
    const temCampos = Object.keys(campos).length > 0;

    this._naoAplicados.set([]);
    this._errosCampos.set(campos);
    this._bannerDeCampos.set(temCampos);
    this._mensagemBase.set(mensagem ?? (temCampos ? MENSAGEM_CAMPOS_INVALIDOS : MENSAGEM_ERRO_PADRAO));
  }

  /**
   * O utilizador mexeu no campo: a mensagem da API foi sobre o valor antigo e deixou de
   * valer. Quando já não sobra campo assinalado, o banner que apontava para eles também
   * desaparece — senão ficava um aviso a mandar corrigir campos que já não acusam nada.
   *
   * Uma mensagem geral da API (sem campos) fica: essa não é o utilizador que a resolve
   * a escrever, e só sai no envio seguinte.
   */
  limparCampo(campo: string): void {
    const atual = this._errosCampos();
    if (!(campo in atual)) return;

    const restantes = { ...atual };
    delete restantes[campo];
    this._errosCampos.set(restantes);

    if (Object.keys(restantes).length || !this._bannerDeCampos()) return;

    this._mensagemBase.set(null);
    this._naoAplicados.set([]);
    this._bannerDeCampos.set(false);
  }

  /**
   * Fallback: mensagens de campos que o formulário aberto não conseguiu mapear (o campo
   * não existe no `FormGroup`) passam a ser mostradas no banner do próprio modal.
   */
  reportarNaoAplicados(mensagens: string[]): void {
    this._naoAplicados.set(mensagens);
  }
}
