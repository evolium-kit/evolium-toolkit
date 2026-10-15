import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir em text-field.css, e vice-versa. A caixa
 * (fundo, borda, raio, altura) não tem tokens próprios: herda os
 * `--evo-input-*`, editáveis no painel do Input.
 */
export const evoTextFieldMeta: EvoComponentMeta = {
  id: 'text-field',
  label: 'Text Field',
  category: 'Formulário',
  tags: ['campo', 'texto', 'input', 'formulário', 'senha', 'textarea'],
  sizes: ['sm', 'md', 'lg'],
  tokens: [
    {
      name: 'text-field-focus-border-color',
      label: 'Borda com foco',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'text-field-focus-ring-color',
      label: 'Anel de foco',
      type: 'color',
      fallback: '--evo-focus-ring-color',
    },
    {
      name: 'text-field-error-ring-color',
      label: 'Anel de erro',
      type: 'color',
      fallback: '--evo-color-danger-soft',
    },
    {
      name: 'text-field-ring-width',
      label: 'Espessura dos anéis',
      type: 'length',
      min: 0,
      max: 6,
      unit: 'px',
      fallback: '--evo-focus-ring-width',
      hint: 'Aplica-se ao anel de foco e ao de erro.',
    },
    {
      name: 'text-field-ring-offset',
      label: 'Afastamento dos anéis',
      type: 'length',
      min: -4,
      max: 6,
      unit: 'px',
      hint: '0 por omissão: o anel encosta à borda. Negativo desenha-o por dentro.',
    },
    {
      name: 'text-field-disabled-bg',
      label: 'Fundo desactivado',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
    },
    {
      name: 'text-field-optional-fg',
      label: 'Cor do "(opcional)"',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'text-field-required-fg',
      label: 'Cor do asterisco',
      type: 'color',
      fallback: '--evo-color-danger',
    },
    {
      name: 'text-field-icon-fg',
      label: 'Cor dos ícones',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
      hint: 'Ícones projectados e botões internos (senha, limpar).',
    },
    {
      name: 'text-field-icon-size',
      label: 'Tamanho dos ícones',
      type: 'length',
      min: 12,
      max: 32,
      unit: 'px',
      hint: '18px por omissão.',
    },
    {
      name: 'text-field-icon-gap',
      label: 'Espaço dos ícones',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-space-sm',
    },
  ],
};
