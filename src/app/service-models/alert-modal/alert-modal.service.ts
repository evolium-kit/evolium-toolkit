import {
  Injectable,
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  signal,
  inject,
  Type,
  Injector,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { startWith } from 'rxjs';
import { AlertOptions, AlertResult } from './alert-modal.types';
import { AlertModalComponent } from './alert-modal.component';
import { ModalDataService } from './modal-data.service';
import { ModalEventsService } from './modal-events.service';

type ModalEntry = {
  componentRef: any;
  hostElement: HTMLElement;
  options: AlertOptions;
  modalId: string;
};

@Injectable({ providedIn: 'root' })
export class AlertModalService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modaisAbertos = new Map<string, ModalEntry>();
  private modaisPorFragment = new Map<string, string>();
  private fragmentRegistry = new Map<string, AlertOptions>();
  private contadorId = 0;
  private fragmentWatcherInitialized = false;
  optionsGlobal = signal<AlertOptions | null>(null);

  constructor() {
    this.inicializarObservacaoFragmento();
  }

  open(options: AlertOptions): Promise<AlertResult> {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('AlertModalService.open() chamado no servidor. Modal não será criado.');
      return Promise.resolve({ confirmado: false });
    }

    const optionsNormalizadas = this.normalizarOpcoes(options);
    const fragment = this.resolverFragmento(optionsNormalizadas);

    if (fragment) {
      this.fragmentRegistry.set(fragment, { ...optionsNormalizadas, fragment });
    }

    this.optionsGlobal.set(optionsNormalizadas);

    return new Promise<AlertResult>((resolve) => {
      const modalId = optionsNormalizadas.id || `modal_${this.contadorId++}_${Date.now()}`;
      const hostElement = document.createElement('div');
      document.body.appendChild(hostElement);

      const injectorCustomizado = Injector.create({
        parent: this.injector,
        providers: [
          {
            provide: ModalDataService,
            useFactory: () => {
              const service = new ModalDataService();
              if (optionsNormalizadas?.data !== undefined) {
                service.definirDados(optionsNormalizadas.data);
              }
              return service;
            },
          },
          {
            provide: ModalEventsService,
            useFactory: () => {
              const service = new ModalEventsService();
              if (optionsNormalizadas?.on) {
                service.registrarMultiplos(optionsNormalizadas.on);
              }
              return service;
            },
          },
        ],
      }) as any as EnvironmentInjector;

      const componentRef = createComponent(AlertModalComponent, {
        environmentInjector: injectorCustomizado,
        hostElement,
      });

      componentRef.instance.opcoes.set({ ...optionsNormalizadas, id: modalId, fragment: fragment ?? undefined });
      componentRef.setInput('isAberto', true);
      componentRef.instance.modalId.set(modalId);
      componentRef.instance.injectorCustomizado.set(injectorCustomizado);

      this.modaisAbertos.set(modalId, { componentRef, hostElement, options: optionsNormalizadas, modalId });

      if (fragment) {
        this.modaisPorFragment.set(fragment, modalId);
      }

      componentRef.instance.aoResolver.subscribe((result: AlertResult) => {
        resolve(result);
        this.fecharModal(modalId);
        componentRef.instance.opcoes()?.on?.['fechar']?.();
      });

      this.sincronizarFragmento(fragment, optionsNormalizadas);
      this.appRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();
    });
  }

  modal(options: AlertOptions): Promise<AlertResult> {
    return this.open(options);
  }

  openFragmented(options: AlertOptions): Promise<AlertResult> {
    return this.open({ ...options, fragmented: true });
  }

  registerFragment(fragment: string, options: AlertOptions): void {
    this.fragmentRegistry.set(fragment, { ...options, fragment });
  }

  fechar(modalIdOrFragment: string): boolean {
    const modalInfo = this.modaisAbertos.get(modalIdOrFragment);
    if (modalInfo) {
      return this.fecharModal(modalIdOrFragment);
    }

    const modalId = this.modaisPorFragment.get(modalIdOrFragment);
    if (modalId) {
      return this.fecharModal(modalId);
    }

    console.warn(`Modal com referência "${modalIdOrFragment}" não encontrado`);
    return false;
  }

  close(modalIdOrFragment: string): boolean {
    return this.fechar(modalIdOrFragment);
  }

  fecharTodos(): void {
    const ids = Array.from(this.modaisAbertos.keys());
    ids.forEach((id) => this.fecharModal(id));
  }

  closeAll(): void {
    this.fecharTodos();
  }

  obterUltimoModalId(): string | null {
    const ids = Array.from(this.modaisAbertos.keys());
    return ids.length > 0 ? ids[ids.length - 1] : null;
  }

  private inicializarObservacaoFragmento(): void {
    if (this.fragmentWatcherInitialized || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.fragmentWatcherInitialized = true;
    this.route.fragment.pipe(startWith(this.route.snapshot.fragment)).subscribe((fragmentoAtual) => {
      const fragment = fragmentoAtual?.trim();
      if (!fragment) {
        this.fecharModaisPorFragment();
        return;
      }

      const modalRegistrado = this.fragmentRegistry.get(fragment);
      if (!modalRegistrado) {
        return;
      }

      const modalJaAberto = this.modaisPorFragment.get(fragment);
      if (modalJaAberto) {
        return;
      }

      void this.open({ ...modalRegistrado, fragment });
    });
  }

  private normalizarOpcoes(options: AlertOptions): AlertOptions {
    return {
      ...options,
      kind: options.kind ?? 'modal',
      fragmented: options.fragmented ?? Boolean(options.fragment),
      closeOnFragmentRemoval: options.closeOnFragmentRemoval ?? true,
    };
  }

  private resolverFragmento(options: AlertOptions): string | null {
    if (options.fragment?.trim()) {
      return options.fragment.trim();
    }

    if (options.fragmented && options.id?.trim()) {
      return options.id.trim();
    }

    return null;
  }

  private sincronizarFragmento(fragment: string | null, options: AlertOptions): void {
    if (!fragment || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const currentUrlTree = this.router.parseUrl(this.router.url);
    if (currentUrlTree.fragment === fragment) {
      return;
    }

    currentUrlTree.fragment = fragment;
    void this.router.navigateByUrl(currentUrlTree);
  }

  private removerFragmentoDaUrl(fragment: string | null): void {
    if (!isPlatformBrowser(this.platformId) || !fragment) {
      return;
    }

    const currentUrlTree = this.router.parseUrl(this.router.url);
    if (currentUrlTree.fragment !== fragment) {
      return;
    }

    currentUrlTree.fragment = null;
    void this.router.navigateByUrl(currentUrlTree);
  }

  private fecharModaisPorFragment(): void {
    Array.from(this.modaisAbertos.keys()).forEach((modalId) => {
      const modalInfo = this.modaisAbertos.get(modalId);
      if (modalInfo?.options.fragment || modalInfo?.options.fragmented) {
        this.fecharModal(modalId);
      }
    });
  }

  private fecharModal(modalId: string): boolean {
    const modalInfo = this.modaisAbertos.get(modalId);
    if (!modalInfo) {
      return false;
    }

    const { componentRef, hostElement, options } = modalInfo;
    componentRef.setInput('isAberto', false);

    setTimeout(() => {
      componentRef.destroy();
      if (hostElement && hostElement.parentNode) {
        hostElement.parentNode.removeChild(hostElement);
      }
      this.modaisAbertos.delete(modalId);

      const fragmentAtivo = this.resolverFragmento(options);
      if (fragmentAtivo) {
        this.modaisPorFragment.delete(fragmentAtivo);
      }

      if (options?.fragmented || options?.fragment) {
        if (options.closeOnFragmentRemoval !== false) {
          this.removerFragmentoDaUrl(fragmentAtivo);
        }
      }
    }, 300);

    return true;
  }

  registerComponentTemplates(components: Record<string, Type<any>>): void {
    const hostElement = document.createElement('div');
    const componentRef = createComponent(AlertModalComponent, {
      environmentInjector: this.injector,
      hostElement,
    });

    componentRef.instance.registerComponents(components);
    componentRef.destroy();
  }

  sucesso(mensagem: string, titulo = 'Sucesso!'): Promise<AlertResult> {
    return this.modal({ titulo, mensagem, icon: 'success' });
  }

  erro(mensagem: string, titulo = 'Erro!'): Promise<AlertResult> {
    return this.modal({ titulo, mensagem, icon: 'error' });
  }

  aviso(mensagem: string, titulo = 'Atenção!'): Promise<AlertResult> {
    return this.modal({ titulo, mensagem, icon: 'warning' });
  }

  info(mensagem: string, titulo = 'Informação'): Promise<AlertResult> {
    return this.modal({ titulo, mensagem, icon: 'info' });
  }

  confirmar(mensagem: string, titulo = 'Confirmar?'): Promise<AlertResult> {
    return this.modal({
      titulo,
      mensagem,
      icon: 'question',
      botoes: [
        { label: 'Cancelar', variant: 'secondary', closeOnClick: true },
        { label: 'Confirmar', variant: 'primary', closeOnClick: true },
      ],
    });
  }
}
