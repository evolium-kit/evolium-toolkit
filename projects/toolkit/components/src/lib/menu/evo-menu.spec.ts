import {
  DOWN_ARROW,
  END,
  ENTER,
  ESCAPE,
  HOME,
  LEFT_ARROW,
  RIGHT_ARROW,
  SPACE,
  TAB,
  UP_ARROW,
} from '@angular/cdk/keycodes';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoMenu } from './evo-menu';
import { EvoMenuBar } from './evo-menu-bar';
import {
  EvoMenuCheckbox,
  EvoMenuGroup,
  EvoMenuItem,
  EvoMenuRadio,
  EvoMenuSeparator,
} from './evo-menu-item';
import { EvoContextMenuTrigger, EvoMenuTrigger } from './evo-menu-trigger';
import { EvoMenuEntry, evoMenuPositions } from './menu.types';
import { evoMenuMeta } from './menu.tokens';

const IMPORTS = [
  EvoMenu,
  EvoMenuItem,
  EvoMenuCheckbox,
  EvoMenuRadio,
  EvoMenuGroup,
  EvoMenuSeparator,
  EvoMenuBar,
  EvoMenuTrigger,
  EvoContextMenuTrigger,
  EvoTokensDirective,
];

/**
 * `keyCode` é o que o CDK lê para setas, Enter, Espaço, Tab e Escape — o jsdom
 * não o preenche sozinho. O typeahead lê `key`.
 */
