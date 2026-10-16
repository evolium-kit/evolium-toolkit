# 📦 Modal Genérico Reutilizável

Um componente de modal flexível e reutilizável para qualquer situação, implementado com Angular standalone, Tailwind CSS e acessibilidade completa.

## 🎯 Características

- ✅ **Totalmente Reutilizável** - Use em qualquer componente
- ✅ **Content Projection** - Injete qualquer conteúdo via `<ng-content>`
- ✅ **3 Tamanhos** - pequeno, medio, grande
- ✅ **Botão de Fechar** - Automático com X no canto superior
- ✅ **Fechar ao Clicar Fora** - Click no backdrop para fechar
- ✅ **Accessibility** - Atributos ARIA completos
- ✅ **Tailwind CSS** - Totalmente estilizado
- ✅ **OnPush Detection** - Otimizado para performance

## 📂 Arquivos

```
modal-generico/
├── modal-generico.ts              # Componente principal
├── modal-generico.html            # Template
├── modal-generico.css             # Estilos
├── example-modal-generico.ts      # Exemplo básico
├── modal-confirmacao.ts           # Exemplo: Modal de confirmação
└── modal-alerta.ts                # Exemplo: Modal de alerta
```

## 🚀 Uso

### 1️⃣ Modal Simples (Conteúdo Customizado)

```typescript
import { Component, signal } from '@angular/core';
import { ModalGenericoComponent } from './modal-generico';

@Component({
  selector: 'app-meu-componente',
  template: `
    <button (click)="abrirModal()">Abrir Modal</button>

    <app-modal-generico
      [isAberto]="modalAberto()"
      titulo="Meu Modal"
      tamanho="medio"
      (aoFechar)="modalAberto.set(false)"
    >
      <p>Conteúdo customizado aqui!</p>
      <button (click)="modalAberto.set(false)">Fechar</button>
    </app-modal-generico>
  `,
  standalone: true,
  imports: [ModalGenericoComponent]
})
export class MeuComponente {
  modalAberto = signal(false);
  
  abrirModal() {
    this.modalAberto.set(true);
  }
}
```

### 2️⃣ Modal de Confirmação

```typescript
import { Component, signal } from '@angular/core';
import { ModalConfirmacaoComponent } from './modal-confirmacao';

@Component({
  selector: 'app-deletar-item',
  template: `
    <button (click)="mostrarConfirmacao.set(true)">Deletar</button>

    <app-modal-confirmacao
      [isAberto]="mostrarConfirmacao()"
      titulo="Confirmar Exclusão"
      mensagem="Tem certeza que deseja deletar este item?"
      tipo="perigo"
      textoBtnConfirmar="Deletar"
      textoBtnCancelar="Cancelar"
      (aoConfirmar)="deletarItem()"
      (aoFechar)="mostrarConfirmacao.set(false)"
    ></app-modal-confirmacao>
  `,
  standalone: true,
  imports: [ModalConfirmacaoComponent]
})
export class DeletarItemComponent {
  mostrarConfirmacao = signal(false);
  
  deletarItem() {
    console.log('Item deletado!');
    this.mostrarConfirmacao.set(false);
  }
}
```

### 3️⃣ Modal de Alerta

```typescript
import { Component, signal } from '@angular/core';
import { ModalAlertaComponent } from './modal-alerta';

@Component({
  selector: 'app-sucesso-registro',
  template: `
    <button (click)="mostrarSucesso.set(true)">Registrar</button>

    <app-modal-alerta
      [isAberto]="mostrarSucesso()"
      titulo="Sucesso!"
      mensagem="Seu registro foi criado com sucesso."
      tipo="sucesso"
      textoBotao="OK"
      (aoFechar)="mostrarSucesso.set(false)"
    ></app-modal-alerta>
  `,
  standalone: true,
  imports: [ModalAlertaComponent]
})
export class SucessoRegistroComponent {
  mostrarSucesso = signal(false);
}
```

## 📋 API

### ModalGenericoComponent

