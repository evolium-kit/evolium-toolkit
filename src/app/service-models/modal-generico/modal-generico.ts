import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertModelTamanho } from './modal-generico.types';

@Component({
  selector: 'app-modal-generico',
  templateUrl: './modal-generico.html',
  styleUrl: './modal-generico.css',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class ModalGenericoComponent {
  isAberto = input<boolean>(false);
  titulo = input<string>('');
  tamanho = input<AlertModelTamanho>('medio');
  fecharAoClicarFundo = input<boolean>(false)
  headerVisisvel = input<boolean>(true);
  isModalPersonalizado = input<boolean>(false)

  aoFechar = output<void>();

  fechar() {
    this.aoFechar.emit();
  }
  tamanhoClass = computed(() => {
    const map: Record<AlertModelTamanho, string> = {
      pequeno: 'md:w-sm',
      medio: 'md:w-md',
      grande: 'md:w-lg',
      xgrande: 'md:w-2xl',
      full: 'w-full h-full',
      xlgrande: 'w-[80%]'
    };
    return map[this.tamanho()] ?? 'md:w-md';
  })

  aoClicarNoFundoFn(evento: MouseEvent) {
    if (this.fecharAoClicarFundo()) {
      this.fechar();
    }
  }
}