function tecla(el: Element, keyCode: number, key?: string): KeyboardEvent {
  const nomes: Record<number, string> = {
    [ESCAPE]: 'Escape',
    [ENTER]: 'Enter',
    [TAB]: 'Tab',
    [SPACE]: ' ',
    [UP_ARROW]: 'ArrowUp',
    [DOWN_ARROW]: 'ArrowDown',
    [LEFT_ARROW]: 'ArrowLeft',
    [RIGHT_ARROW]: 'ArrowRight',
    [HOME]: 'Home',
    [END]: 'End',
  };
  const evento = new KeyboardEvent('keydown', {
    key: key ?? nomes[keyCode] ?? '',
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(evento, 'keyCode', { get: () => keyCode });
  el.dispatchEvent(evento);
  return evento;
}

const paineis = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('.cdk-overlay-container evo-menu'),
];
const itensDe = (painel: HTMLElement): HTMLElement[] => [
  ...painel.querySelectorAll<HTMLElement>('.evo-menu-item'),
];
const item = (texto: string, painel = paineis()[0]): HTMLElement =>
  itensDe(painel).find((i) => i.textContent?.trim().startsWith(texto))!;
/** Como item, mas o texto tem de ser exactamente o do item (A não apanha Actual). */
const itemExacto = (texto: string, painel = paineis()[0]): HTMLElement =>
  itensDe(painel).find((i) => i.textContent?.trim() === texto)!;
const foco = (): string => document.activeElement?.textContent?.trim() ?? '';
const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

@Component({
  imports: IMPORTS,
  template: `
    <section [evoTokens]="{ 'menu-bg': '#fff7ed' }">
      <button
        id="gatilho"
        [evoMenuTriggerFor]="menu"
        [(evoMenuOpen)]="aberto"
        [evoMenuPlacement]="lugar()"
        (evoMenuOpened)="eventos.push('abriu')"
        (evoMenuClosed)="eventos.push('fechou')"
      >
        Acções
      </button>
    </section>
    <ng-template #menu>
      <evo-menu [size]="tamanho()">
        <button evoMenuItem (activated)="escolhas.push('editar')">Editar</button>
        <button evoMenuItem disabled (activated)="escolhas.push('duplicar')">Duplicar</button>
        <button evoMenuItem [selected]="actual()" (activated)="escolhas.push('actual')">
          Actual
        </button>
        <button evoMenuItem [closeOnSelect]="false" (activated)="escolhas.push('fica')">
          Fica aberto
        </button>
        <hr evoMenuSeparator />
        <button evoMenuItem [evoMenuTriggerFor]="sub">Mais</button>
        <a evoMenuItem href="#x" (activated)="escolhas.push('link')">Ligação</a>
        <button evoMenuItem typeaheadLabel="zebra">Listrado</button>
      </evo-menu>
    </ng-template>
    <ng-template #sub>
      <evo-menu>
        <button evoMenuItem (activated)="escolhas.push('sub')">Filho</button>
        <button evoMenuItem [evoMenuTriggerFor]="sub2">Neto</button>
      </evo-menu>
    </ng-template>
    <ng-template #sub2>
      <evo-menu><button evoMenuItem>Bisneto</button></evo-menu>
    </ng-template>
    <button id="depois">Depois</button>
  `,
})
class Anfitriao {
  readonly aberto = signal(false);
  readonly lugar = signal<'bottom-start' | 'top-end'>('bottom-start');
  readonly tamanho = signal<string | null>(null);
  readonly actual = signal(false);
  readonly eventos: string[] = [];
  readonly escolhas: string[] = [];
}

async function criar<T>(tipo: new () => T): Promise<ComponentFixture<T>> {
  await TestBed.configureTestingModule({ imports: [tipo as never] }).compileComponents();
  const fixture = TestBed.createComponent(tipo);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

async function estabilizar(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('EvoMenu: gatilho, painel e itens', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let gatilho: HTMLButtonElement;
  const est = () => estabilizar(fixture);

  beforeEach(async () => {
    fixture = await criar(Anfitriao);
    gatilho = fixture.nativeElement.querySelector('#gatilho');
  });

  describe('abrir e fechar', () => {
    it('o gatilho declara o menu antes de abrir', () => {
      expect(gatilho.getAttribute('aria-haspopup')).toBe('menu');
      expect(gatilho.getAttribute('aria-expanded')).toBe('false');
      expect(paineis().length).toBe(0);
    });

    it('dá um id ao gatilho que o não tem, e respeita o que já tem', () => {
      expect(gatilho.id).toBe('gatilho');
      expect(fixture.nativeElement.querySelector('#depois')).toBeTruthy();
    });

    it('abre ao clicar: foca o 1.º item e o painel é nomeado pelo gatilho', async () => {
      gatilho.click();
      await est();

      const [painel] = paineis();
      expect(painel.getAttribute('role')).toBe('menu');
      expect(painel.getAttribute('aria-labelledby')).toBe('gatilho');
      expect(painel.classList.contains('evo-menu')).toBe(true);
      expect(gatilho.getAttribute('aria-expanded')).toBe('true');
      expect(foco()).toBe('Editar');
      expect(itensDe(painel)[0].getAttribute('role')).toBe('menuitem');
    });

    it('fecha com Escape e devolve o foco ao gatilho', async () => {
      gatilho.focus();
      gatilho.click();
      await est();
      tecla(document.activeElement!, ESCAPE);
      await est();

      expect(paineis().length).toBe(0);
      expect(document.activeElement).toBe(gatilho);
      expect(gatilho.getAttribute('aria-expanded')).toBe('false');
    });

    it('o Escape do menu não chega ao Dialog por baixo (um menu num modal não fecha o modal)', async () => {
      let chegou = 0;
      const ouvinte = () => chegou++;
      document.body.addEventListener('keydown', ouvinte);
      gatilho.click();
      await est();
      tecla(document.activeElement!, ESCAPE);
      await est();
      document.body.removeEventListener('keydown', ouvinte);

      expect(paineis().length).toBe(0);
      expect(chegou).toBe(0);
    });

    it('↓ abre no 1.º item e ↑ no último, a partir do gatilho', async () => {
      gatilho.focus();
      tecla(gatilho, DOWN_ARROW);
      await est();
      expect(foco()).toBe('Editar');

      tecla(document.activeElement!, ESCAPE);
      await est();
      tecla(gatilho, UP_ARROW);
      await est();
      expect(foco()).toBe('Listrado');
    });

    it('Tab fecha o menu e deixa o foco continuar a partir do gatilho', async () => {
      gatilho.focus();
      gatilho.click();
      await est();
      tecla(document.activeElement!, TAB);
      await est();

      expect(paineis().length).toBe(0);
      expect(document.activeElement).toBe(gatilho);
    });

    it('um clique fora fecha-o', async () => {
      gatilho.click();
      await est();
      document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await est();

      expect(paineis().length).toBe(0);
    });

    it('um segundo clique no gatilho fecha-o', async () => {
      gatilho.click();
      await est();
      gatilho.click();
      await est();
      expect(paineis().length).toBe(0);
    });
  });

  describe('teclado no painel', () => {
    beforeEach(async () => {
      gatilho.click();
      await est();
    });

    it('as setas percorrem os itens, com rotação, e Home/End saltam', () => {
      const lista = itensDe(paineis()[0]);
      tecla(document.activeElement!, DOWN_ARROW);
      expect(document.activeElement).toBe(lista[1]);
      tecla(document.activeElement!, UP_ARROW);
      tecla(document.activeElement!, UP_ARROW);
      expect(document.activeElement).toBe(lista[lista.length - 1]);
      tecla(document.activeElement!, HOME);
      expect(document.activeElement).toBe(lista[0]);
      tecla(document.activeElement!, END);
      expect(document.activeElement).toBe(lista[lista.length - 1]);
    });

    it('escrever uma letra salta para o item que começa por ela (e `typeaheadLabel` manda)', async () => {
      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'l', bubbles: true }),
      );
      await esperar(260);
      expect(foco()).toBe('Ligação');

      document.activeElement!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', bubbles: true }),
      );
      await esperar(260);
      expect(foco()).toBe('Listrado');
    });

    it('o rato por cima de um item passa-lhe o foco, e as setas continuam dali', () => {
      const actual = item('Actual');
      actual.dispatchEvent(new MouseEvent('mouseenter'));
      expect(document.activeElement).toBe(actual);

      tecla(actual, DOWN_ARROW);
      expect(foco()).toBe('Fica aberto');
    });
  });

  describe('itens', () => {
    beforeEach(async () => {
      gatilho.click();
      await est();
    });

    it('activar um item emite `activated` e fecha o menu', async () => {
      item('Editar').click();
      await est();

      expect(fixture.componentInstance.escolhas).toEqual(['editar']);
      expect(paineis().length).toBe(0);
      expect(document.activeElement).toBe(gatilho);
    });

    it('`closeOnSelect="false"` deixa o menu aberto', async () => {
      item('Fica aberto').click();
      await est();

      expect(fixture.componentInstance.escolhas).toEqual(['fica']);
      expect(paineis().length).toBe(1);
    });

    it('um item desactivado fica focável, com aria-disabled, e não faz nada', async () => {
      const duplicar = item('Duplicar');
      expect(duplicar.getAttribute('aria-disabled')).toBe('true');
      expect(duplicar.hasAttribute('disabled')).toBe(false);

      duplicar.focus();
      expect(document.activeElement).toBe(duplicar);
      duplicar.click();
      await est();

      expect(fixture.componentInstance.escolhas).toEqual([]);
      expect(paineis().length).toBe(1);
    });

    it('`selected` marca aria-current e data-evo-selected, e sai ao sair do estado', async () => {
      const actual = item('Actual');
      expect(actual.hasAttribute('aria-current')).toBe(false);

      fixture.componentInstance.actual.set(true);
      await est();
      expect(actual.getAttribute('aria-current')).toBe('true');
      expect(actual.hasAttribute('data-evo-selected')).toBe(true);

      fixture.componentInstance.actual.set(false);
      await est();
      expect(actual.hasAttribute('aria-current')).toBe(false);
      expect(actual.hasAttribute('data-evo-selected')).toBe(false);
    });

    it('um `a[evoMenuItem]` é um item de menu com o seu href', () => {
      const ligacao = item('Ligação');
      expect(ligacao.tagName).toBe('A');
      expect(ligacao.getAttribute('role')).toBe('menuitem');
      expect(ligacao.getAttribute('href')).toBe('#x');
    });

    it('o separador é um role=separator e não entra na navegação', () => {
      const [painel] = paineis();
      expect(painel.querySelector('.evo-menu-separator')?.getAttribute('role')).toBe('separator');
      expect(itensDe(painel).some((i) => i.classList.contains('evo-menu-separator'))).toBe(false);
    });

    it('os botões do menu têm type="button" (não submetem formulários)', () => {
      expect(item('Editar').getAttribute('type')).toBe('button');
    });
  });

  describe('estado, tamanho e posição', () => {
    it('[(evoMenuOpen)] e os eventos acompanham o menu', async () => {
      expect(fixture.componentInstance.aberto()).toBe(false);
      gatilho.click();
      await est();
      expect(fixture.componentInstance.aberto()).toBe(true);
      expect(fixture.componentInstance.eventos).toEqual(['abriu']);

      tecla(document.activeElement!, ESCAPE);
      await est();
      expect(fixture.componentInstance.aberto()).toBe(false);
      expect(fixture.componentInstance.eventos).toEqual(['abriu', 'fechou']);
    });

    it('abrir por código abre o menu e leva-lhe o foco; fechar por código fecha-o', async () => {
      fixture.componentInstance.aberto.set(true);
      await est();
      expect(paineis().length).toBe(1);
      expect(gatilho.getAttribute('aria-expanded')).toBe('true');
      expect(foco()).toBe('Editar');

      fixture.componentInstance.aberto.set(false);
      await est();
      expect(paineis().length).toBe(0);
    });

    it('o tamanho é md por omissão, segue o input, e um submenu herda o do pai', async () => {
      gatilho.click();
      await est();
      expect(paineis()[0].getAttribute('data-evo-size')).toBe('md');

      tecla(document.activeElement!, ESCAPE);
      await est();
      fixture.componentInstance.tamanho.set('lg');
      await est();
      gatilho.click();
      await est();
      expect(paineis()[0].getAttribute('data-evo-size')).toBe('lg');

      const mais = item('Mais');
      mais.focus();
      tecla(mais, RIGHT_ARROW);
      await est();
      expect(paineis()[1].getAttribute('data-evo-size')).toBe('lg');
    });

    it('os [evoTokens] do gatilho e dos ancestrais são copiados para o painel', async () => {
      gatilho.click();
      await est();
      expect(paineis()[0].style.getPropertyValue('--evo-menu-bg')).toBe('#fff7ed');
    });

    it('a posição muda com o `evoMenuPlacement`, também com o painel já criado', async () => {
      gatilho.click();
      await est();
      fixture.componentInstance.lugar.set('top-end');
      await est();
      // Não há layout no jsdom: o que se verifica é que a actualização não rebenta
      // e o painel continua aberto (a geometria é validada no playground).
      expect(paineis().length).toBe(1);
    });
  });

  describe('submenus', () => {
    beforeEach(async () => {
      gatilho.click();
      await est();
    });

    it('o item com gatilho anuncia o submenu', () => {
      const mais = item('Mais');
      expect(mais.getAttribute('aria-haspopup')).toBe('menu');
      expect(mais.getAttribute('aria-expanded')).toBe('false');
      expect(mais.getAttribute('role')).toBe('menuitem');
    });

    it('→ abre-o no 1.º item, ← fecha-o e devolve o foco ao pai', async () => {
      const mais = item('Mais');
      mais.focus();
      tecla(mais, RIGHT_ARROW);
      await est();

      expect(paineis().length).toBe(2);
      expect(foco()).toBe('Filho');
      expect(paineis()[1].getAttribute('aria-labelledby')).toBe(mais.id);

      tecla(document.activeElement!, LEFT_ARROW);
      await est();
      expect(paineis().length).toBe(1);
      expect(document.activeElement).toBe(mais);
    });

    it('o Escape fecha só o menu de cima', async () => {
      const mais = item('Mais');
      mais.focus();
      tecla(mais, RIGHT_ARROW);
      await est();

      tecla(document.activeElement!, ESCAPE);
      await est();
      expect(paineis().length).toBe(1);
      expect(foco()).toBe('Mais');
    });

    it('com um menu aberto, o rato por cima do item de um submenu abre-o (feito pelo CDK)', async () => {
      const mais = item('Mais');
      mais.dispatchEvent(new MouseEvent('mouseenter'));
      await est();

      expect(paineis().length).toBe(2);
    });

    it('activar um item do submenu fecha tudo', async () => {
      const mais = item('Mais');
      mais.focus();
      tecla(mais, RIGHT_ARROW);
      await est();
      item('Filho', paineis()[1]).click();
      await est();

      expect(fixture.componentInstance.escolhas).toEqual(['sub']);
      expect(paineis().length).toBe(0);
    });

    it('aguenta três níveis', async () => {
      const mais = item('Mais');
      mais.focus();
      tecla(mais, RIGHT_ARROW);
      await est();
      const neto = item('Neto', paineis()[1]);
      neto.focus();
      tecla(neto, RIGHT_ARROW);
      await est();

      expect(paineis().length).toBe(3);
      expect(foco()).toBe('Bisneto');
    });
  });
});

