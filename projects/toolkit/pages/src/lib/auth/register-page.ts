import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EvoButton, EvoField, EvoInput } from '@evolium-kit/toolkit/components';
import { EvoAuthShell } from '@evolium-kit/toolkit/layouts';
import { EvoAuth, EvoError } from '@evolium-kit/toolkit/services';
import { EvoPageCopy } from '../page-types';

const COPY: EvoPageCopy = {
  brand: 'Evolium',
  title: 'Criar conta',
  subtitle: 'Leva menos de um minuto.',
  name: 'Nome',
  email: 'Email',
  password: 'Senha',
  confirm: 'Confirmar senha',
  submit: 'Criar conta',
  hasAccount: 'Já tens conta?',
  login: 'Entrar',
};

/** As senhas têm de coincidir. Validador ao nível do grupo, não do campo. */
function senhasCoincidem(grupo: AbstractControl): ValidationErrors | null {
  const senha = grupo.get('password')?.value as string;
  const confirmacao = grupo.get('confirm')?.value as string;
  return senha === confirmacao ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'evo-register-page',
  imports: [ReactiveFormsModule, RouterLink, EvoAuthShell, EvoButton, EvoInput, EvoField],
  templateUrl: './register-page.html',
  styleUrl: './auth-pages.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvoRegisterPage {
  readonly copy = input<EvoPageCopy>({});
  // Os transforms reinstalam a omissão quando o router atribui `undefined`.
  readonly redirectTo = input('/', { transform: (v?: string) => v ?? '/' });
  readonly loginLink = input('/auth/login', { transform: (v?: string) => v ?? '/auth/login' });
  /** Comprimento mínimo da senha. Deve espelhar a regra do backend. */
  readonly minPasswordLength = input(8, { transform: (v?: number) => v ?? 8 });

  private readonly auth = inject(EvoAuth);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group(
    {
      name: this.fb.control('', [Validators.required, Validators.minLength(2)]),
      email: this.fb.control('', [Validators.required, Validators.email]),
      password: this.fb.control('', [Validators.required, Validators.minLength(8)]),
      confirm: this.fb.control('', [Validators.required]),
    },
    { validators: senhasCoincidem },
  );

  protected readonly aCriar = signal(false);
  protected readonly erro = signal<string | null>(null);
  /** Erros por campo devolvidos pelo backend, que o cliente não previu. */
  protected readonly errosServidor = signal<Readonly<Record<string, readonly string[]>>>({});

  /** Ver a nota em `EvoLoginPage.texto`: o router pode atribuir `undefined`. */
  protected texto(chave: string): string {
    return (this.copy() ?? {})[chave] ?? COPY[chave] ?? chave;
  }

  protected invalido(campo: 'name' | 'email' | 'password' | 'confirm'): boolean {
    const controlo = this.form.controls[campo];
    return (
      (controlo.invalid || this.erroServidor(campo) !== null) &&
      (controlo.dirty || controlo.touched)
    );
  }

  protected erroServidor(campo: string): string | null {
    return this.errosServidor()[campo]?.[0] ?? null;
  }

  protected get senhasDiferentes(): boolean {
    return this.form.hasError('senhasDiferentes') && this.form.controls.confirm.touched;
  }

  protected async submeter(): Promise<void> {
    this.erro.set(null);
    this.errosServidor.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focarPrimeiroErro();
      return;
    }

    this.aCriar.set(true);
    try {
      const { name, email, password } = this.form.getRawValue();
      await this.auth.register({ name, email, password });
      await this.router.navigateByUrl(this.redirectTo());
    } catch (erro) {
      const evo = erro as EvoError;
      if (evo.fieldErrors) this.errosServidor.set(evo.fieldErrors);
      this.erro.set(evo.message ?? 'Não foi possível criar a conta.');
    } finally {
      this.aCriar.set(false);
    }
  }

  private focarPrimeiroErro(): void {
    for (const nome of ['name', 'email', 'password', 'confirm'] as const) {
      if (this.form.controls[nome].invalid) {
        document.getElementById(`evo-register-${nome}`)?.focus();
        return;
      }
    }
  }
}
