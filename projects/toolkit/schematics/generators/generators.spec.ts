import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

const collection = join(process.cwd(), 'dist/toolkit/schematics/collection.json');
const angularCollection = join(process.cwd(), 'node_modules/@schematics/angular/collection.json');

describe('geradores', () => {
  let runner: SchematicTestRunner;
  let app: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner('@evolium-kit/toolkit', collection);
    runner.registerCollection('@schematics/angular', angularCollection);

    const workspace = await runner.runExternalSchematic('@schematics/angular', 'workspace', {
      name: 'ws',
      version: '21.2.0',
      newProjectRoot: 'projects',
    });

    app = await runner.runExternalSchematic(
      '@schematics/angular',
      'application',
      { name: 'demo', style: 'css', ssr: false },
      workspace,
    );
  });

  describe('resource-plugin', () => {
    const base = '/projects/demo/src/app/resources/facturas';

    it('gera o conjunto completo de ficheiros', async () => {
      const tree = await runner.runSchematic(
        'resource-plugin',
        { name: 'facturas', dependsOn: 'auth', endpoints: 'list,create', skipTests: false },
        app,
      );

      for (const ficheiro of [
        'facturas.models.ts',
        'facturas.mappers.ts',
        'facturas.endpoints.ts',
        'facturas.plugin.ts',
        'facturas.plugin.spec.ts',
        'index.ts',
      ]) {
        expect(tree.exists(`${base}/${ficheiro}`), ficheiro).toBe(true);
      }
    });

    it('gera só as operações pedidas', async () => {
      const tree = await runner.runSchematic(
        'resource-plugin',
        { name: 'facturas', dependsOn: '', endpoints: 'list', skipTests: true },
        app,
      );

      const endpoints = tree.readText(`${base}/facturas.endpoints.ts`);
      expect(endpoints).toContain('list:');
      expect(endpoints).not.toContain('create:');
      expect(endpoints).not.toContain('remove:');
    });

    it('declara dependsOn e aumenta o EvoResourceMap', async () => {
      const tree = await runner.runSchematic(
        'resource-plugin',
        { name: 'facturas', dependsOn: 'auth', endpoints: 'list', skipTests: true },
        app,
      );

      const plugin = tree.readText(`${base}/facturas.plugin.ts`);
      expect(plugin).toContain("dependsOn: ['auth']");
      expect(plugin).toContain("declare module '@evolium-kit/toolkit/services'");
      expect(plugin).toContain('facturas: FacturasApi & FacturasExtensions');
    });

    it('expõe a lista só como computed, nunca o WritableSignal', async () => {
      const tree = await runner.runSchematic(
        'resource-plugin',
        { name: 'facturas', dependsOn: '', endpoints: 'list', skipTests: true },
        app,
      );

      const plugin = tree.readText(`${base}/facturas.plugin.ts`);
      expect(plugin).toContain('lista: computed(() => interna())');
    });

    it('recusa operações desconhecidas em vez de as ignorar', async () => {
      await expect(
        runner.runSchematic(
          'resource-plugin',
          { name: 'facturas', dependsOn: '', endpoints: 'list,inventar', skipTests: true },
          app,
        ),
      ).rejects.toThrow(/Operações desconhecidas: inventar/);
    });
  });

  describe('ui-component', () => {
    const base = '/projects/demo/src/app/ui/painel';

    it('gera componente, estilos, metadados e testes', async () => {
      const tree = await runner.runSchematic(
        'ui-component',
        { name: 'painel', category: 'Superficies', variants: 'plain,sunken', skipTests: false },
        app,
      );

      expect(tree.exists(`${base}/evo-painel.ts`)).toBe(true);
      expect(tree.exists(`${base}/painel.css`)).toBe(true);
      expect(tree.exists(`${base}/painel.tokens.ts`)).toBe(true);
      expect(tree.exists(`${base}/evo-painel.spec.ts`)).toBe(true);
    });

    /** O esqueleto tem de nascer conforme, senão a regra não se mantém. */
    it('respeita a regra 1: default no fallback, não declarado', async () => {
      const tree = await runner.runSchematic(
        'ui-component',
        { name: 'painel', category: 'Superficies', variants: '', skipTests: true },
        app,
      );

      const css = tree.readText(`${base}/painel.css`);
      const base_ = css.split('@layer evo.variants')[0];

      expect(css).toContain('var(--evo-painel-bg, var(--evo-color-surface))');
      expect([...base_.matchAll(/(^|[;{\s])(--evo-painel-[a-z-]+)\s*:/g)]).toEqual([]);
    });

    it('declara os tokens das variantes dentro de evo.variants', async () => {
      const tree = await runner.runSchematic(
        'ui-component',
        { name: 'painel', category: 'Superficies', variants: 'sunken', skipTests: true },
        app,
      );

      const css = tree.readText(`${base}/painel.css`);
      const variantes = css.slice(css.indexOf('@layer evo.variants'));

      expect(variantes).toContain("[data-evo-variant~='sunken']");
      expect(variantes).toContain('--evo-painel-bg:');
    });
  });

  describe('page', () => {
    it('gera os quatro estados obrigatórios', async () => {
      const tree = await runner.runSchematic(
        'page',
        { name: 'relatorios', layout: 'dashboard', skipTests: true },
        app,
      );

      const html = tree.readText('/projects/demo/src/app/pages/relatorios/relatorios.page.html');
      for (const estado of ["'loading'", "'empty'", "'error'", '@default']) {
        expect(html, estado).toContain(estado);
      }
      expect(html).toContain('role="alert"');
    });

    it('usa o shell escolhido', async () => {
      const tree = await runner.runSchematic(
        'page',
        { name: 'entrar', layout: 'auth', skipTests: true },
        app,
      );

      const ts = tree.readText('/projects/demo/src/app/pages/entrar/entrar.page.ts');
      expect(ts).toContain('EvoAuthShell');
    });

    it('liga-se ao resource quando é indicado', async () => {
      const tree = await runner.runSchematic(
        'page',
        { name: 'facturacao', layout: 'dashboard', resource: 'facturas', skipTests: true },
        app,
      );

      const ts = tree.readText('/projects/demo/src/app/pages/facturacao/facturacao.page.ts');
      expect(ts).toContain("registry.get('facturas')");
      expect(ts).not.toContain('HttpClient');
    });
  });

  describe('layout', () => {
    it('gera um slot por cada nome indicado', async () => {
      const tree = await runner.runSchematic(
        'layout',
        { name: 'compacto', slots: 'brand,acoes', skipTests: true },
        app,
      );

      const html = tree.readText('/projects/demo/src/app/layouts/compacto/compacto-shell.html');
      expect(html).toContain('select="[slot=brand]"');
      expect(html).toContain('select="[slot=acoes]"');
      expect(html).toContain('<ng-content />');
    });
  });
});