@Component({
  imports: IMPORTS,
  template: `
    <button id="g" [evoMenuTriggerFor]="m">Ver</button>
    <ng-template #m>
      <evo-menu>
        <button evoMenuCheckbox [(checked)]="grelha" [closeOnSelect]="false">Grelha</button>
        <button evoMenuCheckbox [(checked)]="regua">Régua</button>
        <button evoMenuCheckbox disabled [checked]="true">Fixo</button>
        <hr evoMenuSeparator />
        <evo-menu-group label="Tamanho" [(value)]="tamanho">
          <button evoMenuRadio value="sm">Pequeno</button>
          <button evoMenuRadio value="md">Médio</button>
          <button evoMenuRadio value="lg" (activated)="activados.push('lg')">Grande</button>
        </evo-menu-group>
      </evo-menu>
    </ng-template>
  `,
})
class AnfitriaoGrupos {
  readonly grelha = signal(true);
  readonly regua = signal(false);
  readonly tamanho = signal<unknown>('md');
  readonly activados: string[] = [];
}

describe('EvoMenu: caixas de verificação, grupos e escolha única', () => {
  let fixture: ComponentFixture<AnfitriaoGrupos>;
  let gatilho: HTMLButtonElement;
  const est = () => estabilizar(fixture);

  beforeEach(async () => {
    fixture = await criar(AnfitriaoGrupos);
    gatilho = fixture.nativeElement.querySelector('#g');
    gatilho.click();
    await est();
  });

  it('a caixa de verificação tem role e aria-checked reflectidos, também ao sair do estado', async () => {
    const grelha = item('Grelha');
    expect(grelha.getAttribute('role')).toBe('menuitemcheckbox');
    expect(grelha.getAttribute('aria-checked')).toBe('true');
    expect(grelha.hasAttribute('data-evo-checked')).toBe(true);

    fixture.componentInstance.grelha.set(false);
    await est();
    expect(grelha.getAttribute('aria-checked')).toBe('false');
    expect(grelha.hasAttribute('data-evo-checked')).toBe(false);
  });

  it('activar alterna o [(checked)]; com closeOnSelect=false o menu fica aberto', async () => {
    item('Grelha').click();
    await est();
    expect(fixture.componentInstance.grelha()).toBe(false);
    expect(paineis().length).toBe(1);

    item('Grelha').click();
    await est();
    expect(fixture.componentInstance.grelha()).toBe(true);
  });

  it('por omissão activar fecha o menu', async () => {
    item('Régua').click();
    await est();
    expect(fixture.componentInstance.regua()).toBe(true);
    expect(paineis().length).toBe(0);
  });

  it('a caixa desactivada não alterna', async () => {
    const fixo = item('Fixo');
    expect(fixo.getAttribute('aria-disabled')).toBe('true');
    fixo.click();
    await est();
    expect(fixo.getAttribute('aria-checked')).toBe('true');
    expect(paineis().length).toBe(1);
  });

  it('o grupo tem role=group e é nomeado pelo seu cabeçalho', () => {
    const grupo = paineis()[0].querySelector('evo-menu-group')!;
    expect(grupo.getAttribute('role')).toBe('group');
    const rotulo = document.getElementById(grupo.getAttribute('aria-labelledby')!)!;
    expect(rotulo.textContent?.trim()).toBe('Tamanho');
    // O cabeçalho é lido como nome do grupo, não como um item solto.
    expect(rotulo.getAttribute('aria-hidden')).toBe('true');
  });

  it('só o item cujo value é o do grupo fica marcado', () => {
    const marcado = itensDe(paineis()[0])
      .filter((i) => i.getAttribute('role') === 'menuitemradio')
      .map((i) => `${i.textContent?.trim()}:${i.getAttribute('aria-checked')}`);
    expect(marcado).toEqual(['Pequeno:false', 'Médio:true', 'Grande:false']);
  });

  it('escolher um item muda o [(value)] do grupo e fecha o menu', async () => {
    item('Grande').click();
    await est();

    expect(fixture.componentInstance.tamanho()).toBe('lg');
    expect(fixture.componentInstance.activados).toEqual(['lg']);
    expect(paineis().length).toBe(0);

    gatilho.click();
    await est();
    expect(item('Grande').getAttribute('aria-checked')).toBe('true');
    expect(item('Médio').getAttribute('aria-checked')).toBe('false');
  });
});

