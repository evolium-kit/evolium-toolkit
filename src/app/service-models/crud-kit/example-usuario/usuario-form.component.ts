import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormFieldInputComponentV2 } from '../../../components/input-field/form-input-field';
import { FormFieldSelectComponentV2, SelectOptionV2 } from '../../../components/select-field-v2/select-field-v2';
import { useCrudFormBridge } from '../use-crud-form-bridge';
import { Usuario, UsuarioDto } from './usuario.types';

/**
 * Formulário de criar/editar Usuário. Funciona tanto dentro de um modal (aberto pelo
 * `usuarioCrud()`) quanto numa rota isolada, via `useCrudFormBridge` + `@Input`/`@Output`.
 */
@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule, FormFieldInputComponentV2, FormFieldSelectComponentV2],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuario-form.component.html',
})
export class UsuarioFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bridge = useCrudFormBridge<Usuario>();

  readonly usuarioInicial = input<Usuario | null>(null);
  readonly salvo = output<UsuarioDto>();
  readonly cancelado = output<void>();

  readonly opcoesPerfil: SelectOptionV2[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'padrao', label: 'Padrão' },
  ];

  // Padrão obrigatório do crud-kit: combina o @Input direto com o dado vindo do modal.
  readonly dado = computed(() => this.usuarioInicial() ?? this.bridge.dadoInicialModal());

  readonly form: FormGroup = this.fb.group({
    nome: ['', Validators.required],
    idade: [null as number | null, [Validators.required, Validators.min(0)]],
    perfil: ['padrao' as Usuario['perfil'], Validators.required],
  });

  constructor() {
    effect(() => {
      const dado = this.dado();
      if (dado) {
        this.form.patchValue({ nome: dado.nome, idade: dado.idade, perfil: dado.perfil });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.form.getRawValue() as UsuarioDto;

    // Chamar sempre os dois, sem `if` — um é no-op quando o outro contexto não está presente.
    this.bridge.emitirSalvo(dto);
    this.salvo.emit(dto);
  }

  onCancelar(): void {
    this.bridge.emitirCancelado();
    this.cancelado.emit();
  }
}
