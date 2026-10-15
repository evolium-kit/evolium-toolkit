import { DecimalPipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EvoBadge,
  EvoButton,
  EvoCard,
  EvoField,
  EvoInput,
  EvoFormField,
  EvoTextField,
  EvoSelect,
  EvoSelectOption,
  EvoSelectOptionDef,
} from '@evolium-kit/toolkit/components';
import { EvoTokensDirective } from '@evolium-kit/toolkit/core';
import { EvoThemeExporter, EvoThemeStore } from '@evolium-kit/toolkit/theme';
import { RouterLink } from '@angular/router';
import { EvoAuth, EvoError, EvoResourceRegistry } from '@evolium-kit/toolkit/services';

/**
 * Playground das Fases 1 e 2.
 *
 * Prova as garantias centrais da toolkit: alterar um token muda o aspecto em
 * toda a aplicaÃ§Ã£o; um override de instÃ¢ncia nÃ£o afecta as outras; e a cascata
 * comporta-se como documentado. Ã‰ aqui que a cascata Ã© realmente validada â€” o
 * jsdom dos testes nÃ£o resolve `var()` nem interpreta `@layer`.
 */
@Component({
  selector: 'app-playground',
  imports: [
    EvoButton,
    EvoCard,
    EvoBadge,
    EvoInput,
    EvoField,
    EvoTokensDirective,
    RouterLink,
    DecimalPipe,
    EvoFormField,
    EvoTextField,
    EvoSelect,
    EvoSelectOptionDef,
    ReactiveFormsModule,
    JsonPipe,
  ],
  templateUrl: './playground.html',
  styleUrl: './playground.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Playground {
  protected readonly theme = inject(EvoThemeStore);
  private readonly exporter = inject(EvoThemeExporter);

  protected readonly scheme = this.theme.resolvedScheme;

  protected readonly primary = computed(
    () => this.theme.activeTokens()['--evo-color-primary'] ?? '#2563eb',
  );

  protected readonly radius = computed(() => this.theme.activeTokens()['--evo-radius-md'] ?? '6px');

  /** `parseInt` nÃ£o existe no contexto de template. */
  protected readonly radiusValue = computed(() => Number.parseInt(this.radius(), 10) || 0);

  protected readonly amostras = ['#2563eb', '#0d9488', '#7c3aed', '#b45309', '#dc2626'] as const;

  protected readonly aGravar = signal(false);
  protected readonly emailInvalido = signal(false);

  // ------------------------------------------------------------ text field

  protected readonly registo = inject(NonNullableFormBuilder).group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]],
    valor: [null as number | null, Validators.min(0)],
    obs: [''],
  });

  protected submeterRegisto(): void {
    this.registo.markAllAsTouched();
  }

  protected alternarRegisto(): void {
    if (this.registo.disabled) this.registo.enable();
    else this.registo.disable();
  }

  // ---------------------------------------------------------------- select

  protected readonly provincias: EvoSelectOption<number>[] = [
    { value: 1, label: 'Luanda', sublabel: 'Capital', group: 'Litoral' },
    { value: 2, label: 'Bengo', group: 'Litoral' },
    { value: 3, label: 'Benguela', group: 'Litoral' },
    { value: 4, label: 'Namibe', group: 'Litoral' },
    { value: 5, label: 'Cabinda', group: 'Litoral' },
    { value: 6, label: 'Huambo', group: 'Interior' },
    { value: 7, label: 'Bié', group: 'Interior' },
    { value: 8, label: 'Huíla', group: 'Interior' },
    { value: 9, label: 'Malanje', group: 'Interior', disabled: true },
    { value: 10, label: 'Cuando Cubango', group: 'Interior' },
  ];

  protected readonly gestores: EvoSelectOption<
    { id: number },
    { iniciais: string; cargo: string }
  >[] = [
    { value: { id: 1 }, label: 'Ana Domingos', data: { iniciais: 'AD', cargo: 'Comercial' } },
    { value: { id: 2 }, label: 'Bruno Neto', data: { iniciais: 'BN', cargo: 'Financeiro' } },
    { value: { id: 3 }, label: 'Celma Paulo', data: { iniciais: 'CP', cargo: 'Operações' } },
  ];

  protected readonly mesmoId = (a: { id: number } | null, b: { id: number } | null) =>
    a?.id === b?.id;

  protected readonly escolhas = inject(NonNullableFormBuilder).group({
    provincia: [null as number | null, Validators.required],
    actuacao: [[1, 3] as number[]],
    // Outra referência, o mesmo id: o compareWith encontra-o.
    gestor: [{ id: 2 } as { id: number } | null],
  });

  protected submeterEscolhas(): void {
    this.escolhas.markAllAsTouched();
  }

  protected alternarEscolhas(): void {
    if (this.escolhas.disabled) this.escolhas.enable();
    else this.escolhas.disable();
  }

  protected readonly provinciaLaranja = signal<number | null>(6);

  private readonly todosClientes = [
    'Sonangol',
    'Unitel',
    'Africell',
    'Banco BAI',
    'Banco BIC',
    'ENDE',
    'EPAL',
    'TAAG',
    'Angomart',
  ].map((nome, i) => ({ value: `c${i}`, label: nome }));
  protected readonly clientes = signal<EvoSelectOption<string>[]>(this.todosClientes);
  protected readonly aPesquisarClientes = signal(false);
  protected readonly cliente = signal<string | null>(null);
  private pesquisaClientes?: ReturnType<typeof setTimeout>;

  /** Simula uma API: 400 ms depois de a pessoa parar de escrever. */
  protected pesquisarClientes(termo: string): void {
    clearTimeout(this.pesquisaClientes);
    this.aPesquisarClientes.set(true);
    this.pesquisaClientes = setTimeout(() => {
      const t = termo.toLowerCase();
      this.clientes.set(this.todosClientes.filter((c) => c.label.toLowerCase().includes(t)));
      this.aPesquisarClientes.set(false);
    }, 400);
  }

  // ------------------------------------------------------- Fase 4: serviços

  /** Forma 1 de consumir um resource: o token dedicado do plugin. */
  protected readonly auth = inject(EvoAuth);

  /** Forma 2: o registry genérico, validado contra o EvoResourceMap. */
  private readonly registry = inject(EvoResourceRegistry);
  protected readonly facturas = this.registry.get('facturas');

  /** Nomes dos plugins que arrancaram, por ordem topológica. */
  protected readonly plugins = this.registry.names;

  protected readonly email = signal('ana@evolium.ao');
  protected readonly senha = signal('1234');
  protected readonly aEntrar = signal(false);
  protected readonly aCarregarFacturas = signal(false);
  protected readonly erroAuth = signal<string | null>(null);
  protected readonly erroFacturas = signal<string | null>(null);

  protected async entrar(): Promise<void> {
    this.aEntrar.set(true);
    this.erroAuth.set(null);
    try {
      await this.auth.login({ email: this.email(), password: this.senha() });
    } catch (erro) {
      // Nunca chega aqui um HttpErrorResponse cru: é sempre um EvoError.
      const evo = erro as EvoError;
      this.erroAuth.set(evo.kind === 'unauthorized' ? 'Credenciais inválidas.' : evo.message);
    } finally {
      this.aEntrar.set(false);
    }
  }

  protected async sair(): Promise<void> {
    await this.auth.logout();
    this.erroFacturas.set(null);
  }

  protected async carregarFacturas(): Promise<void> {
    this.aCarregarFacturas.set(true);
    this.erroFacturas.set(null);
    try {
      await this.facturas.carregar();
    } catch (erro) {
      const evo = erro as EvoError;
      this.erroFacturas.set(
        evo.kind === 'unauthorized' ? 'É preciso iniciar sessão primeiro.' : evo.message,
      );
    } finally {
      this.aCarregarFacturas.set(false);
    }
  }

  protected actualizarEmail(evento: Event): void {
    this.email.set((evento.target as HTMLInputElement).value);
  }

  protected actualizarSenha(evento: Event): void {
    this.senha.set((evento.target as HTMLInputElement).value);
  }

  protected definirPrimary(valor: string): void {
    this.theme.setToken('color-primary', valor);
  }

  protected definirRadius(evento: Event): void {
    const alvo = evento.target as HTMLInputElement;
    this.theme.setToken('radius-md', `${alvo.value}px`);
  }

  protected simularEnvio(): void {
    this.aGravar.set(true);
    setTimeout(() => this.aGravar.set(false), 1500);
  }

  protected async guardar(): Promise<void> {
    await this.theme.persist();
  }

  protected exportar(): void {
    this.exporter.downloadAll(this.theme.snapshot());
  }

  protected async reporTudo(): Promise<void> {
    // await this.theme.clearPersisted();
  }
}
