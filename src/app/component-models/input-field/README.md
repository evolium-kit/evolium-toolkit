# README — form-input-field

## Visão geral

Componente standalone de input reutilizável, compatível com ReactiveFormsModule via ControlValueAccessor. Suporta input e textarea, ícones laterais via ng-content, mensagens de erro estáticas ou derivadas de uma função que recebe o FormGroup pai, e integração automática com ControlContainer para resolver erros baseados no estado do form.

## Imports

import { FormFieldInputComponentV2, LeftIconDirective, RightIconDirective } from './form-input-field.component';

## Inputs

| Input        | Tipo                                                                 | Default | Descrição                                                                 |
|--------------|-----------------------------------------------------------------------|---------|-----------------------------------------------------------------------------|
| label        | string                                                                 | ''      | Texto do label acima do campo                                              |
| erro         | string \| null \| boolean \| (form: FormGroup) => string \| null \| boolean | null    | Mensagem de erro fixa ou função avaliada contra o parentForm               |
| type         | string                                                                 | 'text'  | Tipo do input (text, email, password, ou 'textarea' para renderizar <textarea>) |
| placeholder  | string                                                                 | ''      | Placeholder do campo                                                       |
| optional     | boolean                                                                | false   | Mostra "(opcional)" junto ao label                                         |
| inline       | boolean                                                                | false   | Reservado, não usado no template atual                                     |
| rows         | number                                                                 | 4       | Número de linhas quando type() === 'textarea'                              |
| disabled     | boolean                                                                | false   | Desabilita o campo                                                         |

## Slots (ng-content)

| Selector     | Diretiva           | Uso                              |
|--------------|---------------------|-----------------------------------|
| [leftIcon]   | LeftIconDirective   | Ícone à esquerda do campo        |
| [rightIcon]  | RightIconDirective  | Ícone à direita do campo         |

Nota: ao usar os slots, é necessário importar LeftIconDirective/RightIconDirective no componente pai para que o Angular reconheça os seletores.

## Uso básico (Reactive Forms)

@Component({
  imports: [FormFieldInputComponentV2, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <form-input-field
        formControlName="nome"
        label="Nome completo"
        placeholder="Insira o seu nome"
        [erro]="erroNome"
      />
    </form>
  `
})
export class ExemploComponent {
  form = new FormGroup({
    nome: new FormControl('', Validators.required)
  });

  erroNome = (form: FormGroup) => {
    const control = form.get('nome');
    return control?.touched && control?.hasError('required')
      ? 'O nome é obrigatório'
      : null;
  };
}

## Uso com ícones

<form-input-field formControlName="email" label="Email" type="email">
  <svg leftIcon ...></svg>
  <svg rightIcon ...></svg>
</form-input-field>

## Uso como textarea

<form-input-field
  formControlName="descricao"
  label="Descrição"
  type="textarea"
  [rows]="6"
/>

## Detalhes de implementação

- Detecta o FormGroup pai automaticamente via @Optional() @Host() ControlContainer, atribuído a this.parentForm no ngOnInit.
- O computed __erro resolve a prop erro: se for função, invoca-a passando parentForm; caso contrário, devolve o valor diretamente.
- Implementa ControlValueAccessor completo (writeValue, registerOnChange, registerOnTouched, setDisabledState), permitindo uso direto com formControlName ou [(ngModel)].
- id é gerado via crypto.randomUUID() para ligar label[for] ao campo sem colisões.
- Estilização condicional de borda/outline baseada na presença de erro (__erro()), usando Tailwind + NgClass.

## Limitações conhecidas

- inline está declarado mas não é usado no template — sem efeito visual atual.
- setDisabledState não aplica disabled ao elemento nativo; o estado disabled depende exclusivamente do input disabled().
