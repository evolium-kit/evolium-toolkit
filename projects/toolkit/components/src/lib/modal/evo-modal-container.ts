import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  TemplateRef,
  Type,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { EvoButton } from '../button/evo-button';
import { EvoTextField } from '../text-field/evo-text-field';
import { EvoModalPanel } from './evo-modal-panel';
import { EVO_MODAL_DATA, EvoModalRef } from './modal-ref';
import { EVO_MODAL_MESSAGES } from './modal.messages';
import { EvoModalAction, EvoModalConfig, EvoModalEvents } from './modal.types';

/** O que o `EvoModalService` entrega ao contentor. Interno, não exportado. */
export interface EvoModalInterno {
  readonly conteudo: Type<unknown> | TemplateRef<unknown> | null;
  readonly config: EvoModalConfig<unknown, unknown, EvoModalEvents>;
  readonly ref: EvoModalRef<unknown>;
  readonly titleId: string;
  readonly messageId: string;
  readonly acoes: readonly EvoModalAction<unknown>[];
  /** Índice da acção que recebe o foco ao abrir; `-1` deixa-o ao CDK. */
  readonly foco: number;
}

export const EVO_MODAL_INTERNO = new InjectionToken<EvoModalInterno>('EVO_MODAL_INTERNO');

/**
 * O que o `EvoModalService` abre no `Dialog` do CDK: um `evo-modal-panel` com
 * ícone, título, mensagem, o conteúdo do chamador e os botões das acções.
 */
@Component({
  selector: 'evo-modal-container',
  imports: [EvoModalPanel, EvoButton, NgComponentOutlet, NgTemplateOutlet],
  template: `
    <evo-modal-panel
      [heading]="config.title ?? ''"
      [tone]="config.tone"
      [size]="config.size ?? 'md'"
      [showClose]="config.showClose ?? true"
      [titleId]="d.titleId"
      (dismiss)="d.ref.requestClose()"
    >
      @if (config.icon; as icone) {
        <span slot="icon" class="evo-modal-container__icon">
          @if (eTemplate(icone)) {
            <ng-container [ngTemplateOutlet]="icone" />
          } @else {
            <ng-container [ngComponentOutlet]="icone" />
          }
        </span>
      }

      @if (config.message) {
        <p class="evo-modal-container__message" [id]="d.messageId">{{ config.message }}</p>
      }

      @if (d.conteudo; as conteudo) {
        @if (eTemplate(conteudo)) {
          <ng-container
            [ngTemplateOutlet]="conteudo"
            [ngTemplateOutletContext]="{ $implicit: config.data, ref: d.ref }"
          />
        } @else {
          <ng-container [ngComponentOutlet]="conteudo" />
        }
      }

      @if (d.acoes.length) {
        <div slot="footer" class="evo-modal-container__actions">
          @if (erro(); as mensagem) {
            <p class="evo-modal-container__error" role="alert">{{ mensagem }}</p>
          }
          @for (accao of d.acoes; track $index) {
            <button
              evoButton
              type="button"
              [variant]="accao.variant ?? 'solid'"
              [loading]="aCorrer() === $index"
              [disabled]="(aCorrer() !== null && aCorrer() !== $index) || !!accao.disabled?.()"
              [attr.cdkFocusInitial]="d.foco === $index ? '' : null"
              (click)="clicar(accao, $index)"
            >
              {{ accao.label }}
            </button>
          }
        </div>
      }
    </evo-modal-panel>
  `,
  styleUrl: './modal-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoModalContainer {
  protected readonly d = inject(EVO_MODAL_INTERNO);
  protected readonly config = this.d.config;
  private readonly mensagens = inject(EVO_MODAL_MESSAGES);

  /** Índice da acção cujo `handler` está a correr. */
  protected readonly aCorrer = signal<number | null>(null);
  protected readonly erro = signal<string | null>(null);

  protected eTemplate(valor: unknown): valor is TemplateRef<unknown> {
    return valor instanceof TemplateRef;
  }

  protected async clicar(accao: EvoModalAction<unknown>, indice: number): Promise<void> {
    if (this.aCorrer() !== null) return;
    this.erro.set(null);

    let resultado = accao.value;
    if (accao.handler) {
      this.aCorrer.set(indice);
      try {
        const devolvido = await accao.handler(this.d.ref);
        if (devolvido !== undefined) resultado = devolvido;
      } catch (e) {
        this.erro.set(mensagemDoErro(e) ?? this.mensagens.actionFailed);
        return;
      } finally {
        this.aCorrer.set(null);
      }
    }

    if (accao.closes !== false) this.d.ref._fecharComo(resultado, 'action');
  }
}

function mensagemDoErro(e: unknown): string | null {
  const mensagem = (e as { message?: unknown } | null)?.message;
  return typeof mensagem === 'string' && mensagem ? mensagem : null;
}

/** Dados do conteúdo do `prompt()`. Interno. */
export interface EvoModalPromptData {
  readonly valor: WritableSignal<string>;
  readonly label: string;
  readonly placeholder: string;
  readonly required: boolean;
}

/** O campo de texto do `EvoModalService.prompt()`. Enter confirma. */
@Component({
  selector: 'evo-modal-prompt',
  imports: [EvoTextField],
  template: `
    <form (submit)="confirmar($event)">
      <evo-text-field
        [label]="dados.label"
        [placeholder]="dados.placeholder"
        [required]="dados.required"
        [hideLabel]="!dados.label"
        [(value)]="dados.valor"
      />
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoModalPrompt {
  protected readonly dados = inject(EVO_MODAL_DATA) as EvoModalPromptData;
  private readonly ref = inject(EvoModalRef) as EvoModalRef<string | null>;

  protected confirmar(evento: Event): void {
    evento.preventDefault();
    const valor = this.dados.valor();
    if (this.dados.required && !valor.trim()) return;
    this.ref._fecharComo(valor, 'action');
  }
}
