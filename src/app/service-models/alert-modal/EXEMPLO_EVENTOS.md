# Exemplo Prático: Modal com Eventos

Este é um exemplo completo implementando o uso exato que você solicitou:

```typescript
this.alertService.modal({
  template: ModalPagamentoExpressCounter,
  semBotoes: false,
  botoes: [
    { label: "Cancelar", variant: "secondary" }
  ],
  on: {
    finalisou(eventData) {
      // Executa quando ModalPagamentoExpressCounter emitir 'finalisou'
    }
  }
})
```

## Passo 1: Criar o Componente do Modal

```typescript
// modal-pagamento-express-counter.component.ts
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalEventsService } from '../components/alert-modal/modal-events.service';
import { ModalDataService } from '../components/alert-modal/modal-data.service';

interface DadosPagamento {
  id: number;
  valor: number;
  metodo: string;
}

@Component({
  selector: 'app-modal-pagamento-express-counter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 space-y-6">
      <!-- Contador -->
      <div class="flex items-center justify-between">
        <h3 class="font-bold text-lg">Processando Pagamento</h3>
        <div class="text-4xl font-bold text-orange-500">
          {{ contagem() }}s
        </div>
      </div>

      <!-- Status -->
      <div class="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
        <p class="text-sm text-blue-700">
          Aguarde enquanto processamos seu pagamento...
        </p>
      </div>

      <!-- Dados do Pagamento -->
      @if (dadosPagamento(); as dados) {
        <div class="space-y-2 bg-gray-50 p-4 rounded">
          <p><strong>Valor:</strong> {{ dados.valor | currency }}</p>
          <p><strong>Método:</strong> {{ dados.metodo }}</p>
          <p><strong>ID Transação:</strong> {{ dados.id }}</p>
        </div>
      }

      <!-- Progresso -->
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          class="bg-orange-500 h-2 rounded-full transition-all duration-300"
          [style.width.%]="(100 - contagem() * 10) | async">
        </div>
      </div>
    </div>
  `
})
export class ModalPagamentoExpressCounterComponent {
  private modalEvents = inject(ModalEventsService);
  private modalData = inject(ModalDataService);

  contagem = signal(10);
  dadosPagamento = this.modalData.obterDadosSignal<DadosPagamento>();

  constructor() {
    this.iniciarContagem();
  }

  private iniciarContagem(): void {
    const interval = setInterval(() => {
      const novaContagem = this.contagem() - 1;
      this.contagem.set(novaContagem);

      if (novaContagem <= 0) {
        clearInterval(interval);
        this.finalizarPagamento();
      }
    }, 1000);
  }

  private finalizarPagamento(): void {
    // Emitir evento com os dados
    this.modalEvents.emitir('finalisou', {
      id: this.dadosPagamento()?.id,
      status: 'sucesso',
      timestamp: new Date().toISOString(),
      mensagem: 'Pagamento processado com sucesso'
    });
  }
}
```

## Passo 2: Usar o Modal em um Componente

```typescript
// seu-componente.ts
import { Component, inject } from '@angular/core';
import { AlertModalService } from '../components/alert-modal/alert-modal.service';
import { ModalPagamentoExpressCounterComponent } from './modal-pagamento-express-counter.component';

interface DadosPagamento {
  id: number;
  valor: number;
  metodo: string;
}

@Component({
  selector: 'app-pagamento',
  template: `
    <button (click)="abrirModalPagamento()">
      Processar Pagamento
    </button>
  `
})
export class PagamentoComponent {
  private alertService = inject(AlertModalService);

  abrirModalPagamento(): void {
    const dadosPagamento: DadosPagamento = {
      id: 123456,
      valor: 150.50,
      metodo: 'Cartão de Crédito'
    };

    this.alertService.modal({
      titulo: 'Processando Pagamento',
      template: ModalPagamentoExpressCounterComponent,
      semBotoes: false,
      botoes: [
        {
          label: "Cancelar",
          variant: "secondary",
          onClick: () => console.log('Pagamento cancelado')
        }
      ],
      fecharAoClicarFundo: false,
      data: dadosPagamento, // <-- Passar dados para o modal
      on: {
        finalisou(eventData) {
          // Evento disparado quando o contador chega a 0
          console.log('Pagamento finalizado:', eventData);
          // Output:
          // {
          //   id: 123456,
          //   status: 'sucesso',
          //   timestamp: '2024-04-27T10:30:00.000Z',
          //   mensagem: 'Pagamento processado com sucesso'
          // }

          // Você pode fazer qualquer coisa aqui
          this.registrarPagamento(eventData);
          this.atualizarUI();
          this.enviarNotificacao();
        }
      }
    });
  }

  private registrarPagamento(eventData: any): void {
    console.log('Registrando pagamento:', eventData);
  }

  private atualizarUI(): void {
    console.log('Atualizando UI');
  }

  private enviarNotificacao(): void {
    console.log('Enviando notificação');
  }
}
```

## Recursos Disponíveis

### ModalEventsService (no componente do modal)

```typescript
private modalEvents = inject(ModalEventsService);

// Emitir evento com dados
modalEvents.emitir('finalisou', { id: 123, status: 'sucesso' });

// Emitir evento sem dados
modalEvents.emitir('cancelado');

// Múltiplos eventos
modalEvents.emitir('progresso', { percentual: 50 });
modalEvents.emitir('erro', { codigo: 'E001', mensagem: 'Erro ao processar' });
```

### ModalDataService (no componente do modal)

```typescript
private modalData = inject(ModalDataService);

// Obter dados como signal
const dados = this.modalData.obterDadosSignal<DadosPagamento>();

// Obter dados diretamente
const dadosAtual = this.modalData.obterDados<DadosPagamento>();

// Limpar dados
this.modalData.limpar();
```

## Tipos Suportados para EventData

```typescript
// Qualquer tipo de dado é suportado
on: {
  // Objeto
  evento1(data: { id: number; status: string }) { },

  // Array
  evento2(data: number[]) { },

  // String
  evento3(data: string) { },

  // null/undefined
  evento4(data?: any) { },

  // Qualquer tipo
  evento5(data: any) { }
}
```

## Notas Importantes

1. **Listeners são Opcionais**: Se você não precisar de eventos, não inclua `on`
2. **Múltiplos Eventos**: O mesmo modal pode emitir vários eventos diferentes
3. **Tipo Seguro**: Use TypeScript para tipar seus eventos
4. **Limpeza Automática**: Listeners são limpos quando o modal fecha
5. **Tratamento de Erros**: Erros em listeners não afetam o modal
