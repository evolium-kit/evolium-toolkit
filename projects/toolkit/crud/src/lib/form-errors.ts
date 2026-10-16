import { InjectionToken, Signal, computed, signal } from '@angular/core';
import { EvoError } from '@evolium-kit/toolkit/services';
import { EvoCrudMode } from './crud.types';

/** Quando a API falha sem mensagem aproveitável. */
export const EVO_CRUD_DEFAULT_ERROR =
  'Não foi possível guardar. Verifique os dados e tente novamente.';

/** Quando o detalhe já está junto de cada campo. */
export const EVO_CRUD_FIELDS_ERROR = 'Corrija os campos assinalados e tente novamente.';

/**
 * Erros da API de **um** formulário aberto. Cada abertura tem o seu: no
 * original era um serviço `root`, e dois formulários abertos ao mesmo tempo
 * (um modal sobre outro) misturavam erros.
 */
export class CrudFormErrors {
  private readonly campos = signal<Readonly<Record<string, string>>>({});
  private readonly base = signal<string | null>(null);
  private readonly semCampo = signal<readonly string[]>([]);
  /** `true` quando o banner só existe para apontar para os campos assinalados. */
  private bannerDeCampos = false;

  readonly fields: Signal<Readonly<Record<string, string>>> = this.campos.asReadonly();

  /** A mensagem geral mais o que não coube em campo nenhum. */
  readonly general = computed<string | null>(() => {
    const partes = [this.base(), ...this.semCampo()].filter((p): p is string => !!p);
    return partes.length ? partes.join(' ') : null;
  });

  clear(): void {
    this.campos.set({});
    this.base.set(null);
    this.semCampo.set([]);
    this.bannerDeCampos = false;
  }

  register(erro: EvoError): void {
    const campos: Record<string, string> = {};
    for (const [campo, mensagens] of Object.entries(erro.fieldErrors ?? {})) {
      const primeira = mensagens.find((m) => m.trim());
      if (primeira) campos[campo] = primeira;
    }
    const temCampos = Object.keys(campos).length > 0;

    this.semCampo.set([]);
    this.campos.set(campos);
    this.bannerDeCampos = temCampos;
    this.base.set(
      erro.message?.trim() || (temCampos ? EVO_CRUD_FIELDS_ERROR : EVO_CRUD_DEFAULT_ERROR),
    );
  }

  /**
   * O utilizador mexeu no campo: a mensagem era sobre o valor antigo. Sem
   * campos assinalados, o banner que apontava para eles também sai; uma
   * mensagem geral sem campos fica até ao envio seguinte.
   */
  clearField(campo: string): void {
    const actual = this.campos();
    if (!(campo in actual)) return;

    const restantes = { ...actual };
    delete restantes[campo];
    this.campos.set(restantes);

    if (Object.keys(restantes).length || !this.bannerDeCampos) return;
    this.base.set(null);
    this.semCampo.set([]);
    this.bannerDeCampos = false;
  }

  /** Mensagens de campos que o `FormGroup` não tem: vão para o banner. */
  reportUnapplied(mensagens: readonly string[]): void {
    this.semCampo.set(mensagens);
  }
}

/** Uma abertura do formulário pelo controller. Interno. */
export interface CrudFormSession<T, D> {
  readonly mode: EvoCrudMode;
  readonly item: T | null;
  readonly errors: CrudFormErrors;
  submit(dto: D): void;
  cancel(): void;
}

/** @internal Fornecido pelo controller ao injector do modal. */
export const EVO_CRUD_FORM_SESSION = new InjectionToken<CrudFormSession<unknown, unknown>>(
  'EVO_CRUD_FORM_SESSION',
);
