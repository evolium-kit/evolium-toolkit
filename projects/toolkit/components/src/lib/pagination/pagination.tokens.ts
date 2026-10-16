import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir em pagination.css, e vice-versa: o painel de
 * propriedades é gerado a partir desta lista.
 */
export const evoPaginationMeta: EvoComponentMeta = {
  id: 'pagination',
  label: 'Pagination',
  category: 'Básicos',
  tags: ['paginação', 'páginas', 'navegação', 'tabela', 'lista'],
  sizes: ['sm', 'md', 'lg'],
  tokens: [
    {
      name: 'pagination-item-size',
      label: 'Tamanho dos botões',
      type: 'length',
      min: 20,
      max: 56,
      unit: 'px',
      hint: 'Altura e largura mínima de cada página (32px por omissão). O alvo de toque é sempre de pelo menos 44px.',
    },
    {
      name: 'pagination-item-radius',
      label: 'Raio dos botões',
      type: 'length',
      min: 0,
      max: 28,
      unit: 'px',
      fallback: '--evo-radius-full',
    },
    {
      name: 'pagination-item-border-color',
      label: 'Borda dos botões',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'pagination-item-fg',
      label: 'Texto dos botões',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'pagination-item-bg-active',
      label: 'Fundo da página actual',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'pagination-item-fg-active',
      label: 'Texto da página actual',
      type: 'color',
      fallback: '--evo-color-on-primary',
    },
  ],
};
