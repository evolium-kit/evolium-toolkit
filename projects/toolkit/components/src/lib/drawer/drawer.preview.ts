import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EvoDrawerPanel } from './evo-drawer-panel';

/**
 * Pré-visualização para o Theme Studio, desenhada num iframe.
 *
 * Como o `evo-drawer-panel` é a caixa do drawer sem o overlay do CDK à
 * volta, mostra-se directamente no palco — é o mesmo visual que o
 * `<evo-drawer>` desenha dentro do `Dialog`.
 */
@Component({
  selector: 'evo-drawer-preview',
  imports: [EvoDrawerPanel],
  template: `
    <div class="pv__row">
      <div class="pv__estado">
        <evo-drawer-panel heading="Comandos" description="LD-45-67-AA" position="right">
          <p>Conteúdo do drawer.</p>
          <div slot="footer">
            <button type="button">Enviar</button>
          </div>
        </evo-drawer-panel>
        <span>right</span>
      </div>

      <div class="pv__estado">
        <evo-drawer-panel heading="Detalhes" position="left" size="sm">
          <p>Conteúdo do drawer.</p>
        </evo-drawer-panel>
        <span>left, sm, sem rodapé</span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoDrawerPreview {}