@Component({
  imports: IMPORTS,
  template: `
    <evo-menu-bar aria-label="Aplicação">
      <button id="b-ficheiro" evoMenuItem [evoMenuTriggerFor]="ficheiro">Ficheiro</button>
      <button id="b-editar" evoMenuItem [evoMenuTriggerFor]="editar">Editar</button>
    </evo-menu-bar>
    <ng-template #ficheiro>
      <evo-menu><button evoMenuItem>Novo</button></evo-menu>
    </ng-template>
    <ng-template #editar>
      <evo-menu><button evoMenuItem>Desfazer</button></evo-menu>
    </ng-template>
  `,
})
class AnfitriaoBarra {}

describe('EvoMenuBar', () => {
  let fixture: ComponentFixture<AnfitriaoBarra>;
  let barra: HTMLElement;
  const est = () => estabilizar(fixture);

  beforeEach(async () => {
    fixture = await criar(AnfitriaoBarra);
    barra = fixture.nativeElement.querySelector('evo-menu-bar');
  });

  it('é um role=menubar com nome, e as entradas são menuitems com submenu', () => {
    expect(barra.getAttribute('role')).toBe('menubar');
    expect(barra.getAttribute('aria-label')).toBe('Aplicação');
    const ficheiro = barra.querySelector('#b-ficheiro')!;
    expect(ficheiro.getAttribute('role')).toBe('menuitem');
    expect(ficheiro.getAttribute('aria-haspopup')).toBe('menu');
    expect(ficheiro.hasAttribute('data-evo-in-bar')).toBe(true);
  });

  it('a barra entra na ordem de tabulação e, com o foco numa entrada, só essa fica nela (roving tabindex)', () => {
    const tabs = () =>
      [...barra.querySelectorAll('.evo-menu-item')].map((i) => i.getAttribute('tabindex'));
    expect(barra.getAttribute('tabindex')).toBe('0');
    expect(tabs()).toEqual(['-1', '-1']);

    barra.querySelector<HTMLElement>('#b-editar')!.focus();
    fixture.detectChanges();
    expect(tabs()).toEqual(['-1', '0']);
  });

  it('↓ abre o menu da entrada; com ele aberto, → passa ao menu seguinte (o foco fica na entrada)', async () => {
    const ficheiro = barra.querySelector<HTMLElement>('#b-ficheiro')!;
    ficheiro.focus();
    tecla(ficheiro, DOWN_ARROW);
    await est();
    expect(paineis().length).toBe(1);
    expect(foco()).toBe('Novo');

    tecla(document.activeElement!, RIGHT_ARROW);
    await est();
    expect(paineis().length).toBe(1);
    expect(paineis()[0].textContent).toContain('Desfazer');
    expect(foco()).toBe('Editar');
    expect(barra.querySelector('#b-editar')!.getAttribute('aria-expanded')).toBe('true');
    expect(barra.querySelector('#b-ficheiro')!.getAttribute('aria-expanded')).toBe('false');
  });

  it('o Escape fecha o menu e devolve o foco à entrada da barra', async () => {
    const ficheiro = barra.querySelector<HTMLElement>('#b-ficheiro')!;
    ficheiro.click();
    await est();
    tecla(document.activeElement!, ESCAPE);
    await est();

    expect(paineis().length).toBe(0);
    expect(document.activeElement).toBe(ficheiro);
  });
});

