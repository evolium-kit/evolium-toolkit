import { EvoComponentMeta } from '@evolium-kit/toolkit/core';

const largura = (tamanho: string, omissao: string) => ({
  name: `modal-width-${tamanho}`,
  label: `Largura (${tamanho})`,
  type: 'length' as const,
  min: 240,
  max: 1200,
  unit: 'px',
  hint: `Largura com size="${tamanho}". Por omissão, ${omissao}. Nunca passa da largura do ecrã.`,
});

/**
 * Metadados para o Theme Studio.
 *
 * Cada token aqui tem de existir no CSS (modal.css, modal-container.css ou a
 * secção do modal em styles/evolium-components.css), e vice-versa: o painel de
 * propriedades é gerado a partir desta lista.
 *
 * Os botões das acções não têm tokens próprios: herdam os `--evo-button-*`.
 */
export const evoModalMeta: EvoComponentMeta = {
  id: 'modal',
  label: 'Modal',
  category: 'Superfícies',
  tags: ['modal', 'diálogo', 'dialog', 'alerta', 'confirmação', 'janela'],
  sizes: ['sm', 'md', 'lg', 'xl', 'full'],
  tokens: [
    // Caixa
    {
      name: 'modal-bg',
      label: 'Cor de fundo',
      type: 'color',
      fallback: '--evo-color-surface-raised',
    },
    { name: 'modal-fg', label: 'Cor do texto', type: 'color', fallback: '--evo-color-on-surface' },
    {
      name: 'modal-radius',
      label: 'Raio',
      type: 'length',
      min: 0,
      max: 40,
      unit: 'px',
      fallback: '--evo-radius-lg',
      hint: 'Aceita a sintaxe completa do border-radius no CSS: "24px 24px 0 0" arredonda só os cantos de cima.',
    },
    {
      name: 'modal-padding',
      label: 'Espaçamento interno',
      type: 'length',
      min: 0,
      max: 64,
      unit: 'px',
      fallback: '--evo-space-lg',
    },
    {
      name: 'modal-shadow',
      label: 'Sombra',
      type: 'shadow',
      fallback: '--evo-elevation-2',
    },
    {
      name: 'modal-border-color',
      label: 'Cor da borda',
      type: 'color',
      hint: 'Por omissão, transparente (sem borda visível).',
    },
    {
      name: 'modal-divider-color',
      label: 'Linha do rodapé',
      type: 'color',
      fallback: '--evo-color-border',
    },
    // Dimensões
    largura('sm', '24rem'),
    largura('md', '28rem'),
    largura('lg', '32rem'),
    largura('xl', '42rem'),
    {
      name: 'modal-max-height',
      label: 'Altura máxima',
      type: 'length',
      min: 200,
      max: 1200,
      unit: 'px',
      hint: 'Por omissão, 90dvh. O corpo ganha scroll; título e rodapé ficam fixos.',
    },
    // Fundo e movimento
    {
      name: 'modal-backdrop',
      label: 'Cor do fundo da página',
      type: 'color',
      hint: 'Por omissão, a cor do texto a 40% de opacidade.',
    },
    {
      name: 'modal-backdrop-blur',
      label: 'Desfoque do fundo',
      type: 'length',
      min: 0,
      max: 24,
      unit: 'px',
      hint: 'Por omissão, 0 (sem desfoque).',
    },
    {
      name: 'modal-duration',
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
      name: 'modal-title-size',
      label: 'Tamanho do título',
      type: 'length',
      min: 12,
      max: 40,
      unit: 'px',
      fallback: '--evo-font-size-lg',
    },
    {
      name: 'modal-message-color',
      label: 'Cor da mensagem',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    // Ícone e acções
    {
      name: 'modal-icon-size',
      label: 'Tamanho do ícone',
      type: 'length',
      min: 16,
      max: 128,
      unit: 'px',
      hint: 'Por omissão, 4rem. Aplica-se também a um ícone próprio (slot="icon").',
    },
    {
      name: 'modal-icon-success',
      label: 'Ícone (success)',
      type: 'color',
      fallback: '--evo-color-success',
    },
    {
      name: 'modal-icon-danger',
      label: 'Ícone (danger)',
      type: 'color',
      fallback: '--evo-color-danger',
    },
    {
      name: 'modal-icon-warning',
      label: 'Ícone (warning)',
      type: 'color',
      fallback: '--evo-color-warning',
    },
    {
      name: 'modal-icon-info',
      label: 'Ícone (info, question)',
      type: 'color',
      fallback: '--evo-color-primary',
    },
    {
      name: 'modal-close-color',
      label: 'Botão ×',
      type: 'color',
      fallback: '--evo-color-on-surface-muted',
    },
    {
      name: 'modal-close-color-hover',
      label: 'Botão × (hover)',
      type: 'color',
      fallback: '--evo-color-on-surface',
    },
    {
      name: 'modal-actions-align',
      label: 'Alinhamento dos botões',
      type: 'select',
      options: ['flex-end', 'center', 'flex-start', 'space-between'],
      hint: 'Por omissão, à direita; ao centro quando o modal tem ícone.',
    },
  ],
};
