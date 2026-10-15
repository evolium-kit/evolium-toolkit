import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

const collection = join(process.cwd(), 'dist/toolkit/schematics/collection.json');
const angularCollection = join(process.cwd(), 'node_modules/@schematics/angular/collection.json');

const SKILL = '/.claude/skills/evolium-toolkit/SKILL.md';
const INICIO = '<!-- evolium-toolkit:inicio';
const contar = (texto: string, agulha: string): number => texto.split(agulha).length - 1;

describe('ai-context', () => {
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

  it('cria a skill, que manda ler o AGENTS.md do pacote', async () => {
    const tree = await runner.runSchematic('ai-context', {}, app);
    const skill = tree.readText(SKILL);

    expect(skill).toMatch(/^---\nname: evolium-toolkit\ndescription: /);
    expect(skill).toContain('node_modules/@evolium-kit/toolkit/AGENTS.md');
    expect(skill).toContain('gerado por ng g @evolium-kit/toolkit:ai-context');
  });

  it('cria o CLAUDE.md com o bloco entre marcadores', async () => {
    const tree = await runner.runSchematic('ai-context', {}, app);
    const claude = tree.readText('/CLAUDE.md');

    expect(claude).toContain(INICIO);
    expect(claude).toContain('<!-- evolium-toolkit:fim -->');
    expect(claude).toContain('node_modules/@evolium-kit/toolkit/AGENTS.md');
  });

  it('acrescenta a um CLAUDE.md existente sem tocar no resto', async () => {
    app.create('/CLAUDE.md', '# Projecto\n\nRegras da equipa.\n');
    const tree = await runner.runSchematic('ai-context', {}, app);
    const claude = tree.readText('/CLAUDE.md');

    expect(
      claude.startsWith('# Projecto\n\nRegras da equipa.\n\n<!-- evolium-toolkit:inicio'),
    ).toBe(true);
  });

  it('usa o .claude/CLAUDE.md quando é esse o que existe', async () => {
    app.create('/.claude/CLAUDE.md', '# Instruções\n');
    const tree = await runner.runSchematic('ai-context', {}, app);

    expect(tree.exists('/CLAUDE.md')).toBe(false);
    expect(tree.readText('/.claude/CLAUDE.md')).toContain(INICIO);
  });

  it('é idempotente: correr duas vezes não duplica nada', async () => {
    const primeira = await runner.runSchematic('ai-context', {}, app);
    const segunda = await runner.runSchematic('ai-context', {}, primeira);

    expect(contar(segunda.readText('/CLAUDE.md'), INICIO)).toBe(1);
    expect(segunda.readText(SKILL)).toBe(primeira.readText(SKILL));
  });

  it('substitui um bloco antigo, mantendo o que está antes e depois', async () => {
    app.create(
      '/CLAUDE.md',
      '# A\n\n<!-- evolium-toolkit:inicio — antigo -->\ntexto velho\n<!-- evolium-toolkit:fim -->\n\n## B\n',
    );
    const tree = await runner.runSchematic('ai-context', {}, app);
    const claude = tree.readText('/CLAUDE.md');

    expect(claude).not.toContain('texto velho');
    expect(claude.startsWith('# A\n\n<!-- evolium-toolkit:inicio')).toBe(true);
    expect(claude.endsWith('<!-- evolium-toolkit:fim -->\n\n## B\n')).toBe(true);
    expect(contar(claude, INICIO)).toBe(1);
  });

  it('actualiza a skill gerada, mas não uma personalizada (sem a marca)', async () => {
    app.create(SKILL, '---\nname: evolium-toolkit\n---\nA minha versão.\n');
    const tree = await runner.runSchematic('ai-context', {}, app);
    expect(tree.readText(SKILL)).toBe('---\nname: evolium-toolkit\n---\nA minha versão.\n');

    const outra = await runner.runSchematic('ai-context', {}, await novaApp());
    const gerada = outra.readText(SKILL);
    outra.overwrite(SKILL, gerada.replace('# @evolium-kit', '# Desactualizada @evolium-kit'));
    const actualizada = await runner.runSchematic('ai-context', {}, outra);
    expect(actualizada.readText(SKILL)).toBe(gerada);
  });

  describe('pelo ng-add', () => {
    const OPCOES = {
      project: 'demo',
      baseUrl: '/api',
      auth: false,
      authRoutes: false,
      themeStudio: false,
      skipInstall: true,
    };

    it('corre por omissão', async () => {
      const tree = await runner.runSchematic('ng-add', OPCOES, app);
      expect(tree.exists(SKILL)).toBe(true);
      expect(tree.readText('/CLAUDE.md')).toContain(INICIO);
    });

    it('não corre com aiContext: false', async () => {
      const tree = await runner.runSchematic('ng-add', { ...OPCOES, aiContext: false }, app);
      expect(tree.exists(SKILL)).toBe(false);
      expect(tree.exists('/CLAUDE.md')).toBe(false);
    });
  });

  async function novaApp(): Promise<UnitTestTree> {
    const ws = await runner.runExternalSchematic('@schematics/angular', 'workspace', {
      name: 'ws2',
      version: '21.2.0',
      newProjectRoot: 'projects',
    });
    return runner.runExternalSchematic(
      '@schematics/angular',
      'application',
      { name: 'demo', style: 'css', ssr: false },
      ws,
    );
  }
});
