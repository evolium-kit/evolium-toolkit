# Alert Modal com Templates Dinâmicos

## Funcionalidade

O serviço `AlertModalService` agora suporta renderizar componentes personalizados como templates dentro do modal, sincronizar abertura/fechamento com o fragmento da URL e facilitar cenários de CRUD com dados de criação/edição.

## Formas de Uso

### 1. Com Mensagem Simples (Compatível com uso anterior)

```typescript
this.servicoAlert.modal({
  mensagem: 'Pagamento aceite com sucesso',
  icon: 'success',
});
```

### 2. Com a API mais clara: `open(options)`

A API `open(options)` é a recomendada para o fluxo novo. O método `modal(options)` continua disponível como alias para manter compatibilidade.

```typescript
this.servicoAlert.open({
  titulo: 'Confirmação',
  template: MeuComponenteModal,
});
```

### 3. Fluxo com fragmento da URL (recomendado para CRUD)

Este é o fluxo principal para abrir um modal e manter o estado ligado à URL, por exemplo `/motorista#registar-motorista`.

```typescript
this.servicoAlert.open({
  fragment: 'registar-motorista',
  template: FormMotoristaComponent,
  data: { mode: 'create' },
  temHeader: true,
  titulo: 'Registrar motorista',
  semBotoes: true,
  fragmented: true,
});
```

Para edição:

```typescript
this.servicoAlert.open({
  fragment: 'editar-motorista',
  template: FormMotoristaComponent,
  data: { mode: 'edit', motorista },
  temHeader: true,
  titulo: 'Editar motorista',
  semBotoes: true,
  fragmented: true,
});
```

Se o fragmento for removido da URL, o modal é fechado automaticamente. Se a página for recarregada com o mesmo fragmento, o modal é reaberto.

### 4. Com Template Importado Diretamente

Importe o componente e passe como Type:

```typescript
import { MeuComponenteModal } from './meu-componente-modal';

this.servicoAlert.open({
  titulo: 'Confirmação',
  template: MeuComponenteModal,
});
```

### 5. Com Template Registrado por String

#### Passo 1: Registre os componentes durante a inicialização (ex: em `app.config.ts`)

```typescript
import { ApplicationConfig } from '@angular/core';
import { AlertModalService } from './components/alert-modal/alert-modal.service';
import { MeuComponenteModal } from './components/meu-componente-modal';
import { OutroComponente } from './components/outro-componente';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: 'ALERT_MODAL_INIT',
      useFactory: (alertService: AlertModalService) => {
        alertService.registerComponentTemplates({
          'meu-modal': MeuComponenteModal,
          'outro-modal': OutroComponente,
        });
        return null;
      },
      deps: [AlertModalService],
    },
  ],
};
```

#### Passo 2: Use a string como referência

```typescript
this.servicoAlert.open({
  template: 'meu-modal',
});
```

## Propriedades do AlertOptions

```typescript
interface AlertOptions {
  titulo?: string;
  mensagem?: string;
  icon?: AlertIcon;
  template?: Type<any> | string;
  fecharAoClicarFundo?: boolean;
  botoes?: AlertButton[];
  semBotoes?: boolean;
  data?: unknown;
  on?: Record<string, (eventData?: any) => void>;
  id?: string;
  fragment?: string;
  fragmented?: boolean;
  kind?: 'modal' | 'drawer';
  closeOnFragmentRemoval?: boolean;
}
```

## 4. Com Dados Injetados no Template

O componente pode acessar dados via `ModalDataService`:

```typescript
import { inject } from '@angular/core';
import { ModalDataService } from './components/alert-modal/modal-data.service';

@Component({
  // ...
})
export class MeuComponenteModal {
  private modalData = inject(ModalDataService);
  dados = this.modalData.obterDados<{ nome: string; valor: number }>();
}

// Usar:
this.servicoAlert.modal({
  template: MeuComponenteModal,
  data: { nome: 'João', valor: 100 }
})
```

