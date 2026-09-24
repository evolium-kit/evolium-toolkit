import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados do botão para o Theme Studio.
 *
 * Cada token aqui declarado tem de existir no `button.css`, e vice-versa: o
 * painel de propriedades é gerado a partir desta lista, portanto um token que
 * falte aqui é um token que ninguém consegue editar pela interface.
 */
export const evoButtonMeta: EvoComponentMeta = {
  id: 'button',
  label: 'Button',
  category: 'Básicos',
  tags: ['acção', 'formulário', 'cta', 'botão'],
  variants: ['solid', 'ghost', 'outline', 'danger'] as const,
  sizes: ['sm', 'md', 'lg'],
  tokens: [
    {
      name: 'button-bg',
      label: 'Cor de fundo',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'button-fg',
      label: 'Cor do texto',
      type: 'color',
      fallback: '--evo-color-on-primary',
    },
    {
      name: 'button-bg-hover',
      label: 'Fundo ao passar',
      type: 'color',
      fallback: '--evo-color-primary-hover',
    },
    {
      name: 'button-border-color',
      label: 'Cor da borda',
      type: 'color',
      hint: 'Transparente por omissão; usada pela variante outline.',
    },
    {
      name: 'button-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-md',
    },
    {
      name: 'button-height',
      label: 'Altura',
      type: 'length',
      min: 24,
      max: 56,
      unit: 'px',
    },
    {
      name: 'button-padding-inline',
      label: 'Espaço lateral',
      type: 'length',
      min: 0,
      max: 48,
      unit: 'px',
      fallback: '--evo-space-md',
    },
    {
      name: 'button-font-weight',
      label: 'Peso do texto',
      type: 'select',
      options: ['400', '500', '600', '700'],
    },
  ],
};
