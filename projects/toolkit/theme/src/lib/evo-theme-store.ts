import { isPlatformBrowser } from '@angular/common';
import {
  CSP_NONCE,
  DOCUMENT,
  Injectable,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  EVO_DARK_MODE_CONFIG,
  EVO_THEME_DEFAULTS,
  EVO_THEME_PERSISTENCE,
  EvoColorScheme,
  EvoThemeSnapshot,
  EvoTokenRecord,
  EvoVariantRecord,
  normalizeTokenName,
  normalizeTokens,
} from '@evolium-kit/toolkit/core';
import { buildThemeCss } from './build-theme-css';

const STYLE_ELEMENT_ID = 'evo-theme';

/**
 * Estado do tema e sua aplicação no documento.
 *
 * O CSS é gerado por `buildThemeCss()` (função pura, testável sem DOM) e
 * escrito num único `<style id="evo-theme">`. O elemento é procurado por `id`
 * antes de ser criado — é isso que evita duplicação na hidratação.
 */
@Injectable({ providedIn: 'root' })
export class EvoThemeStore {
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly nonce = inject(CSP_NONCE, { optional: true });
  private readonly defaults = inject(EVO_THEME_DEFAULTS);
  private readonly persistence = inject(EVO_THEME_PERSISTENCE, { optional: true });
  private readonly darkConfig = inject(EVO_DARK_MODE_CONFIG, { optional: true });

  private readonly _tokens = signal<EvoTokenRecord>(this.defaults.tokens);
  private readonly _darkTokens = signal<EvoTokenRecord>(this.defaults.darkTokens);
  private readonly _variants = signal<EvoVariantRecord>(this.defaults.variants);
  private readonly _scheme = signal<EvoColorScheme>(
    this.darkConfig?.initial ?? this.defaults.scheme,
  );
  private readonly _systemDark = signal(false);
  private readonly _dirty = signal(false);

  readonly tokens = this._tokens.asReadonly();
  readonly darkTokens = this._darkTokens.asReadonly();
  readonly variants = this._variants.asReadonly();
  readonly scheme = this._scheme.asReadonly();
  /** `true` quando há alterações por gravar. */
  readonly dirty = this._dirty.asReadonly();

  /** Esquema realmente aplicado. No servidor, `system` resolve sempre para claro. */
  readonly resolvedScheme = computed<'light' | 'dark'>(() => {
    const scheme = this._scheme();
    if (scheme !== 'system') return scheme;
    return this._systemDark() ? 'dark' : 'light';
  });

  /** Tokens em vigor para o esquema activo — é isto que o Studio mostra. */
  readonly activeTokens = computed<EvoTokenRecord>(() =>
    this.resolvedScheme() === 'dark'
      ? { ...this._tokens(), ...this._darkTokens() }
      : this._tokens(),
  );

  readonly css = computed(() =>
    buildThemeCss({
      tokens: this._tokens(),
      darkTokens: this._darkTokens(),
      variants: this._variants(),
    }),
  );

  private styleElement: HTMLStyleElement | null = null;

  constructor() {
    // Escrita síncrona inicial: corre no servidor e no browser, antes do
    // primeiro render. É o que garante que o HTML servido já leva o tema.
    this.flushToDom(untracked(this.css));
    this.applySchemeAttribute(untracked(this.resolvedScheme));

    effect(() => this.flushToDom(this.css()));
    effect(() => this.applySchemeAttribute(this.resolvedScheme()));

    if (this.isBrowser && this.darkConfig?.followSystem !== false) {
      const view = this.doc.defaultView;
      if (view?.matchMedia) {
        const query = view.matchMedia('(prefers-color-scheme: dark)');
        this._systemDark.set(query.matches);
        query.addEventListener('change', (event) => this._systemDark.set(event.matches));
      }
    }
  }

  // ---------------------------------------------------------------- mutações

  setToken(name: string, value: string): void {
    const key = normalizeTokenName(name);
    if (this.resolvedScheme() === 'dark') {
      this._darkTokens.update((tokens) => ({ ...tokens, [key]: value }));
    } else {
      this._tokens.update((tokens) => ({ ...tokens, [key]: value }));
    }
    this._dirty.set(true);
  }

