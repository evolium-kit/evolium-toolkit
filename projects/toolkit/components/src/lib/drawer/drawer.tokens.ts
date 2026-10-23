import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir no CSS (drawer.css, drawer-container.css ou
 * a secção do drawer em styles/evolium-components.css), e vice-versa: o
 * painel de propriedades é gerado a partir desta lista.
 *
 * Os botões das acções não têm tokens próprios: herdam os `--evo-button-*`.
 */
export const evoDrawerMeta: EvoComponentMeta = {
  id: 'drawer',
  label: 'Drawer',
  category: 'Superfícies',
  tags: ['drawer', 'painel', 'sheet', 'sidebar', 'lateral'],
  sizes: ['sm', 'md', 'lg', 'full'],
  tokens: [
    // Caixa
    {
      name: 'drawer-bg',
      label: 'Cor de fundo',
      type: 'color',
      fallback: '--evo-color-surface-raised',
    },
    { name: 'drawer-fg', label: 'Cor do texto', type: 'color', fallback: '--evo-color-on-surface' },
    { name: 'drawer-shadow', label: 'Sombra', type: 'shadow', fallback: '--evo-elevation-2' },
    {
      name: 'drawer-padding',
      label: 'Espaçamento interno',
      type: 'length',
      min: 0,
      max: 64,
      unit: 'px',
      fallback: '--evo-space-lg',
    },
    // Bordas
    {
      name: 'drawer-divider-color',
      label: 'Linha entre zonas',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'drawer-border-color',
      label: 'Cor da borda',
      type: 'color',
      hint: 'Por omissão, transparente (sem borda visível).',
    },
    // Largura (posição left/right)
    {
      name: 'drawer-width-sm',
      label: 'Largura (sm)',
      type: 'length',
      min: 200,
      max: 1200,
      unit: 'px',
      hint: 'Com position="left"/"right". Por omissão, 20rem.',
    },
    {
      name: 'drawer-width-md',
      label: 'Largura (md)',
      type: 'length',
      min: 200,
      max: 1200,
      unit: 'px',
      hint: 'Com position="left"/"right". Por omissão, 28rem.',
    },
    {
      name: 'drawer-width-lg',
      label: 'Largura (lg)',
      type: 'length',
      min: 200,
      max: 1200,
      unit: 'px',
      hint: 'Com position="left"/"right". Por omissão, 40rem.',
    },
    // Altura (posição top/bottom)
    {
      name: 'drawer-height-sm',
      label: 'Altura (sm)',
      type: 'length',
      min: 160,
      max: 1200,
      unit: 'px',
      hint: 'Com position="top"/"bottom". Por omissão, 16rem.',
    },
    {
      name: 'drawer-height-md',
      label: 'Altura (md)',
      type: 'length',
      min: 160,
      max: 1200,
      unit: 'px',
      hint: 'Com position="top"/"bottom". Por omissão, 24rem.',
    },
    {
      name: 'drawer-height-lg',
      label: 'Altura (lg)',
      type: 'length',
      min: 160,
      max: 1200,
      unit: 'px',
      hint: 'Com position="top"/"bottom". Por omissão, 36rem.',
    },
    // Fundo e movimento
    {
      name: 'drawer-backdrop',
      label: 'Cor do fundo da página',
      type: 'color',
      hint: 'Por omissão, a cor do texto a 40% de opacidade.',
    },
    {
      name: 'drawer-backdrop-blur',
      label: 'Desfoque do fundo',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      hint: 'Por omissão, 0 (sem desfoque).',
    },
    {
      name: 'drawer-duration',
      label: 'Duração da entrada',
      type: 'number',
      min: 0,
      max: 1000,
      step: 10,
      unit: 'ms',
      fallback: '--evo-duration-fast',
      hint: 'Sem animação com prefers-reduced-motion.',
    },
    // Textos
    {
      name: 'drawer-title-size',
      label: 'Tamanho do título',
      type: 'length',
      min: 12,
      max: 40,
      unit: 'px',
      fallback: '--evo-font-size-lg',
    },
    {
      name: 'drawer-description-color',
      label: 'Cor da descrição',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    // Botão fechar
    {
      name: 'drawer-close-color',
      label: 'Botão ×',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'drawer-close-color-hover',
      label: 'Botão × (hover)',
      type: 'color',
      fallback: '--evo-color-on-surface',
    },
  ],
};
