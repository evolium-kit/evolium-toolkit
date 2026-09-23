import { DOCUMENT, Injectable, inject } from '@angular/core';
import { EvoThemeSnapshot } from '@evolium-kit/toolkit/core';
import { buildThemeCss } from '../build-theme-css';

export interface EvoThemeExportBundle {
  readonly css: string;
  readonly json: string;
}

/**
 * Exporta o tema como ficheiros para o programador committar no projecto.
 *
 * Esta é a segunda estratégia de persistência, e não colide com a de runtime:
 * o CSS gerado sai deliberadamente de `@layer evo.overrides`, pelo que ao ser
 * importado fora de camada no `styles.css` ganha ao que o `EvoThemeStore`
 * escreve. O ficheiro committado é a base de produção; o runtime serve para
 * experimentar por cima.
 */
@Injectable({ providedIn: 'root' })
export class EvoThemeExporter {
  private readonly doc = inject(DOCUMENT);

  build(snapshot: EvoThemeSnapshot): EvoThemeExportBundle {
    return { css: this.toCss(snapshot), json: this.toJson(snapshot) };
  }

  toJson(snapshot: EvoThemeSnapshot): string {
    return `${JSON.stringify(snapshot, null, 2)}\n`;
  }

  toCss(snapshot: EvoThemeSnapshot): string {
    const header =
      `/* Gerado pelo Evolium Theme Studio — ${snapshot.updatedAt}\n` +
      ` * Tema: ${snapshot.name} (${snapshot.id})\n` +
      ` *\n` +
      ` * NÃO editar à mão: regenerar no Studio e voltar a committar.\n` +
      ` * Importar em src/styles.css DEPOIS dos imports da toolkit.\n` +
      ` */\n`;

    const body = buildThemeCss({
      tokens: snapshot.tokens,
      darkTokens: snapshot.darkTokens,
      variants: snapshot.variants,
    })
      .replace(/^@layer evo\.overrides \{/, '')
      .replace(/\}$/, '');

    return header + prettify(body);
  }

  /** Só tem efeito no browser; no servidor é uma operação vazia. */
  download(filename: string, content: string, mime: string): void {
    const view = this.doc.defaultView;
    if (!view) return;

    const url = view.URL.createObjectURL(new Blob([content], { type: mime }));
    const anchor = this.doc.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    this.doc.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    view.setTimeout(() => view.URL.revokeObjectURL(url), 0);
  }

  downloadAll(snapshot: EvoThemeSnapshot): void {
    const { css, json } = this.build(snapshot);
    this.download('evolium-theme.css', css, 'text/css;charset=utf-8');
    this.download('evolium-theme.json', json, 'application/json;charset=utf-8');
  }
}

/** Formatação legível. O CSS de runtime é minificado; o exportado é para ler. */
function prettify(css: string): string {
  return css
    .replace(/\}/g, '}\n')
    .replace(/\{/g, ' {\n  ')
    .replace(/;(?!\n)/g, ';\n  ')
    .replace(/\n\s+\}/g, '\n}')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .concat('\n');
}