## 5. Com Eventos (Listeners)

O componente pode emitir eventos que são capturados na chamada do modal:

```typescript
// componente-pagamento.component.ts
import { Component, inject } from '@angular/core';
import { ModalEventsService } from './components/alert-modal/modal-events.service';

@Component({
  selector: 'app-modal-pagamento',
  standalone: true,
  template: `
    <div class="p-4">
      <button (click)="confirmarPagamento()">Confirmar Pagamento</button>
      <button (click)="cancelarPagamento()">Cancelar</button>
    </div>
  `
})
export class ModalPagamentoComponent {
  private modalEvents = inject(ModalEventsService);

  confirmarPagamento(): void {
    // Emitir evento com dados
    this.modalEvents.emitir('pagamento_confirmado', {
      id: 123,
      valor: 100,
      referencia: 'PAG-2024-001'
    });
  }

  cancelarPagamento(): void {
    // Emitir evento sem dados
    this.modalEvents.emitir('pagamento_cancelado');
  }
}

// Uso:
this.servicoAlert.modal({
  template: ModalPagamentoComponent,
  on: {
    pagamento_confirmado(eventData) {
      console.log('Pagamento confirmado:', eventData);
      // Handle dados do pagamento
    },
    pagamento_cancelado() {
      console.log('Pagamento cancelado');
    },
    erro(error) {
      console.error('Erro:', error);
    }
  }
})
```

## Exemplo Completo

### 1. Criar um componente customizado

```typescript
// confirmacao-pagamento.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmacao-pagamento',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4">
      <h3 class="font-bold mb-4">Detalhes do Pagamento</h3>
      <div class="space-y-2">
        <p><strong>Valor:</strong> €100,00</p>
        <p><strong>Referência:</strong> PAG-2024-001</p>
        <p><strong>Data:</strong> 27/04/2024</p>
      </div>
    </div>
  `,
})
export class ConfirmacaoPagamentoComponent {}
```

### 2. Usar o componente no modal

```typescript
// seu-componente.ts
import { AlertModalService } from './components/alert-modal/alert-modal.service';
import { ConfirmacaoPagamentoComponent } from './confirmacao-pagamento.component';

export class SeuComponente {
  constructor(private alertService: AlertModalService) {}

  mostrarConfirmacao() {
    this.alertService.modal({
      titulo: "Pagamento Aceite com Sucesso",
      template: ConfirmacaoPagamentoComponent,
      botoes: [
        { label: 'Fechar', variant: 'primary', closeOnClick: true },
      ]
    });
  }

  // Ou com string (se registrado)
  mostrarConfirmacaoString() {
    this.alertService.modal({
      template: 'confirmacao-pagamento',
      botoes: [
        { label: 'Fechar', variant: 'primary', closeOnClick: true },
      ]
    });
  }
}
```

## Injetar Dados no Template

Agora é possível injetar dados no componente template que será renderizado dentro do modal. Os dados são acessados através do `ModalDataService`.

### Como usar:

#### 1. Passar dados ao criar o modal

```typescript
import { AlertModalService } from './components/alert-modal/alert-modal.service';

export class ItemListSolicitacaoEmpresaComponent {
  servicoAlert = inject(AlertModalService);
  
  abrirModalComDados(solicitacao: TecnicoSolicitacao) {
    this.servicoAlert.modal({
      template: AgendarSolicitacaoFormComponent,
      fecharAoClicarFundo: false,
      semBotoes: true,
      temHeader: true,
      titulo: "Agendar Visita",
      id: "modal-agendar-visita",
      data: solicitacao  // <-- Injetar dados aqui
    });
  }
}
```

#### 2. Acessar os dados no componente template

```typescript
import { ModalDataService } from '../../../components/alert-modal/modal-data.service';
import { TecnicoSolicitacao } from '../../../pages/portal-tecnico/tecnico.types';

