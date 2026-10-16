import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  output,
  Type,
  Injector,
  input,
} from '@angular/core';
import { AlertOptions, AlertResult, AlertIcon } from './alert-modal.types';
import { ModalGenericoComponent } from "../modal-generico/modal-generico";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { saxInfoCircleOutline, saxTickCircleOutline, saxCloseCircleOutline, saxVerifyOutline } from '@ng-icons/iconsax/outline';
import { CommonModule } from '@angular/common';

interface IconConfig {
  name: string;
  color: string;
  bgClass: string;
}

@Component({
  selector: 'app-alert-modal',
  viewProviders: [provideIcons({ saxTickCircleOutline, saxInfoCircleOutline, saxCloseCircleOutline, saxVerifyOutline })],
  imports: [ModalGenericoComponent, CommonModule, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-generico
      [isAberto]="isAberto()"
      [headerVisisvel]="opcoes().temHeader!"
      [titulo]="opcoes().temHeader && opcoes().titulo ? opcoes().titulo!  : ''"
      [tamanho]="opcoes().tamanho ? opcoes().tamanho! : 'pequeno'"
      [fecharAoClicarFundo]="opcoes().fecharAoClicarFundo ?? false"
      [isModalPersonalizado]="true"
      (aoFechar)="fechar()">
      <div class="flex flex-col justify-between  h-full gap-4">
          <!-- Ícone -->
          @if (opcoes().icon) {
            <div class="flex justify-center mb-4 mt-8 cursor-pointer">
              <div
                class="w-20 h-20 rounded-full flex items-center justify-center "
                [class]="iconConfig().color">
                <ng-icon [name]="iconConfig().name" size="80" [color]="iconConfig().color"/>
              </div>
            </div>
          }
          <!-- Template Dinâmico -->
         <ng-container [ngComponentOutlet]="templateComponente()"
                    [ngComponentOutletInjector]="injectorCustomizado() ?? undefined">
       </ng-container>

          <!-- Mensagem (compatível com uso anterior) -->
          @if (opcoes().mensagem && !templateComponente()) {
            <p class="text-md text-gray-600 text-center mb-6 px-6">
              {{ opcoes().mensagem }}
            </p>
          }
        </div>
        @if (!opcoes().semBotoes) {
          <div slot="footer" class="flex justify-center self-end py-3">

                <div class="flex gap-4">
                  @for (botao of botoesResolvidos(); track $index) {
                  <button
                    [class]="estilosBotao(botao.variant ?? 'primary')"
                    (click)="clicarBotao($index)">
                    {{ botao.label }}
                    </button>
                  }
                </div>
          </div>
        }
    </app-modal-generico>
  `,
})
export class AlertModalComponent {
  isAberto = input<boolean>(false);
  opcoes = signal<AlertOptions>({});
  modalId = signal<string>('');
  data = signal<unknown | null>(null)
  injectorCustomizado = signal<Injector | null>(null);
  aoResolver = output<AlertResult>();

  // Mapa de componentes registrados (você pode expandir isso)
  private registeredComponents = new Map<string, Type<any>>();
  templateComponente = computed((): Type<any> | null => {
    const template = this.opcoes().template;
    if (!template) return null;

    // Se for um Type (importado diretamente), usa direto
    if (typeof template === 'function') {
      return template as Type<any>;
    }

    // Se for uma string, tenta encontrar no registro
    if (typeof template === 'string') {
      return this.registeredComponents.get(template) ?? null;
    }

    return null;
  });

  /**
   * Registra um componente para que possa ser referenciado por string
   * Exemplo: registerComponent('modal-confirmacao', MeuComponente)
   * Uso: { template: 'modal-confirmacao' }
   */
  registerComponent(key: string, component: Type<any>): void {
    this.registeredComponents.set(key, component);
  }

  /**
   * Registra múltiplos componentes de uma vez
   */
  registerComponents(components: Record<string, Type<any>>): void {
    Object.entries(components).forEach(([key, component]) => {
      this.registeredComponents.set(key, component);
    });
  }

  botoesResolvidos = computed(() => {
    const botoes = this.opcoes().botoes;
    if (botoes && botoes.length > 0) return botoes;
    return [{ label: 'Confirmar', variant: 'primary' as const, closeOnClick: true }];
  });

  iconConfig = computed((): IconConfig => {
    const map: Record<AlertIcon, IconConfig> = {
      success: {
        name: 'saxTickCircleOutline',
        color: '#098700',
        bgClass: 'bg-green-100',
      },
      error: {
        name: 'saxCloseCircleOutline',
        color: '#fd0909',
        bgClass: 'bg-red-100',
      },
      warning: {
        name: 'saxInfoCircleOutline',
        color: '#E47202',
        bgClass: 'bg-yellow-100',
      },
      info: {
        name: 'saxInfoCircleOutline',
        color: '#0085B5',
        bgClass: 'bg-blue-100',
      },
      question: {
        name: 'saxInfoCircleOutline',
        color: '#0085B5',
        bgClass: 'bg-purple-100',
      },
      verify: {
        name: 'saxVerifyOutline',
        color: '#098700',
        bgClass: 'bg-white'
      }
    };
    return map[this.opcoes().icon ?? 'info'];
  });

  estilosBotao(variant: 'primary' | 'secondary' | 'danger'): string {
    const base = 'px-6 py-2 rounded-full transition-all hover:scale-105 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed min-w-28 flex items-center justify-center text-sm font-medium';
    const variants: Record<string, string> = {
      primary: 'bg-brand-orange-500 text-white hover:bg-[#D96100]',
      secondary: 'button',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    return `${base} ${variants[variant]}`;
  }

  async clicarBotao(index: number): Promise<void> {
    const botao = this.botoesResolvidos()[index];
    if (botao.onClick) await botao.onClick();
    if (botao.closeOnClick !== false) {
      this.aoResolver.emit({ confirmado: index === this.botoesResolvidos().length - 1, botaoIndex: index });
    }
  }

  fechar(): void {

  
    this.aoResolver.emit({ confirmado: false });
  }
}
