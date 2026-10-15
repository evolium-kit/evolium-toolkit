# FormFieldSelectComponent (`field-select`)

Componente de select customizado para Angular Reactive Forms, com suporte a:

- Seleção simples ou múltipla
- Busca (searchable)
- Ícones por item (Material Icons ou imagem/URL)
- Renderização de itens totalmente personalizada via `ng-template`
- Desabilitação do componente inteiro ou de opções específicas
- Integração com `ControlValueAccessor` (funciona com `formControlName`)

---

## Instalação / Import

```typescript
import { FormFieldSelectComponent, SelectOption } from './select-field';

@Component({
  imports: [FormFieldSelectComponent, ReactiveFormsModule],
  ...
})
```

---

## Uso básico

```html
<field-select
  formControlName="pais"
  label="País/Região"
  [options]="opcoesPais"
  placeholder="Selecione o país">
</field-select>
```

```typescript
readonly opcoesPais: SelectOption[] = [
  { value: 'Angola', label: 'Angola | 244' },
  { value: 'Portugal', label: 'Portugal | 351' },
  { value: 'Brasil', label: 'Brasil | 55' },
];
```

---

## Interface `SelectOption`

```typescript
export interface SelectOption {
  value: string;
  label: string;
  icon?: string;       // nome de ícone Material OU URL/caminho de imagem
  iconClass?: string;  // classes Tailwind aplicadas ao ícone
  disabled?: boolean;  // desabilita apenas esta opção
}
```

### Detecção automática do tipo de ícone

O valor de `icon` é tratado como **imagem** se:
- Começar com `http://`, `https://`, `/`, `./`, `../`, ou `data:image`
- Terminar com `.png`, `.jpg`, `.jpeg`, `.svg`, `.gif` ou `.webp`

Caso contrário, é tratado como nome de **Material Icon** (ex: `'star'`, `'verified'`, `'flag'`).

---

## Inputs (Properties)

| Input           | Tipo                                                | Padrão            | Descrição                                                             |
|-----------------|------------------------------------------------------|-------------------|-------------------------------------------------------------------------|
| `label`         | `string`                                             | `''`              | Texto do label acima do select                                          |
| `options`       | `SelectOption[]`                                     | `[]`              | Lista de opções                                                         |
| `placeholder`   | `string`                                             | `'Selecione...'`  | Texto exibido quando nada está selecionado                              |
| `erro`          | `string \| boolean \| null \| (form: FormGroup) => ...` | `null`         | Mensagem de erro estática ou função que recebe o form e retorna a mensagem |
| `optional`      | `boolean`                                            | `false`           | Exibe `(opcional)` ao lado do label                                     |
| `searchable`    | `boolean`                                            | `false`           | Habilita campo de busca dentro do dropdown                              |
| `multiple`      | `boolean`                                            | `false`           | Permite seleção múltipla (valor do form vira `string[]`)                |
| `bgTransparent` | `boolean`                                            | `false`           | Remove o fundo branco do componente                                     |
| `temError`      | `boolean`                                            | `true`            | Controla se o espaço/linha de erro é renderizado                        |
| `disabled`      | `boolean`                                            | `false`           | Desabilita o componente via template (independente do FormControl)      |
| `dataCy`        | `string \| null`                                     | `null`            | Atributo `data-cy` para testes E2E                                      |

> Nota: o componente também respeita o estado `disabled` vindo do próprio `FormControl` (via `setDisabledState`). Ele fica desabilitado se **qualquer um dos dois** (`[disabled]` ou o FormControl) estiver true.

---

## Ícones por item

Basta adicionar `icon` (e opcionalmente `iconClass`) na `SelectOption`. Funciona tanto na lista aberta quanto no botão fechado (seleção simples).

### Ícone Material

```typescript
readonly opcoesPais: SelectOption[] = [
  { value: 'Angola', label: 'Angola | 244', icon: 'flag', iconClass: 'text-green-600' },
];
```

### Ícone como imagem

```typescript
readonly opcoesPais: SelectOption[] = [
  { value: 'Portugal', label: 'Portugal | 351', icon: '/assets/flags/pt.svg' },
];
```

---

## Renderização personalizada de itens

Quando o ícone + label padrão não é suficiente (ex: avatar, badge de status, múltiplos elementos), use um `<ng-template #optionTemplate>` dentro do `<field-select>`.

```html
<field-select
  formControlName="empresa_id"
  label="Empresa"
  [options]="empresaOptions()"
  [searchable]="true">
  <ng-template #optionTemplate let-option let-selected="selected">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-2">
        <img [src]="option.icon" class="w-6 h-6 rounded-full object-cover" />
        <span>{{ option.label }}</span>
      </div>
      @if (selected) {
        <span class="material-icons text-green-500 text-base">check_circle</span>
      }
    </div>
  </ng-template>
</field-select>
```

### Contexto disponível no template

| Variável    | Tipo           | Descrição                              |
|-------------|----------------|-----------------------------------------|
| `option`    | `SelectOption` | A opção atual (`$implicit`)             |
| `selected`  | `boolean`      | Se a opção está selecionada atualmente  |

> Quando `optionTemplate` é fornecido, o componente delega **toda** a renderização do item a ele — o ícone padrão e o checkmark (`✓`) automáticos são ignorados.

---

## Desabilitar uma opção específica

```typescript
readonly empresas: SelectOption[] = [
  { value: '1', label: 'Empresa A' },
  { value: '2', label: 'Empresa B (inativa)', disabled: true },
];
```

A opção fica visível na lista, mas não pode ser selecionada (fica com opacidade reduzida e cursor `not-allowed`).

---

## Seleção múltipla

```html
<field-select
  formControlName="permissoes"
  label="Permissões"
  [options]="permissoesOptions"
  [multiple]="true">
</field-select>
```

O valor do `FormControl` passa a ser um array de `string[]` (os `value` das opções selecionadas).

---

## Exibindo erros de validação

### Com string estática

```html
<field-select formControlName="empresa_id" label="Empresa" [options]="empresaOptions()" [erro]="'Campo obrigatório'"></field-select>
```

### Com função (ex: integração com serviço de validação)

```html
<field-select formControlName="empresa_id" label="Empresa" [options]="empresaOptions()" [erro]="validacao.getErro('empresa_id')"></field-select>
```

A função recebe o `FormGroup` pai (obtido automaticamente via `ControlContainer`) e deve retornar `string | null | boolean`.

---

## Comportamento interno relevante

- Sem `label`, a linha do rótulo não é renderizada — quem rotula o campo por fora (ex: o cartão de parâmetros dos Relatórios) fica alinhado com os campos vizinhos. É o mesmo comportamento do `field-select-pill` e do `field-date-range-pill`.
- O dropdown fecha automaticamente ao clicar fora do componente (`document:click`).
- Em seleção simples, o dropdown fecha ao escolher uma opção; em múltipla, permanece aberto.
- O campo de busca (`searchable`) filtra por `label` (case-insensitive, sem acentuação especial tratada — considerar `normalize()` se precisar de busca sem acento).
- `onTouched()` é chamado ao fechar o dropdown ou ao selecionar uma opção, garantindo que os validators e mensagens de erro do Angular Forms disparem corretamente.

---

## Possíveis extensões futuras

- Adicionar `iconType: 'material' | 'image' | 'svg-inline'` explícito, caso a detecção automática por padrão de string se mostre insuficiente.
- Suporte a agrupamento de opções (`optgroup`-like).
- Busca sem distinção de acentos.
