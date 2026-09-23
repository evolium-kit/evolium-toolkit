import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EvoButton, EvoField, EvoInput } from '@evolium-kit/toolkit/components';
import { EvoAuthShell } from '@evolium-kit/toolkit/layouts';
import { EvoAuth, EvoError } from '@evolium-kit/toolkit/services';
import { EvoPageCopy } from '../page-types';

const COPY: EvoPageCopy = {
  brand: 'Evolium',
  title: 'Recuperar senha',
  subtitle: 'Enviamos-te um link para definir uma senha nova.',
  email: 'Email',
  submit: 'Enviar link',
  back: 'Voltar a entrar',
  sent: 'Se existir uma conta com esse email, o link foi enviado. Verifica a tua caixa de entrada.',
};

@Component({
  selector: 'evo-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, EvoAuthShell, EvoButton, EvoInput, EvoField],
  templateUrl: './forgot-password-page.html',
  styleUrl: './auth-pages.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoForgotPasswordPage {
  readonly copy = input<EvoPageCopy>({});
  // O transform reinstala a omissão quando o router atribui `undefined`.
  readonly loginLink = input('/auth/login', { transform: (v?: string) => v ?? '/auth/login' });

  private readonly auth = inject(EvoAuth);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
  });

  protected readonly aEnviar = signal(false);
  protected readonly enviado = signal(false);
  protected readonly erro = signal<string | null>(null);

  /** Ver a nota em `EvoLoginPage.texto`: o router pode atribuir `undefined`. */
  protected texto(chave: string): string {
    return (this.copy() ?? {})[chave] ?? COPY[chave] ?? chave;
  }

  protected get invalido(): boolean {
    const controlo = this.form.controls.email;
    return controlo.invalid && (controlo.dirty || controlo.touched);
  }

  protected async submeter(): Promise<void> {
    this.erro.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.aEnviar.set(true);
    try {
      await this.auth.recoverPassword(this.form.controls.email.value);
      // A confirmação é deliberadamente vaga: dizer "esse email não existe"
      // permitiria enumerar contas registadas.
      this.enviado.set(true);
    } catch (erro) {
      this.erro.set((erro as EvoError).message ?? 'Não foi possível enviar o link.');
    } finally {
      this.aEnviar.set(false);
    }
  }
}
