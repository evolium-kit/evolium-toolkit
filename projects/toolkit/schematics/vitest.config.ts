import { defineConfig } from 'vitest/config';

/**
 * Os testes de schematics correm em **Node**, não no browser.
 *
 * Por isso não usam o `@angular/build:unit-test`, que monta um ambiente jsdom
 * e exige um `buildTarget` de aplicação. Aqui o que se testa é manipulação de
 * ficheiros através do `Tree`, que é código Node puro.
 */
export default defineConfig({
  test: {
    name: 'schematics',
    environment: 'node',
    include: ['projects/toolkit/schematics/**/*.spec.ts'],
    root: process.cwd(),
  },
});