@Component({
  selector: 'app-agendar-solicitacao-form',
  templateUrl: 'agendar-solicitacao-form.html',
  imports: [CommonModule, ReactiveFormsModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgendarSolicitacaoFormComponent {
  private fb = inject(FormBuilder);
  private modalData = inject(ModalDataService);
  
  // Obter dados injetados do modal com type-safety
  data = computed(() => this.modalData.obterDados<TecnicoSolicitacao>());
  
  // Ou usar o signal bruto
  dadosSignal = this.modalData.obterDadosSignal();
  
  onSubmit() {
    // Usar os dados
    console.log('Dados da solicitação:', this.data());
  }
}
```

#### 3. Usar os dados no template

```html
<form [formGroup]="form">
  <!-- Dados do modal disponíveis -->
  @if (data(); as solicitacao) {
    <div class="solicitacao-info">
      <p><strong>ID:</strong> {{ solicitacao.id }}</p>
      <p><strong>Estado:</strong> {{ solicitacao.estado }}</p>
      <p><strong>Data:</strong> {{ solicitacao.data }}</p>
    </div>
  }
  
  <!-- Resto do formulário -->
  <input formControlName="tecnico_id" />
</form>
```

## Tipos de Dados Suportados

O `ModalDataService` aceita qualquer tipo de dado:

```typescript
// Objeto simples
this.servicoAlert.modal({
  template: MeuComponente,
  data: { id: 1, nome: 'João' }
});

// Array
this.servicoAlert.modal({
  template: MeuComponente,
  data: [{ id: 1 }, { id: 2 }]
});

// String
this.servicoAlert.modal({
  template: MeuComponente,
  data: 'Mensagem de contexto'
});

// Qualquer tipo
this.servicoAlert.modal({
  template: MeuComponente,
  data: minhaVariavel
});
```

## Exemplo Completo

### Componente pai (ItemListSolicitacaoEmpresa)

```typescript
export class ItemListSolicitacaoEmpresaComponent {
  servicoAlert = inject(AlertModalService);
  
  abrirAgendamento(solicitacao: TecnicoSolicitacao) {
    this.servicoAlert.modal({
      template: AgendarSolicitacaoFormComponent,
      id: 'agendar-visita',
      titulo: 'Agendar Visita',
      semBotoes: true,
      fecharAoClicarFundo: false,
      data: solicitacao // <-- Dados da solicitação
    });
  }
}
```

### Componente template (AgendarSolicitacaoForm)

```typescript
@Component({
  selector: 'app-agendar-solicitacao-form',
  templateUrl: './agendar-solicitacao-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgendarSolicitacaoFormComponent {
  private fb = inject(FormBuilder);
  private modalData = inject(ModalDataService);
  private servicoAlert = inject(AlertModalService);
  
  // Dados injetados do modal
  data = computed(() => this.modalData.obterDados<TecnicoSolicitacao>());
  
  form = this.fb.group({
    tecnico_id: ['', Validators.required],
    local_visita: ['', Validators.required],
  });
  
  onSubmit() {
    const solicitacao = this.data();
    if (!solicitacao) {
      this.servicoAlert.modal({
        mensagem: 'Dados inválidos',
        icon: 'error'
      });
      return;
    }
    
    // Usar dados da solicitação
    console.log('Agendando para solicitação:', solicitacao.id);
  }
  
  onCancel() {
    this.servicoAlert.fechar('agendar-visita');
  }
}
```

### Template (agendar-solicitacao-form.html)

```html
@if (data(); as solicitacao) {
  <div class="mb-4 p-4 bg-gray-100 rounded">
    <h3 class="font-bold mb-2">Detalhes da Solicitação</h3>
    <p><strong>ID:</strong> {{ solicitacao.id }}</p>
    <p><strong>Status:</strong> {{ solicitacao.estado }}</p>
  </div>
} @else {
  <div class="text-red-600">Nenhuma solicitação selecionada</div>
}

<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <!-- Campos do formulário -->
</form>
```

## Usando Dados + Eventos Combinados

```typescript
// Dados para passar
interface DadosPagamento {
  id: number;
  valor: number;
  cliente: string;
}

// Componente do modal
@Component({
  selector: 'app-modal-pagamento',
  standalone: true,
  template: `
    @if (dadosPagamento(); as dados) {
      <div class="p-6 space-y-4">
        <h3 class="font-bold">Confirmar Pagamento</h3>
        <p><strong>Cliente:</strong> {{ dados.cliente }}</p>
        <p><strong>Valor:</strong> {{ dados.valor | currency }}</p>
        
        <button (click)="confirmar()">Confirmar</button>
        <button (click)="rejeitar()">Rejeitar</button>
      </div>
    }
  `
})
export class ModalPagamentoComponent {
  private modalData = inject(ModalDataService);
  private modalEvents = inject(ModalEventsService);
  
  dadosPagamento = this.modalData.obterDadosSignal<DadosPagamento>();
  
  confirmar(): void {
    this.modalEvents.emitir('pagamento_confirmado', {
      id: this.dadosPagamento()?.id,
      timestamp: new Date().toISOString()
    });
  }
  
  rejeitar(): void {
    this.modalEvents.emitir('pagamento_rejeitado');
  }
}

// Usando o modal com dados e eventos:
this.alertService.modal({
  template: ModalPagamentoComponent,
  semBotoes: true,
  data: { id: 123, valor: 150.50, cliente: 'João' },
  on: {
    pagamento_confirmado(eventData) {
      console.log('Confirmado:', eventData);
      // { id: 123, timestamp: "2024-04-27T10:30:00.000Z" }
    },
    pagamento_rejeitado() {
      console.log('Rejeitado');
    }
  }
});
```

## Compatibilidade

- ✅ Mantém compatibilidade com código existente (mensagem simples)
- ✅ Se `template` e `mensagem` forem fornecidos, `template` tem prioridade
- ✅ Suporta qualquer componente standalone do Angular
- ✅ Dados e eventos funcionam opcionalmente
- ✅ Listeners podem ser omitidos se não precisar de eventos

<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div class="form-group mb-4">
    <label for="tecnico">Técnico:</label>
    <select formControlName="tecnico_id" id="tecnico">
      <option value="">Selecione...</option>
    </select>
  </div>
  
  <div class="flex gap-2">
    <button type="submit" class="btn btn-primary">Agendar</button>
    <button type="button" (click)="onCancel()" class="btn btn-secondary">Cancelar</button>
  </div>
</form>
```

## API do ModalDataService

| Método | Descrição | Retorno |
|--------|-----------|---------|
| `obterDados<T>()` | Obtém os dados com type-safety | `T \| null` |
| `obterDadosSignal()` | Obtém o signal bruto dos dados | `Signal<unknown>` |
| `definirDados(dados)` | Define novos dados (uso avançado) | `void` |
| `limpar()` | Limpa os dados | `void` |

## Notas Importantes

- ✅ Os dados são automaticamente injetados quando o modal é criado
- ✅ Use `inject(ModalDataService)` para acessar os dados no componente template
- ✅ Use `computed()` para reatividade automática quando os dados mudam
- ✅ É type-safe: `obterDados<T>()` garante type-checking
- ✅ Funciona com qualquer tipo de dado (objetos, arrays, strings, etc.)
- ✅ Os dados são limpos automaticamente quando o modal é fechado



Agora é possível ter vários modais abertos ao mesmo tempo e fechá-los individualmente por ID:

#### 1. Criar um modal com ID identificável

```typescript
// seu-componente.ts
import { AlertModalService } from './components/alert-modal/alert-modal.service';

export class SeuComponente {
  constructor(private alertService: AlertModalService) {}

  abrirMultiploModais() {
    // Modal de notificação
    this.alertService.modal({
      id: 'notificacao-importante',
      titulo: 'Notificação',
      mensagem: 'Você tem uma mensagem nova',
      icon: 'info'
    });

    // Modal de confirmação
    this.alertService.modal({
      id: 'confirmacao-acao',
      titulo: 'Confirmar?',
      mensagem: 'Deseja continuar com esta ação?',
      icon: 'question',
      botoes: [
        { label: 'Cancelar', variant: 'secondary' },
        { label: 'Confirmar', variant: 'primary' }
      ]
    });
  }

  // Fechar um modal específico de qualquer lugar
  fecharNotificacao() {
    this.alertService.fechar('notificacao-importante');
  }

  // Fechar outro modal
  fecharConfirmacao() {
    this.alertService.fechar('confirmacao-acao');
  }

  // Fechar todos os modais abertos
  fecharTodos() {
    this.alertService.fecharTodos();
  }
}
```

### 2. Usar ID auto-gerado e armazenar referência

```typescript
export class SeuComponente {
  private ultimoModalId: string | null = null;

  constructor(private alertService: AlertModalService) {}

  abrirModal() {
    this.alertService.modal({
      titulo: 'Operação em Progresso',
      mensagem: 'Por favor, aguarde...',
      semBotoes: true
    });
    
    // Armazenar o ID do último modal aberto
    this.ultimoModalId = this.alertService.obterUltimoModalId();
  }

  // Fechar o modal depois de 5 segundos
  fecharAposDelay() {
    setTimeout(() => {
      if (this.ultimoModalId) {
        this.alertService.fechar(this.ultimoModalId);
      }
    }, 5000);
  }
}
```

### 3. Fechar de serviços ou outras partes da aplicação

```typescript
// Em qualquer lugar da aplicação (serviço, guard, interceptor, etc.)
import { AlertModalService } from './components/alert-modal/alert-modal.service';

export class MeuServiço {
  constructor(private alertService: AlertModalService) {}

  processarDados() {
    // Mostrar modal de carregamento
    this.alertService.modal({
      id: 'loading-dados',
      titulo: 'Carregando',
      mensagem: 'Processando dados...',
      semBotoes: true
    });

    // Fazer operação assíncrona
    setTimeout(() => {
      // Fechar modal de carregamento
      this.alertService.fechar('loading-dados');
      
      // Mostrar resultado
      this.alertService.sucesso('Dados processados com sucesso!');
    }, 3000);
  }
}
```

### Métodos Disponíveis

| Método | Descrição | Exemplo |
|--------|-----------|---------|
| `fechar(id)` | Fecha um modal específico | `alertService.fechar('meu-modal')` |
| `fecharTodos()` | Fecha todos os modais abertos | `alertService.fecharTodos()` |
| `obterUltimoModalId()` | Retorna o ID do último modal aberto | `const id = alertService.obterUltimoModalId()` |

## Métodos úteis

```typescript
this.servicoAlert.open({...});
this.servicoAlert.modal({...}); // alias de open
this.servicoAlert.openFragmented({...});
this.servicoAlert.fechar('meu-modal');
this.servicoAlert.close('meu-modal');
this.servicoAlert.fecharTodos();
this.servicoAlert.closeAll();
this.servicoAlert.obterUltimoModalId();
```

## Compatibilidade

- ✅ Mantém compatibilidade com código existente usando `modal(options)`
- ✅ A nova API `open(options)` é recomendada para fluxo novo
- ✅ Se `template` e `mensagem` forem fornecidos, `template` tem prioridade
- ✅ Suporta qualquer componente standalone do Angular
- ✅ Múltiplos modais abertos simultaneamente
- ✅ Fechar modais específicos por ID ou por fragmento
- ✅ Reabre automaticamente ao carregar a página com o mesmo fragmento
