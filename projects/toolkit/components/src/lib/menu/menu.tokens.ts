import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir em menu.css, e vice-versa: o painel de
 * propriedades é gerado a partir desta lista.
 */
export const evoMenuMeta: EvoComponentMeta = {
  id: 'menu',
  label: 'Menu',
  category: 'Superfícies',
  tags: ['menu', 'dropdown', 'contexto', 'submenu', 'acções', 'barra de menus'],
  sizes: ['sm', 'md', 'lg'],
  tokens: [
    // Caixa do painel
    {
      name: 'menu-bg',
      label: 'Fundo do painel',
      type: 'color',
      fallback: '--evo-color-surface-raised',
    },
    {
      name: 'menu-border-color',
      label: 'Cor da borda',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'menu-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-radius-md',
    },
    { name: 'menu-shadow', label: 'Sombra', type: 'shadow', fallback: '--evo-elevation-2' },
    {
      name: 'menu-min-width',
      label: 'Largura mínima',
      type: 'length',
      min: 96,
      max: 480,
      unit: 'px',
      hint: 'Largura mínima do painel (144px por omissão). Cresce com o conteúdo.',
    },
    {
      name: 'menu-padding',
      label: 'Respiro do painel',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-space-xs',
    },
    // Itens
    {
      name: 'menu-item-fg',
      label: 'Cor do texto dos itens',
      type: 'color',
      fallback: '--evo-color-on-surface',
    },
    {
      name: 'menu-item-hover-bg',
      label: 'Fundo do item destacado',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
      hint: 'O item com o foco, ou debaixo do rato, ou cujo submenu está aberto.',
    },
    {
      name: 'menu-item-selected-bg',
      label: 'Fundo do item actual',
      type: 'color',
      fallback: '--evo-color-primary-soft',
      hint: 'O item com `selected` (`aria-current`).',
    },
    {
      name: 'menu-item-selected-fg',
      label: 'Texto do item actual',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'menu-item-padding-block',
      label: 'Respiro vertical do item',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      fallback: '--evo-space-sm',
      hint: 'Os tamanhos sm e lg definem o seu próprio valor.',
    },
    {
      name: 'menu-item-padding-inline',
      label: 'Respiro lateral do item',
      type: 'length',
      min: 0,
      max: 32,
      unit: 'px',
      fallback: '--evo-space-md',
    },
    // Grupos e separadores
    {
      name: 'menu-separator-color',
      label: 'Cor do separador',
      type: 'color',
      fallback: '--evo-color-border',
    },
    {
      name: 'menu-group-label-fg',
      label: 'Texto do cabeçalho de grupo',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    // Barra de menus
    {
      name: 'menu-bar-bg',
      label: 'Fundo da barra',
      type: 'color',
      fallback: '--evo-color-surface',
    },
    {
      name: 'menu-bar-item-active-bg',
      label: 'Entrada da barra com o menu aberto',
      type: 'color',
      fallback: '--evo-color-surface-sunken',
    },
    // Movimento
    {
      name: 'menu-duration',
      label: 'Duração da entrada',
      type: 'number',
      min: 0,
      max: 1000,
      step: 10,
      unit: 'ms',
      fallback: '--evo-duration-fast',
      hint: 'Com `prefers-reduced-motion` não há animação.',
    },
  ],
};