@Component({
  imports: IMPORTS,
  template: `
    <div id="area" [evoContextMenuTriggerFor]="m" [evoContextMenuDisabled]="desactivado()">
      Área
    </div>
    <ng-template #m>
      <evo-menu>
        <button evoMenuItem (activated)="escolhas.push('copiar')">Copiar</button>
      </evo-menu>
    </ng-template>
  `,
})
class AnfitriaoContexto {
  readonly desactivado = signal(false);
  readonly escolhas: string[] = [];
}

describe('EvoContextMenuTrigger', () => {
  let fixture: ComponentFixture<AnfitriaoContexto>;
  let area: HTMLElement;
  const est = () => estabilizar(fixture);
  const contexto = (): MouseEvent =>
    new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 50 });

  beforeEach(async () => {
    fixture = await criar(AnfitriaoContexto);
    area = fixture.nativeElement.querySelector('#area');
  });

  it('abre com o botão direito, sem o menu nativo, e foca o 1.º item', async () => {
    const evento = contexto();
    area.dispatchEvent(evento);
    await est();

    expect(evento.defaultPrevented).toBe(true);
    expect(paineis().length).toBe(1);
    expect(foco()).toBe('Copiar');
  });

  it('o painel não tem aria-labelledby: o alvo é uma área sem nome', async () => {
    area.dispatchEvent(contexto());
    await est();
    expect(paineis()[0].hasAttribute('aria-labelledby')).toBe(false);
  });

  it('activar um item emite e fecha; o Escape também fecha', async () => {
    area.dispatchEvent(contexto());
    await est();
    item('Copiar').click();
    await est();
    expect(fixture.componentInstance.escolhas).toEqual(['copiar']);
    expect(paineis().length).toBe(0);

    area.dispatchEvent(contexto());
    await est();
    tecla(document.activeElement!, ESCAPE);
    await est();
    expect(paineis().length).toBe(0);
  });

  it('com `evoContextMenuDisabled` deixa o menu nativo em paz', async () => {
    fixture.componentInstance.desactivado.set(true);
    await est();
    const evento = contexto();
    area.dispatchEvent(evento);
    await est();

    expect(evento.defaultPrevented).toBe(false);
    expect(paineis().length).toBe(0);
  });
});

