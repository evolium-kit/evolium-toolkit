import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir no CSS, e vice-versa: o painel de
 * propriedades e gerado a partir desta lista, portanto um token em falta e um
 * token que ninguem consegue editar pela interface.
 *
 * Registar com: provideEvoComponentMeta(evoFormFieldMeta)
 */
export const evoFormFieldMeta: EvoComponentMeta = {
  id: 'form-field',
  label: 'FormField',
  category: 'Básicos',
  tags: ['form-field'],
  tokens: [
    {
      name: 'form-field-bg',
      label: 'Cor de fundo',
      type: 'color',
      fallback: '--evo-color-surface',
    },
    {
      name: 'form-field-fg',
      label: 'Cor do texto',
      type: 'color',
      fallback: '--evo-color-on-surface',
    },
    {
      name: 'form-field-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-md',
    },
  ],
};
