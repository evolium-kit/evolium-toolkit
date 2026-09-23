import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

export const evoBadgeMeta: EvoComponentMeta = {
  id: 'badge',
  label: 'Badge',
  category: 'Básicos',
  tags: ['etiqueta', 'estado', 'contador', 'tag'],
  variants: ['neutral', 'primary', 'success', 'warning', 'danger'],
  tokens: [
    {
      name: 'badge-bg',
      label: 'Cor de fundo',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
    },
    {
      name: 'badge-fg',
      label: 'Cor do texto',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'badge-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-full',
    },
    {
      name: 'badge-font-size',
      label: 'Tamanho do texto',
      type: 'length',
      min: 10,
      max: 20,
      unit: 'px',
      fallback: '--evo-font-size-sm',
    },
    {
      name: 'badge-font-weight',
      label: 'Peso do texto',
      type: 'select',
      options: ['400', '500', '600', '700'],
    },
  ],
};
