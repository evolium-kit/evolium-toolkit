import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { EvoSwitch } from './evo-switch';
import { evoSwitchMeta } from './switch.tokens';

@Component({
  imports: [EvoSwitch],
  template: `
    <evo-switch [(checked)]="ligado" [disabled]="desactivado()" ariaLabel="Notificações" />
  `,
})
class Anfitriao {
  readonly ligado = signal(false);
  readonly desactivado = signal(false);
}

@Component({
  imports: [EvoSwitch, ReactiveFormsModule],
  template: `<evo-switch [formControl]="controlo" ariaLabelledby="rotulo" />`,
})
class AnfitriaoForm {
  readonly controlo = new FormControl(true, { nonNullable: true });
}

describe('EvoSwitch', () => {
  let fixture: ComponentFixture<Anfitriao>;
  let host: HTMLElement;
  let botao: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitriao] }).compileComponents();
    fixture = TestBed.createComponent(Anfitriao);
    fixture.detectChanges();
    host = fixture.nativeElement.querySelector('evo-switch');
    botao = host.querySelector('button')!;
  });

  it('renderiza um botão com role switch, desligado por omissão', () => {
    expect(host.classList.contains('evo-switch')).toBe(true);
    expect(botao.getAttribute('role')).toBe('switch');
    expect(botao.getAttribute('type')).toBe('button');
    expect(botao.getAttribute('aria-checked')).toBe('false');
    expect(host.hasAttribute('data-evo-checked')).toBe(false);
  });

  it('passa o nome acessível ao botão interno, e só o que foi dado', () => {
    expect(botao.getAttribute('aria-label')).toBe('Notificações');
    expect(botao.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('o círculo é decorativo', () => {
    expect(botao.querySelector('.evo-switch__thumb')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('um clique liga e actualiza o [(checked)]', () => {
    botao.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.ligado()).toBe(true);
    expect(botao.getAttribute('aria-checked')).toBe('true');
    expect(host.hasAttribute('data-evo-checked')).toBe(true);
  });

  it('não deixa o data-evo-checked para trás ao desligar', () => {
    botao.click();
    fixture.detectChanges();
    botao.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.ligado()).toBe(false);
    expect(host.hasAttribute('data-evo-checked')).toBe(false);
  });

  it('o valor vindo do pai reflecte-se no DOM', () => {
    fixture.componentInstance.ligado.set(true);
    fixture.detectChanges();
    expect(botao.getAttribute('aria-checked')).toBe('true');
  });

  it('desactivado, não muda de estado', () => {
    fixture.componentInstance.desactivado.set(true);
    fixture.detectChanges();

    expect(botao.disabled).toBe(true);
    expect(host.hasAttribute('data-evo-disabled')).toBe(true);

    botao.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.ligado()).toBe(false);

    fixture.componentInstance.desactivado.set(false);
    fixture.detectChanges();
    expect(host.hasAttribute('data-evo-disabled')).toBe(false);
  });

  describe('com Reactive Forms', () => {
    let formFixture: ComponentFixture<AnfitriaoForm>;
    let formBotao: HTMLButtonElement;

    beforeEach(() => {
      formFixture = TestBed.createComponent(AnfitriaoForm);
      formFixture.detectChanges();
      formBotao = formFixture.nativeElement.querySelector('button');
    });

    it('lê o valor inicial do controlo', () => {
      expect(formBotao.getAttribute('aria-checked')).toBe('true');
      expect(formBotao.getAttribute('aria-labelledby')).toBe('rotulo');
    });

    it('escreve no controlo ao clicar, e marca-o como tocado ao sair', () => {
      const controlo = formFixture.componentInstance.controlo;
      formBotao.click();
      expect(controlo.value).toBe(false);
      expect(controlo.dirty).toBe(true);

      formBotao.dispatchEvent(new Event('blur'));
      expect(controlo.touched).toBe(true);
    });

    it('setValue no controlo actualiza o interruptor', () => {
      formFixture.componentInstance.controlo.setValue(false);
      formFixture.detectChanges();
      expect(formBotao.getAttribute('aria-checked')).toBe('false');
    });

    it('control.disable() desactiva de facto', () => {
      const controlo = formFixture.componentInstance.controlo;
      controlo.disable();
      formFixture.detectChanges();

      expect(formBotao.disabled).toBe(true);
      formBotao.click();
      expect(controlo.value).toBe(true);

      controlo.enable();
      formFixture.detectChanges();
      expect(formBotao.disabled).toBe(false);
    });
  });

  /** Regra 1 do CSS — ver button/evo-button.spec.ts para o porquê deste teste. */
  describe('regra 1: o CSS não declara os próprios tokens', () => {
    function cssDoComponente(): string {
      return [...document.querySelectorAll('style')]
        .map((s) => s.textContent ?? '')
        .filter((css) => css.includes('evo-switch__track'))
        .join('\n');
    }

    it('usa o fallback do var() para cada token dos metadados', () => {
      const css = cssDoComponente();
      expect(css).toContain('var(--evo-switch-bg,');
      expect(css).toContain('var(--evo-switch-bg-checked,');
      expect(css).toContain('var(--evo-switch-thumb-bg,');
      expect(css).toContain('var(--evo-switch-radius,');
      expect(css).toContain('var(--evo-switch-thumb-size,');
    });

    it('cada token dos metadados é consumido no CSS, e vice-versa', () => {
      const css = cssDoComponente();
      const noCss = new Set([...css.matchAll(/var\(--evo-(switch-[a-z-]+),/g)].map((m) => m[1]));
      const nosMetadados = new Set(evoSwitchMeta.tokens.map((t) => t.name));
      expect([...noCss].sort()).toEqual([...nosMetadados].sort());
    });

    it('não declara nenhum --evo-switch-*', () => {
      const declaracoes = [
        ...cssDoComponente().matchAll(/(^|[;{\s])(--evo-switch-[a-z-]+)\s*:/g),
      ].map((m) => m[2]);
      expect(declaracoes).toEqual([]);
    });
  });
});
