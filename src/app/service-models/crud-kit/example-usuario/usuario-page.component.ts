import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createCrudResource } from '../create-crud-resource';
import { useCrudPageState } from '../use-crud-page-state';
import { UsuarioFormComponent } from './usuario-form.component';
import { Usuario, UsuarioDto } from './usuario.types';

/**
 * Exemplo de criar/editar Usuário em rota isolada (fluxo Rota), reaproveitando o mesmo
 * `UsuarioFormComponent` do fluxo Modal sem nenhuma alteração.
 */
@Component({
  selector: 'app-usuario-page',
  imports: [UsuarioFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuario-page.component.html',
})
export class UsuarioPageComponent {
  private readonly router = inject(Router);

  // Rota isolada: acessar /usuarios/:id/editar diretamente (sem passar pela listagem)
  // não tem o cache de `list` populado, então usamos 'fetch-on-miss' para garantir o GET individual.
  private readonly resource = createCrudResource<Usuario, UsuarioDto>({
    resource: '/usuarios',
    strategy: 'fetch-on-miss',
  });

  readonly page = useCrudPageState(this.resource);

  onSalvo(dto: UsuarioDto): void {
    // `...EConcluir` em vez de `mutate` direto: é o que corre os hooks `depoisDeX` dos
    // plugins (mensagem de sucesso, invalidações relacionadas) na altura certa — só
    // quando o pedido e a revalidação da lista terminam.
    const salvo =
      this.page.mode() === 'atualizar'
        ? this.resource.atualizarEConcluir(this.page.id()!, dto)
        : this.resource.salvarEConcluir(dto);

    // A navegação não espera pelo pedido — o erro é anunciado pelo hook `aoOcorrerErro`.
    void salvo.catch(() => undefined);
    this.router.navigate(['/usuarios']);
  }

  onCancelado(): void {
    this.router.navigate(['/usuarios']);
  }
}