#### Inputs
| Input | Tipo | Descrição |
|-------|------|-----------|
| `isAberto` | `boolean` | Controla visibilidade do modal |
| `titulo` | `string` | Título do modal (opcional) |
| `tamanho` | `'pequeno' \| 'medio' \| 'grande'` | Tamanho do modal |

#### Outputs
| Output | Tipo | Descrição |
|--------|------|-----------|
| `aoFechar` | `void` | Emitido ao fechar modal |

### ModalConfirmacaoComponent

#### Inputs
| Input | Tipo | Descrição |
|-------|------|-----------|
| `isAberto` | `boolean` | Visibilidade |
| `titulo` | `string` | Título |
| `mensagem` | `string` | Mensagem principal |
| `tipo` | `'perigo' \| 'info' \| 'sucesso'` | Estilo do botão |
| `textoBtnConfirmar` | `string` | Texto botão confirmar |
| `textoBtnCancelar` | `string` | Texto botão cancelar |

#### Outputs
| Output | Tipo | Descrição |
|--------|------|-----------|
| `aoConfirmar` | `void` | Ao confirmar |
| `aoFechar` | `void` | Ao fechar |

### ModalAlertaComponent

#### Inputs
| Input | Tipo | Descrição |
|-------|------|-----------|
| `isAberto` | `boolean` | Visibilidade |
| `titulo` | `string` | Título |
| `mensagem` | `string` | Mensagem |
| `tipo` | `'erro' \| 'aviso' \| 'sucesso' \| 'info'` | Tipo de alerta |
| `textoBotao` | `string` | Texto do botão |

#### Outputs
| Output | Tipo | Descrição |
|--------|------|-----------|
| `aoFechar` | `void` | Ao fechar |

## 🎨 Casos de Uso

- ✅ Confirmação de ações (deletar, cancelar)
- ✅ Formulários em modal
- ✅ Alertas e notificações
- ✅ Exibição de detalhes
- ✅ Loading spinners
- ✅ Galeria de imagens
- ✅ Edição de dados
- ✅ Autenticação

## 🔧 Customização

### Modificar Cores

Editar `modal-generico.html` e alterar as cores:

```html
<!-- Mudar cor do botão X -->
<button ... class="hover:text-[#DC2626] ...">
```

### Adicionar Animações

No `modal-generico.css`:

```css
@keyframes customAnimation {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}
```

E adicionar à classe do modal:

```html
<div class="... animate-customAnimation ...">
```

## ♿ Acessibilidade

- ✅ Atributos `role="dialog"`
- ✅ `aria-modal="true"`
- ✅ `aria-labelledby` para título
- ✅ `aria-label` em botões
- ✅ Suporta ESC para fechar (futuro)
- ✅ Focus management (futuro)

## 🐛 Troubleshooting

**Q: Modal não aparece**
- A: Verifique se `[isAberto]="true"` está correto

**Q: Conteúdo não aparece**
- A: Coloque conteúdo dentro do modal, dentro de `<ng-content>`

**Q: Quer adicionar ESC para fechar?**
- A: Use `@HostListener` no componente modal

## 📝 Exemplo Completo com Formulário

```typescript
@Component({
  selector: 'app-editar-empresa',
  template: `
    <app-modal-generico
      [isAberto]="modalAberto()"
      titulo="Editar Empresa"
      tamanho="grande"
      (aoFechar)="modalAberto.set(false)"
    >
      <form [formGroup]="formulario" (ngSubmit)="salvar()">
        <input formControlName="nome" placeholder="Nome" />
        <div class="mt-6 flex gap-4 justify-end">
          <button type="button" (click)="modalAberto.set(false)">Cancelar</button>
          <button type="submit">Salvar</button>
        </div>
      </form>
    </app-modal-generico>
  `,
  standalone: true,
  imports: [ModalGenericoComponent, ReactiveFormsModule]
})
export class EditarEmpresaComponent {
  modalAberto = signal(false);
  formulario = new FormGroup({
    nome: new FormControl('')
  });

  salvar() {
    console.log(this.formulario.value);
    this.modalAberto.set(false);
  }
}
```

---

**Desenvolvido com ❤️ para INAPEM**
