import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EvoButton, EvoField, EvoInput } from '@evolium-kit/toolkit/components';
import { EvoAuthShell } from '@evolium-kit/toolkit/layouts';
import { EvoAuth, EvoError } from '@evolium-kit/toolkit/services';
import { EvoPageCopy } from '../page-types';

const COPY: EvoPageCopy = {
  brand: 'Evolium',
  title: 'Entrar',
  subtitle: 'Acede à tua conta.',
  email: 'Email',
  password: 'Senha',
  submit: 'Entrar',
  forgot: 'Esqueceste-te da senha?',
  noAccount: 'Ainda não tens conta?',
  register: 'Criar conta',
};

/**
 * Página de início de sessão.
 *
 * Compõe componentes e o shell de autenticação, e fala com o backend apenas
 * através do resource `auth`. Nunca injecta `HttpClient`.
 */
@Component({
  selector: 'evo-login-page',
  imports: [ReactiveFormsModule, RouterLink, EvoAuthShell, EvoButton, EvoInput, EvoField],
  templateUrl: './login-page.html',
  styleUrl: './auth-pages.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoLoginPage {
  /** Textos substituíveis, para tradução ou ajuste de marca. */
  readonly copy = input<EvoPageCopy>({});
  // Os transforms reinstalam a omissão quando o router atribui `undefined`.
  readonly redirectTo = input('/', { transform: (v?: string) => v ?? '/' });
  readonly registerLink = input('/auth/registar', {
    transform: (v?: string) => v ?? '/auth/registar',
  });
  readonly forgotLink = input('/auth/recuperar', {
    transform: (v?: string) => v ?? '/auth/recuperar',
  });

  private readonly auth = inject(EvoAuth);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required]),
  });

  protected readonly aEntrar = signal(false);
  protected readonly erro = signal<string | null>(null);

  /**
   * O `?? {}` não é defensivo em excesso: com `withComponentInputBinding()`, o
   * router atribui `undefined` a inputs sem correspondência no `data` da rota,
   * sobrepondo o valor por omissão do `input()`.
   */
  protected texto(chave: string): string {
    return (this.copy() ?? {})[chave] ?? COPY[chave] ?? chave;
  }

  protected invalido(campo: 'email' | 'password'): boolean {
    const controlo = this.form.controls[campo];
    return controlo.invalid && (controlo.dirty || controlo.touched);
  }

  protected async submeter(): Promise<void> {
    this.erro.set(null);

    if (this.form.invalid) {
      // Marcar como tocado é o que faz as mensagens aparecerem; sem isto o
      // formulário recusa submeter sem explicar porquê.
      this.form.markAllAsTouched();
      this.focarPrimeiroErro();
      return;
    }

    this.aEntrar.set(true);
    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl(this.redirectTo());
    } catch (erro) {
      const evo = erro as EvoError;
      this.erro.set(
        evo.kind === 'unauthorized'
          ? 'Email ou senha incorrectos.'
          : (evo.message ?? 'Não foi possível entrar.'),
      );
    } finally {
      this.aEntrar.set(false);
    }
  }

  /** Move o foco para o primeiro campo inválido, como manda a a11y. */
  private focarPrimeiroErro(): void {
    for (const nome of ['email', 'password'] as const) {
      if (this.form.controls[nome].invalid) {
        document.getElementById(`evo-login-${nome}`)?.focus();
        return;
      }
    }
  }
}
