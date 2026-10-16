import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoPagination, evoPageItems } from './evo-pagination';
import { provideEvoPaginationMessages } from './pagination.messages';
import { evoPaginationMeta } from './pagination.tokens';

@Component({
  imports: [EvoPagination],
  template: `
    <evo-pagination
      [(page)]="pagina"
      [(pageSize)]="porPagina"
      [length]="total()"
      [pageSizeOptions]="opcoes()"
      [showSummary]="resumo()"
      [hideSinglePage]="esconder()"
      [disabled]="desactivada()"
    />
  `,
})
class Anfitriao {
  readonly pagina = signal(1);
  readonly porPagina = signal(10);
  readonly total = signal(95);
  readonly opcoes = signal<number[]>([]);
  readonly resumo = signal(false);
  readonly esconder = signal(false);
  readonly desactivada = signal(false);
}

describe('evoPageItems', () => {
  it('mostra todas as páginas quando são poucas', () => {
    expect(evoPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('põe reticências nos buracos à volta da actual', () => {
    expect(evoPageItems(10, 20)).toEqual([1, 'gap', 9, 10, 11, 'gap', 20]);
  });

  it('um buraco de uma só página mostra a página, não "…"', () => {
    expect(evoPageItems(4, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 20]);
  });

  it('perto das pontas mantém o mesmo número de elementos', () => {
    expect(evoPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'gap', 20]);
    expect(evoPageItems(20, 20)).toEqual([1, 'gap', 16, 17, 18, 19, 20]);
    expect(evoPageItems(17, 20)).toEqual([1, 'gap', 16, 17, 18, 19, 20]);
  });

  it('respeita vizinhos e extremos', () => {
    expect(evoPageItems(10, 20, 2, 2)).toEqual([1, 2, 'gap', 8, 9, 10, 11, 12, 'gap', 19, 20]);
  });

  it('sem páginas, nada', () => {
    expect(evoPageItems(1, 0)).toEqual([]);
  });
});

describe('EvoPagination', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let host: HTMLElement;

  const botoes = () => [...host.querySelectorAll<HTMLButtonElement>('.evo-pagination__item')];
  const anterior = () => botoes()[0];
  const seguinte = () => botoes().at(-1)!;
  const actual = () => host.querySelector('[aria-current="page"]');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitriao] }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    fixture.detectChanges();
    host = fixture.nativeElement.querySelector('evo-pagination');
  });

  it('renderiza um nav com nome acessível e a página actual marcada', () => {
    expect(host.classList.contains('evo-pagination')).toBe(true);
    expect(host.querySelector('nav')?.getAttribute('aria-label')).toBe('Paginação');
    expect(actual()?.textContent?.trim()).toBe('1');
    expect(actual()?.getAttribute('aria-label')).toBe('Página 1');
    expect(anterior().getAttribute('aria-label')).toBe('Página anterior');
    expect(anterior().disabled).toBe(true);
    expect(seguinte().disabled).toBe(false);
  });

  it('clicar numa página actualiza o [(page)] e move o aria-current', () => {
    botoes()
      .find((b) => b.textContent?.trim() === '3')!
      .click();
    fixture.detectChanges();

    expect(fixture.componentInstance.pagina()).toBe(3);
    expect(actual()?.textContent?.trim()).toBe('3');
    expect(host.querySelectorAll('[aria-current]').length).toBe(1);
  });

  it('anterior e seguinte andam uma página, e param nos extremos', () => {
    seguinte().click();
    fixture.detectChanges();
    expect(fixture.componentInstance.pagina()).toBe(2);

    fixture.componentInstance.pagina.set(10);
    fixture.detectChanges();
    expect(seguinte().disabled).toBe(true);
    anterior().click();
    fixture.detectChanges();
    expect(fixture.componentInstance.pagina()).toBe(9);
  });

  it('uma página para lá do total mostra-se como a última', () => {
    fixture.componentInstance.pagina.set(50);
    fixture.detectChanges();
    expect(actual()?.textContent?.trim()).toBe('10');
  });

  it('mostra o resumo com showSummary', () => {
    expect(host.querySelector('.evo-pagination__summary')).toBeNull();
    fixture.componentInstance.resumo.set(true);
    fixture.componentInstance.pagina.set(10);
    fixture.detectChanges();
    expect(host.querySelector('.evo-pagination__summary')?.textContent?.trim()).toBe(
      'A mostrar 91–95 de 95',
    );
  });

  it('o selector de linhas por página muda o tamanho e volta à página 1', () => {
    fixture.componentInstance.pagina.set(4);
    fixture.componentInstance.opcoes.set([10, 25, 50]);
    fixture.detectChanges();

    const select = host.querySelector('select')!;
    expect(select.classList.contains('evo-input')).toBe(true);
    select.value = '25';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.porPagina()).toBe(25);
    expect(fixture.componentInstance.pagina()).toBe(1);
  });

  it('hideSinglePage esconde os botões quando só há uma página', () => {
    fixture.componentInstance.total.set(5);
    fixture.componentInstance.esconder.set(true);
    fixture.detectChanges();
    expect(host.querySelector('.evo-pagination__pages')).toBeNull();
  });

  it('desactivada: todos os botões ficam inactivos e o atributo sai ao reactivar', () => {
    fixture.componentInstance.desactivada.set(true);
    fixture.detectChanges();
    expect(botoes().every((b) => b.disabled)).toBe(true);
    expect(host.hasAttribute('data-evo-disabled')).toBe(true);

    fixture.componentInstance.desactivada.set(false);
    fixture.detectChanges();
    expect(host.hasAttribute('data-evo-disabled')).toBe(false);
  });

  it('as mensagens são sobreponíveis', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Anfitriao],
      providers: [provideEvoPaginationMessages({ label: 'Páginas', page: (n) => `Ir para ${n}` })],
    }).compileComponents();
    const f = TestBed.createComponent(Anfitriao);
    f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('Páginas');
    expect(el.querySelector('[aria-current]')?.getAttribute('aria-label')).toBe('Ir para 1');
  });

  describe('regra 1: o CSS não declara os próprios tokens', () => {
    const css = () =>
      [...document.querySelectorAll('style')]
        .map((s) => s.textContent ?? '')
        .filter((c) => c.includes('evo-pagination__item'))
        .join('\n');

    it('não declara nenhum --evo-pagination-*', () => {
      expect([...css().matchAll(/(^|[;{\s])(--evo-pagination-[a-z-]+)\s*:/g)]).toEqual([]);
    });

    it('cada token dos metadados é lido pelo CSS, e vice-versa', () => {
      const lidos = new Set(
        [...css().matchAll(/var\(--evo-(pagination-[a-z-]+)/g)].map((m) => m[1]),
      );
      expect([...lidos].sort()).toEqual(evoPaginationMeta.tokens.map((t) => t.name).sort());
    });
  });
});
