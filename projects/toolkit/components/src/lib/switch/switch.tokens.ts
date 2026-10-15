import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir em switch.css, e vice-versa: o painel de
 * propriedades é gerado a partir desta lista.
 */
export const evoSwitchMeta: EvoComponentMeta = {
  id: 'switch',
  label: 'Switch',
  category: 'Formulário',
  tags: ['interruptor', 'toggle', 'ligar', 'desligar', 'checkbox'],
  tokens: [
    {
      name: 'switch-bg',
      label: 'Fundo (desligado)',
      type: 'color',
      fallback: '--evo-color-border-strong',
    },
    {
      name: 'switch-bg-checked',
      label: 'Fundo (ligado)',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'switch-thumb-bg',
      label: 'Cor do círculo',
      type: 'color',
      fallback: '--evo-color-on-primary',
    },
    {
      name: 'switch-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-full',
      hint: 'Aplica-se ao fundo e ao círculo. 0 dá um interruptor quadrado; metade da altura ou mais, redondo.',
    },
    {
      name: 'switch-thumb-size',
      label: 'Tamanho do círculo',
      type: 'length',
      min: 12,
      max: 40,
      unit: 'px',
      hint: 'Diâmetro do círculo (20px por omissão). O fundo cresce com ele, mantendo a proporção.',
    },
  ],
};
