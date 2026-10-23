import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  TemplateRef,
  Type,
  inject,
  signal,
} from '@angular/core';
import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { EvoButton } from '../button/evo-button';
import { EvoDrawerPanel } from './evo-drawer-panel';
import { EvoDrawerRef } from './drawer-ref';
import { EVO_DRAWER_MESSAGES } from './drawer.messages';
import { EvoDrawerAction, EvoDrawerConfig, EvoDrawerEvents } from './drawer.types';

/** O que o `EvoDrawerService` entrega ao contentor. Interno, não exportado. */
export interface EvoDrawerInterno {
  readonly conteudo: Type<unknown> | TemplateRef<unknown> | null;
  readonly config: EvoDrawerConfig<unknown, unknown, EvoDrawerEvents>;
  readonly ref: EvoDrawerRef<unknown>;
  readonly titleId: string;
  readonly descriptionId: string;
  readonly acoes: readonly EvoDrawerAction<unknown>[];
}

export const EVO_DRAWER_INTERNO = new InjectionToken<EvoDrawerInterno>('EVO_DRAWER_INTERNO');

/**
 * O que o `EvoDrawerService` abre no `Dialog` do CDK: um `evo-drawer-panel`
 * com título, descrição, o conteúdo do chamador e os botões das acções.
 */
@Component({
  selector: 'evo-drawer-container',
  imports: [EvoDrawerPanel, EvoButton, NgComponentOutlet, NgTemplateOutlet],
  template: `
    <evo-drawer-panel
      [heading]="config.title ?? ''"
      [description]="config.description ?? ''"
      [position]="config.position ?? 'right'"
      [size]="config.size ?? 'md'"
      [showClose]="config.showClose ?? true"
      [titleId]="d.titleId"
      [descriptionId]="config.description ? d.descriptionId : ''"
      (dismiss)="d.ref.requestClose()"
    >
      @if (config.message) {
        <p class="evo-drawer-container__message">{{ config.message }}</p>
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
        <div slot="footer" class="evo-drawer-container__actions">
          @if (erro(); as mensagem) {
            <p class="evo-drawer-container__error" role="alert">{{ mensagem }}</p>
          }
          @for (accao of d.acoes; track $index) {
            <button
              evoButton
              type="button"
              [variant]="accao.variant ?? 'solid'"
              [loading]="aCorrer() === $index"
              [disabled]="(aCorrer() !== null && aCorrer() !== $index) || !!accao.disabled?.()"
              [attr.cdkFocusInitial]="accao.autofocus ? '' : null"
              (click)="clicar(accao, $index)"
            >
              {{ accao.label }}
            </button>
          }
        </div>
      }
    </evo-drawer-panel>
  `,
  styleUrl: './drawer-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoDrawerContainer {
  protected readonly d = inject(EVO_DRAWER_INTERNO);
  protected readonly config = this.d.config;
  private readonly mensagens = inject(EVO_DRAWER_MESSAGES);

  /** Índice da acção cujo `handler` está a correr. */
  protected readonly aCorrer = signal<number | null>(null);
  protected readonly erro = signal<string | null>(null);

  protected eTemplate(valor: unknown): valor is TemplateRef<unknown> {
    return valor instanceof TemplateRef;
  }

  protected async clicar(accao: EvoDrawerAction<unknown>, indice: number): Promise<void> {
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
