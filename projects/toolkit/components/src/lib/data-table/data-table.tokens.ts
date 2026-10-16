import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir em data-table.css, e vice-versa: o painel de
 * propriedades é gerado a partir desta lista. A paginação tem os seus
 * (`--evo-pagination-*`), a pesquisa herda os do `evo-text-field`.
 */
export const evoDataTableMeta: EvoComponentMeta = {
  id: 'data-table',
  label: 'Data table',
  category: 'Superfícies',
  tags: ['tabela', 'grelha', 'lista', 'paginação', 'pesquisa', 'ordenação', 'dados'],
  sizes: ['sm', 'md', 'lg'],
  tokens: [
    // Caixa
    { name: 'data-table-bg', label: 'Fundo', type: 'color', fallback: '--evo-color-surface' },
    {
      name: 'data-table-border-color',
      label: 'Borda externa',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'data-table-border-width',
      label: 'Espessura da borda externa',
      type: 'length',
      min: 0,
      max: 6,
      unit: 'px',
      fallback: '--evo-border-width',
      hint: '0 tira a borda à volta da tabela.',
    },
    {
      name: 'data-table-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 32,
      unit: 'px',
      fallback: '--evo-radius-lg',
    },
    { name: 'data-table-shadow', label: 'Sombra', type: 'shadow', fallback: '--evo-elevation-1' },

    // Linhas
    {
      name: 'data-table-row-border-color',
      label: 'Separador das linhas',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'data-table-row-border-width',
      label: 'Espessura do separador',
      type: 'length',
      min: 0,
      max: 6,
      unit: 'px',
      fallback: '--evo-border-width',
      hint: 'Também separa a barra de cima e o rodapé. 0 tira os separadores.',
    },
    {
      name: 'data-table-row-hover-bg',
      label: 'Fundo da linha (hover)',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
    },
    {
      name: 'data-table-row-selected-bg',
      label: 'Fundo da linha seleccionada / expandida',
      type: 'color',
      fallback: '--evo-color-primary-soft',
    },
    {
      name: 'data-table-row-striped-bg',
      label: 'Fundo das linhas pares (zebra)',
      type: 'color',
      hint: 'Transparente por omissão (sem zebra).',
    },
    {
      name: 'data-table-cell-padding-x',
      label: 'Espaçamento horizontal das células',
      type: 'length',
      min: 0,
      max: 48,
      unit: 'px',
      fallback: '--evo-space-lg',
    },
    {
      name: 'data-table-cell-padding-y',
      label: 'Espaçamento vertical das células',
      type: 'length',
      min: 0,
      max: 32,
      unit: 'px',
      fallback: '--evo-space-md',
      hint: 'O tamanho sm usa metade, o lg uma vez e meia.',
    },

    // Zonas e texto
    {
      name: 'data-table-header-bg',
      label: 'Fundo do cabeçalho e da barra',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
    },
    {
      name: 'data-table-header-fg',
      label: 'Texto do cabeçalho',
      type: 'color',
      fallback: '--evo-color-on-surface',
    },
    {
      name: 'data-table-footer-bg',
      label: 'Fundo do rodapé',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
    },
    { name: 'data-table-fg', label: 'Texto', type: 'color', fallback: '--evo-color-on-surface' },
    {
      name: 'data-table-fg-muted',
      label: 'Texto secundário',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
      hint: 'Estado vazio, erro e rodapé.',
    },
    {
      name: 'data-table-skeleton-bg',
      label: 'Esqueleto (a carregar)',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'data-table-progress-color',
      label: 'Barra de recarregamento',
      type: 'color',
      fallback: '--evo-color-primary',
    },
  ],
};