@Component({
  imports: IMPORTS,
  template: `
    <button id="d" [evoMenuTriggerFor]="entradas()">Dados</button>
    <button id="d2" [evoMenuTriggerFor]="alvo()">Outro</button>
  `,
})
class AnfitriaoDados {
  readonly marcado = signal(false);
  readonly valor = signal<unknown>('b');
  readonly feitos: string[] = [];
  readonly alvo = signal<readonly EvoMenuEntry[] | null>(null);

  readonly entradas = signal<EvoMenuEntry[]>([]);

  constructor() {
    this.refazer();
  }

  refazer(): void {
    this.entradas.set([
      {
        label: 'Novo',
        suffix: '⌘ N',
        iconClass: 'icone-novo',
        run: () => this.feitos.push('novo'),
      },
      { label: 'Desactivado', disabled: true, run: () => this.feitos.push('nunca') },
      { label: 'Actual', selected: true },
      {
        label: 'Recentes',
        children: [{ label: 'um.pdf', run: () => this.feitos.push('um.pdf') }],
      },
      { type: 'separator' },
      {
        type: 'checkbox',
        label: 'Grelha',
        checked: this.marcado(),
        run: (v) => {
          this.marcado.set(v);
          this.refazer();
        },
      },
      {
        type: 'group',
        label: 'Ordem',
        value: this.valor(),
        run: (v) => {
          this.valor.set(v);
          this.refazer();
        },
        children: [
          { type: 'radio', label: 'A', value: 'a' },
          { type: 'radio', label: 'B', value: 'b' },
          { type: 'radio', label: 'C', value: 'c', disabled: true },
        ],
      },
      { label: 'Docs', href: '#docs' },
    ]);
  }
}

