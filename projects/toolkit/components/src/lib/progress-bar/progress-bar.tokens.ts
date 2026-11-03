import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir no CSS, e vice-versa: o painel de
 * propriedades é gerado a partir desta lista.
 *
 * Registar com: provideEvoComponentMeta(evoProgressBarMeta)
 */
export const evoProgressBarMeta: EvoComponentMeta = {
  id: 'progress-bar',
  label: 'ProgressBar',
  category: 'Navegação',
  tags: ['progresso', 'carregamento', 'router', 'loading', 'nprogress'],
  tokens: [
    {
      name: 'progress-bar-height',
      label: 'Altura',
      type: 'length',
      min: 1,
      max: 16,
      unit: 'px',
      hint: 'Sem equivalente semântico — 8px por omissão.',
    },
    {
      name: 'progress-bar-color',
      label: 'Cor',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'progress-bar-duration',
      label: 'Duração da transição',
      type: 'number',
      min: 0,
      max: 1000,
      unit: 'ms',
      fallback: '--evo-duration-fast',
    },
    {
      name: 'progress-bar-z-index',
      label: 'Z-index',
      type: 'number',
      min: 1,
      max: 2147483647,
      hint: 'Sobe para ficar acima de um cabeçalho fixo próprio com z-index ainda mais alto.',
    },
    {
      name: 'progress-bar-glow-color',
      label: 'Cor do brilho (peg)',
      type: 'color',
      fallback: '--evo-progress-bar-color',
    },
    {
      name: 'progress-bar-indeterminate-duration',
      label: 'Duração do varrimento indeterminado',
      type: 'number',
      min: 200,
      max: 5000,
      unit: 'ms',
      hint: 'Duração de um ciclo da animação quando não há percentagem conhecida.',
    },
  ],
};
