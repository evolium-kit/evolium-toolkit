import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

// Caminhos directos: o Vitest transpila para ESM e `require.resolve` não
// resolve ficheiros .json aqui.
const collection = join(process.cwd(), 'dist/toolkit/schematics/collection.json');
const angularCollection = join(process.cwd(), 'node_modules/@schematics/angular/collection.json');

const OPCOES = {
  project: 'demo',
  baseUrl: '/api',
  auth: true,
  authRoutes: true,
  themeStudio: true,
  skipInstall: true,
};

describe('ng-add', () => {
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

  const configDe = (tree: UnitTestTree): string =>
    tree.readText('/projects/demo/src/app/app.config.ts');

  it('injecta provideEvoServices com o baseUrl escolhido', async () => {
    const tree = await runner.runSchematic('ng-add', OPCOES, app);
    const config = configDe(tree);

    expect(config).toContain('provideEvoServices(');
    expect(config).toContain("withBaseUrl('/api')");
    expect(config).toContain('withPlugin(authPlugin())');
    expect(config).toContain("from '@evolium-kit/toolkit/services'");
  });

  it('injecta o HttpClient com o dispatcher do kernel', async () => {
    const tree = await runner.runSchematic('ng-add', OPCOES, app);
    const config = configDe(tree);

    expect(config).toContain('provideHttpClient(');
    expect(config).toContain('evoDispatchInterceptor');
  });

  it('injecta o tema', async () => {
    const tree = await runner.runSchematic('ng-add', OPCOES, app);
    expect(configDe(tree)).toContain('provideEvoTheme(');
  });

  it('omite o plugin de auth quando não é pedido', async () => {
    const tree = await runner.runSchematic('ng-add', { ...OPCOES, auth: false }, app);
    const config = configDe(tree);

    expect(config).toContain('provideEvoServices(');
    expect(config).not.toContain('authPlugin');
  });

  describe('estilos', () => {
    it('põe a declaração de camadas como primeira regra', async () => {
      const tree = await runner.runSchematic('ng-add', OPCOES, app);
      const estilos = tree.readText('/projects/demo/src/styles.css');

      expect(estilos.trimStart().startsWith('@layer theme, base, evo.tokens')).toBe(true);
      expect(estilos).toContain('evo.overrides');
    });

    it('importa as três folhas da toolkit', async () => {
      const tree = await runner.runSchematic('ng-add', OPCOES, app);
      const estilos = tree.readText('/projects/demo/src/styles.css');

      expect(estilos).toContain('evolium-theme.css');
      expect(estilos).toContain('evolium-components.css');
      expect(estilos).toContain('evolium-layouts.css');
    });
  });

  /**
   * Regressão. Até à 0.1.0, responder "sim" a esta pergunta não acrescentava
   * `provideEvoThemeStudio()` a lado nenhum — só a mensagem final da consola,
   * que dava a entender (por engano) que já estava configurado. `/_evo/theme`
   * dava sempre 404. Ver `.claude/KNOWN-BUGS.md`.
   */
  describe('Theme Studio', () => {
    it('regista o provider quando pedido', async () => {
      const tree = await runner.runSchematic('ng-add', OPCOES, app);
      const config = configDe(tree);

      expect(config).toContain('provideEvoThemeStudio()');
      expect(config).toContain("from '@evolium-kit/toolkit/pages'");
    });

    it('só regista em isDevMode(), nunca em produção', async () => {
      const tree = await runner.runSchematic('ng-add', OPCOES, app);
      const config = configDe(tree);

      expect(config).toContain('isDevMode()');
      expect(config).toMatch(/isDevMode\(\)\s*\?\s*\[provideEvoThemeStudio\(\)\]\s*:\s*\[\]/);
    });

    it('vem antes do provideRouter — senão uma rota ** sombreia-o', async () => {
      const tree = await runner.runSchematic('ng-add', OPCOES, app);
      const config = configDe(tree);

      const indiceStudio = config.indexOf('provideEvoThemeStudio');
      const indiceRouter = config.indexOf('provideRouter(');

      expect(indiceStudio).toBeGreaterThan(-1);
      expect(indiceRouter).toBeGreaterThan(-1);
      expect(indiceStudio).toBeLessThan(indiceRouter);
    });

    it('não o regista quando a resposta é não', async () => {
      const tree = await runner.runSchematic('ng-add', { ...OPCOES, themeStudio: false }, app);
      expect(configDe(tree)).not.toContain('provideEvoThemeStudio');
    });

    it('não duplica numa segunda corrida', async () => {
      const primeira = await runner.runSchematic('ng-add', OPCOES, app);
      const segunda = await runner.runSchematic('ng-add', OPCOES, primeira);

      const config = configDe(segunda);
      expect(config.split('provideEvoThemeStudio(').length - 1).toBe(1);
    });
  });

  it('acrescenta as rotas de autenticação', async () => {
    const tree = await runner.runSchematic('ng-add', OPCOES, app);
    const rotas = tree.readText('/projects/demo/src/app/app.routes.ts');

    expect(rotas).toContain('evoAuthRoutes');
    expect(rotas).toContain("from '@evolium-kit/toolkit/pages'");
  });

  /**
   * Um `ng add` que só funcione em projectos virgens é um `ng add` que ninguém
   * se atreve a correr outra vez. Correr duas vezes não pode duplicar nada.
   */
  describe('idempotência', () => {
    it('não duplica providers, estilos nem rotas', async () => {
      const primeira = await runner.runSchematic('ng-add', OPCOES, app);
      const segunda = await runner.runSchematic('ng-add', OPCOES, primeira);

      const config = configDe(segunda);
      const estilos = segunda.readText('/projects/demo/src/styles.css');
      const rotas = segunda.readText('/projects/demo/src/app/app.routes.ts');

      const contar = (texto: string, agulha: string): number => texto.split(agulha).length - 1;

      expect(contar(config, 'provideEvoServices(')).toBe(1);
      expect(contar(config, 'provideEvoTheme(')).toBe(1);
      expect(contar(config, 'provideHttpClient(')).toBe(1);
      expect(contar(estilos, 'evolium-theme.css')).toBe(1);
      expect(contar(estilos, '@layer theme, base')).toBe(1);
      expect(contar(rotas, 'evoAuthRoutes')).toBe(2); // o import e a utilização
    });

    it('respeita um provideHttpClient que já exista', async () => {
      const caminho = '/projects/demo/src/app/app.config.ts';
      app.overwrite(
        caminho,
        app.readText(caminho).replace('providers: [', 'providers: [provideHttpClient(),'),
      );

      const tree = await runner.runSchematic('ng-add', OPCOES, app);
      expect(configDe(tree).split('provideHttpClient(').length - 1).toBe(1);
    });
  });

  it('recusa instalar numa library', async () => {
    const comLib = await runner.runExternalSchematic(
      '@schematics/angular',
      'library',
      { name: 'minha-lib' },
      app,
    );

    await expect(
      runner.runSchematic('ng-add', { ...OPCOES, project: 'minha-lib' }, comLib),
    ).rejects.toThrow(/library/i);
  });

  it('explica-se quando o projecto não existe', async () => {
    await expect(
      runner.runSchematic('ng-add', { ...OPCOES, project: 'inexistente' }, app),
    ).rejects.toThrow(/não existe no angular\.json/);
  });
});
