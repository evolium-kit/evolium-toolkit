import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir no CSS, e vice-versa: o painel de
 * propriedades é gerado a partir desta lista, portanto um token em falta é um
 * token que ninguém consegue editar pela interface.
 *
 * Registar com: provideEvoComponentMeta(evoTabsMeta)
 */
export const evoTabsMeta: EvoComponentMeta = {
  id: 'tabs',
  label: 'Tabs',
  category: 'Básicos',
  tags: ['tabs', 'navegação'],
  sizes: ['sm', 'md', 'lg'],
  tokens: [
    {
      name: 'tabs-gap',
      label: 'Espaço entre tabs',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-space-sm',
    },
    {
      name: 'tabs-list-border-color',
      label: 'Linha da lista',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'tabs-indicator-color',
      label: 'Cor do indicador',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'tabs-indicator-thickness',
      label: 'Espessura do indicador',
      type: 'length',
      min: 1,
      max: 8,
      unit: 'px',
      fallback: '2px',
    },
    {
      name: 'tabs-indicator-radius',
      label: 'Cantos do indicador',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-full',
    },
    {
      name: 'tabs-indicator-duration',
      label: 'Duração da transição',
      type: 'length',
      min: 0,
      max: 600,
      unit: 'ms',
      fallback: '--evo-duration-fast',
    },
    {
      name: 'tabs-tab-fg',
      label: 'Texto (não seleccionada)',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'tabs-tab-fg-selected',
      label: 'Texto (seleccionada)',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'tabs-tab-bg-hover',
      label: 'Fundo em hover',
      type: 'color',
      fallback: '--evo-color-primary-soft',
    },
    {
      name: 'tabs-tab-padding-x',
      label: 'Espaçamento horizontal da tab',
      type: 'length',
      min: 0,
      max: 48,
      unit: 'px',
      fallback: '--evo-space-md',
    },
    {
      name: 'tabs-tab-padding-y',
      label: 'Espaçamento vertical da tab',
      type: 'length',
      min: 0,
      max: 32,
      unit: 'px',
      fallback: '--evo-space-sm',
    },
    {
      name: 'tabs-tab-disabled-opacity',
      label: 'Opacidade desactivada',
      type: 'number',
      min: 0,
      max: 1,
      step: 0.1,
      fallback: '0.5',
    },
    {
      name: 'tabs-panel-padding',
      label: 'Espaço interno do painel',
      type: 'length',
      min: 0,
      max: 48,
      unit: 'px',
      fallback: '--evo-space-md',
    },
  ],
};
