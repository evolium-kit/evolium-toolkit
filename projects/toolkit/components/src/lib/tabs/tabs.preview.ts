import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { EvoTab } from './evo-tab';
import { EvoTabList } from './evo-tab-list';
import { EvoTabPanel } from './evo-tab-panel';
import { EvoTabs } from './evo-tabs';

/**
 * Pré-visualização para o Theme Studio, desenhada num iframe.
 *
 * Mostra os estados lado a lado: é assim que se vê logo se um override partiu
 * o indicador, o `disabled` ou o foco. O Studio passa `size` (o `EvoTabs`
 * declara-o como input).
 */
@Component({
  selector: 'evo-tabs-preview',
  imports: [EvoTabs, EvoTabList, EvoTab, EvoTabPanel],
  template: `
    <div class="pv__stack">
      <div class="pv__estado">
        <span>Horizontal</span>
        <evo-tabs [(value)]="h" ariaLabel="Pré-visualização horizontal">
          <evo-tab-list>
            <button evoTab value="a">Tab A</button>
            <button evoTab value="b">Tab B</button>
            <button evoTab value="c" disabled>Desactivada</button>
          </evo-tab-list>
          <evo-tab-panel value="a">Conteúdo A</evo-tab-panel>
          <evo-tab-panel value="b">Conteúdo B</evo-tab-panel>
          <evo-tab-panel value="c">Conteúdo C</evo-tab-panel>
        </evo-tabs>
      </div>

      <div class="pv__estado">
        <span>Vertical</span>
        <evo-tabs [(value)]="v" orientation="vertical" ariaLabel="Pré-visualização vertical">
          <evo-tab-list>
            <button evoTab value="a">Tab A</button>
            <button evoTab value="b">Tab B</button>
          </evo-tab-list>
          <evo-tab-panel value="a">Conteúdo A</evo-tab-panel>
          <evo-tab-panel value="b">Conteúdo B</evo-tab-panel>
        </evo-tabs>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoTabsPreview {
  protected readonly h = signal<string>('a');
  protected readonly v = signal<string>('a');
}