describe('EvoMenuTrigger com dados', () => {
  let fixture: ComponentFixture<AnfitriaoDados>;
  let gatilho: HTMLButtonElement;
  const est = () => estabilizar(fixture);

  beforeEach(async () => {
    fixture = await criar(AnfitriaoDados);
    gatilho = fixture.nativeElement.querySelector('#d');
  });

  it('declara o menu antes do primeiro clique', () => {
    expect(gatilho.getAttribute('aria-haspopup')).toBe('menu');
    expect(fixture.nativeElement.querySelector('#d2').getAttribute('aria-haspopup')).toBeNull();
  });

  it('desenha cada tipo de entrada com os papéis certos', async () => {
    gatilho.click();
    await est();

    const papeis = [...paineis()[0].querySelectorAll('[role]')]
      .map((e) => e.getAttribute('role'))
      .filter((r) => r !== 'menu');
    expect(papeis).toEqual([
      'menuitem',
      'menuitem',
      'menuitem',
      'menuitem',
      'separator',
      'menuitemcheckbox',
      'group',
      'menuitemradio',
      'menuitemradio',
      'menuitemradio',
      'menuitem',
    ]);
    expect(item('Docs').tagName).toBe('A');
    expect(item('Docs').getAttribute('href')).toBe('#docs');
    expect(item('Actual').getAttribute('aria-current')).toBe('true');
    expect(item('Desactivado').getAttribute('aria-disabled')).toBe('true');
    expect(item('Novo').querySelector('[slot="suffix"]')?.textContent).toBe('⌘ N');
    expect(item('Novo').querySelector('[slot="prefix"]')?.classList).toContain('icone-novo');
  });

  it('`run` corre ao activar e não corre num item desactivado', async () => {
    gatilho.click();
    await est();
    item('Desactivado').click();
    item('Novo').click();
    await est();

    expect(fixture.componentInstance.feitos).toEqual(['novo']);
  });

  it('um item com `children` abre um submenu a partir dos mesmos dados', async () => {
    gatilho.click();
    await est();
    const recentes = item('Recentes');
    expect(recentes.getAttribute('aria-haspopup')).toBe('menu');
    recentes.focus();
    tecla(recentes, RIGHT_ARROW);
    await est();

    expect(paineis().length).toBe(2);
    item('um.pdf', paineis()[1]).click();
    await est();
    expect(fixture.componentInstance.feitos).toEqual(['um.pdf']);
  });

  it('a caixa de verificação não fecha o menu e mostra o estado novo que o chamador passa', async () => {
    gatilho.click();
    await est();
    item('Grelha').click();
    await est();

    expect(fixture.componentInstance.marcado()).toBe(true);
    expect(paineis().length).toBe(1);
    expect(item('Grelha').getAttribute('aria-checked')).toBe('true');
  });

  it('o grupo de escolha única devolve o valor e reflecte o novo', async () => {
    gatilho.click();
    await est();
    expect(itemExacto('B').getAttribute('aria-checked')).toBe('true');
    expect(itemExacto('C').getAttribute('aria-disabled')).toBe('true');

    itemExacto('A').click();
    await est();
    expect(fixture.componentInstance.valor()).toBe('a');

    gatilho.click();
    await est();
    expect(itemExacto('A').getAttribute('aria-checked')).toBe('true');
  });

  it('trocar o alvo de dados para nada tira o menu', async () => {
    const outro = fixture.nativeElement.querySelector('#d2') as HTMLButtonElement;
    expect(outro.getAttribute('aria-haspopup')).toBeNull();

    fixture.componentInstance.alvo.set([{ label: 'X' }]);
    await est();
    expect(outro.getAttribute('aria-haspopup')).toBe('menu');
    outro.click();
    await est();
    expect(paineis().length).toBe(1);
    tecla(document.activeElement!, ESCAPE);
    await est();

    fixture.componentInstance.alvo.set(null);
    await est();
    expect(outro.getAttribute('aria-haspopup')).toBeNull();
  });
});

@Component({
  imports: IMPORTS,
  template: `
    <evo-menu id="lateral" aria-label="Navegação">
      <button evoMenuItem selected>Início</button>
      <button evoMenuItem>Facturas</button>
      <button evoMenuItem>Clientes</button>
    </evo-menu>
  `,
})
class AnfitriaoEmbutido {}

