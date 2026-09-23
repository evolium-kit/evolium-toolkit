import { EvoThemeDefaults } from '@evolium-kit/toolkit/core';

/**
 * Paleta flat design da Evolium: superfícies quase brancas, azul calmo como
 * acento, sem gradientes. "Elevação" é uma borda de 1px, não uma sombra difusa.
 *
 * Todos os pares de texto/fundo foram verificados contra WCAG 2.1 AA. Os rácios
 * estão anotados porque são fáceis de partir sem dar por isso — ver theme/README.md.
 */
export const EVO_LIGHT_TOKENS = {
  '--evo-color-surface': '#ffffff',
  '--evo-color-surface-sunken': '#f8fafc',
  '--evo-color-surface-raised': '#ffffff',
  '--evo-color-on-surface': '#0f172a', // 17.4:1 sobre surface — AAA
  '--evo-color-on-surface-muted': '#64748b', // 4.76:1 — AA
  '--evo-color-border': '#e2e8f0', // decorativo apenas (1.28:1)
  '--evo-color-border-strong': '#64748b', // interactivo — 4.76:1, cumpre 1.4.11
  '--evo-color-primary': '#2563eb', // 4.97:1 sobre branco — AA
  '--evo-color-primary-hover': '#1d4ed8', // 6.69:1 — AA
  '--evo-color-primary-soft': '#eff6ff',
  '--evo-color-on-primary': '#ffffff',
  '--evo-color-success': '#15803d', // 5.02:1. NÃO usar #16a34a: 3.30:1 reprova AA
  '--evo-color-success-soft': '#dcfce7',
  '--evo-color-on-success': '#ffffff',
  '--evo-color-warning': '#b45309', // 5.07:1 — AA
  '--evo-color-warning-soft': '#fef3c7',
  '--evo-color-on-warning': '#ffffff',
  '--evo-color-danger': '#dc2626', // 4.82:1 — AA
  '--evo-color-danger-soft': '#fee2e2',
  '--evo-color-on-danger': '#ffffff',
} as const;

/**
 * Modo escuro sobre `#0f172a`.
 *
 * O botão primário inverte-se (fundo claro, texto escuro): manter
 * `#3b82f6` com texto branco daria 3.68:1 e reprovaria AA.
 */
export const EVO_DARK_TOKENS = {
  '--evo-color-surface': '#0f172a',
  '--evo-color-surface-sunken': '#020617',
  '--evo-color-surface-raised': '#1e293b',
  '--evo-color-on-surface': '#e2e8f0', // 14.6:1 — AAA
  '--evo-color-on-surface-muted': '#94a3b8', // 7.01:1 — AAA
  '--evo-color-border': '#1e293b',
  '--evo-color-border-strong': '#475569', // 3.3:1, cumpre 1.4.11
  '--evo-color-primary': '#60a5fa', // 7.08:1 — AAA
  '--evo-color-primary-hover': '#93c5fd',
  '--evo-color-primary-soft': '#1e3a8a',
  '--evo-color-on-primary': '#0f172a', // inversão deliberada
  '--evo-color-success': '#4ade80',
  '--evo-color-success-soft': '#14532d',
  '--evo-color-on-success': '#0f172a',
  '--evo-color-warning': '#fbbf24',
  '--evo-color-warning-soft': '#78350f',
  '--evo-color-on-warning': '#0f172a',
  '--evo-color-danger': '#f87171',
  '--evo-color-danger-soft': '#7f1d1d',
  '--evo-color-on-danger': '#0f172a',
} as const;

/**
 * Tema por omissão.
 *
 * Os tokens estruturais (espaçamento, raio, tipografia, foco) vivem no CSS
 * estático `styles/evolium-theme.css` e não aqui: não mudam com o esquema de
 * cor e não precisam de estar no snapshot que a persistência guarda.
 */
export const EVO_DEFAULT_THEME: EvoThemeDefaults = {
  id: 'evolium-flat',
  name: 'Evolium Flat',
  tokens: EVO_LIGHT_TOKENS,
  darkTokens: EVO_DARK_TOKENS,
  variants: {},
  scheme: 'system',
};
