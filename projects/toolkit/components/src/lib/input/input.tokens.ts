import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

export const evoInputMeta: EvoComponentMeta = {
  id: 'input',
  label: 'Input',
  category: 'Formulário',
  tags: ['campo', 'texto', 'formulário', 'entrada'],
  sizes: ['sm', 'md', 'lg'],
  tokens: [
    { name: 'input-bg', label: 'Cor de fundo', type: 'color', fallback: '--evo-color-surface' },
    { name: 'input-fg', label: 'Cor do texto', type: 'color', fallback: '--evo-color-on-surface' },
    {
      name: 'input-border-color',
      label: 'Cor da borda',
      type: 'color',
      fallback: '--evo-color-border-strong',
      hint: 'Precisa de 3:1 contra o fundo (WCAG 1.4.11): é o limite de um controlo.',
    },
    {
      name: 'input-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-md',
    },
    { name: 'input-height', label: 'Altura', type: 'length', min: 24, max: 56, unit: 'px' },
  ],
};
