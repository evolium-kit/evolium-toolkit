import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EvoButton } from '@evolium-kit/toolkit/components';
import { EvoBlankShell } from '@evolium-kit/toolkit/layouts';
import { EvoPageCopy } from '../page-types';

const COPY: EvoPageCopy = {
  code: '404',
  title: 'Página não encontrada',
  subtitle: 'O endereço que procuras não existe ou foi movido.',
  back: 'Voltar ao início',
};

@Component({
  selector: 'evo-not-found-page',
  imports: [RouterLink, EvoBlankShell, EvoButton],
  template: `
    <evo-blank-shell [center]="true">
      <div class="nf">
        <p class="nf__codigo" aria-hidden="true">{{ texto('code') }}</p>
        <h1 class="nf__titulo">{{ texto('title') }}</h1>
        <p class="nf__subtitulo">{{ texto('subtitle') }}</p>
        <a evoButton [routerLink]="homeLink()">{{ texto('back') }}</a>
      </div>
    </evo-blank-shell>
  `,
  styles: `
    @layer evo.components {
      .nf {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--evo-space-sm);
        text-align: center;
      }

      .nf__codigo {
        margin: 0;
        color: var(--evo-color-primary);
        font-size: 3.5rem;
        font-weight: 700;
        line-height: 1;
      }

      .nf__titulo {
        margin: 0;
        font-size: 1.375rem;
        font-weight: 600;
      }

      .nf__subtitulo {
        margin: 0 0 var(--evo-space-md);
        color: var(--evo-color-on-surface-muted);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoNotFoundPage {
  readonly copy = input<EvoPageCopy>({});
  // O transform reinstala a omissão quando o router atribui `undefined`.
  readonly homeLink = input('/', { transform: (valor?: string) => valor ?? '/' });

  /** Ver a nota em `EvoLoginPage.texto`: o router pode atribuir `undefined`. */
  protected texto(chave: string): string {
    return (this.copy() ?? {})[chave] ?? COPY[chave] ?? chave;
  }
}