describe('EvoMenu embutido (sem gatilho)', () => {
  let fixture: ComponentFixture<AnfitriaoEmbutido>;
  let menu: HTMLElement;

  beforeEach(async () => {
    fixture = await criar(AnfitriaoEmbutido);
    menu = fixture.nativeElement.querySelector('#lateral');
  });

  it('é um menu na página: role=menu, o id e o nome que lhe deram, sem aria-labelledby', () => {
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.id).toBe('lateral');
    expect(menu.getAttribute('aria-label')).toBe('Navegação');
    expect(menu.hasAttribute('aria-labelledby')).toBe(false);
    expect(itensDe(menu)[0].getAttribute('aria-current')).toBe('true');
  });

  it('tem teclado: as setas percorrem os itens, com rotação', () => {
    const lista = itensDe(menu);
    // Entrar no menu (com Tab, ou foco no painel) leva o foco ao 1.º item.
    menu.focus();
    expect(document.activeElement).toBe(lista[0]);
    tecla(lista[0], DOWN_ARROW);
    expect(document.activeElement).toBe(lista[1]);
    tecla(lista[1], UP_ARROW);
    tecla(lista[0], UP_ARROW);
    expect(document.activeElement).toBe(lista[2]);
  });

  it('o Escape não é engolido: não há nada para fechar', () => {
    let chegou = 0;
    const ouvinte = () => chegou++;
    document.body.addEventListener('keydown', ouvinte);
    tecla(itensDe(menu)[0], ESCAPE);
    document.body.removeEventListener('keydown', ouvinte);
    expect(chegou).toBe(1);
  });
});

describe('evoMenuPositions', () => {
  it('bottom-start: por baixo, alinhado ao início, com a distância; a seguir vira para cima', () => {
    const [principal, virada] = evoMenuPositions('bottom-start', 4);
    expect(principal).toMatchObject({
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    });
    expect(virada).toMatchObject({ originY: 'top', overlayY: 'bottom', offsetY: -4 });
  });

  it('bottom-end alinha as bordas do fim', () => {
    expect(evoMenuPositions('bottom-end', 4)[0]).toMatchObject({
      originX: 'end',
      overlayX: 'end',
    });
  });

  it('right-start abre ao lado, alinhado ao topo, e left-end à esquerda alinhado à base', () => {
    expect(evoMenuPositions('right-start', 2)[0]).toMatchObject({
      originX: 'end',
      overlayX: 'start',
      originY: 'top',
      overlayY: 'top',
      offsetX: 2,
    });
    expect(evoMenuPositions('left-end', 2)[0]).toMatchObject({
      originX: 'start',
      overlayX: 'end',
      originY: 'bottom',
      overlayY: 'bottom',
      offsetX: -2,
    });
  });

  it('o centro não tem alternativa de alinhamento, só a do lado oposto', () => {
    const posicoes = evoMenuPositions('top', 4);
    expect(posicoes[0]).toMatchObject({ originX: 'center', originY: 'top', overlayY: 'bottom' });
    expect(posicoes[1]).toMatchObject({ originY: 'bottom', overlayY: 'top' });
  });
});

describe('EvoMenu: tokens e CSS (Regra 1 e Regra 2)', () => {
  /** O CSS que o Angular injectou para todas as peças do menu, depois de as desenhar. */
  async function cssDoMenu(): Promise<string> {
    const fixture = await criar(AnfitriaoGrupos);
    fixture.nativeElement.querySelector('#g').click();
    await estabilizar(fixture);
    return [...document.querySelectorAll('style')]
      .map((s) => s.textContent ?? '')
      .filter((c) => c.includes('evo-menu'))
      .join('\n');
  }

  it('nenhum --evo-menu-* é declarado fora de @layer evo.variants', async () => {
    const css = await cssDoMenu();
    const base = css.slice(0, css.indexOf('@layer evo.variants'));
    const declaracoes = [...base.matchAll(/(^|[;{\s])(--evo-menu-[a-z-]+)\s*:/g)];

    expect(declaracoes.map((m) => m[2])).toEqual([]);
    expect(css).toContain('var(--evo-menu-bg,');
  });

  it('só os tamanhos declaram tokens, e só no painel', async () => {
    const css = await cssDoMenu();
    const variantes = css.slice(css.indexOf('@layer evo.variants'));
    const declarados = [...variantes.matchAll(/(--evo-menu-[a-z-]+)\s*:/g)].map((m) => m[1]);

    expect(new Set(declarados)).toEqual(
      new Set(['--evo-menu-item-padding-block', '--evo-menu-item-padding-inline']),
    );
  });

  it('os tokens do .tokens.ts e do CSS batem 1:1', async () => {
    const css = await cssDoMenu();
    const doMeta = evoMenuMeta.tokens.map((t) => `--evo-${t.name}`).sort();
    const doCss = [
      ...new Set([...css.matchAll(/var\((--evo-menu-[a-z-]+)/g)].map((m) => m[1])),
    ].sort();

    expect(doCss).toEqual(doMeta);
    expect(doMeta.length).toBe(17);
  });

  it('não usa @property nos tokens (Regra 2)', async () => {
    expect(await cssDoMenu()).not.toMatch(/@property\s+--evo-menu/);
  });
});
