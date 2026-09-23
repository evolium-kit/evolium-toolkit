import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

export const evoCardMeta: EvoComponentMeta = {
  id: 'card',
  label: 'Card',
  category: 'Superfícies',
  tags: ['painel', 'caixa', 'superfície', 'cartão'],
  variants: ['plain', 'sunken', 'outlined'],
  tokens: [
    { name: 'card-bg', label: 'Cor de fundo', type: 'color', fallback: '--evo-color-surface' },
    { name: 'card-fg', label: 'Cor do texto', type: 'color', fallback: '--evo-color-on-surface' },
    {
      name: 'card-border-color',
      label: 'Cor da borda',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'card-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 32,
      unit: 'px',
      fallback: '--evo-radius-lg',
    },
    {
      name: 'card-padding',
      label: 'Espaçamento interno',
      type: 'length',
      min: 0,
      max: 48,
      unit: 'px',
      fallback: '--evo-space-md',
    },
    {
      name: 'card-shadow',
      label: 'Sombra',
      type: 'shadow',
      hint: 'O flat design usa borda em vez de sombra; por omissão é none.',
    },
  ],
};
