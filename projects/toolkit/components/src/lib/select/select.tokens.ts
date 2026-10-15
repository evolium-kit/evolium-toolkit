import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir em select.css, e vice-versa. O gatilho
 * (fundo, borda, raio, altura) não tem tokens próprios: herda os
 * `--evo-input-*`, editáveis no painel do Input. Os tokens de estado caem
 * primeiro nos `--evo-text-field-*` equivalentes.
 */
export const evoSelectMeta: EvoComponentMeta = {
  id: 'select',
  label: 'Select',
  category: 'Formulário',
  tags: ['lista', 'escolha', 'dropdown', 'combobox', 'formulário', 'pesquisa', 'múltipla'],
  sizes: ['sm', 'md', 'lg'],
  tokens: [
    // ------------------------------------------------------------- estados
    {
      name: 'select-focus-border-color',
      label: 'Borda com foco',
      type: 'color',
      fallback: '--evo-color-primary',
      hint: 'Herda primeiro de text-field-focus-border-color.',
    },
    {
      name: 'select-focus-ring-color',
      label: 'Anel de foco',
      type: 'color',
      fallback: '--evo-focus-ring-color',
      hint: 'Herda primeiro de text-field-focus-ring-color.',
    },
    {
      name: 'select-error-ring-color',
      label: 'Anel de erro',
      type: 'color',
      fallback: '--evo-color-danger-soft',
      hint: 'Herda primeiro de text-field-error-ring-color.',
    },
    {
      name: 'select-ring-width',
      label: 'Espessura dos anéis',
      type: 'length',
      min: 0,
      max: 6,
      unit: 'px',
      fallback: '--evo-focus-ring-width',
      hint: 'Anel de foco e de erro. Herda primeiro de text-field-ring-width.',
    },
    {
      name: 'select-ring-offset',
      label: 'Afastamento dos anéis',
      type: 'length',
      min: -4,
      max: 6,
      unit: 'px',
      hint: '0 por omissão. Herda primeiro de text-field-ring-offset.',
    },
    {
      name: 'select-disabled-bg',
      label: 'Fundo desactivado',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
    },
    {
      name: 'select-placeholder-fg',
      label: 'Cor do placeholder',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'select-optional-fg',
      label: 'Cor do "(opcional)"',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'select-required-fg',
      label: 'Cor do asterisco',
      type: 'color',
      fallback: '--evo-color-danger',
    },
    // -------------------------------------------------------------- painel
    {
      name: 'select-panel-bg',
      label: 'Fundo do painel',
      type: 'color',
      fallback: '--evo-color-surface-raised',
    },
    {
      name: 'select-panel-border-color',
      label: 'Borda do painel',
      type: 'color',
      fallback: '--evo-color-border',
      hint: 'Também as divisórias da pesquisa e do "Seleccionar todos".',
    },
    {
      name: 'select-panel-radius',
      label: 'Raio do painel',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-md',
    },
    {
      name: 'select-panel-shadow',
      label: 'Sombra do painel',
      type: 'shadow',
      hint: 'Valor de box-shadow. Por omissão, 0 8px 24px com 16% da cor do texto.',
    },
    {
      name: 'select-panel-max-height',
      label: 'Altura máxima do painel',
      type: 'length',
      min: 120,
      max: 640,
      unit: 'px',
      hint: '18rem (288px) por omissão. A pesquisa fica fixa; a lista faz scroll.',
    },
    {
      name: 'select-panel-offset',
      label: 'Distância ao gatilho',
      type: 'length',
      min: 0,
      max: 16,
      unit: 'px',
      fallback: '--evo-space-xs',
    },
    {
      name: 'select-panel-padding',
      label: 'Espaço interior do painel',
      type: 'length',
      min: 0,
      max: 16,
      unit: 'px',
      fallback: '--evo-space-xs',
    },
    // -------------------------------------------------------------- opções
    {
      name: 'select-option-hover-bg',
      label: 'Fundo da opção activa',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
      hint: 'Rato por cima, ou destacada pelo teclado.',
    },
    {
      name: 'select-option-selected-fg',
      label: 'Texto da opção escolhida',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'select-option-selected-bg',
      label: 'Fundo da opção escolhida',
      type: 'color',
      fallback: '--evo-color-primary-soft',
    },
    {
      name: 'select-option-padding-block',
      label: 'Espaço vertical das opções',
      type: 'length',
      min: 0,
      max: 20,
      unit: 'px',
      fallback: '--evo-space-sm',
    },
    {
      name: 'select-option-padding-inline',
      label: 'Espaço horizontal das opções',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-space-sm',
    },
    {
      name: 'select-icon-fg',
      label: 'Cor dos ícones',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
      hint: 'Seta, × e indicador de carregamento. Herda primeiro de text-field-icon-fg.',
    },
    {
      name: 'select-icon-size',
      label: 'Tamanho dos ícones',
      type: 'length',
      min: 12,
      max: 32,
      unit: 'px',
      hint: '18px por omissão. Também os ícones e o visto das opções.',
    },
    {
      name: 'select-check-fg',
      label: 'Cor do visto',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'select-group-label-fg',
      label: 'Cor dos cabeçalhos de grupo',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'select-sublabel-fg',
      label: 'Cor da segunda linha',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
  ],
};