  patchTokens(patch: Readonly<Record<string, string>>): void {
    const normalized = normalizeTokens(patch);
    this._tokens.update((tokens) => ({ ...tokens, ...normalized }));
    this._dirty.set(true);
  }

  setVariantToken(component: string, variant: string, name: string, value: string): void {
    const key = `${component}.${variant}`;
    const token = normalizeTokenName(name);
    this._variants.update((variants) => ({
      ...variants,
      [key]: { ...(variants[key] ?? {}), [token]: value },
    }));
    this._dirty.set(true);
  }

  /** Valor actualmente em vigor para um token, já resolvido para o esquema activo. */
  tokenValue(name: string, variantKey?: string): string | undefined {
    const key = normalizeTokenName(name);
    if (variantKey) {
      const value = this._variants()[variantKey]?.[key];
      if (value !== undefined) return value;
      return undefined;
    }
    return this.activeTokens()[key];
  }

  setScheme(scheme: EvoColorScheme): void {
    this._scheme.set(scheme);
  }

  toggleScheme(): void {
    this.setScheme(this.resolvedScheme() === 'dark' ? 'light' : 'dark');
  }

  reset(): void {
    this._tokens.set(this.defaults.tokens);
    this._darkTokens.set(this.defaults.darkTokens);
    this._variants.set(this.defaults.variants);
    this._scheme.set(this.defaults.scheme);
    this._dirty.set(false);
  }

  // ------------------------------------------------------------ persistência

  snapshot(): EvoThemeSnapshot {
    return {
      id: this.defaults.id,
      name: this.defaults.name,
      version: 1,
      tokens: this._tokens(),
      darkTokens: this._darkTokens(),
      variants: this._variants(),
      scheme: this._scheme(),
      updatedAt: new Date().toISOString(),
    };
  }

  async restore(): Promise<void> {
    if (!this.persistence) return;
    const saved = await this.persistence.load();
    if (!saved || saved.version !== 1) return;

    // Fundir sobre os defaults, nunca substituir. Um snapshot guardado descreve
    // o que o utilizador alterou, não a totalidade do tema: se substituísse,
    // um tema gravado com uma versão antiga da toolkit apagaria todos os tokens
    // acrescentados entretanto — incluindo a paleta escura inteira, se tiver
    // sido gravado antes de esta existir.
    this._tokens.set({ ...this.defaults.tokens, ...saved.tokens });
    this._darkTokens.set({ ...this.defaults.darkTokens, ...saved.darkTokens });
    this._variants.set({ ...this.defaults.variants, ...saved.variants });
    this._scheme.set(saved.scheme);
    this._dirty.set(false);
  }

  async persist(): Promise<void> {
    if (!this.persistence) return;
    await this.persistence.save(this.snapshot());
    this._dirty.set(false);
  }

  async clearPersisted(): Promise<void> {
    await this.persistence?.clear();
    this.reset();
  }

  // -------------------------------------------------------------------- DOM

  private flushToDom(css: string): void {
    const element = this.resolveStyleElement();
    if (element.textContent !== css) {
      element.textContent = css;
    }
  }

  private resolveStyleElement(): HTMLStyleElement {
    if (this.styleElement?.isConnected) return this.styleElement;

    const existing = this.doc.getElementById(STYLE_ELEMENT_ID);
    if (existing) {
      this.styleElement = existing as HTMLStyleElement;
      return this.styleElement;
    }

    const element = this.doc.createElement('style');
    element.id = STYLE_ELEMENT_ID;
    if (this.nonce) element.setAttribute('nonce', this.nonce);
    this.doc.head.appendChild(element);
    this.styleElement = element;
    return element;
  }

  private applySchemeAttribute(scheme: 'light' | 'dark'): void {
    const root = this.doc.documentElement;
    if (this._scheme() === 'system') {
      root.removeAttribute('data-evo-scheme');
    } else {
      root.setAttribute('data-evo-scheme', scheme);
    }
  }
}
